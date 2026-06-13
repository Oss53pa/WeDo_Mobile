// WeDo — initiate-payment
// Creates (or reuses) the pending contribution for the caller's current round
// and a Pending transaction, then hands off to the Mobile Money provider.
//
// Sandbox mode (default): no external call. The client then polls
// `check-payment-status`, which marks the payment Completed.
// Real mode: set WEDO_MM_PROVIDER (e.g. "cinetpay") + provider keys and
// implement the PSP call in the marked section below.

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

    const { tontineId, amount, paymentMethod, mobileMoneyAccountId } =
      await req.json();
    if (!tontineId || typeof amount !== "number" || amount <= 0) {
      return json({ error: "Missing tontineId or invalid amount" }, 400);
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
      db: { schema: "wedo" },
      auth: { persistSession: false },
    });

    // 1) Caller must be an active member of the tontine
    const { data: member } = await admin
      .from("tontine_members")
      .select("id, status")
      .eq("tontine_id", tontineId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!member || member.status !== "Active") {
      return json({ error: "Not an active member of this tontine" }, 403);
    }

    // 2) Tontine context (round + currency)
    const { data: tontine } = await admin
      .from("tontines")
      .select("current_round, currency")
      .eq("id", tontineId)
      .single();
    const round = tontine?.current_round && tontine.current_round > 0
      ? tontine.current_round
      : 1;
    const currency = tontine?.currency ?? "XOF";

    // 3) Find or create the pending contribution for this round
    let { data: contribution } = await admin
      .from("contributions")
      .select("*")
      .eq("tontine_id", tontineId)
      .eq("user_id", user.id)
      .eq("round", round)
      .maybeSingle();

    if (!contribution) {
      const due = new Date();
      due.setDate(due.getDate() + 7);
      const { data: created, error: cErr } = await admin
        .from("contributions")
        .insert({
          tontine_id: tontineId,
          member_id: member.id,
          user_id: user.id,
          amount,
          round,
          due_date: due.toISOString().slice(0, 10),
          status: "Pending",
          payment_method: paymentMethod ?? null,
        })
        .select("*")
        .single();
      if (cErr) throw cErr;
      contribution = created;
    }

    if (contribution.status === "Paid") {
      return json({ error: "Contribution already paid for this round" }, 409);
    }

    // 4) Create a Pending transaction and link it to the contribution
    const { data: tx, error: tErr } = await admin
      .from("transactions")
      .insert({
        user_id: user.id,
        tontine_id: tontineId,
        type: "Contribution",
        amount,
        currency,
        status: "Pending",
        description: `Cotisation tour ${round}`,
        reference_id: contribution.id,
      })
      .select("*")
      .single();
    if (tErr) throw tErr;

    await admin
      .from("contributions")
      .update({ transaction_id: tx.id, payment_method: paymentMethod ?? null })
      .eq("id", contribution.id);

    // 5) ----- Mobile Money provider hand-off -----
    let paymentUrl: string | undefined;
    let paymentToken: string | undefined;
    if (MM_PROVIDER === "cinetpay") {
      // CinetPay v2 hosted checkout. The webhook (wedo-cinetpay-webhook) settles
      // the contribution asynchronously; the app opens payment_url.
      const apiKey = Deno.env.get("CINETPAY_API_KEY");
      const siteId = Deno.env.get("CINETPAY_SITE_ID");
      if (!apiKey || !siteId) {
        return json({ error: "CinetPay non configuré (CINETPAY_API_KEY / CINETPAY_SITE_ID)" }, 500);
      }

      // Profile for the customer block (CinetPay requires name + phone for MM).
      const { data: profile } = await admin
        .from("profiles")
        .select("full_name, phone_number")
        .eq("id", user.id)
        .maybeSingle();
      const [firstName, ...rest] = (profile?.full_name ?? "Membre WeDo").split(" ");

      const initRes = await fetch("https://api-checkout.cinetpay.com/v2/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apikey: apiKey,
          site_id: siteId,
          transaction_id: tx.id,
          amount,
          currency,
          description: `Cotisation tour ${round}`,
          notify_url: `${SUPABASE_URL}/functions/v1/wedo-cinetpay-webhook`,
          return_url: "https://wedo.app/paiement/retour",
          channels: "ALL",
          customer_name: firstName,
          customer_surname: rest.join(" ") || firstName,
          customer_phone_number: profile?.phone_number ?? "",
          metadata: contribution.id,
        }),
      });
      const initData = await initRes.json().catch(() => ({}));
      if (String(initData?.code) !== "201" || !initData?.data?.payment_url) {
        return json(
          { error: `CinetPay init échouée: ${initData?.message ?? initRes.status}` },
          502,
        );
      }
      paymentUrl = initData.data.payment_url;
      paymentToken = initData.data.payment_token;
      await admin
        .from("transactions")
        .update({ external_transaction_id: paymentToken ?? null })
        .eq("id", tx.id);
    }

    return json({
      contribution: mapContribution(contribution),
      transaction: mapTransaction(tx),
      paymentUrl,
      paymentToken,
      sandbox: MM_PROVIDER === "sandbox",
    });
  } catch (e) {
    return json({ error: String((e as Error)?.message ?? e) }, 500);
  }
});

function mapContribution(d: any) {
  return {
    id: d.id,
    tontineId: d.tontine_id,
    memberId: d.member_id,
    userId: d.user_id,
    amount: d.amount,
    penaltyAmount: d.penalty_amount,
    round: d.round,
    dueDate: d.due_date,
    paidDate: d.paid_date ?? undefined,
    status: d.status,
    paymentMethod: d.payment_method ?? undefined,
    transactionId: d.transaction_id ?? undefined,
    receiptUrl: d.receipt_url ?? undefined,
    createdAt: d.created_at,
  };
}

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
