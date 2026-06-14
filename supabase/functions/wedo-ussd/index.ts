// WeDo — wedo-ussd : passerelle USSD (cotiser/consulter sans smartphone).
//
// SQUELETTE prêt à brancher. Le menu est agnostique du provider ; seul le format
// requête/réponse dépend de l'agrégateur (Africa's Talking par défaut : form-urlencoded
// {sessionId, serviceCode, phoneNumber, text} -> réponse text/plain "CON ..."/"END ...").
// Pour activer : déclarer l'URL de cette fonction comme callback USSD chez l'agrégateur,
// puis poser WEDO_USSD_PROVIDER (voir PARTNERS.md). verify_jwt=false (webhook public).
//
// NB : l'initiation de paiement USSD (cotiser) renvoie pour l'instant un message
// "ouvrez l'app" — à câbler sur initiate-payment quand le flux USSD->MM sera validé
// avec l'agrégateur. Lecture (tontines) déjà fonctionnelle.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const text = (body: string) =>
  new Response(body, { status: 200, headers: { "Content-Type": "text/plain" } });

/** Lit la requête (form-urlencoded OU JSON) et normalise les champs USSD. */
async function parseUssd(req: Request): Promise<{ phone: string; input: string; sessionId: string }> {
  const ct = req.headers.get("content-type") ?? "";
  if (ct.includes("application/json")) {
    const b = await req.json().catch(() => ({}));
    return { phone: b.phoneNumber ?? b.msisdn ?? "", input: b.text ?? "", sessionId: b.sessionId ?? "" };
  }
  const form = new URLSearchParams(await req.text());
  return {
    phone: form.get("phoneNumber") ?? form.get("msisdn") ?? "",
    input: form.get("text") ?? "",
    sessionId: form.get("sessionId") ?? "",
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok");
  try {
    const { phone, input } = await parseUssd(req);
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
      db: { schema: "wedo" }, auth: { persistSession: false },
    });

    // Identifie l'utilisateur par son numéro (E.164 ou national selon l'agrégateur).
    const { data: profile } = await admin
      .from("profiles")
      .select("id, full_name")
      .or(`phone_number.eq.${phone},phone_number.eq.+${phone.replace(/^\+/, "")}`)
      .maybeSingle();

    if (!profile) {
      return text("END Numero non reconnu. Telechargez l'app WeDo pour vous inscrire.");
    }

    // Menu principal
    if (!input) {
      return text(
        "CON WeDo - vos tontines en confiance\n" +
          "1. Mes tontines\n" +
          "2. Mon prochain tour\n" +
          "3. Aide",
      );
    }

    const steps = input.split("*");
    const choice = steps[0];

    if (choice === "1") {
      const { data: mems } = await admin
        .from("tontine_members")
        .select("tontines(name, status)")
        .eq("user_id", profile.id)
        .eq("status", "Active")
        .limit(5);
      const names = (mems ?? [])
        .map((m: any, i: number) => `${i + 1}. ${m.tontines?.name ?? "Tontine"}`)
        .join("\n");
      return text(names ? `END Vos tontines:\n${names}` : "END Vous n'avez pas encore de tontine active.");
    }

    if (choice === "2") {
      return text("END Consultez le calendrier de vos tours dans l'app WeDo.");
    }

    if (choice === "3") {
      return text("END WeDo: cotisez en confiance. Support: ouvrez l'app WeDo > Aide.");
    }

    return text("END Choix invalide.");
  } catch (_e) {
    return text("END Service momentanement indisponible. Reessayez.");
  }
});
