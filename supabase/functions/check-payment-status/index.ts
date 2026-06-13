// WeDo — check-payment-status
// Reconciles a transaction with the Mobile Money provider.
//
// Sandbox mode (default): marks the transaction Completed and settles the linked
// contribution THROUGH the séquestre. Settlement is delegated to the
// `wedo.confirmer_cotisation` RPC, which atomically: deposits into the EME escrow,
// appends a SHA-256-chained `mouvement`, updates the portable reliability score,
// and auto-triggers `distribuer_tour` when the round is complete (0 human
// intervention on the funds). Real mode: query the PSP for the true status first.

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
    } else if (MM_PROVIDER === "cinetpay") {
      const apiKey = Deno.env.get("CINETPAY_API_KEY");
      const siteId = Deno.env.get("CINETPAY_SITE_ID");
      const checkRes = await fetch(
        "https://api-checkout.cinetpay.com/v2/payment/check",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ apikey: apiKey, site_id: siteId, transaction_id: tx.id }),
        },
      );
      const checkData = await checkRes.json().catch(() => ({}));
      const s = checkData?.data?.status;
      if (s === "ACCEPTED") newStatus = "Completed";
      else if (s === "REFUSED" || s === "EXPIRED") newStatus = "Failed";
      else newStatus = "Pending";
      externalRef = checkData?.data?.payment_method
        ? `CP-${checkData.data.payment_method}`
        : externalRef;
    }

    const { data: updatedTx } = await admin
      .from("transactions")
      .update({ status: newStatus, external_transaction_id: externalRef })
      .eq("id", tx.id)
      .select("*")
      .single();

    // On success: activation fee → mark the member's frais_paye (no escrow, it's revenue).
    if (newStatus === "Completed" && tx.type === "Fee" && tx.reference_id) {
      await admin
        .from("tontine_members")
        .update({ frais_paye: true, frais_paye_at: new Date().toISOString() })
        .eq("id", tx.reference_id)
        .eq("frais_paye", false);
      await admin.from("notifications").insert({
        user_id: user.id,
        title: "Frais d'activation réglés",
        body: `Vos frais d'activation de ${tx.amount} ${tx.currency} sont confirmés. Vous pouvez cotiser.`,
        type: "PaymentSuccess",
        related_id: tx.tontine_id,
      });
    }

    // On success, settle the linked contribution THROUGH the séquestre.
    let escrow: unknown = undefined;
    if (newStatus === "Completed" && tx.type === "Contribution") {
      const { data: contribution } = await admin
        .from("contributions")
        .select("id, status")
        .eq("transaction_id", tx.id)
        .maybeSingle();

      if (contribution && contribution.status !== "Paid") {
        // Escrow deposit + ledger append + score + automatic distribution.
        const { data: result, error: rpcErr } = await admin.rpc(
          "confirmer_cotisation",
          { p_contribution_id: contribution.id },
        );
        if (rpcErr) throw rpcErr;
        escrow = result;

        await admin.from("notifications").insert({
          user_id: user.id,
          title: "Cotisation versée au séquestre",
          body: `Votre cotisation de ${tx.amount} ${tx.currency} est sécurisée dans le compte de cantonnement.`,
          type: "PaymentSuccess",
          related_id: tx.tontine_id,
        });
      }
    }

    return json({
      status: newStatus,
      transaction: mapTransaction(updatedTx ?? { ...tx, status: newStatus }),
      escrow,
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
