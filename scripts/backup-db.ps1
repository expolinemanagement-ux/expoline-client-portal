$ErrorActionPreference = 'Stop'
$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$backupDir = Join-Path (Get-Location) 'backups'
New-Item -ItemType Directory -Force -Path $backupDir | Out-Null
$file = Join-Path $backupDir "expoline-$timestamp.sql"

docker compose exec -T db pg_dump -U expoline -d expoline --clean --if-exists | Out-File -FilePath $file -Encoding utf8
Write-Host "Database backup created: $file"
