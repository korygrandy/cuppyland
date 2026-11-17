$repoRoot = Split-Path -Parent $PSScriptRoot
$androidRoot = Join-Path $repoRoot "android"
$javaHome = $env:JAVA_HOME
if ($javaHome -and $javaHome.EndsWith('\bin')) {
  $javaHome = Split-Path $javaHome -Parent
}

if (-not $javaHome) {
  $javaCandidates = @(
    "C:\Program Files\Microsoft\jdk-21.0.13.21-hotspot",
    "C:\Program Files\Microsoft\jdk-21",
    "C:\Program Files\Eclipse Adoptium\jdk-21*",
    "C:\Program Files\Amazon Corretto\jdk21*"
  )

  foreach ($candidate in $javaCandidates) {
    $candidateRoot = $candidate
    if ($candidate.EndsWith('*')) {
      $matches = Get-ChildItem -Path (Split-Path $candidate -Parent) -Directory -ErrorAction SilentlyContinue | Where-Object { $_.Name -like (Split-Path $candidate -Leaf).Replace('*', '*') } | Select-Object -First 1
      if ($matches) {
        $candidateRoot = $matches.FullName
      }
    }

    if ((Test-Path $candidateRoot) -and (Test-Path (Join-Path $candidateRoot 'bin\java.exe'))) {
      $javaHome = $candidateRoot
      break
    }
  }
}

if (-not $javaHome -or -not (Test-Path (Join-Path $javaHome 'bin\java.exe'))) {
  throw "JAVA_HOME is not set and no Java 21 installation was found. Install JDK 21 and set JAVA_HOME."
}

$env:JAVA_HOME = $javaHome.TrimEnd('\')
$env:Path = "$env:JAVA_HOME\bin;" + $env:Path
Write-Host "Using JAVA_HOME=$env:JAVA_HOME"

Push-Location $repoRoot
try {
  npm run cap:copy
  Push-Location $androidRoot
  try {
    .\gradlew.bat clean assembleRelease
  }
  finally {
    Pop-Location
  }
}
finally {
  Pop-Location
}

$apkPath = Join-Path $androidRoot "app\build\outputs\apk\release\app-release.apk"
if (-not (Test-Path $apkPath)) {
  throw "Release APK was not created at $apkPath"
}

$appDownloadDir = Join-Path $repoRoot "cuppylandapp"
New-Item -ItemType Directory -Path $appDownloadDir -Force | Out-Null
$stagedApkPath = Join-Path $appDownloadDir "app-release.apk"
Copy-Item -Path $apkPath -Destination $stagedApkPath -Force

Write-Host "Release build succeeded: $apkPath"
Write-Host "APK copied to: $stagedApkPath"
