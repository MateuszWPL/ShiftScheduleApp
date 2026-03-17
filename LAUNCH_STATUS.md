# Staffer.pl — Status przed launchem

> Ostatnia aktualizacja: marzec 2026

---

## PRIORYTET 1 — Blokuje launch (must-have)

- [ ] **Stripe live mode**
  - [ ] Zmienić klucze na produkcyjne (sk_live_*, whsec_*)
  - [ ] Skonfigurować webhook endpoint w Stripe Dashboard (prod)
  - [ ] Stworzyć produkcyjne Price ID (29 zł Starter, 79 zł Business) i zaktualizować env
  - [ ] Włączyć Stripe Radar (fraud detection)
  - [ ] Skonfigurować retry schedule dla nieudanych płatności
  - [ ] Przetestować pełny flow: checkout -> trial -> płatność -> cancel

- [ ] **Dokumenty prawne (RODO)**
  - [ ] Weryfikacja szablonów przez prawnika (docs/legal/)
  - [ ] Wdrożenie stron /polityka-prywatnosci i /regulamin w UI
  - [ ] Cookie banner (komponent)
  - [ ] Klauzula zgody przy rejestracji (checkbox)

- [ ] **Email logo** — ustawić EMAIL_LOGO_URL na produkcyjny URL

---

## PRIORYTET 2 — Ważne, ale nie blokują natychmiastowego launchu

- [ ] **Blokada downgrade planu** — changePlan() z walidacją targetLevel > currentLevel
- [ ] **Toast przy przekroczeniu limitu** — gdy OWNER próbuje zaprosić pracownika ponad limit
- [ ] **CI/CD pipeline** — GitHub Actions: lint -> build -> deploy staging/prod
- [ ] **Testy automatyczne** — unit testy kluczowych serwisów (BillingService, AuthService, ShiftsService)
- [ ] **Staging environment** — osobne środowisko do testów przed deployem
- [ ] **Landing page** — uruchomienie staffer.pl na WordPress

---

## PRIORYTET 3 — Ulepszenia (po launchu)

- [ ] **Monitoring uptime** — np. Better Uptime / UptimeRobot
- [ ] **Ograniczenie PII w logach** — usunąć emaile z logów operacyjnych
- [ ] **Weryfikacja HSTS** — sprawdzić konfigurację na Vercel i Railway
- [ ] **Dark mode** — opcjonalnie

---

## Stan obecny

| Obszar | Status |
|--------|--------|
| Aplikacja (app.staffer.pl) | OK - działa produkcyjnie |
| Backend API (Railway) | OK - działa |
| Baza danych (Neon) | OK - działa |
| Rejestracja / logowanie | OK - gotowe |
| Grafik, giełda, raporty, eksport | OK - gotowe |
| Powiadomienia (email + wewnętrzne) | OK - gotowe |
| Szablony grafiku (Business+) | OK - gotowe |
| Wiele lokalizacji (Business+) | OK - gotowe (Faza 3.5) |
| Stripe płatności | UWAGA - sandbox, wymaga przejścia na live |
| Dokumenty prawne (RODO) | UWAGA - szablony gotowe, wymaga prawnika |
| Landing page (staffer.pl) | UWAGA - w przygotowaniu (WordPress) |
