# Staffer.pl — Dokumentacja projektu i plan rozwoju

## Informacje o projekcie

**Staffer.pl** to aplikacja B2B SaaS do zarzadzania grafikami zmian dla zespolow (gastronomia, handel, uslugi). Umozliwia tworzenie grafiku, zarzadzanie dostepnoscia pracownikow, gielde zmian, raporty i eksport danych.

### Stack technologiczny

| Warstwa | Technologia |
|---------|------------|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS 4, shadcn/ui, TanStack React Query, Framer Motion |
| Backend | NestJS 11, Express, TypeScript |
| Baza danych | PostgreSQL 15 (Prisma ORM) |
| Autentykacja | NextAuth.js (Google OAuth + email/haslo), JWT (passport-jwt) |
| Walidacja | class-validator + class-transformer (DTOs) |

### Zewnetrzne platformy

| Platforma | Zastosowanie | Status |
|-----------|-------------|--------|
| **Stripe** | Platnosci — Checkout Session, Customer Portal, Webhooks | Sandbox (do przelaczenia na live) |
| **Resend** | Emaile transakcyjne (weryfikacja, reset hasla, powiadomienia) | Produkcja |
| **Cloudinary** | Upload plikow (avatary uzytkownikow, loga zespolow) | Produkcja |
| **Google OAuth** | Logowanie + synchronizacja z Google Calendar | Produkcja |
| **Sentry** | Monitoring bledow (backend + frontend) | Produkcja |

### Hosting i infrastruktura

| Element | Hosting |
|---------|---------|
| Frontend (app.staffer.pl) | Vercel |
| Backend API | Railway |
| Baza danych (PostgreSQL) | Neon |
| Landing page (staffer.pl) | WordPress (osobny hosting, w przygotowaniu) |
| Domeny | staffer.pl, app.staffer.pl |

### Architektura projektu

```
ShiftScheduleApp/
├── backend/                    # NestJS API
│   ├── prisma/                 # Schema, migracje, seed
│   └── src/
│       ├── announcements/      # Ogloszenia zespolowe
│       ├── auth/               # Rejestracja, logowanie, JWT, reset hasla
│       ├── availability/       # Dostepnosc pracownikow
│       ├── billing/            # Stripe: checkout, portal, webhook, subskrypcje
│       ├── calendar/           # Google Calendar sync + iCal export
│       ├── cloudinary/         # Upload plikow (avatary)
│       ├── common/             # Filtry, guardy, middleware (auth, roles, premium, throttle)
│       ├── email/              # Resend — szablony emaili
│       ├── export/             # CSV export (grafik, godziny, pracownicy)
│       ├── notifications/      # Powiadomienia wewnetrzne (bell icon)
│       ├── positions/          # Stanowiska (CRUD + przypisanie do pracownikow)
│       ├── reports/            # Raporty: godziny, koszty, zgodnosc KP
│       ├── shifts/             # Zmiany, przypisania, giełda, kopiowanie, walidacja
│       ├── team-settings/      # Ustawienia zespolu
│       └── users/              # Uzytkownicy, profil, shadow profile
├── frontend/                   # Next.js 16 (App Router)
│   └── src/
│       ├── app/                # Strony (dashboard, auth, print)
│       ├── components/         # Komponenty UI (shadcn + custom)
│       ├── hooks/              # React hooks
│       └── lib/                # API client, sciezki, onboarding
├── scripts/                    # Backup bazy danych (bash + PowerShell)
└── docs/                       # Dokumentacja (audyt, cennik, konfiguracja)
```

---

## Zrealizowane funkcje

### Autentykacja i uzytkownicy
- Logowanie / rejestracja (Google OAuth + email/haslo)
- Resetowanie hasla + weryfikacja email (tokeny z wygasaniem)
- Profile uzytkownikow (avatar, dane, umiejetnosci, stawka godzinowa, notatki)
- Shadow profile dla Google OAuth
- Wyloguj ze wszystkich urzadzen (tokenVersion)

### Zespol i organizacja
- Zakladanie firmy (zespolu) z kodem zaproszenia
- Dolaczanie do zespolu przez kod, akceptacja/odrzucanie przez managera
- Role: OWNER / MANAGER / EMPLOYEE z kontrola dostepu na kazdym endpoincie
- Stanowiska (positions) — CRUD, many-to-many z pracownikami, kolorowanie na kalendarzu
- Ustawienia firmy: nazwa, godziny otwarcia, min/max dlugosci zmiany, preferencje powiadomien
- Regeneracja kodu zaproszenia (tylko OWNER)

### Grafik i zmiany
- Kalendarz tygodniowy z widokiem dla pracownika i menadzera
- Tworzenie zmian (DRAFT -> PUBLISHED) z walidacja (konflikty, 11h odpoczynku KP, dostepnosc)
- Edycja i usuwanie zmian
- Przypisywanie pracownikow do zmian z filtrowaniem po stanowisku
- Publikacja grafiku (zbiorczy email do pracownikow)
- Kopiowanie calego tygodnia (z pracownikami lub tylko struktura, podglad przed zatwierdzeniem)
- Widok "Moje zmiany" (lista dla pracownika)
- Filtrowanie kalendarza po pracowniku / stanowisku
- Kalendarz miesieczny (read-only)

### Dostepnosc
- Drag-to-create dostepnosci na kalendarzu (minimum 4h, batch save)
- Drag & drop z dostepnosci na tworzenie zmian

### Giełda zmian
- Oddawanie zmian na gielde
- Przejmowanie zmian przez innych pracownikow

### Podsumowania i raporty (PREMIUM: Starter+)
- Raport godzin: per pracownik (total, shifts, overtime, avg/shift, bar chart)
- Raport kosztow: per pracownik na podstawie hourlyRate
- Raport zgodnosci z Kodeksem Pracy: 11h odpoczynku, 48h/tydzien, maxHours + violation cards
- Filtrowanie raportow po okresie (5 predefiniowanych zakresow)

### Eksport danych (PREMIUM: Starter+)
- Eksport grafiku do CSV
- Eksport raportu godzin do CSV
- Eksport listy pracownikow do CSV
- Strona druku grafiku (/print/schedule — window.print())

### Integracja z kalendarzem (PREMIUM: Starter+)
- Eksport zmian do Google Calendar / iCal
- Link do subskrypcji kalendarza (auto-aktualizacja)
- Synchronizacja z Google Calendar (OAuth + przycisk "Synchronizuj")

### Ogloszenia zespolowe
- CRUD z priorytetami (NORMAL / IMPORTANT / URGENT) i wygasaniem
- Powiadomienie do calego zespolu (1 zbiorczy, nie spam)
- Oznaczanie jako przeczytane

### Powiadomienia
- Powiadomienia wewnetrzne (bell icon): nowy grafik, przypisanie, giełda, usuniecie, czlonkostwo, ogloszenie
- Emaile: zaproszenie, akceptacja, publikacja grafiku (batch), przypisanie do zmiany, urgent ogloszenie, nieudana platnosc
- Unsubscribe link w kazdym emailu
- Konfiguracja powiadomien w ustawieniach zespolu

### Platnosci i subskrypcje (Stripe — sandbox)
- Model cenowy: FREE (5 pracownikow) / STARTER (29 zl, 15 pracownikow) / BUSINESS (79 zl, bez limitu)
- Stripe Checkout Session + Customer Portal
- Webhook z idempotencja (StripeWebhookEvent)
- Trial 14 dni (jednorazowy, flaga trialUsed)
- PremiumGuard + @RequirePlan dekorator na backendzie
- Strona /billing (tylko OWNER) z wyborem planu i zarzadzaniem subskrypcja
- Badge planu w menu bocznym + bramki premium na Reports/Export/Templates
- Obsluga invoice.payment_failed (email do ownera)
- Whitelist priceId, ochrona przed open redirect
- Limity pracownikow egzekwowane przy akceptacji czlonka
- Flaga limitExceeded + LimitExceededBanner
- Backend blokuje tworzenie zmian i publikacje gdy limitExceeded

### Onboarding
- Kreator pierwszego uruchomienia: zaloz firme -> zapros zespol -> ustaw godziny -> dodaj pierwsza zmiane
- Tour po aplikacji (podswietlanie elementow z opisem)
- Opcja pominiecia w kazdym kroku
- Puste stany z CTA na kazdej stronie

### Bezpieczenstwo
- Helmet + CORS (whitelist domen, brak wildcard)
- Rate limiting: globalne 100/min + per-user (PerUserThrottlerGuard)
- Auth-specific: login 5/min, register 3/min, reset 2-5/min
- ValidationPipe (whitelist + forbidNonWhitelisted)
- CSP, X-Frame-Options DENY, X-Content-Type-Options nosniff, Referrer-Policy
- Stripe webhook signature verification + idempotencja
- IDOR protection — wszystkie zapytania scoped do teamId
- Sentry (backend + frontend) + exception filter (brak stack trace w prod)
- Token versioning do revoke sesji
- Env validation przy starcie (JWT_SECRET, DATABASE_URL, FRONTEND_URL w produkcji)
- Wymuszenie FRONTEND_URL, CLOUDINARY_*, STRIPE_WEBHOOK_SECRET w produkcji (blad przy braku)

### UI/UX
- Paleta kolorow brand: #FF8400, #8FACDB, #F9DFC6, #0B0829
- Responsive design — mobile bottom navigation, sticky kolumny
- Mikro-interakcje (hovers, transitions, active:scale, touch-manipulation)
- Spojny design system (shadcn + brand + semantic colors)
- Logo SVG, favicon, ilustracje empty state

### Backup
- Skrypty pg_dump (bash + PowerShell) w scripts/
- Neon PITR dostepne w konsoli

---

## Aktualny stan produkcji (marzec 2026)

### Co dziala:
- Cala aplikacja dostepna na app.staffer.pl (Vercel)
- Backend API na Railway, baza na Neon
- Rejestracja, logowanie, zarzadzanie zespolem
- Pelny cykl grafiku (tworzenie, publikacja, giełda, kopiowanie)
- Raporty, eksport, kalendarz (Google Calendar + iCal)
- Powiadomienia email i wewnetrzne
- Stripe w trybie sandbox — platnosci testowe dzialaja

### Znane ograniczenia:
- **Stripe w trybie sandbox** — platnosci testowe, nie produkcyjne
- **Brak dokumentow prawnych** — szablony przygotowane (docs/legal/), wymagaja weryfikacji prawnika i wdrozenia w UI
- **Email logo** — skonfigurowane przez zmienna EMAIL_LOGO_URL (wymaga ustawienia produkcyjnego URL)
- **Landing page** — w przejsciu na WordPress, tymczasowo niedostepna
- **Szablony grafiku** — strona /templates to stub (tylko bramka premium, brak backendu)

---

## TODO — Przed pelnym launchem

### KRYTYCZNE (blokuja launch):

- [ ] **Stripe live mode** — przejscie na produkcyjne klucze:
  - [ ] Zmienic STRIPE_SECRET_KEY na live key (sk_live_*)
  - [ ] Zmienic STRIPE_WEBHOOK_SECRET na produkcyjny
  - [ ] Skonfigurowac webhook endpoint w Stripe Dashboard (produkcja)
  - [ ] Wlaczyc Stripe Radar (fraud detection)
  - [ ] Stworzyc produkcyjne Price ID (Starter 29 zl, Business 79 zl) i zaktualizowac env
  - [ ] Skonfigurowac retry schedule dla nieudanych platnosci (Settings -> Billing)
  - [ ] Przetestowac pelny flow: checkout -> trial -> platnosc -> cancel

- [ ] **Dokumenty prawne (RODO)** — szablony przygotowane w `docs/legal/`:
  - [x] ~~Szablon polityki prywatnosci (docs/legal/PRIVACY_POLICY.md)~~
  - [x] ~~Szablon regulaminu (docs/legal/TERMS_OF_SERVICE.md)~~
  - [x] ~~Szablon polityki cookies (docs/legal/COOKIE_POLICY.md)~~
  - [ ] Weryfikacja i dostosowanie przez prawnika
  - [ ] Wdrozenie w UI (strony /polityka-prywatnosci, /regulamin)
  - [ ] Cookie banner (komponent)
  - [ ] Klauzula zgody przy rejestracji

- [x] ~~**Czyszczenie hardcoded URLs** — zamienione na zmienne srodowiskowe (NEXT_PUBLIC_API_URL, FRONTEND_URL)~~

- [ ] **Email logo** — ustawic zmienna EMAIL_LOGO_URL na produkcyjny URL logo (szablony przygotowane)

- [x] ~~**FRONTEND_URL wymuszone** — backend rzuca blad w produkcji gdy brak FRONTEND_URL (email, billing, calendar, cloudinary)~~

### WYSOKIE (przed skalowaniem):

- [ ] **CI/CD pipeline** — GitHub Actions: lint, build, deploy na staging/prod
- [ ] **Testy automatyczne** — przynajmniej unit testy krytycznych serwisow (BillingService, AuthService, ShiftsService)
- [ ] **Staging environment** — osobne srodowisko do testow przed deployem
- [x] ~~**Blokada akcji przy limitExceeded** — backend blokuje tworzenie zmian i publikacje gdy zespol przekracza limit pracownikow~~
- [x] ~~**Past_due flow** — status past_due zapisywany przez webhook, banner w UI na stronie /billing~~

### SREDNIE (ulepszenia):

- [ ] **Dark mode** — opcjonalnie
- [ ] **Ograniczenie PII w logach** — usunac emaile z logow operacyjnych
- [ ] **Weryfikacja HSTS** — sprawdzic konfiguracje na Vercel i Railway
- [ ] **Monitoring uptime** — dodac monitoring dostepnosci (np. Better Uptime)

---

## System platnosci — cykl zycia subskrypcji

### Plany cenowe:

| Plan | Cena | Limit pracownikow | Funkcje |
|------|------|--------------------|---------|
| FREE | 0 zl | 5 | Podstawowe: grafik, giełda, ogloszenia |
| STARTER | 29 zl/mies | 15 | + raporty, eksport, kalendarz |
| BUSINESS | 79 zl/mies | Bez limitu | + wszystkie funkcje (szablony, zaawansowane role) |

### Flow:

```
Rejestracja -> FREE
  |
  ├── Checkout (Starter/Business) -> TRIALING (14 dni, jednorazowo)
  |     ├── Karta OK -> ACTIVE
  |     ├── Karta fail -> PAST_DUE -> grace 7 dni -> FREE
  |     └── Cancel w trakcie trialu -> FREE (natychmiast)
  |
  ├── ACTIVE
  |     ├── Upgrade (Starter -> Business) -> ACTIVE (proration)
  |     ├── Downgrade ZABLOKOWANY (tylko cancel + nowy checkout)
  |     ├── Cancel -> FREE (na koniec oplaconego okresu)
  |     └── Payment failed -> PAST_DUE -> retry -> cancel -> FREE
  |
  └── Ponowna subskrypcja po cancel -> BEZ trialu (trialUsed = true)
```

### Do zaimplementowania:
- [ ] `changePlan()` — walidacja targetLevel > currentLevel (blokada downgrade)
- [x] ~~Obsluga `past_due` w UI (banner + CTA do aktualizacji karty)~~
- [x] ~~Blokada akcji (tworzenie zmian, publikacja) gdy limitExceeded~~
- [ ] Toast przy probie zaproszenia pracownika ponad limit

---

## Plany rozwoju (przyszlosc)

### Faza 3.4 — Szablony grafiku (PREMIUM: Business+)
- Zapisywanie calego tygodnia jako szablon (nazwa, opis)
- Biblioteka szablonow: "Tydzien normalny", "Tydzien swiateczny" itp.
- Zastosowanie szablonu na wybrany tydzien (1 klik)
- Szablony dzielone w zespole

### Faza 3.5 — Wiele lokalizacji (PREMIUM: Enterprise)
- Zarzadzanie wieloma lokalizacjami / oddzialami
- Osobne grafiki per lokalizacja
- Przenoszenie pracownikow miedzy lokalizacjami
- Dashboard zbiorczy

### Faza 3.6 — Zaawansowane role i uprawnienia (PREMIUM: Business+)
- Role niestandardowe (np. "Starszy kelner", "Kierownik zmiany")
- Granularne uprawnienia: kto moze publikowac, kto edytowac
- Hierarchia rol

### Faza 3.8 — API dla zewnetrznych systemow (PREMIUM: Enterprise)
- Publiczne API REST z kluczami API
- Dokumentacja Swagger/OpenAPI
- Webhook do zewnetrznych systemow
- Integracja z systemami kadrowo-placowymi

### Faza 3.9 — Zaawansowane powiadomienia (PREMIUM: Business+)
- Push notifications (PWA / Web Push)
- Przypomnienia o zmianie (np. 1h przed)
- Niestandardowe reguly powiadomien

### Faza 3.10 — Audit Log (PREMIUM: Business+)
- Historia wszystkich zmian w systemie (kto, co, kiedy)
- Filtrowanie i eksport logow

### Daleka przyszlosc
- **Aplikacja mobilna** (React Native / Expo)
- **Integracja z systemami kadrowymi** (Comarch, Sage, enova)
- **AI sugestie grafiku** — automatyczne generowanie na podstawie dostepnosci i historii
- **Multi-language (i18n)** — wersja angielska
- **Marketplace integracji** — Zapier/Make triggers
- **Powiadomienia SMS** — dla krytycznych sytuacji
- **Metryki biznesowe** — retencja pracownikow, fill rate zmian
- **Synchronizacja dwukierunkowa Google Calendar**
- **Drag & resize zmian na kalendarzu**

---

## Usuniete funkcje

- **Swap Requests (zamiana zmian)** — usuniety (model, backend, frontend, powiadomienia SWAP_*)
- **Panel Menadzera** — przekierowany na Grafik (nie potrzebny osobny widok)
- **Landing page w Next.js** — przeniesione na WordPress (staffer.pl)

---

## Wazne zalozenia

- **Landing page** (staffer.pl) bedzie na WordPress — osobny hosting, osobny deployment. Nie jest czescia tego repozytorium.
- **Stripe** musi przejsc na live mode przed publicznym launchem z platnosciami.
- **Dokumenty prawne** (RODO, regulamin) wymagaja weryfikacji prawnika przed launchem.
- **Backupy** — Neon oferuje PITR; dodatkowe pg_dump w scripts/ do recznie planowanego harmonogramu.
- **Monitoring** — Sentry dla bledow; uptime monitoring do dodania.

---

## Dokumentacja dodatkowa

| Plik | Opis |
|------|------|
| [docs/SECURITY_AUDIT.md](docs/SECURITY_AUDIT.md) | Audyt bezpieczenstwa (OWASP ASVS/WSTG) + ocena stanu |
| [docs/CENNIK_DATA.md](docs/CENNIK_DATA.md) | Dane cennikowe (referencja dla WordPress) |
| [docs/KALENDARZ_KONFIGURACJA.md](docs/KALENDARZ_KONFIGURACJA.md) | Konfiguracja Google Calendar |
| [docs/legal/](docs/legal/) | Szablony dokumentow prawnych (RODO, regulamin, cookies) |
| [scripts/](scripts/) | Skrypty backup bazy danych |
