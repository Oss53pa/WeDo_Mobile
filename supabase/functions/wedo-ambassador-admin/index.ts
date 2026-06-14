// WeDo — wedo-ambassador-admin (WEDO-AMB-09 back-office)
// API admin du programme : liste review/payouts/audit + actions (validate/reject,
// clawback, build payouts, execute payout). Admin-gated (WEDO_ADMIN_USER_IDS).
// Toutes les actions passent par les RPC service-role + sont journalisées (audit).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
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
    if (!ADMINS.includes(user.id)) return json({ error: "Forbidden (admin only)" }, 403);

    const { action, payload = {} } = await req.json();
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
      db: { schema: "wedo" }, auth: { persistSession: false },
    });

    switch (action) {
      case "reviewQueue": {
        const { data } = await admin.from("reward_events")
          .select("id, ambassador_id, tontine_id, reward_fcfa, status, qualified_at")
          .eq("status", "review").order("qualified_at", { ascending: true });
        return json({ ok: true, items: data ?? [] });
      }
      case "payoutsPending": {
        const { data } = await admin.from("payouts")
          .select("id, ambassador_id, period_month, tier, total_fcfa, status")
          .in("status", ["pending", "failed"]).order("period_month", { ascending: false });
        return json({ ok: true, items: data ?? [] });
      }
      case "auditLog": {
        const { data } = await admin.from("ambassador_audit")
          .select("*").order("created_at", { ascending: false }).limit(200);
        return json({ ok: true, items: data ?? [] });
      }
      case "reviewDecision": {
        const { data } = await admin.rpc("ambassador_review_decision",
          { p_event: payload.rewardEventId, p_decision: payload.decision, p_actor: user.id });
        return json({ ok: true, result: data });
      }
      case "clawback": {
        const { data } = await admin.rpc("ambassador_clawback",
          { p_event: payload.rewardEventId, p_reason: payload.reason ?? "fraude", p_actor: user.id });
        return json({ ok: true, result: data });
      }
      case "buildPayouts": {
        const { data } = await admin.rpc("build_monthly_payouts",
          payload.period ? { p_period: payload.period } : {});
        return json({ ok: true, made: data });
      }
      case "executePayout": {
        // règle en sandbox via la même RPC que l'Edge executePayout
        const { data: po } = await admin.from("payouts").select("*").eq("id", payload.payoutId).maybeSingle();
        if (!po) return json({ error: "Payout introuvable" }, 404);
        if (po.status === "sent") return json({ ok: true, already: true });
        const { data } = await admin.rpc("ambassador_mark_payout_sent",
          { p_payout: payload.payoutId, p_provider: "sandbox", p_ref: `SBX-PO-${String(payload.payoutId).slice(0, 8)}` });
        return json({ ok: true, result: data });
      }
      case "kycPending": {
        // File de revue KYC : pièces (URLs signées temporaires pour la revue).
        const { data: subs } = await admin.from("kyc_submissions")
          .select("user_id, cni_number, cni_recto_path, cni_verso_path, selfie_path, submitted_at")
          .eq("status", "pending").order("submitted_at", { ascending: true });
        const items = [];
        for (const sub of subs ?? []) {
          const sign = async (p: string | null) =>
            p ? (await admin.storage.from("wedo-kyc").createSignedUrl(p, 600)).data?.signedUrl ?? null : null;
          items.push({
            userId: sub.user_id, cniNumber: sub.cni_number, submittedAt: sub.submitted_at,
            rectoUrl: await sign(sub.cni_recto_path),
            versoUrl: await sign(sub.cni_verso_path),
            selfieUrl: await sign(sub.selfie_path),
          });
        }
        return json({ ok: true, items });
      }
      case "kycDecision": {
        const { data } = await admin.rpc("kyc_decision",
          { p_user: payload.userId, p_decision: payload.decision, p_reason: payload.reason ?? null, p_actor: user.id });
        return json({ ok: true, result: data });
      }
      default:
        return json({ error: "Unknown action" }, 400);
    }
  } catch (e) {
    return json({ error: String((e as Error)?.message ?? e) }, 500);
  }
});
