// WeDo — wedo-send-sms : envoi SMS / WhatsApp (relances, codes), provider abstrait.
//
// INERTE PAR DÉFAUT : WEDO_SMS_PROVIDER='none' -> aucun appel externe, les messages
// en file passent à 'skipped'. Pour activer : poser les secrets (voir PARTNERS.md) :
//   WEDO_SMS_PROVIDER = twilio
//   TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN
//   TWILIO_SMS_FROM         (ex. +1xxx, expéditeur SMS)
//   TWILIO_WHATSAPP_FROM    (ex. whatsapp:+14155238886, expéditeur WhatsApp)
//   WEDO_CRON_SECRET        (protège le mode dispatch appelé par le cron)
//
// Deux modes (POST JSON) :
//   { mode:'dispatch' }                      -> dépile wedo.sms_outbox (cron). En-tête
//                                               x-wedo-cron: <WEDO_CRON_SECRET> requis.
//   { to:'+225...', body:'...', channel? }   -> envoi unitaire (service/admin).
//
// Aucune logique métier ni montant ici : pur transport.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-wedo-cron",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const PROVIDER = Deno.env.get("WEDO_SMS_PROVIDER") ?? "none";
const CRON_SECRET = Deno.env.get("WEDO_CRON_SECRET") ?? "";

const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...cors, "Content-Type": "application/json" } });

/** Envoi via le provider. Retourne {ok, ref?, error?}. 'none' = no-op (skipped). */
async function deliver(to: string, body: string, channel: string): Promise<{ ok: boolean; skipped?: boolean; ref?: string; error?: string }> {
  if (PROVIDER === "none") return { ok: false, skipped: true };

  if (PROVIDER === "twilio") {
    const sid = Deno.env.get("TWILIO_ACCOUNT_SID")!;
    const token = Deno.env.get("TWILIO_AUTH_TOKEN")!;
    const from = channel === "whatsapp"
      ? Deno.env.get("TWILIO_WHATSAPP_FROM")!
      : Deno.env.get("TWILIO_SMS_FROM")!;
    const dest = channel === "whatsapp" ? `whatsapp:${to}` : to;
    const form = new URLSearchParams({ To: dest, From: from, Body: body });
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: "Basic " + btoa(`${sid}:${token}`),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: form.toString(),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: data?.message ?? `Twilio ${res.status}` };
    return { ok: true, ref: data?.sid };
  }

  // Provider inconnu -> traité comme non configuré.
  return { ok: false, error: `Provider inconnu: ${PROVIDER}` };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
      db: { schema: "wedo" }, auth: { persistSession: false },
    });
    // Fonction interne (cron / server-to-server) : protégée par un secret partagé,
    // jamais appelée directement par l'app. Refuse tout tant que le secret n'est pas posé.
    if (!CRON_SECRET || req.headers.get("x-wedo-cron") !== CRON_SECRET) {
      return json({ error: "Forbidden (secret manquant/incorrect)" }, 401);
    }

    const payload = await req.json().catch(() => ({}));
    const mode = payload.mode ?? (payload.to ? "single" : "dispatch");

    // ── Envoi unitaire ────────────────────────────────────────────────
    if (mode === "single") {
      if (!payload.to || !payload.body) return json({ error: "to + body requis" }, 400);
      const r = await deliver(payload.to, payload.body, payload.channel ?? "sms");
      return json({ ok: r.ok, skipped: r.skipped ?? false, provider: PROVIDER, ref: r.ref, error: r.error });
    }

    // ── Dispatch (cron) : dépile la file ──────────────────────────────
    if (mode === "dispatch") {
      const { data: rows } = await admin
        .from("sms_outbox")
        .select("id, phone, body, channel")
        .eq("status", "pending")
        .order("created_at", { ascending: true })
        .limit(50);

      let sent = 0, failed = 0, skipped = 0;
      for (const row of rows ?? []) {
        const r = await deliver(row.phone, row.body, row.channel);
        if (r.skipped) {
          skipped++;
          await admin.from("sms_outbox").update({ status: "skipped", provider: PROVIDER }).eq("id", row.id);
        } else if (r.ok) {
          sent++;
          await admin.from("sms_outbox").update({
            status: "sent", provider: PROVIDER, provider_ref: r.ref ?? null, sent_at: new Date().toISOString(),
          }).eq("id", row.id);
        } else {
          failed++;
          await admin.from("sms_outbox").update({ status: "failed", provider: PROVIDER, error: r.error ?? "échec" }).eq("id", row.id);
        }
      }
      return json({ ok: true, provider: PROVIDER, processed: (rows ?? []).length, sent, failed, skipped });
    }

    return json({ error: "mode inconnu" }, 400);
  } catch (e) {
    return json({ error: String((e as Error)?.message ?? e) }, 500);
  }
});
