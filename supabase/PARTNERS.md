# WeDo — Branchement des partenaires (runbook « coller la clé »)

Tout est **scaffoldé et INERTE par défaut** (provider `sandbox`/`none` → aucun appel
externe, rien ne casse). Activer une intégration = **poser les secrets** puis, le cas
échéant, déclarer un webhook ou programmer un cron. Aucune réécriture de code.

> Où poser les secrets : **Supabase Dashboard → Project Settings → Edge Functions →
> Secrets** (ou `supabase secrets set NOM=valeur`). ⚠️ Ne jamais committer les clés.
> Claude ne saisit pas les clés lui-même : vous les collez.

Projet : `easoqoswtmvtkdwwkqtc` · Base URL Edge : `https://easoqoswtmvtkdwwkqtc.supabase.co/functions/v1`

---

## 1) Mobile Money — cotisations (encaissement)  ✅ déjà câblé

Fonctions : `initiate-payment`, `check-payment-status`, webhook `wedo-cinetpay-webhook`.
Défaut : `WEDO_MM_PROVIDER=sandbox` (auto-règle, aucun appel réel).

**Activer (CinetPay) — secrets :**
```
WEDO_MM_PROVIDER = cinetpay
CINETPAY_API_KEY = <clé API>
CINETPAY_SITE_ID = <site id>
```
**Webhook à déclarer chez CinetPay (notify URL) :**
`https://easoqoswtmvtkdwwkqtc.supabase.co/functions/v1/wedo-cinetpay-webhook`

Test : faire une cotisation Mobile Money dans l'app → `payment_url` s'ouvre → après
paiement, le webhook règle la cotisation (séquestre + registre).

---

## 2) Versements — cagnottes & commissions (décaissement)  ✅ déjà câblé

- Cagnotte aux bénéficiaires : `process-disbursement` (utilise `WEDO_MM_PROVIDER`).
- Commissions ambassadrices : `wedo-ambassador-payout` (+ webhook
  `wedo-ambassador-payout-webhook`), derrière `WEDO_PAYOUT_PROVIDER`.

Défaut : `sandbox` (marque réglé sans transfert réel).

**Activer — secrets :**
```
WEDO_PAYOUT_PROVIDER = cinetpay        # (ou le provider de transfert retenu)
CINETPAY_TRANSFER_API_KEY = <clé transfert>
CINETPAY_TRANSFER_PASSWORD = <mot de passe transfert>
```
**Webhook transfert à déclarer :**
`https://easoqoswtmvtkdwwkqtc.supabase.co/functions/v1/wedo-ambassador-payout-webhook`

> Le décaissement déplace de l'argent réel : à n'activer qu'après validation du compte
> de cantonnement (EME) avec le partenaire.

---

## 3) SMS / WhatsApp — relances & notifications  ⚙️ scaffold prêt (INERTE)

Aujourd'hui les relances d'impayés partent **in-app** uniquement. La couche SMS/WhatsApp
est posée mais éteinte :
- File `wedo.sms_outbox` (migration 027) : les notifications « sortables » (PaymentDue,
  PaymentLate, DistributionReceived, JoinApproved, TontineStarted) y sont **déjà mises en
  file** dès qu'un membre a un numéro (trigger `trg_enqueue_sms`).
- Fonction `wedo-send-sms` (provider abstrait, défaut `none` → messages passés à `skipped`).

**Activer (Twilio) — secrets :**
```
WEDO_SMS_PROVIDER   = twilio
TWILIO_ACCOUNT_SID  = <SID>
TWILIO_AUTH_TOKEN   = <token>
TWILIO_SMS_FROM     = +1XXXXXXXXXX                 # expéditeur SMS
TWILIO_WHATSAPP_FROM= whatsapp:+14155238886        # expéditeur WhatsApp (si utilisé)
WEDO_CRON_SECRET    = <chaîne aléatoire longue>    # protège le dispatch
```

**Puis programmer le dépileur** (à lancer UNE fois en SQL, remplace `<WEDO_CRON_SECRET>`) :
```sql
select cron.schedule('wedo-dispatch-sms', '*/2 * * * *', $$
  select net.http_post(
    url     := 'https://easoqoswtmvtkdwwkqtc.supabase.co/functions/v1/wedo-send-sms',
    headers := jsonb_build_object('Content-Type','application/json','x-wedo-cron','<WEDO_CRON_SECRET>'),
    body    := '{"mode":"dispatch"}'::jsonb
  );
$$);
```
Test : `select * from wedo.sms_outbox order by created_at desc;` → les lignes passent de
`pending` à `sent`. (Tant que le provider = `none`, elles passent à `skipped`.)

---

## 4) USSD — accès hors smartphone  ⚙️ squelette prêt (INERTE)

Fonction `wedo-ussd` (webhook public, `verify_jwt=false`). Menu agnostique : identifie le
membre par son numéro, liste ses tontines, prochain tour, aide. Format Africa's Talking
par défaut (form-urlencoded → réponse `CON`/`END`).

**Activer :**
1. Poser `WEDO_USSD_PROVIDER = africastalking` (ou l'agrégateur retenu).
2. Déclarer le **callback USSD** chez l'agrégateur :
   `https://easoqoswtmvtkdwwkqtc.supabase.co/functions/v1/wedo-ussd`
3. Adapter le parsing/format de réponse si l'agrégateur n'est pas Africa's Talking
   (fonction `parseUssd` + préfixes `CON`/`END`).

> La cotisation par USSD (débit Mobile Money) reste à câbler sur `initiate-payment` une
> fois le flux USSD→MM validé avec l'agrégateur ; la consultation est déjà fonctionnelle.

---

## Bonus — KYC automatisé (optionnel)

`kyc-verify` est derrière `WEDO_KYC_PROVIDER` (défaut `sandbox`). Le **KYC manuel gratuit**
(CNI + selfie → revue humaine) fonctionne déjà sans aucune clé. Pour un prestataire
automatique (Smile ID / Jumio) : poser `WEDO_KYC_PROVIDER` + ses clés et implémenter
l'appel dans `kyc-verify` (TODO marqué dans le fichier).

---

### Récapitulatif des « interrupteurs »
| Intégration | Variable | Défaut (inerte) | Valeur live |
|---|---|---|---|
| Mobile Money | `WEDO_MM_PROVIDER` | `sandbox` | `cinetpay` |
| Versements | `WEDO_PAYOUT_PROVIDER` | `sandbox` | `cinetpay` |
| SMS/WhatsApp | `WEDO_SMS_PROVIDER` | `none` | `twilio` |
| USSD | `WEDO_USSD_PROVIDER` | `none` | `africastalking` |
| KYC auto | `WEDO_KYC_PROVIDER` | `sandbox` | `smileid` / `jumio` |
