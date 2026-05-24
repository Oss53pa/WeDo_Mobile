# Script de configuration des variables d'environnement Android
# Exécutez ce script en tant qu'Administrateur

Write-Host "🔧 Configuration des variables d'environnement Android..." -ForegroundColor Cyan

# Définir le chemin du SDK Android
$ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"

# Vérifier si le SDK existe
if (Test-Path $ANDROID_HOME) {
    Write-Host "✅ Android SDK trouvé: $ANDROID_HOME" -ForegroundColor Green

    # Définir ANDROID_HOME
    [Environment]::SetEnvironmentVariable("ANDROID_HOME", $ANDROID_HOME, "User")
    Write-Host "✅ ANDROID_HOME configuré" -ForegroundColor Green

    # Ajouter au PATH
    $currentPath = [Environment]::GetEnvironmentVariable("Path", "User")

    # Chemins à ajouter
    $pathsToAdd = @(
        "$ANDROID_HOME\platform-tools",
        "$ANDROID_HOME\emulator",
        "$ANDROID_HOME\tools",
        "$ANDROID_HOME\tools\bin"
    )

    $newPath = $currentPath
    foreach ($path in $pathsToAdd) {
        if ($currentPath -notlike "*$path*") {
            $newPath = "$path;$newPath"
            Write-Host "✅ Ajouté au PATH: $path" -ForegroundColor Green
        }
    }

    [Environment]::SetEnvironmentVariable("Path", $newPath, "User")
    Write-Host "✅ PATH mis à jour" -ForegroundColor Green

    Write-Host ""
    Write-Host "🎉 Configuration terminée!" -ForegroundColor Green
    Write-Host ""
    Write-Host "⚠️  IMPORTANT: Fermez TOUS vos terminaux et rouvrez-les pour appliquer les changements" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Pour vérifier, ouvrez un nouveau terminal et tapez:" -ForegroundColor Cyan
    Write-Host "  adb --version" -ForegroundColor White

} else {
    Write-Host "❌ Android SDK non trouvé dans: $ANDROID_HOME" -ForegroundColor Red
    Write-Host "Vérifiez que Android Studio a bien installé le SDK." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Appuyez sur une touche pour continuer..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
