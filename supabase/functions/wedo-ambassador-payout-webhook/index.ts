// WeDo — wedo-ambassador-payout-webhook (WEDO-AMB-06 reconcilePayout)
// Notification du PSP de transfert → passe le payout à sent/failed + stocke momo_ref.
// Idempotent (la RPC ne double pas un payout déjà 'sent'). verify_jwt=false (appel
// externe) ; en mode réel, vérifier la signature/secret du fournisseur avant d'agir.
// Nom préfixé wedo-* pour ne pas entrer en collision avec les webhooks TableSmart.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-webhook-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const WEBHOOK_SECRET = Deno.env.get("WEDO_PAYOUT_WEBHOOK_SECRET") ?? "";

const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    // Garde-fou : si un secret est configuré, l'exiger (sandbox = pas de secret requis).
    if (WEBHOOK_SECRET && req.headers.get("x-webhook-secret") !== WEBHOOK_SECRET) {
      return json({ error: "Bad signature" }, 401);
    }

    const body = await req.json().catch(() => ({}));
    const payoutId = body.payoutId ?? body.metadata;
    const status = String(body.status ?? "").toLowerCase(); // success|failed
    const provider = body.provider ?? "unknown";
    const ref = body.momoRef ?? body.transactionId ?? body.ref ?? null;
    if (!payoutId) return json({ error: "Missing payoutId" }, 400);

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
      db: { schema: "wedo" }, auth: { persistSession: false },
    });

    if (status === "success" || status === "sent" || status === "completed") {
      const { data } = await admin.rpc("ambassador_mark_payout_sent", {
        p_payout: payoutId, p_provider: provider, p_ref: ref ?? `REF-${String(payoutId).slice(0, 8)}`,
      });
      return json({ ok: true, result: data });
    }
    const { data } = await admin.rpc("ambassador_mark_payout_failed", {
      p_payout: payoutId, p_reason: body.reason ?? "provider failure",
    });
    return json({ ok: true, failed: true, result: data });
  } catch (e) {
    return json({ error: String((e as Error)?.message ?? e) }, 500);
  }
});
