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

    const { tontineId, amount, paymentMethod, mobileMoneyAccountId, kind } =
      await req.json();
    const payKind = kind === "fee" ? "fee" : "contribution";
    if (!tontineId) return json({ error: "Missing tontineId" }, 400);
    if (payKind === "contribution" && (typeof amount !== "number" || amount <= 0)) {
      return json({ error: "Invalid amount" }, 400);
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
      db: { schema: "wedo" },
      auth: { persistSession: false },
    });

    // 1) Caller must be a member of the tontine (fee/activation included)
    const { data: member } = await admin
      .from("tontine_members")
      .select("id, status, frais_du, frais_paye, nb_tetes")
      .eq("tontine_id", tontineId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!member || member.status !== "Active") {
      return json({ error: "Not an active member of this tontine" }, 403);
    }

    // 2) Tontine context (round + currency + base contribution)
    const { data: tontine } = await admin
      .from("tontines")
      .select("current_round, currency, contribution_amount")
      .eq("id", tontineId)
      .single();
    const feeCurrency = tontine?.currency ?? "XOF";

    // ----- Activation-fee payment (paid once at launch, never trusts client amount) -----
    if (payKind === "fee") {
      if (member.frais_paye) {
        return json({ error: "Frais d'activation déjà réglés." }, 409);
      }
      const feeAmount = Number(member.frais_du ?? 0);
      if (feeAmount <= 0) return json({ error: "Aucun frais d'activation dû." }, 400);

      const { data: feeTx, error: feeErr } = await admin
        .from("transactions")
        .insert({
          user_id: user.id,
          tontine_id: tontineId,
          type: "Fee",
          amount: feeAmount,
          currency: feeCurrency,
          status: "Pending",
          description: "Frais d'activation",
          reference_id: member.id,
        })
        .select("*")
        .single();
      if (feeErr) throw feeErr;

      let feeUrl: string | undefined;
      let feeToken: string | undefined;
      if (MM_PROVIDER === "cinetpay") {
        const r = await cinetpayInit(admin, user.id, feeTx.id, feeAmount, feeCurrency, "Frais d'activation");
        if ("error" in r) return json({ error: r.error }, 502);
        feeUrl = r.payment_url;
        feeToken = r.payment_token;
        await admin.from("transactions").update({ external_transaction_id: feeToken ?? null }).eq("id", feeTx.id);
      }
      return json({
        kind: "fee",
        transaction: mapTransaction(feeTx),
        paymentUrl: feeUrl,
        paymentToken: feeToken,
        sandbox: MM_PROVIDER === "sandbox",
      });
    }

    // Soft barrier: a member with an unpaid activation fee can't contribute yet.
    if (Number(member.frais_du ?? 0) > 0 && !member.frais_paye) {
      return json(
        { error: "Réglez d'abord vos frais d'activation avant de cotiser.", need: "FEE" },
        402,
      );
    }
    const round = tontine?.current_round && tontine.current_round > 0
      ? tontine.current_round
      : 1;
    const currency = tontine?.currency ?? "XOF";

    // Server-authoritative contribution amount = nb_tetes × base cotisation.
    // Never trust the client `amount`: a member holding several "têtes" owes a
    // multiple of the base contribution each round (and the pot math depends on it).
    const tetes = Math.max(1, Number(member.nb_tetes ?? 1));
    const baseCotisation = Number(tontine?.contribution_amount ?? amount);
    const contribAmount = baseCotisation * tetes;

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
          amount: contribAmount,
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
        amount: contribAmount,
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
      const r = await cinetpayInit(admin, user.id, tx.id, contribAmount, currency, `Cotisation tour ${round}`);
      if ("error" in r) return json({ error: r.error }, 502);
      paymentUrl = r.payment_url;
      paymentToken = r.payment_token;
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

// CinetPay v2 hosted-checkout init. Returns {payment_url, payment_token} or {error}.
async function cinetpayInit(
  admin: any,
  userId: string,
  txId: string,
  amount: number,
  currency: string,
  description: string,
): Promise<{ payment_url: string; payment_token?: string } | { error: string }> {
  const apiKey = Deno.env.get("CINETPAY_API_KEY");
  const siteId = Deno.env.get("CINETPAY_SITE_ID");
  if (!apiKey || !siteId) {
    return { error: "CinetPay non configuré (CINETPAY_API_KEY / CINETPAY_SITE_ID)" };
  }
  const { data: profile } = await admin
    .from("profiles")
    .select("full_name, phone_number")
    .eq("id", userId)
    .maybeSingle();
  const [firstName, ...rest] = (profile?.full_name ?? "Membre WeDo").split(" ");
  const res = await fetch("https://api-checkout.cinetpay.com/v2/payment", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      apikey: apiKey,
      site_id: siteId,
      transaction_id: txId,
      amount,
      currency,
      description,
      notify_url: `${SUPABASE_URL}/functions/v1/wedo-cinetpay-webhook`,
      return_url: "https://wedo.app/paiement/retour",
      channels: "ALL",
      customer_name: firstName,
      customer_surname: rest.join(" ") || firstName,
      customer_phone_number: profile?.phone_number ?? "",
      metadata: txId,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (String(data?.code) !== "201" || !data?.data?.payment_url) {
    return { error: `CinetPay init échouée: ${data?.message ?? res.status}` };
  }
  return { payment_url: data.data.payment_url, payment_token: data.data.payment_token };
}

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
