Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$webRoot = Join-Path $repoRoot "web"

if (Test-Path $webRoot) {
  Remove-Item $webRoot -Recurse -Force
}

New-Item -ItemType Directory -Path $webRoot | Out-Null

$pathsToCopy = @(
  "index.html",
  "styles.css",
  "assets",
  "sfx",
  "src"
)

foreach ($relativePath in $pathsToCopy) {
  $sourcePath = Join-Path $repoRoot $relativePath
  if (-not (Test-Path $sourcePath)) {
    throw "Missing required path for web package: $relativePath"
  }
  Copy-Item -Path $sourcePath -Destination $webRoot -Recurse -Force
}

Write-Host "Prepared web assets at $webRoot"
