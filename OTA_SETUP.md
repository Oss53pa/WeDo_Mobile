# Mises à jour automatiques (OTA / EAS Update)

Objectif : que l'app **se mette à jour toute seule** (sans réinstaller d'APK)
quand on pousse du code sur `main`.

## ⚠️ Ce que l'OTA couvre — et ne couvre pas

| Type de changement | Mise à jour |
|---|---|
| JS / écrans / textes / logique / images des assets | ✅ **OTA automatique** (pas de réinstall) |
| Code natif : nouvelle librairie native, permission, version SDK | ❌ **Nouvel APK obligatoire** |

> Exemple : l'ajout de `@react-native-clipboard/clipboard` (auto-remplissage) est
> un changement **natif** → il faut un nouvel APK une fois. Ensuite, les retouches
> JS passent en OTA.

## Configuration (une seule fois)

### 1. Compte Expo + lien du projet
```bash
npm install -g eas-cli
eas login                 # crée/utilise ton compte Expo (gratuit)
eas init                  # écrit extra.eas.projectId dans app.json
eas update:configure      # écrit updates.url dans app.json
```
Committe les modifications de `app.json` que ces commandes ajoutent.

### 2. Jeton EXPO_TOKEN dans le repo GitHub
- Sur https://expo.dev → **Account settings → Access tokens → Create token**.
- Sur GitHub : **Settings → Secrets and variables → Actions → New repository secret**
  - Nom : `EXPO_TOKEN`
  - Valeur : le jeton copié.

### 3. Premier APK OTA-enabled
- GitHub → onglet **Actions** → workflow **« Build APK (EAS, OTA-enabled) »** → **Run workflow**.
- Récupère l'APK sur le tableau de bord EAS (ou `eas build:list`) et installe-le sur le téléphone.
- Cet APK est lié au canal `preview` : il sait aller chercher les mises à jour OTA.

## Ensuite : c'est automatique

À chaque push sur `main` touchant `src/`, `App.tsx`, `assets/`, `app.json`…
le workflow **« OTA Update (EAS Update) »** publie la mise à jour. L'app la
télécharge **à la prochaine ouverture**. Aucune réinstallation.

## Quand refaire un APK ?

Uniquement si tu ajoutes/changes du **natif**. Dans ce cas :
1. Relance **« Build APK (EAS, OTA-enabled) »** et réinstalle l'APK.
2. (Si la version de l'app change, pense à incrémenter `expo.version` dans
   `app.json` pour garder OTA et APK alignés via `runtimeVersion`.)

## Deux pipelines APK — lequel utiliser ?

- **« Build APK (EAS, OTA-enabled) »** → pour l'OTA (canal `preview`). **À privilégier.**
- **« Android APK »** (build self-hosted, lien `android-latest`) → APK de test
  rapide **sans** compte Expo, mais **non** compatible OTA. Pratique pour un
  partage ponctuel, pas pour le flux de mise à jour automatique.
