# Helix Jump - Build signed AAB for Google Play
# Usage: cd Desktop\helix-jump ; .\build-aab.ps1

$ProjectPath  = "$env:USERPROFILE\Desktop\helix-jump"
$KeystorePath = "C:\Keys\helix-jump.jks"
$KeyAlias     = "helixjump1"
$BumpVersion  = $true

$ErrorActionPreference = "Stop"

function Step($msg) { Write-Host "`n==> $msg" -ForegroundColor Cyan }

Step "Switching to project: $ProjectPath"
Set-Location $ProjectPath

if (-not (Test-Path -LiteralPath $KeystorePath -PathType Leaf)) {
    Write-Host "`n  Keystore file not found: $KeystorePath" -ForegroundColor Red
    Write-Host "  Create the folder and generate the keystore before building:" -ForegroundColor Yellow
    Write-Host "`n  New-Item -ItemType Directory -Force -Path C:\Keys" -ForegroundColor Gray
    Write-Host "  & `"$env:JAVA_HOME\bin\keytool.exe`" -genkey -v -keystore C:\Keys\helix-jump.jks -alias $KeyAlias -keyalg RSA -keysize 2048 -validity 10000`n" -ForegroundColor Gray
    Write-Error "Missing release signing keystore. Expected: $KeystorePath"
}

Step "bun install"
bun install

Step "Building web app"
bun run build

Step "Clearing old Android icon + splash outputs"
$resPath = "$ProjectPath\android\app\src\main\res"
if (Test-Path -LiteralPath $resPath -PathType Container) {
    Get-ChildItem -LiteralPath $resPath -Directory -Filter "mipmap-*" | ForEach-Object {
        Remove-Item -LiteralPath (Join-Path $_.FullName "ic_launcher*.png") -Force -ErrorAction SilentlyContinue
        Remove-Item -LiteralPath (Join-Path $_.FullName "ic_launcher*.xml") -Force -ErrorAction SilentlyContinue
    }
    Get-ChildItem -LiteralPath $resPath -Directory -Filter "drawable*" | ForEach-Object {
        Remove-Item -LiteralPath (Join-Path $_.FullName "splash*.png") -Force -ErrorAction SilentlyContinue
        Remove-Item -LiteralPath (Join-Path $_.FullName "ic_launcher*.xml") -Force -ErrorAction SilentlyContinue
    }
}

Step "Regenerating Android launcher icon + splash from resources/"
bun run assets:generate

Step "Capacitor sync (Android)"
bunx cap sync android

if ($BumpVersion) {
    Step "Bumping versionCode"
    $gradle = "android/app/build.gradle"
    $content = Get-Content $gradle -Raw
    if ($content -match 'versionCode\s+(\d+)') {
        $old = [int]$Matches[1]
        $new = $old + 1
        $content = $content -replace "versionCode\s+$old", "versionCode $new"
        Set-Content $gradle $content -NoNewline
        Write-Host "    versionCode: $old -> $new" -ForegroundColor Green
    } else {
        Write-Warning "Could not find versionCode in $gradle"
    }
}

Step "Keystore credentials (typing is hidden)"
$storePassSecure = Read-Host "Keystore password" -AsSecureString
$keyPassSecure   = Read-Host "Key password (Enter to reuse keystore password)" -AsSecureString

$storePass = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto([System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($storePassSecure))
$keyPass   = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto([System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($keyPassSecure))
if ([string]::IsNullOrEmpty($keyPass)) { $keyPass = $storePass }

Step "Building signed release AAB"
if (Test-Path -Path "$ProjectPath\android\gradlew.bat") {
    Set-Location "$ProjectPath\android"
    $gradleArgs = @(
        "bundleRelease",
        "-Pandroid.injected.signing.store.file=$KeystorePath",
        "-Pandroid.injected.signing.store.password=$storePass",
        "-Pandroid.injected.signing.key.alias=$KeyAlias",
        "-Pandroid.injected.signing.key.password=$keyPass"
    )
    & .\gradlew.bat @gradleArgs
} else {
    Write-Error "gradlew.bat not found. Did you run 'bunx cap add android'?"
}

$storePass = $null
$keyPass = $null
[System.GC]::Collect()

$aab = "$ProjectPath\android\app\build\outputs\bundle\release\app-release.aab"
Set-Location $ProjectPath

if (Test-Path $aab) {
    Write-Host "`n  SUCCESS" -ForegroundColor Green
    Write-Host "  Signed AAB: $aab" -ForegroundColor Green
    Write-Host "  Upload to Play Console -> Closed testing -> Create new release.`n"
    Start-Process explorer.exe "/select,`"$aab`""
} else {
    Write-Error "Build finished but AAB not found at $aab"
}
