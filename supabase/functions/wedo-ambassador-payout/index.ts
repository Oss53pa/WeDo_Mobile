// WeDo — wedo-ambassador-payout (WEDO-AMB-06 executePayout)
// Déclenche le versement mobile money d'un payout ambassadrice, depuis le COMPTE
// D'EXPLOITATION (côté PSP) — jamais le compte cantonné des tontines.
// Sandbox (défaut) : règle immédiatement via la RPC idempotente. Mode réel
// (WEDO_PAYOUT_PROVIDER=cinetpay) : appelle l'API de transfert, puis le webhook
// `wedo-ambassador-payout-webhook` réconcilie. Réservé aux admins (WEDO_ADMIN_USER_IDS).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const PROVIDER = Deno.env.get("WEDO_PAYOUT_PROVIDER") ?? "sandbox";
const ADMINS = (Deno.env.get("WEDO_ADMIN_USER_IDS") ?? "").split(",").map((s) => s.trim()).filter(Boolean);

const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return json({ error: "Unauthorized" }, 401);
    // Programme = action sensible : réservé aux admins déclarés.
    if (!ADMINS.includes(user.id)) return json({ error: "Forbidden (admin only)" }, 403);

    const { payoutId } = await req.json();
    if (!payoutId) return json({ error: "Missing payoutId" }, 400);

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
      db: { schema: "wedo" }, auth: { persistSession: false },
    });

    const { data: payout } = await admin.from("payouts").select("*").eq("id", payoutId).maybeSingle();
    if (!payout) return json({ error: "Payout introuvable" }, 404);
    if (payout.status === "sent") return json({ ok: true, already: true, momoRef: payout.momo_ref });
    if (Number(payout.total_fcfa) <= 0) return json({ error: "Montant nul" }, 400);

    // ----- Mobile Money provider hand-off -----
    if (PROVIDER === "sandbox") {
      // Auto-règlement immédiat (pas d'appel externe).
      const ref = `SBX-PO-${String(payoutId).slice(0, 8)}`;
      const { data } = await admin.rpc("ambassador_mark_payout_sent", {
        p_payout: payoutId, p_provider: "sandbox", p_ref: ref,
      });
      return json({ ok: true, sandbox: true, result: data });
    }

    // Mode réel : ici on appellerait l'API de transfert du PSP agréé (Orange/MTN/
    // Moov/Wave via l'agrégateur). On laisse le payout 'pending' ; le webhook
    // `wedo-ambassador-payout-webhook` le passera à sent/failed à la notification.
    // TODO PSP: const r = await fetch(<transfer endpoint>, {...});  (clés en secrets)
    return json({ ok: true, provider: PROVIDER, pending: true,
      note: "Transfert PSP à implémenter ; le webhook réconciliera." });
  } catch (e) {
    return json({ error: String((e as Error)?.message ?? e) }, 500);
  }
});
