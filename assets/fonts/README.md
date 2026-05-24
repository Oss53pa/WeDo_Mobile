# Polices natives (Android/iOS)

L'app utilise **Grand Hotel** (titre/logo « WeDo ») et **Dosis** (tout le reste).
Sur le web elles sont chargées via Google Fonts ; pour le **build natif (APK/IPA)** il faut
embarquer les fichiers `.ttf` ici, puis lancer l'édition de liens des assets.

## 1. Déposer les fichiers .ttf dans ce dossier
Téléchargez depuis Google Fonts (https://fonts.google.com) :

- `GrandHotel-Regular.ttf`
- `Dosis-Regular.ttf`
- `Dosis-Medium.ttf`
- `Dosis-SemiBold.ttf`
- `Dosis-Bold.ttf`
- `Dosis-ExtraBold.ttf`

(Le nom de famille PostScript doit correspondre à « Dosis » / « Grand Hotel » utilisés dans
`src/theme/typography.ts`.)

## 2. Lier les polices au projet natif
```bash
npx react-native-asset
```
Cela copie les `.ttf` dans `android/app/src/main/assets/fonts` (et le projet iOS).

> Sans ces fichiers, l'app fonctionne mais le texte retombe sur la police système au lieu de
> Dosis/Grand Hotel. À faire avant de livrer une version finale.
