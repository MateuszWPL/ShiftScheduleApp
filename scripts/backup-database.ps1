# Backup bazy PostgreSQL (pg_dump) — PowerShell, Windows
# Wymaga: PostgreSQL client tools (pg_dump w PATH) oraz DATABASE_URL
# Użycie: .\scripts\backup-database.ps1 [-OutputDir ".\backups"]

param([string]$OutputDir = ".\backups")

$ErrorActionPreference = "Stop"

# Ładuj .env z backendu
$envPath = "backend\.env"
if (Test-Path $envPath) {
    Get-Content $envPath | ForEach-Object {
        if ($_ -match "^\s*([^#][^=]*)=(.*)$") {
            [Environment]::SetEnvironmentVariable($matches[1].Trim(), $matches[2].Trim(), "Process")
        }
    }
}

$dbUrl = $env:DATABASE_URL
if (-not $dbUrl) {
    Write-Error "DATABASE_URL nie jest ustawione. Ustaw w backend\.env"
    exit 1
}

New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$outputFile = Join-Path $OutputDir "shiftapp_$timestamp.sql"

Write-Host "Tworzenie backupu do $outputFile ..."
& pg_dump $dbUrl --no-owner --no-acl -F p -f $outputFile

Write-Host "Backup zapisany: $outputFile"
Write-Host "Rozmiar: $((Get-Item $outputFile).Length / 1KB) KB"
