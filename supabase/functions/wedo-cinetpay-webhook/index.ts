// WeDo — wedo-cinetpay-webhook
// Public endpoint CinetPay calls (notify_url) after a checkout. It posts
// `cpm_trans_id` (= our transactions.id). We MUST re-verify the status with
// CinetPay's /v2/payment/check (never trust the POST body), then settle the
// linked contribution through the séquestre via wedo.confirmer_cotisation
// (escrow deposit + SHA-256 ledger + score + automatic distribution).
//
// Deploy with verify_jwt = false (CinetPay sends no Supabase JWT).
// Name is wedo-* to avoid colliding with TableSmart's own cinetpay-webhook
// in the shared Supabase project.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const CINETPAY_API_KEY = Deno.env.get("CINETPAY_API_KEY") ?? "";
const CINETPAY_SITE_ID = Deno.env.get("CINETPAY_SITE_ID") ?? "";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok");
  try {
    // CinetPay posts application/x-www-form-urlencoded.
    let transId: string | null = null;
    const ct = req.headers.get("content-type") ?? "";
    if (ct.includes("application/json")) {
      const b = await req.json().catch(() => ({}));
      transId = b.cpm_trans_id ?? b.transaction_id ?? null;
    } else {
      const form = await req.formData().catch(() => null);
      transId = (form?.get("cpm_trans_id") as string) ??
        (form?.get("transaction_id") as string) ?? null;
    }
    if (!transId) return new Response("missing cpm_trans_id", { status: 400 });

    // Re-verify with CinetPay — do not trust the callback payload.
    const checkRes = await fetch(
      "https://api-checkout.cinetpay.com/v2/payment/check",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apikey: CINETPAY_API_KEY,
          site_id: CINETPAY_SITE_ID,
          transaction_id: transId,
        }),
      },
    );
    const check = await checkRes.json().catch(() => ({}));
    const status = check?.data?.status;

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
      db: { schema: "wedo" },
      auth: { persistSession: false },
    });

    const { data: tx } = await admin
      .from("transactions")
      .select("*")
      .eq("id", transId)
      .maybeSingle();
    if (!tx) return new Response("unknown transaction", { status: 200 });

    if (status !== "ACCEPTED") {
      if (status === "REFUSED" || status === "EXPIRED") {
        await admin.from("transactions").update({ status: "Failed" }).eq("id", tx.id);
      }
      return new Response("ok", { status: 200 });
    }

    // Idempotent settlement.
    if (tx.status !== "Completed") {
      await admin
        .from("transactions")
        .update({
          status: "Completed",
          external_transaction_id: check?.data?.payment_method
            ? `CP-${check.data.payment_method}`
            : tx.external_transaction_id,
        })
        .eq("id", tx.id);

      if (tx.type === "Contribution") {
        const { data: contribution } = await admin
          .from("contributions")
          .select("id, status")
          .eq("transaction_id", tx.id)
          .maybeSingle();
        if (contribution && contribution.status !== "Paid") {
          await admin.rpc("confirmer_cotisation", { p_contribution_id: contribution.id });
          await admin.from("notifications").insert({
            user_id: tx.user_id,
            title: "Cotisation confirmée",
            body: `Votre cotisation de ${tx.amount} ${tx.currency} est sécurisée dans le séquestre.`,
            type: "PaymentSuccess",
            related_id: tx.tontine_id,
          });
        }
      }
    }

    return new Response("ok", { status: 200 });
  } catch (e) {
    return new Response(String((e as Error)?.message ?? e), { status: 500 });
  }
});
