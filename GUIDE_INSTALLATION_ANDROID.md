# 📱 Guide d'Installation Android Studio & Émulateur

Ce guide vous permettra d'installer Android Studio et de configurer un émulateur pour voir votre application TontineDigital en action.

---

## ⏱️ Temps estimé: 20-30 minutes

## 💾 Espace disque requis: ~10 GB

---

## Étape 1: Télécharger Android Studio

### Option A: Téléchargement Manuel (Recommandé)

1. **Ouvrez votre navigateur** et allez sur:
   ```
   https://developer.android.com/studio
   ```

2. **Cliquez sur "Download Android Studio"**

3. **Acceptez les conditions** d'utilisation

4. **Le téléchargement commence** (~1 GB, cela peut prendre 5-10 minutes selon votre connexion)

### Option B: Téléchargement Direct (Windows)

Ouvrez PowerShell et exécutez:
```powershell
# Créer un dossier de téléchargement
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\Downloads\AndroidStudio"

# Télécharger Android Studio
$url = "https://redirector.gvt1.com/edgedl/android/studio/install/2023.3.1.18/android-studio-2023.3.1.18-windows.exe"
$output = "$env:USERPROFILE\Downloads\AndroidStudio\android-studio-installer.exe"

Write-Host "📥 Téléchargement d'Android Studio en cours..."
Invoke-WebRequest -Uri $url -OutFile $output
Write-Host "✅ Téléchargement terminé!"
Write-Host "📂 Fichier: $output"
```

---

## Étape 2: Installer Android Studio

1. **Lancez l'installateur** que vous venez de télécharger

2. **Suivez l'assistant d'installation**:
   - ✅ Cliquez sur "Next"
   - ✅ Sélectionnez "Android Studio" et "Android Virtual Device" (AVD)
   - ✅ Choisissez le dossier d'installation (laissez par défaut)
   - ✅ Cliquez sur "Install"

3. **Attendez la fin de l'installation** (5-10 minutes)

4. **Cliquez sur "Finish"** et cochez "Start Android Studio"

---

## Étape 3: Configuration Initiale d'Android Studio

Lors du premier lancement:

### 3.1 Assistant de Configuration

1. **Import Settings**
   - Sélectionnez "Do not import settings"
   - Cliquez "OK"

2. **Welcome**
   - Cliquez "Next"

3. **Install Type**
   - Sélectionnez "**Standard**" (recommandé)
   - Cliquez "Next"

4. **Select UI Theme**
   - Choisissez votre thème préféré (Darcula ou Light)
   - Cliquez "Next"

5. **Verify Settings**
   - Vérifiez que les composants suivants sont sélectionnés:
     - ✅ Android SDK
     - ✅ Android SDK Platform
     - ✅ Android Virtual Device
   - Cliquez "Next"

6. **License Agreement**
   - Acceptez toutes les licences
   - Cliquez "Finish"

7. **Downloading Components** (Cette étape peut prendre 15-20 minutes)
   - Android SDK (~3 GB)
   - Android SDK Platform-Tools
   - Android SDK Build-Tools
   - Android Emulator
   - Attendez que tous les téléchargements se terminent

8. **Cliquez sur "Finish"** quand c'est terminé

---

## Étape 4: Configurer les Variables d'Environnement

### 4.1 Trouver le chemin du SDK Android

Le SDK est généralement installé dans:
```
C:\Users\VotreNom\AppData\Local\Android\Sdk
```

### 4.2 Configurer les Variables (Windows)

**Ouvrez PowerShell en tant qu'Administrateur** et exécutez:

```powershell
# Définir le chemin du SDK
$ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"

# Ajouter aux variables d'environnement utilisateur
[Environment]::SetEnvironmentVariable("ANDROID_HOME", $ANDROID_HOME, "User")

# Ajouter au PATH
$currentPath = [Environment]::GetEnvironmentVariable("Path", "User")
$newPath = "$ANDROID_HOME\platform-tools;$ANDROID_HOME\emulator;$ANDROID_HOME\tools;$ANDROID_HOME\tools\bin;$currentPath"
[Environment]::SetEnvironmentVariable("Path", $newPath, "User")

Write-Host "✅ Variables d'environnement configurées!"
Write-Host "⚠️ Fermez et rouvrez votre terminal pour appliquer les changements"
```

### 4.3 Vérification

**Fermez TOUS vos terminaux** et ouvrez-en un nouveau, puis testez:

```bash
adb --version
# Devrait afficher: Android Debug Bridge version ...

emulator -version
# Devrait afficher: Android emulator version ...
```

---

## Étape 5: Créer un Émulateur Android (AVD)

### 5.1 Ouvrir le AVD Manager

1. **Ouvrez Android Studio**

2. **Cliquez sur "More Actions"** (ou les 3 points)

3. **Sélectionnez "Virtual Device Manager"**

### 5.2 Créer un Nouveau Device

1. **Cliquez sur "Create Device"**

2. **Sélectionnez un appareil**:
   - Recommandé: **Pixel 6** ou **Pixel 5**
   - Catégorie: Phone
   - Cliquez "Next"

3. **Sélectionnez une System Image**:
   - Onglet: **"Recommended"**
   - Sélectionnez: **"Tiramisu" (API 33)** ou **"UpsideDownCake" (API 34)**
   - Si pas téléchargé, cliquez sur l'icône de téléchargement à côté
   - Attendez le téléchargement (~800 MB)
   - Cliquez "Next"

4. **Configuration de l'AVD**:
   - Nom: Laissez par défaut ou donnez un nom (ex: "Pixel_6_API_33")
   - Startup orientation: Portrait
   - **Important**: Cochez "Show Advanced Settings"

5. **Paramètres Avancés** (recommandés pour de meilleures performances):
   - RAM: **4096 MB** (4 GB)
   - VM heap: **512 MB**
   - Internal Storage: **4096 MB**
   - SD card: **512 MB**
   - Graphics: **Hardware - GLES 2.0**
   - Boot option: **Cold boot**

6. **Cliquez sur "Finish"**

### 5.3 Lancer l'Émulateur

1. Dans le **Device Manager**, trouvez votre émulateur

2. **Cliquez sur le bouton Play (▶)** à côté de votre device

3. **Attendez le démarrage** (peut prendre 1-2 minutes la première fois)

4. Vous devriez voir **un téléphone Android virtuel** s'ouvrir dans une fenêtre!

---

## Étape 6: Lancer l'Application TontineDigital

### 6.1 Vérifier que l'émulateur est détecté

Ouvrez un **nouveau terminal** dans le dossier du projet:

```bash
cd "C:\devs\Wedo-Tontine Digitale\TontineDigital"

# Vérifier les appareils connectés
adb devices
```

Vous devriez voir quelque chose comme:
```
List of devices attached
emulator-5554   device
```

### 6.2 Lancer l'application

**Important**: Assurez-vous que:
- ✅ L'émulateur Android est **démarré**
- ✅ Le serveur Metro est **en cours d'exécution** (sur le port 8082)

Puis exécutez:

```bash
npm run android
```

### 6.3 Ce qui va se passer:

1. **Gradle Build** (première fois: 3-5 minutes)
   - Le projet Android est compilé
   - Les dépendances sont téléchargées

2. **Installation de l'APK**
   - L'application est installée sur l'émulateur

3. **Lancement automatique**
   - L'application TontineDigital se lance!

---

## 🎉 Succès!

Si tout s'est bien passé, vous devriez maintenant voir:
- 📱 L'émulateur Android avec votre application en cours d'exécution
- 🏠 L'écran de connexion de TontineDigital
- ✨ Une application mobile professionnelle et fonctionnelle!

---

## 🐛 Dépannage

### Problème 1: "adb: command not found"
**Solution**: Les variables d'environnement ne sont pas configurées
- Refaites l'Étape 4
- **Fermez TOUS vos terminaux** et réouvrez-les
- Redémarrez votre ordinateur si nécessaire

### Problème 2: "No devices/emulators found"
**Solution**: L'émulateur n'est pas démarré
- Ouvrez Android Studio → Device Manager
- Lancez l'émulateur manuellement (bouton Play)
- Attendez qu'il démarre complètement
- Réessayez `npm run android`

### Problème 3: "SDK location not found"
**Solution**:
```bash
cd "C:\devs\Wedo-Tontine Digitale\TontineDigital\android"
echo "sdk.dir=C:\\Users\\VotreNom\\AppData\\Local\\Android\\Sdk" > local.properties
```
Remplacez `VotreNom` par votre nom d'utilisateur Windows

### Problème 4: Erreur Gradle / Build Failed
**Solution**:
```bash
cd android
./gradlew clean
cd ..
npm run android
```

### Problème 5: L'émulateur est lent
**Solutions**:
- Allouez plus de RAM (6 GB ou 8 GB si possible)
- Activez la virtualisation dans le BIOS (Intel VT-x ou AMD-V)
- Fermez les applications lourdes
- Utilisez Graphics: Hardware

### Problème 6: "Port 8081 already in use"
**Solution**: Le serveur Metro est déjà lancé
- C'est normal! Le serveur tourne sur le port 8082
- Ignorez cette erreur si l'app se lance quand même

---

## 📝 Commandes Utiles

```bash
# Lister les appareils connectés
adb devices

# Lister les émulateurs disponibles
emulator -list-avds

# Démarrer un émulateur spécifique
emulator -avd Pixel_6_API_33

# Recharger l'application (dans l'émulateur)
Appuyez deux fois sur "R" rapidement

# Ouvrir le menu développeur (dans l'émulateur)
Ctrl + M (Windows) ou Cmd + M (Mac)

# Nettoyer le cache
cd android && ./gradlew clean && cd ..

# Désinstaller l'app de l'émulateur
adb uninstall com.tontinedigital.app
```

---

## 🚀 Prochaines Étapes

Une fois l'application lancée:

1. **Testez la navigation** entre les écrans
2. **Explorez les fonctionnalités**:
   - Inscription / Connexion
   - Création de tontine
   - Liste des tontines
   - Profil utilisateur
   - Paramètres

3. **Rechargement à chaud** (Hot Reload):
   - Modifiez un fichier dans `src/`
   - L'application se recharge automatiquement!

4. **Menu développeur**:
   - Appuyez sur `Ctrl + M` dans l'émulateur
   - Activez "Fast Refresh" pour le rechargement automatique

---

## 💡 Conseils

- **Première compilation**: Peut prendre 5-10 minutes (Gradle télécharge les dépendances)
- **Compilations suivantes**: 30 secondes à 1 minute
- **Hot Reload**: Instantané pour les changements de code
- **RAM recommandée**: 8 GB minimum, 16 GB idéal
- **Espace disque**: Gardez au moins 15 GB d'espace libre

---

## 📚 Resources

- [Documentation React Native](https://reactnative.dev/docs/environment-setup)
- [Documentation Android Studio](https://developer.android.com/studio/intro)
- [React Native Debugging](https://reactnative.dev/docs/debugging)

---

## ✅ Checklist Finale

Avant de lancer `npm run android`, vérifiez:

- [ ] Android Studio est installé
- [ ] SDK Android est téléchargé
- [ ] Variables d'environnement configurées (ANDROID_HOME, PATH)
- [ ] Un émulateur AVD est créé
- [ ] L'émulateur est démarré et visible
- [ ] `adb devices` montre l'émulateur
- [ ] Le serveur Metro tourne (port 8082)
- [ ] Tous les terminaux ont été fermés et rouverts après config

---

**Bonne chance! 🎉** Votre application TontineDigital est prête à être testée!
