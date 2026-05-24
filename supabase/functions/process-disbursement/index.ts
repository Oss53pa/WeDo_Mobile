// WeDo — process-disbursement
// Admin/Treasurer triggers the payout to the round's beneficiary.
// Settles the distribution, records the Distribution transaction, updates the
// recipient's member totals and the tontine balance, and notifies the recipient.
//
// Sandbox mode (default): settles immediately. Real mode: call the PSP payout
// API first, then settle on confirmation (or via webhook).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const MM_PROVIDER = Deno.env.get("WEDO_MM_PROVIDER") ?? "sandbox";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return json({ error: "Unauthorized" }, 401);

    const { tontineId, beneficiaryId, amount, round } = await req.json();
    if (!tontineId || !beneficiaryId || typeof amount !== "number" || amount <= 0) {
      return json({ error: "Missing tontineId / beneficiaryId / amount" }, 400);
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
      db: { schema: "wedo" },
      auth: { persistSession: false },
    });

    // Only an admin/treasurer of this tontine may disburse
    const { data: isAdmin, error: adminErr } = await admin.rpc("is_tontine_admin", {
      p_tontine_id: tontineId,
      p_user_id: user.id,
    });
    if (adminErr) throw adminErr;
    if (!isAdmin) {
      return json({ error: "Only a tontine admin can process a disbursement" }, 403);
    }

    const targetRound = typeof round === "number" && round > 0 ? round : 1;

    // Find or create the distribution row
    let { data: distribution } = await admin
      .from("distributions")
      .select("*")
      .eq("tontine_id", tontineId)
      .eq("recipient_id", beneficiaryId)
      .eq("round", targetRound)
      .maybeSingle();

    if (!distribution) {
      const { data: created, error: dErr } = await admin
        .from("distributions")
        .insert({
          tontine_id: tontineId,
          recipient_id: beneficiaryId,
          amount,
          round: targetRound,
          scheduled_date: new Date().toISOString().slice(0, 10),
          status: "Processing",
        })
        .select("*")
        .single();
      if (dErr) throw dErr;
      distribution = created;
    }

    if (distribution.status === "Completed") {
      return json({ error: "Distribution already completed" }, 409);
    }

    // ----- Provider payout -----
    if (MM_PROVIDER !== "sandbox") {
      // TODO: call the PSP payout API to send `amount` to the beneficiary's
      // Mobile Money account, then settle below on confirmation.
    }

    const { data: tontine } = await admin
      .from("tontines")
      .select("currency, current_balance")
      .eq("id", tontineId)
      .single();
    const currency = tontine?.currency ?? "XOF";

    // Record the Distribution transaction (money received by beneficiary)
    const { data: tx } = await admin
      .from("transactions")
      .insert({
        user_id: beneficiaryId,
        tontine_id: tontineId,
        type: "Distribution",
        amount,
        currency,
        status: "Completed",
        description: `Distribution tour ${targetRound}`,
        reference_id: distribution.id,
        external_transaction_id: MM_PROVIDER === "sandbox"
          ? `SBX-PAYOUT-${distribution.id.slice(0, 8)}`
          : null,
      })
      .select("*")
      .single();

    // Settle the distribution
    const { data: settled } = await admin
      .from("distributions")
      .update({
        status: "Completed",
        distributed_date: new Date().toISOString(),
        transaction_id: tx?.id ?? null,
      })
      .eq("id", distribution.id)
      .select("*")
      .single();

    // Update the recipient's membership totals
    const { data: m } = await admin
      .from("tontine_members")
      .select("id, total_received")
      .eq("tontine_id", tontineId)
      .eq("user_id", beneficiaryId)
      .maybeSingle();
    if (m) {
      await admin
        .from("tontine_members")
        .update({
          total_received: (m.total_received ?? 0) + amount,
          has_received: true,
          is_current_beneficiary: false,
        })
        .eq("id", m.id);
    }

    // Reduce the tontine balance
    await admin
      .from("tontines")
      .update({
        current_balance: Math.max(0, (tontine?.current_balance ?? 0) - amount),
      })
      .eq("id", tontineId);

    // Notify the beneficiary
    await admin.from("notifications").insert({
      user_id: beneficiaryId,
      title: "Distribution reçue",
      body: `Vous avez reçu ${amount} ${currency} (tour ${targetRound}).`,
      type: "DistributionReceived",
      related_id: tontineId,
    });

    return json(mapDistribution(settled ?? distribution));
  } catch (e) {
    return json({ error: String((e as Error)?.message ?? e) }, 500);
  }
});

function mapDistribution(d: any) {
  return {
    id: d.id,
    tontineId: d.tontine_id,
    recipientId: d.recipient_id,
    amount: d.amount,
    round: d.round,
    scheduledDate: d.scheduled_date,
    distributedDate: d.distributed_date ?? undefined,
    status: d.status,
    transactionId: d.transaction_id ?? undefined,
    receiptUrl: d.receipt_url ?? undefined,
    createdAt: d.created_at,
  };
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
