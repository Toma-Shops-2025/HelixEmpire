# Helix Empire - Build signed APK for Testing
$ProjectPath  = "$env:USERPROFILE\Desktop\helix-jump"
$KeystorePath = "C:\Keys\helix-jump.jks"
$KeyAlias     = "alias"
$ApkPath      = "$ProjectPath\android\app\build\outputs\apk\release\app-release.apk"

$ErrorActionPreference = "Stop"
function Step($msg) { Write-Host "`n==> $msg" -ForegroundColor Cyan }

Step "Cleaning..."
if (Test-Path $ApkPath) { Remove-Item $ApkPath -Force }

Step "Building Web App..."
Set-Location $ProjectPath
npm install
npm run build

Step "Syncing Capacitor..."
npx cap sync android

Step "Credentials (Typing is hidden)..."
$storePassSecure = Read-Host "Keystore password" -AsSecureString
$storePass = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto([System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($storePassSecure))

Step "Building Android APK..."
Set-Location "$ProjectPath\android"
& .\gradlew.bat clean
& .\gradlew.bat assembleRelease "-Pandroid.injected.signing.store.file=$KeystorePath" "-Pandroid.injected.signing.store.password=$storePass" "-Pandroid.injected.signing.key.alias=$KeyAlias" "-Pandroid.injected.signing.key.password=$storePass"

Set-Location $ProjectPath
if (Test-Path $ApkPath) {
    Write-Host "`n  SUCCESS! APK Ready: $ApkPath" -ForegroundColor Green
    Start-Process explorer.exe "/select,`"$ApkPath`""
}
