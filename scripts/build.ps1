Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
Push-Location (Join-Path $PSScriptRoot "..")
Write-Host "Reign — build (Windows)"
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
  Write-Error "npm not found. Install Node.js 18+ first."; exit 1
}
if (Test-Path package-lock.json) { npm ci } else { npm install }
Write-Host "→ Building NSIS installer + portable exe (x64)…"
npx electron-builder --win --x64
Write-Host ""
Write-Host "Done. Artifacts in .\dist\:"
Get-ChildItem dist -ErrorAction SilentlyContinue | Format-Table Name, Length
Write-Host ""
Write-Host "Installer:  .\dist\Reign Setup *.exe"
Write-Host "Portable:   .\dist\Reign-*-portable.exe"
Pop-Location
