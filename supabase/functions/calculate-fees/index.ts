// WeDo — calculate-fees
// Returns the Mobile Money fee + total for a given amount and operator.
// Pure computation (no DB). verify_jwt = true (the app sends the user token).
//
// NOTE: rates below are placeholders. Confirm the exact schedule with each PSP
// (CinetPay / Flutterwave / Orange Money / Wave) before going to production.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Fee as a fraction of the amount, per operator (XOF markets).
const FEE_RATES: Record<string, number> = {
  "Wave": 0, // Wave: free P2P transfers
  "Orange Money": 0.01,
  "MTN Money": 0.01,
  "Moov Money": 0.015,
  "Airtel Money": 0.015,
  "M-Pesa": 0.01,
};

const DEFAULT_RATE = 0.01;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  try {
    const { amount, provider } = await req.json();
    if (typeof amount !== "number" || amount <= 0) {
      return json({ error: "Invalid amount" }, 400);
    }
    const rate = FEE_RATES[provider] ?? DEFAULT_RATE;
    const fees = Math.round(amount * rate);
    return json({ fees, total: amount + fees, provider: provider ?? "unknown" });
  } catch (e) {
    return json({ error: String((e as Error)?.message ?? e) }, 500);
  }
});

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
