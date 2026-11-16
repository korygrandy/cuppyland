$ErrorActionPreference = "Stop"

$projectRoot = "C:\dev\oliviaworld\cuppy-land"
$logDir = Join-Path $projectRoot "logs"
$androidRoot = Join-Path $projectRoot "android"
$javaHome = "C:\Users\KG1\.jdks\jbr-21.0.11"
$keystorePath = Join-Path $androidRoot "my-release-key.keystore"
$keystoreAlias = "cuppyland"
$unsignedApk = Join-Path $androidRoot "app\build\outputs\apk\release\app-release-unsigned.apk"
$signedApk = Join-Path $androidRoot "app\build\outputs\apk\release\app-release.apk"
$apksigner = "C:\Users\KG1\AppData\Local\Android\Sdk\build-tools\35.0.0\apksigner.bat"

New-Item -ItemType Directory -Force -Path $logDir | Out-Null

Write-Host "[1/4] Preparing web bundle..."
Set-Location $projectRoot
npm run prepare:web *> (Join-Path $logDir "web-build.log") 2>&1

Write-Host "[2/4] Building Android release APK..."
Set-Location $androidRoot
$env:JAVA_HOME = $javaHome
$env:Path = "$javaHome\bin;$env:Path"
.\gradlew.bat assembleRelease *> (Join-Path $logDir "android-release.log") 2>&1

if (-not (Test-Path $unsignedApk)) {
    throw "Unsigned release APK was not produced: $unsignedApk"
}

if (-not (Test-Path $keystorePath)) {
    Write-Host "[3/4] Keystore not found. Creating a new one..."
    & "C:\Program Files\Android\Android Studio\jbr\bin\keytool.exe" -genkeypair -v `
        -keystore $keystorePath `
        -alias $keystoreAlias `
        -keyalg RSA `
        -keysize 2048 `
        -validity 10000
}

Write-Host "[3/4] Signing release APK..."
& $apksigner sign --ks $keystorePath --ks-key-alias $keystoreAlias --out $signedApk $unsignedApk
& $apksigner verify $signedApk

Write-Host "[4/4] Release check complete."
Write-Host "Signed APK: $signedApk"
Write-Host "Web bundle logs: $logDir"
