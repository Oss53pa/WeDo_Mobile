// WeDo — send-push
// Sends an Expo push notification to every registered device of a user.
// Called by the wedo.notifications AFTER INSERT trigger (pg_net) or by other
// edge functions. Guarded by a shared secret header (x-wedo-push-secret) so it
// cannot be abused even though verify_jwt is false.
//
// Config (Supabase Edge Function secrets):
//   WEDO_PUSH_SECRET  — shared secret; the caller must send it in the header.
// Reads device tokens from wedo.device_tokens (Expo push tokens only).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const PUSH_SECRET = Deno.env.get("WEDO_PUSH_SECRET") ?? "";

const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), {
    status: s,
    headers: { "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok");
  try {
    if (!PUSH_SECRET) return json({ error: "WEDO_PUSH_SECRET not configured" }, 503);
    if (req.headers.get("x-wedo-push-secret") !== PUSH_SECRET) {
      return json({ error: "Forbidden" }, 403);
    }

    const { userId, title, body, data } = await req.json();
    if (!userId || !title) return json({ error: "Missing userId or title" }, 400);

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
      db: { schema: "wedo" },
      auth: { persistSession: false },
    });

    const { data: tokens } = await admin
      .from("device_tokens")
      .select("device_token")
      .eq("user_id", userId);

    const messages = (tokens ?? [])
      .map((t: { device_token: string }) => t.device_token)
      .filter((tok: string) => tok && tok.startsWith("ExponentPushToken"))
      .map((tok: string) => ({
        to: tok,
        sound: "default",
        title,
        body: body ?? "",
        data: data ?? {},
        channelId: "default",
      }));

    if (messages.length === 0) return json({ sent: 0, reason: "no Expo tokens" });

    const res = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Accept-Encoding": "gzip, deflate",
      },
      body: JSON.stringify(messages),
    });
    const result = await res.json().catch(() => ({}));
    return json({ sent: messages.length, expo: result });
  } catch (e) {
    return json({ error: String((e as Error)?.message ?? e) }, 500);
  }
});
