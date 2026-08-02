# Helix Empire - Build signed AAB for Google Play
$ProjectPath  = "$env:USERPROFILE\Desktop\helix-jump"
$KeystorePath = "C:\Keys\helix-jump.jks"
$KeyAlias     = "helixjump1"
$Password     = "Custom.247"
$AabPath      = "$ProjectPath\android\app\build\outputs\bundle\release\app-release.aab"

$ErrorActionPreference = "Stop"
function Step($msg) { Write-Host "`n==> $msg" -ForegroundColor Cyan }

Step "Cleaning..."
if (Test-Path $AabPath) { Remove-Item $AabPath -Force }

Step "Building Web App..."
Set-Location $ProjectPath
npm install
npm run build

Step "Regenerating Android launcher icon + splash from resources/"
npm run assets:generate

Step "Syncing Capacitor..."
if (Test-Path "android/app/src/main/assets/public") {
    Remove-Item "android/app/src/main/assets/public" -Recurse -Force
}
npx cap sync android

Step "Bumping versionCode..."
$gradle = "android/app/build.gradle"
$content = Get-Content $gradle -Raw
if ($content -match 'versionCode\s+(\d+)') {
    $old = [int]$Matches[1]
    $new = $old + 1
    $content = $content -replace "versionCode\s+$old", "versionCode $new"
    Set-Content $gradle $content -NoNewline
    Write-Host "    versionCode: $old -> $new" -ForegroundColor Green
}

Step "Building Android AAB..."
Set-Location "$ProjectPath\android"
& .\gradlew.bat clean
& .\gradlew.bat bundleRelease "-Pandroid.injected.signing.store.file=$KeystorePath" "-Pandroid.injected.signing.store.password=$Password" "-Pandroid.injected.signing.key.alias=$KeyAlias" "-Pandroid.injected.signing.key.password=$Password"

Set-Location $ProjectPath
if (Test-Path $AabPath) {
    Write-Host "`n  SUCCESS! AAB Ready: $AabPath" -ForegroundColor Green
    Start-Process explorer.exe "/select,`"$AabPath`""
}
