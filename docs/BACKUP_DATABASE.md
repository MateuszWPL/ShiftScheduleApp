# Strategia backupu bazy danych

## Neon (zalecane)

Neon oferuje **automatyczny Point-in-Time Recovery (PITR)**:
- Retencja 1–30 dni (zależnie od planu)
- Przywracanie do dowolnego momentu w oknie
- Bez dodatkowych skryptów — włącz w Neon Console → Project Settings → Restore

**Akcje:**
1. Neon Console → wybrany projekt → Settings
2. Ustaw **History retention** (np. 7 dni na Free, 30 na Scale)
3. Restore: Branching → „Restore to point in time”

## Backup logiczny (pg_dump)

Dla dodatkowej warstwy — np. off-site, długoterminowa retencja.

### Wymagania
- PostgreSQL client tools (`pg_dump`) — [PostgreSQL downloads](https://www.postgresql.org/download/)
- `DATABASE_URL` w `backend/.env`

### Skrypty

| System | Skrypt | Użycie |
|--------|--------|--------|
| Linux / macOS / Git Bash | `scripts/backup-database.sh` | `./scripts/backup-database.sh [katalog]` |
| Windows PowerShell | `scripts/backup-database.ps1` | `.\scripts\backup-database.ps1 -OutputDir ".\backups"` |

Domyślny katalog: `./backups`. Pliki: `shiftapp_YYYYMMDD_HHMMSS.sql`.

### Harmonogram (cron, np. Linux)

```cron
0 3 * * * cd /path/to/ShiftScheduleApp && ./scripts/backup-database.sh /var/backups/shiftapp
```

### Off-site (S3/GCS)

Po wykonaniu backupu można skopiować plik do chmury, np.:

```bash
aws s3 cp backups/shiftapp_*.sql s3://bucket/backups/ --storage-class STANDARD_IA
```

## Przywracanie z pg_dump

```bash
psql "$DATABASE_URL" -f backups/shiftapp_YYYYMMDD_HHMMSS.sql
```

Uwaga: nadpisuje obecną bazę. Na produkcji najpierw przywróć do bazy testowej.

## Retencja (zal. A.9)

| Środowisko | Sugerowana retencja |
|------------|---------------------|
| Produkcja  | min. 30 dni         |
| Z płatnościami | 1–7 lat (RODO/księgowość) |
