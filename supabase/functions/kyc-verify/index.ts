// WeDo — kyc-verify (palier P2)
// Verifies a national ID (CNI/NNI) with face-match + liveness, then promotes the
// caller's PERSONNE to palier 2 (required for séquestre tontines and large amounts).
//
// The CNI number is hashed server-side (SHA-256) and stored ONLY as a hash
// (`personnes.cni_hash`) — never in clear (conformité ARTCI). The hash is the
// biometric dedup key: the same person can hold several accounts, but a single
// `personne`. A clash with another personne is surfaced (semi-manual review at the
// pilot — the dedup key is in place from the MVP).
//
// Sandbox mode (default): auto-approves with provided face-match / liveness scores.
// Real mode: set WEDO_KYC_PROVIDER + keys and implement the provider call below.

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
const KYC_PROVIDER = Deno.env.get("WEDO_KYC_PROVIDER") ?? "sandbox";
const FACE_MATCH_MIN = 0.85;
const LIVENESS_MIN = 0.90;

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return json({ error: "Unauthorized" }, 401);

    const {
      cniNumber,
      selfieRef,
      faceMatchScore = 0.99,
      livenessScore = 0.99,
    } = await req.json();
    if (!cniNumber || typeof cniNumber !== "string" || cniNumber.trim().length < 6) {
      return json({ error: "Numéro CNI/NNI invalide" }, 400);
    }
    if (!selfieRef) return json({ error: "Selfie requis (face-match + liveness)" }, 400);

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
      db: { schema: "wedo" },
      auth: { persistSession: false },
    });

    // 1) Resolve the caller's personne
    const { data: compte } = await admin
      .from("comptes")
      .select("id, personne_id")
      .eq("profile_id", user.id)
      .maybeSingle();
    if (!compte?.personne_id) return json({ error: "Profil non initialisé" }, 409);

    // 2) Provider verification (sandbox auto-approves on the supplied scores)
    let approved = false;
    if (KYC_PROVIDER === "sandbox") {
      approved = faceMatchScore >= FACE_MATCH_MIN && livenessScore >= LIVENESS_MIN;
    } else {
      // TODO: call the KYC provider (Smile ID / Youverify / Daktela…) with the
      // CNI image + selfie; map their decision to `approved` + scores.
      approved = false;
    }
    if (!approved) {
      return json({
        success: false,
        error: "Vérification refusée (face-match / liveness insuffisant)",
        faceMatchScore,
        livenessScore,
      }, 422);
    }

    // 3) Hash the CNI (stored as hash only) — the portable dedup key
    const cniHash = await sha256Hex(`CNI:${cniNumber.trim().toUpperCase()}`);

    // 4) Dedup against other personnes
    const { data: clash } = await admin
      .from("personnes")
      .select("id")
      .eq("cni_hash", cniHash)
      .neq("id", compte.personne_id)
      .maybeSingle();
    if (clash) {
      return json({
        success: false,
        error: "Cette pièce est déjà rattachée à une autre identité (revue manuelle requise).",
        duplicate: true,
      }, 409);
    }

    // 5) Promote the personne to P2 + sync the profile KYC level
    const { error: pErr } = await admin
      .from("personnes")
      .update({ cni_hash: cniHash, palier: 2 })
      .eq("id", compte.personne_id);
    if (pErr) throw pErr;

    await admin
      .from("profiles")
      .update({ kyc_level: 2, is_verified: true })
      .eq("id", user.id);

    await admin.from("notifications").insert({
      user_id: user.id,
      title: "Identité vérifiée (P2)",
      body: "Votre pièce d'identité a été vérifiée. Vous pouvez rejoindre les tontines sous séquestre.",
      type: "System",
    });

    return json({
      success: true,
      palier: 2,
      faceMatchScore,
      livenessScore,
      sandbox: KYC_PROVIDER === "sandbox",
    });
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
