// WeDo — check-payment-status
// Reconciles a transaction with the Mobile Money provider.
//
// Sandbox mode (default): marks the transaction Completed and settles the linked
// contribution (status Paid, paid_date, member + tontine balances, notification).
// Real mode: query the PSP for the true status before settling.

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

    const { transactionId } = await req.json();
    if (!transactionId) return json({ error: "Missing transactionId" }, 400);

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
      db: { schema: "wedo" },
      auth: { persistSession: false },
    });

    const { data: tx } = await admin
      .from("transactions")
      .select("*")
      .eq("id", transactionId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!tx) return json({ error: "Transaction not found" }, 404);

    // Already settled — return as-is
    if (tx.status === "Completed" || tx.status === "Failed") {
      return json({ status: tx.status, transaction: mapTransaction(tx) });
    }

    // ----- Determine the real status -----
    let newStatus: "Completed" | "Failed" | "Pending" = "Pending";
    let externalRef: string | null = tx.external_transaction_id ?? null;
    if (MM_PROVIDER === "sandbox") {
      newStatus = "Completed";
      externalRef = `SBX-${tx.id.slice(0, 8)}`;
    } else {
      // TODO: call the PSP status endpoint with tx.external_transaction_id and
      // map their result to Completed / Failed / Pending.
      newStatus = "Pending";
    }

    const { data: updatedTx } = await admin
      .from("transactions")
      .update({ status: newStatus, external_transaction_id: externalRef })
      .eq("id", tx.id)
      .select("*")
      .single();

    // On success, settle the linked contribution + balances
    if (newStatus === "Completed" && tx.type === "Contribution") {
      const { data: contribution } = await admin
        .from("contributions")
        .select("*")
        .eq("transaction_id", tx.id)
        .maybeSingle();

      if (contribution && contribution.status !== "Paid") {
        await admin
          .from("contributions")
          .update({ status: "Paid", paid_date: new Date().toISOString() })
          .eq("id", contribution.id);

        // Bump member.total_contributed
        const { data: m } = await admin
          .from("tontine_members")
          .select("id, total_contributed")
          .eq("id", contribution.member_id)
          .maybeSingle();
        if (m) {
          await admin
            .from("tontine_members")
            .update({ total_contributed: (m.total_contributed ?? 0) + tx.amount })
            .eq("id", m.id);
        }

        // Bump tontine.current_balance
        const { data: t } = await admin
          .from("tontines")
          .select("current_balance")
          .eq("id", tx.tontine_id)
          .maybeSingle();
        if (t) {
          await admin
            .from("tontines")
            .update({ current_balance: (t.current_balance ?? 0) + tx.amount })
            .eq("id", tx.tontine_id);
        }

        // Notify the payer
        await admin.from("notifications").insert({
          user_id: user.id,
          title: "Cotisation reçue",
          body: `Votre cotisation de ${tx.amount} ${tx.currency} a bien été enregistrée.`,
          type: "PaymentSuccess",
          related_id: tx.tontine_id,
        });
      }
    }

    return json({
      status: newStatus,
      transaction: mapTransaction(updatedTx ?? { ...tx, status: newStatus }),
    });
  } catch (e) {
    return json({ error: String((e as Error)?.message ?? e) }, 500);
  }
});

function mapTransaction(d: any) {
  return {
    id: d.id,
    userId: d.user_id,
    tontineId: d.tontine_id,
    type: d.type,
    amount: d.amount,
    currency: d.currency,
    status: d.status,
    description: d.description,
    referenceId: d.reference_id ?? undefined,
    transactionId: d.external_transaction_id ?? undefined,
    createdAt: d.created_at,
  };
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
