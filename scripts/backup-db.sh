#!/usr/bin/env bash
set -euo pipefail
mkdir -p backups
timestamp=$(date +%Y%m%d-%H%M%S)
docker compose exec -T db pg_dump -U expoline -d expoline --clean --if-exists > "backups/expoline-${timestamp}.sql"
echo "Database backup created: backups/expoline-${timestamp}.sql"
