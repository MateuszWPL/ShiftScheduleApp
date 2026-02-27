#!/bin/bash
# Backup bazy PostgreSQL (pg_dump) — do uruchomienia ręcznie lub z crona
# Wymaga: PostgreSQL client tools (pg_dump) oraz DATABASE_URL w .env
# Użycie: ./scripts/backup-database.sh [katalog_docelowy]

set -e
BACKUP_DIR="${1:-./backups}"
mkdir -p "$BACKUP_DIR"

# Ładuj .env z backendu (jeśli istnieje)
if [ -f backend/.env ]; then
  set -a
  source backend/.env
  set +a
fi

if [ -z "$DATABASE_URL" ]; then
  echo "Błąd: DATABASE_URL nie jest ustawione. Ustaw w backend/.env" >&2
  exit 1
fi

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
OUTPUT_FILE="$BACKUP_DIR/shiftapp_$TIMESTAMP.sql"

echo "Tworzenie backupu do $OUTPUT_FILE ..."
pg_dump "$DATABASE_URL" --no-owner --no-acl -F p -f "$OUTPUT_FILE"

echo "Backup zapisany: $OUTPUT_FILE"
echo "Rozmiar: $(du -h "$OUTPUT_FILE" | cut -f1)"
