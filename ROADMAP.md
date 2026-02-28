# ShiftApp B2B — Plan rozwoju aplikacji

## Status aktualny (luty 2026)

**Etap:** FAZA 1 ✅ | FAZA 2 ✅ | FAZA 3.1 Stripe (sandbox) ✅ | FAZA 4 (marketing/polish) — w toku.

**Kamień milowy:** Płatności Stripe wpięte w trybie sandbox. Backend: BillingService (Checkout Session, Customer Portal, Webhook z idempotencją), model Subscription + StripeWebhookEvent w Prisma. Frontend: strona /billing, badge PRO w menu, placeholder pages (Reports, Export, Templates) z bramką "Ulepsz do Pro".

### Co mamy (gotowe):
- Logowanie / rejestracja (Google OAuth + email/haslo)
- Resetowanie hasla + weryfikacja email
- Zakladanie firmy (zespolu) + kod zaproszenia
- Akceptacja / odrzucanie czlonkow zespolu
- Profile uzytkownikow (avatar, dane, umiejetnosci)
- Grafik tygodniowy (kalendarz) z widokiem dla pracownika i menadzera
- Tworzenie zmian (DRAFT -> PUBLISHED) z walidacja (konflikty, 11h odpoczynku, dostepnosc)
- Edycja i usuwanie zmian
- Dostepnosc pracownikow (drag-to-create, minimum 4h, batch save)
- Gielda zmian (oddaj / przejmij zmiane)
- Drag & drop dostepnosci na kalendarz (tworzenie zmian z dostepnosci)
- Powiadomienia wewnętrzne (bell icon) — nowy grafik, przypisanie zmiany, gielda, usuniecie
- Powiadomienia email (zaproszenie, akceptacja czlonkostwa)
- Zabezpieczenia: Helmet, rate limiting, walidacja inputow, CORS, JWT
- **Platnosci Stripe (sandbox)**: Checkout Session, Customer Portal, Webhook (idempotentny), model Subscription
- Strona /billing (tylko OWNER), badge PRO, bramki premium (Reports, Export, Templates)

### Co nie dziala / do usuniecia:
- Zamiana zmian (Swap Requests) — usuniete
- Panel Menadzera — juz przekierowany na Grafik

### Domeny i hosting (aktualnie):
- **staffer.pl** — landing, blog, cennik (Vercel)
- **app.staffer.pl** — aplikacja (Vercel)
- Frontend: Vercel | Backend: Railway/Neon (planowane)

---

## FAZA 1 — Poprawki i stabilizacja (MVP)
> Priorytet: WYSOKI | Cel: Aplikacja gotowa do uzycia

### 1.1 Usuniecie nieuzywanych funkcji ✅ DONE
- [x] Usunac cala logike Swap Requests (backend: service, controller, DTO)
- [x] Usunac model SwapRequest ze schema.prisma + migracja
- [x] Usunac frontend: SwapRequestsSection z grafik/page.tsx
- [x] Usunac API functions swap z api.ts
- [x] Wyczyścic powiadomienia typu SWAP_*

### 1.2 Poprawki UI/UX ✅ DONE
- [x] Paleta kolorow brand: #FF8400, #8FACDB, #F9DFC6, #0B0829 (delikatna, jasna)
- [x] Poprawic Pulpit — statystyki, nadchodzace zmiany, powiadomienia, karta profilu
- [x] Lepszy podział menu bocznego: Menu / Zespol / Premium (z PRO badge)
- [x] Aktywna strona podswietlona w menu (usePathname)
- [x] Responsywnosc — mobilne bottom navigation
- [x] Lepsze empty states na Pulpicie
- [x] Poprawic wyglad kartek zmian w kalendarzu (wiecej informacji, czytelnosc)
- [x] Dodac tooltips i podpowiedzi dla nowych uzytkownikow

### 1.3 Ogloszenia zespolowe (Announcements)
- [x] Model `Announcement` + `AnnouncementRead` w Prisma z priorytetami (NORMAL/IMPORTANT/URGENT) i wygasaniem
- [x] Backend: CRUD dla ogloszen (tylko OWNER/MANAGER moze tworzyc/usuwac)
- [x] Frontend: Sekcja ogloszen na Pulpicie (karty z priorytetem, kolorowe ramki, badge nieprzeczytanych)
- [x] Strona /announcements z formularzem tworzenia (tytul, tresc, priorytet, czas wygasniecia)
- [x] Powiadomienie wewnetrzne do wszystkich czlonkow zespolu (1 powiadomienie, nie spam)
- [x] Oznaczanie ogloszenia jako przeczytane (przycisk "oczko")

### 1.4 Ustawienia firmy
- [x] Nowy model `TeamSettings` (1:1 z Team): companyName, logoUrl, godziny otwarcia/zamkniecia, min/max dlugosc zmiany, preferencje powiadomien
- [x] Strona /settings z zakladkami:
  - [x] Firma (nazwa zespolu, nazwa firmy)
  - [x] Zaproszenia (widoczny kod, kopiowanie, regeneracja — tylko OWNER)
  - [x] Grafik (domyslne godziny otwarcia/zamkniecia, min/max dlugosc zmiany)
  - [x] Powiadomienia (toggle: przypisanie, publikacja, gielda, ogloszenia)
- [x] Backend: GET/PATCH team-settings, PATCH team-name, POST regenerate-invite
- [x] Auto-tworzenie TeamSettings przy pierwszym odczycie

### 1.5 Poprawki powiadomien email
- [x] Email przy publikacji grafiku (zbiorczy, 1 email na tydzien, nie na zmiane)
- [x] Email przy przypisaniu do zmiany (opcjonalnie, zalezne od ustawien)
- [x] Email przy nowym ogloszeniu (tylko priorytet "urgent")
- [x] Unsubscribe link w kazdym emailu
- [x] Unikanie spamu: batch + debounce (np. publikacja 10 zmian = 1 email)

---

## FAZA 2 — Kompletna funkcjonalnosc
> Priorytet: SREDNI | Cel: Pelna aplikacja produkcyjna

### 2.1 Kopiowanie grafiku
- [x] Przycisk "Kopiuj tydzien" — kopiuje caly grafik z wybranego tygodnia na nastepny
- [x] Opcja kopiowania tylko struktury (bez przypisanych pracownikow) lub z pracownikami
- [x] Podglad przed zatwierdzeniem kopii

### 2.2 Podsumowanie tygodnia / miesiaca
- [x] Widok podsumowania: ile godzin przepracował każdy pracownik
- [x] Ostrzezenia: przekroczenie maxHours, brak dostepnosci
- [x] Prosty widok kalendarza miesiecznego (read-only, przeglad)

### 2.3 Stanowiska (Positions) — zrobione ✅
- [x] Model Position + EmployeePosition (many-to-many) w bazie danych
- [x] API CRUD: tworzenie, edycja, usuwanie stanowisk
- [x] Przypisywanie wielu stanowisk do pracownika
- [x] Zarzadzanie stanowiskami w Ustawieniach (nowa zakladka "Stanowiska")
- [x] Dropdown stanowisk w dialogu tworzenia/edycji zmiany (zamiast recznego wpisywania)
- [x] Automatyczne filtrowanie pracownikow wg wybranego stanowiska
- [x] Kolorowanie paskow zmian na kalendarzu wedlug stanowiska
- [x] Wyswietlanie stanowisk na kartach pracownikow (strona Zespol)
- [x] Migracja istniejacych roleNames na rekordy Position (endpoint /positions/migrate)

### 2.4 Poprawki UX kalendarza — zrobione ✅
- [ ] Drag & resize zmian (odlozone — skupienie na nawigacji)
- [x] Filtrowanie kalendarza po pracowniku / stanowisku (kompaktowe dropdowny)
- [x] Widok „Moje zmiany” dla pracownika (lista zamiast tabeli, domyslnie dla pracownikow)
- [x] **Mobile-first UX w przegladarce**: responsywnosc wszystkich widokow (Pulpit, Grafik, Moje zmiany, Podsumowanie, Zespol, Ogloszenia, Dostepnosc, Ustawienia, Profil); brak overflow, czytelny tekst, skalowanie przy 30+ pracownikach; bottom nav, sticky kolumny w tabelach

### 2.5 Onboarding — zrobione ✅
- [x] Kreator pierwszego uruchomienia: załóż firmę → zaproś zespół → ustaw godziny → dodaj pierwszą zmianę
- [x] Opcja „Pomiń samouczek” w każdym kroku kreatora
- [x] Tour po aplikacji (podświetlanie elementów z opisem)
- [x] Opcja pominięcia przewodnika („Pomiń”)
- [x] Pusty stan z CTA na każdej stronie (Grafik, Zespół, Podsumowanie, Ogłoszenia)

### 2.6 Bezpieczenstwo produkcyjne

#### 2.6.1 Audyt bezpieczenstwa ✅
Audyt zakończony. Wszystkie punkty przeanalizowane; elementy do rozbudowy w 2.6.2.

**Checklista audytu (OWASP ASVS + WSTG):**
- [x] **Autoryzacja (Access Control)** — kazdy endpoint sprawdzony pod katem IDOR: czy zalogowany uzytkownik moze dostac dane innego zespolu/pracownika? Weryfikacja teamId, membership w kazdym serwisie. Wyniki: [docs/AUDYT_2_6_1_AUTORYZACJA.md](docs/AUDYT_2_6_1_AUTORYZACJA.md) — naprawiono 2 luki (getAllUsers, getEmployeePositions)
- [x] **Autentykacja** — JWT: walidacja algorytmu (wykluczyc "none"), exp/iat; NextAuth: secret w env, SameSite cookies, secure flag. Wyniki: [docs/AUDYT_2_6_1_AUTENTYKACJA.md](docs/AUDYT_2_6_1_AUTENTYKACJA.md)
- [x] **Walidacja wejsciowa** — wszystkie DTO z class-validator; SQL injection (Prisma param), brak command injection; dodano MaxLength (login, create-shift, create-shadow-profile)
- [x] **XSS** — React escapuje output; brak dangerouslySetInnerHTML; CSP dodany w next.config
- [x] **CSRF** — SameSite=Lax na cookies NextAuth; API używa Bearer JWT (brak cookies); NextAuth ma wbudowany CSRF dla auth
- [x] **Sesje** — logout czyści klient (cookie+cache); JWT bez blacklisty (ważny do exp); „wyloguj wszędzie” → 2.6.2 (blacklista jti / Redis)
- [x] **Rate limiting** — Throttler: global 100/min; auth: login 5/min, register 3/min, reset 2–5/min; per-IP (per-user → 2.6.2)
- [x] **Naglowki bezpieczenstwa** — Helmet na backendzie; frontend: X-Frame-Options DENY, X-Content-Type-Options nosniff, CSP, Referrer-Policy; HSTS zwykle z reverse proxy
- [x] **Dane wrazliwe** — sekrety z env; logi zawierają emaile (PII) — do ograniczenia; pgcrypto opcjonalnie
- [x] **Obsluga bledow** — NestJS HttpException bez stack; nieobsłużone 500 mogą ujawnić stack — Sentry/exception filter → 2.6.2
- [x] **CORS** — whitelist FRONTEND_URL; dev: localhost; credentials; brak `*`
- [x] **Backup** — strategia w zal. A.9; wdrożenie na poziomie infra (Railway/Neon) — 2.6.2

#### 2.6.2 Pozostale zadania (po audycie 2.6.1)
- [x] Rate limiting per-user — PerUserThrottlerGuard: klucz user-{userId} lub ip-{ip}; Redis storage opcjonalnie przy skalowaniu
- [x] Sesje: wylogowanie ze wszystkich urzadzen — User.tokenVersion, JWT payload v, endpoint revoke-all, przycisk w Profilu
- [ ] Logowanie bledow (Sentry) + exception filter (brak stack w prod)
- [x] Backup bazy — skrypty pg_dump (scripts/), strategia w docs/BACKUP_DATABASE.md; Neon: PITR w console

---

## FAZA 3 — Funkcje PREMIUM (platne)
> Priorytet: BIZNESOWY | Cel: Monetyzacja

### Model cenowy (propozycja):
- **Free**: do 5 pracownikow, podstawowe funkcje
- **Starter (29 zl/mies)**: do 15 pracownikow, eksport, raporty
- **Business (79 zl/mies)**: bez limitu pracownikow, wszystkie funkcje
- **Enterprise (indywidualnie)**: wiele lokalizacji, API, priorytetowe wsparcie

### 3.1 System subskrypcji (Stripe) — sandbox ✅, produkcja w toku
- [x] Integracja Stripe Checkout + Customer Portal (BillingService: createCheckoutSession, createPortalSession)
- [x] Model Subscription w bazie (planId, status, currentPeriodEnd, stripeCustomerId, stripeSubscriptionId)
- [x] Model StripeWebhookEvent — idempotencja webhookow (deduplication po stripeEventId)
- [x] Webhook Stripe do obslugi platnosci, anulowania, zmiany planu (checkout.session.completed, customer.subscription.updated/deleted, invoice.payment_failed)
- [x] trial_period_days: 14 dni darmowego trialu przy pierwszej subskrypcji
- [x] Whitelist priceId (STRIPE_PRICE_PRO, STRIPE_PRICE_PRO_YEARLY) — ochrona przed podmiana planu
- [x] URL success/cancel budowane z FRONTEND_URL (ochrona przed open redirect)
- [x] Strona /billing z wyborem planu Starter/Business i zarzadzaniem subskrypcja (tylko OWNER)
- [x] Badge planu w menu bocznym (dynamicznie: Starter/Business) + bramki premium (Reports, Export, Templates)
- [x] PremiumGuard + @RequirePlan dekorator — backend guard sprawdzajacy plan (hierarchia: free < starter < business)
- [x] Strona /cennik z 3 pakietami (FREE / STARTER 29zl / BUSINESS 79zl) + tabela porownawcza 26 funkcji
- [x] Obsluga invoice.payment_failed — email do ownera z CTA do zarzadzania subskrypcja
- [x] Zabezpieczenie trialu — `trialUsed` flag, trial 14 dni tylko raz na zespół
- [ ] Przelaczenie Stripe na tryb produkcyjny (live keys, Radar, konfiguracja webhookow prod)

### 3.2 Raporty i analizy [PREMIUM: Starter+] ✅
- [x] Dashboard raportow z 3 zakladkami: godziny, koszty, zgodnosc KP
- [x] Raport godzin: per pracownik (total, shifts, overtime, avg/shift, bar chart)
- [x] Raport kosztow: per pracownik na podstawie hourlyRate (total, avg stawka)
- [x] Raport zgodnosci z KP: 11h odpoczynku, 48h/tydzien, maxHours + violation cards
- [x] Filtrowanie raportow po okresie (5 predefiniowanych zakresow)
- [x] Guard @RequirePlan('starter') na endpointach raportow

### 3.3 Eksport danych [PREMIUM: Starter+] ✅
- [x] Eksport grafiku do CSV (czytelny format do pobrania i druku)
- [x] Eksport raportu godzin do CSV (do systemow kadrowych)
- [x] Eksport listy pracowników do CSV
- [ ] Eksport listy pracownikow

### 3.4 Szablony grafiku [PREMIUM: Business+]
- [ ] Zapisywanie calego tygodnia jako szablon (nazwa, opis)
- [ ] Biblioteka szablonow: "Tydzien normalny", "Tydzien swiateczny" itp.
- [ ] Zastosowanie szablonu na wybrany tydzien (1 klik)
- [ ] Szablony dzielone w zespole

### 3.5 Wiele lokalizacji [PREMIUM: Enterprise]
- [ ] Mozliwosc zarzadzania wieloma lokalizacjami / oddzialami
- [ ] Osobne grafiki per lokalizacja
- [ ] Przenoszenie pracownikow miedzy lokalizacjami
- [ ] Dashboard zbiorczy dla wszystkich lokalizacji

### 3.6 Zaawansowane role i uprawnienia [PREMIUM: Business+]
- [ ] Role niestandardowe (np. "Starszy kelner", "Kierownik zmiany")
- [ ] Granularne uprawnienia: kto moze publikowac, kto moze edytowac
- [ ] Hierarchia ról w zespole

### 3.7 Integracja z kalendarzem [PREMIUM: Starter+]
- [ ] Eksport zmian do Google Calendar / iCal
- [ ] Link do subskrypcji kalendarza (auto-aktualizacja)
- [ ] Synchronizacja dwukierunkowa (jesli pracownik doda wydarzenie w Google Calendar -> konflikt)

### 3.8 API dla zewnetrznych systemow [PREMIUM: Enterprise]
- [ ] Publiczne API REST z kluczami API
- [ ] Dokumentacja API (Swagger/OpenAPI)
- [ ] Webhook: powiadomienia o zmianach w grafiku do zewnetrznych systemow
- [ ] Integracja z systemami kadrowo-placowymi

### 3.9 Zaawansowane powiadomienia [PREMIUM: Business+]
- [ ] Powiadomienia push (PWA / Web Push)
- [ ] Przypomnienia o zmianie (np. 1h przed zmiana)
- [ ] Powiadomienie gdy pracownik nie potwierdzi obecnosci
- [ ] Niestandardowe reguly powiadomien

### 3.10 Audit Log [PREMIUM: Business+]
- [ ] Historia wszystkich zmian w systemie (kto, co, kiedy)
- [ ] Filtrowanie logów po typie, dacie, uzytkowniku
- [ ] Eksport logów

---

## FAZA 4 — Polish i marketing
> Priorytet: KONCOWY | Cel: Wyglad, branding, launch

### 4.1 UI/UX — Kolory i branding
- [x] Wdrozenie wlasnej palety kolorow (brand colors: #FF8400, #8FACDB, #F9DFC6, #0B0829)
- [ ] Dark mode (opcjonalnie)
- [x] Mikro-interakcje (cursor-pointer, hovers, transitions 150ms, active:scale na przyciskach, touch-manipulation na mobilce)
- [x] Spójny design system (wszystkie komponenty – brand, semantic success/warning/error)
- [x] Ikony i ilustracje brandowe (Logo SVG, favicon, ilustracje empty state)

### 4.2 Landing Page — zrobione ✅
- [x] Strona glowna z prezentacja funkcji (hero, features, testimonials)
- [x] Sekcja cennikowa (pricing) — /cennik
- [x] Testimonials / social proof
- [x] CTA do rejestracji (link do app.staffer.pl)
- [x] SEO (meta tags, Open Graph, sitemap.ts, robots.ts)
- [x] Blog / baza wiedzy — Velite + MD, content/blog/*.md
- [x] Domeny: staffer.pl, www.staffer.pl, app.staffer.pl (middleware host-based routing)

### 4.2b Landing Page — przebudowa marketingowa (2025) ✅
- [x] Navbar: glass effect przy scrollu, banner „14 dni za darmo” wraca przy powrocie na górę
- [x] Hero: rotujący headline („bez chaosu”, „w 5 minut”, „bez Excela”…), video popup po kliknięciu grafiki
- [x] Sekcja Stats: animowane liczniki, ikony ze spring animation
- [x] „Wszystkie plany zawierają”: sticky lewa kolumna + scroll-driven zmiana opisu, siatka funkcji
- [x] How it works: timeline ze scroll-podświetlaniem kroków
- [x] Tabs „Co możesz zrobić w aplikacji” (Grafik, Giełda, Zespół…)
- [x] Features: konkretny copy, hooki, layout horyzontalny
- [x] Testimonials: slider, 6 opinii, przyciski nawigacji
- [x] FAQ: 2×3 kolumny, zawsze rozwinięte, kreska pod pytaniem
- [x] Banner CTA: pełna szerokość, gradient, lista plusów, TrustBadges
- [x] Sekcja kontaktowa zamiast ostatniego CTA
- [x] Strona /kontakt z formularzem
- [x] Stopka: lżejszy kolor (#252240), link Kontakt
- [ ] Grafiki: placeholdery w public/landing/ — do uzupełnienia przez użytkownika (HeroProduct, Step1–3, Tab*, BigCTAGraphic, BannerBg)

### 4.3 Prawne i compliance
- [ ] Polityka prywatnosci (RODO/GDPR)
- [ ] Regulamin uzytkowania
- [ ] Cookie banner
- [ ] Przetwarzanie danych osobowych — umowa powierzenia

### 4.4 Monitoring i DevOps
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Monitoring (Sentry, Uptime)
- [ ] Automatyczne backupy bazy
- [ ] Testy automatyczne (unit + e2e)
- [ ] Staging environment

---

## Kolejnosc wdrazania (zalecana)

```
FAZA 1.1  Usuniecie Swap Requests (czyszczenie)
FAZA 1.2  Poprawki UI/UX (menu, pulpit, loading states)
FAZA 1.3  Ogloszenia zespolowe
FAZA 1.4  Ustawienia firmy
FAZA 1.5  Poprawki powiadomien email
---
FAZA 2.1  Kopiowanie grafiku
FAZA 2.2  Podsumowanie tygodnia
FAZA 2.3  Profil pracownika (rozszerzony)
FAZA 2.4  Poprawki UX kalendarza
FAZA 2.5  Onboarding
FAZA 2.6  Bezpieczenstwo produkcyjne
---
FAZA 3.1  Stripe (subskrypcje)
FAZA 3.2  Raporty i analizy
FAZA 3.3  Eksport danych
FAZA 3.4  Szablony grafiku
FAZA 3.5+ Wiele lokalizacji, role, API, push
---
FAZA 4    Kolory, prawne, DevOps (landing + domeny — done)
```

---

## Zalacznik A — Mozliwosci bezpieczenstwa (research)

> Research wykonany w ramach audytu 2.6.1. Aplikacja zarzadza grafikami i wkrotce platnosci — wymagany najwyzszy poziom zabezpieczen.

### A.1 Standardy i ramy

| Zrodlo | Zakres |
|--------|--------|
| **OWASP ASVS** | Application Security Verification Standard — wymagania techniczne i procesowe |
| **OWASP WSTG** | Web Security Testing Guide — metodologia testow penetracyjnych |
| **OWASP Top 10** | A01 Broken Access Control, A02 Cryptographic Failures, A03 Injection, A04 Insecure Design, A05 Security Misconfiguration, A06 Vulnerable Components, A07 Auth Failures, A08 Integrity Failures, A09 Logging Failures, A10 SSRF |
| **PCI DSS** | Obowiazuje przy platnosciach kartami — Stripe jako PSP przejmuje wiekszosc; nasza strona: minimalna ekspozycja, Checkout przez Stripe |

### A.2 Autentykacja i sesje

| Obszar | Mozliwosci / wymagania |
|--------|------------------------|
| **JWT** | Krotki czas zycia (np. 15 min access, 7 dni refresh); jti do revoke; algorytm RS256/ES256, NIGDY "none"; walidacja iss/aud/exp/iat/nbf |
| **NextAuth** | Explicit JWT secret w env (nie domyslny hash); session maxAge; cookies HttpOnly, Secure, SameSite=Strict |
| **CSRF** | SameSite cookies + token CSRF w naglowkach dla mutacji; double-submit cookie lub synchronizer token pattern |
| **Wyloguj wszedzie** | Endpoint revoke wszystkich sesji/tokenow uzytkownika; lista aktywnych sesji (opcjonalnie); blokada refresh tokenow po stronie serwera |

### A.3 Autoryzacja (Access Control)

| Obszar | Mozliwosci / wymagania |
|--------|------------------------|
| **IDOR** | Kazdy dostep do zasobu (shift, team, user, availability) — weryfikacja membership/role; nie polegac na ID z URL; UUID zamiast sekwencyjnych ID utrudnia enumeracje |
| **Role** | OWNER/MANAGER/EMPLOYEE — sprawdzanie w kazdym endpoincie; middleware/filtr per-resource |
| **Object-level** | Zapytania scoped do teamId uzytkownika; nigdy "SELECT * WHERE id = X" bez sprawdzenia przynaleznosci |

### A.4 Rate limiting

| Obszar | Mozliwosci / wymagania |
|--------|------------------------|
| **Per-user** | Klucz: userId (z JWT) + IP fallback; rozne limity: auth (np. 5/15min), API (np. 100/min), webhook (osobny endpoint) |
| **Token bucket** | Sustained RPS + burst; Redis do wspoldzielenia stanu miedzy instancjami |
| **Odpowiedzi** | HTTP 429, Retry-After, standard Problem Details |
| **Osobne limity** | Login, rejestracja, reset hasla — nizsze (np. 5/15min) — ochrona przed credential stuffing |

### A.5 Dane i szyfrowanie

| Obszar | Mozliwosci / wymagania |
|--------|------------------------|
| **W tranzycie** | TLS 1.2+; HSTS z max-age, includeSubDomains, preload |
| **W spoczynku** | PostgreSQL: szyfrowanie dysku (LUKS/EBS-KMS) na poziomie hosta; pgcrypto dla wrażliwych kolumn (opcjonalnie) |
| **Sekrety** | Env vars / secret manager; rotacja kluczy; brak w repo |

### A.6 Naglowki i frontend

| Obszar | Mozliwosci / wymagania |
|--------|------------------------|
| **CSP** | default-src 'self'; script-src bez unsafe-inline (nonces); frame-ancestors 'none'; form-action 'self'; start od report-only |
| **HSTS** | Strict-Transport-Security: max-age=31536000; includeSubDomains; preload |
| **X-Frame-Options** | DENY lub SAMEORIGIN |
| **X-Content-Type-Options** | nosniff |
| **Referrer-Policy** | strict-origin-when-cross-origin |

### A.7 Mobile / PWA

| Obszar | Mozliwosci / wymagania |
|--------|------------------------|
| **Phishing** | PWA moze byc zainstalowana jak "legitymacja" — edukacja uzytkownikow; weryfikacja domeny przy instalacji |
| **Service Worker** | Ograniczenia scope; brak skryptow z zewnetrznych zrodel |
| **Przechowywanie** | localStorage/sessionStorage — unikac tokenow (XSS); preferowac HttpOnly cookies |
| **Responsywnosc** | Brak overflow; czytelne pola formularzy; bezpieczne logowanie na urzadzeniach mobilnych |

### A.8 Platnosci (Stripe) — przed 3.1

| Obszar | Mozliwosci / wymagania |
|--------|------------------------|
| **Checkout** | Stripe Hosted Checkout — karty nigdy nie przechodza przez nasze serwery (brak PCI scope dla pelnego SAQ) |
| **Webhook** | Weryfikacja Stripe-Signature (constructEvent); surowy body (bez parsowania przed weryfikacja); secret whsec_* w env; odrzucanie requestow z timestamp poza 5 min (ochrona przed replay) |
| **Idempotencja** | Obsluga zdarzen stripe — uzycie id eventu do unikniecia duplikatow przy retry |
| **PCI** | Nie przechowywac pelnych numerow kart; tylko ostatnie 4 cyfry / typ — jesli zwrocone przez Stripe |
| **Konto Stripe** | Wlaczyc Radar (fraud detection); testy w trybie testowym przed produkcja |

### A.9 Backup i odzyskiwanie

| Obszar | Mozliwosci / wymagania |
|--------|------------------------|
| **PostgreSQL** | pg_dump (logiczne) lub pgBackRest (fizyczne, PITR); harmonogram: np. dzienny full + WAL archiving |
| **Off-site** | Backupy w innym regionie/cloud storage (S3, GCS); szyfrowane |
| **Test restore** | Okresowe przywracanie na staging — weryfikacja integralnosci |
| **Retencja** | Min. 30 dni; dla platnosci/compliance — rozszerzyc do 1–7 lat wedlug RODO/ksiegowosci |

### A.10 Logowanie i monitoring

| Obszar | Mozliwosci / wymagania |
|--------|------------------------|
| **Bledy** | Sentry lub equivalent; kontekst (userId, requestId); brak stack trace w odpowiedzi API |
| **Audit log** | Dla platnosci — zalecany: kto, co, kiedy (np. zmiany subskrypcji, billing); retencja zgodna z RODO |
| **Logi operacyjne** | Bez hasel/tokenow; logowanie podejrzanych zdarzen (nieudane logowania, zmiany uprawnien) |

### A.11 Compliance (RODO/GDPR)

| Obszar | Mozliwosci / wymagania |
|--------|------------------------|
| **Polityka prywatnosci** | Administrator, cele, podstawa prawna, okres przechowywania, prawa uzytkownika |
| **Klauzule** | Przy kazdym formularzu — kto zbiera, po co, jak dlugo |
| **Zgody** | Swiadome, dobrowolne, udokumentowane; aktywne "Zgadzam sie" |
| **Privacy by default** | Minimalizacja danych; domyslna ochrona |

---

## Ocena bezpieczenstwa (stan na luty 2026)

### ✅ Co jest dobrze zrobione:
- **Stripe Webhook** — weryfikacja Stripe-Signature (constructEvent), surowy body (rawBody: true w NestFactory), idempotencja (StripeWebhookEvent z unique stripeEventId), przetwarzanie w transakcji
- **Autoryzacja platnosci** — tylko OWNER moze tworzyc Checkout/Portal, requireOwner() na kazdym endpoincie billing
- **URL bezpieczenstwo** — success/cancel URL budowane z FRONTEND_URL (serwer), nie przyjmowane z klienta (ochrona open redirect)
- **Price whitelist** — akceptowane tylko priceId z env (STRIPE_PRICE_PRO, STRIPE_PRICE_PRO_YEARLY)
- **Webhook publiczny** — @Public() + @SkipThrottle() (poprawnie, bo Stripe sam retryuje)
- **Helmet + CORS** — poprawna konfiguracja, whitelist domen, brak wildcard
- **Walidacja wejsciowa** — ValidationPipe z whitelist + forbidNonWhitelisted
- **Rate limiting** — globalne + per-user (PerUserThrottlerGuard)
- **Token versioning** — User.tokenVersion do revoke sesji
- **Env validation** — Bootstrap sprawdza JWT_SECRET/NEXTAUTH_SECRET, DATABASE_URL w produkcji

### ⚠️ Ryzyka i braki:
| Ryzyko | Priorytet | Opis |
|--------|-----------|------|
| **Brak backend guard na premium** | KRYTYCZNY | Strony Reports/Export/Templates blokowane tylko na frontendzie. Backend nie sprawdza planu — kazdy moze wywolac API jesli zna endpoint. Potrzebny PremiumGuard / PlanCheckMiddleware |
| **Brak Sentry** | WYSOKI | Punkt 2.6.2 — nieobsluzane 500 moga ujawnic stack trace. Brak monitoringu bledow produkcyjnych |
| **Brak RODO compliance** | WYSOKI | Brak polityki prywatnosci, regulaminu, cookie bannera — wymagane przed uruchomieniem produkcyjnym z danymi osobowymi |
| **invoice.payment_failed — brak akcji** | SREDNI | Webhook loguje blad, ale nie podejmuje akcji (email do ownera, grace period, degradacja planu) |
| **Brak CI/CD** | SREDNI | Brak automatycznego pipeline'u (testy, build, deploy). Reczny deploy zwieksza ryzyko bledow |
| **Brak testow automatycznych** | SREDNI | Brak unit / e2e testow. Trudno weryfikowac zmiany bez regresji |
| **Logi z PII** | NISKI | Logi moga zawierac emaile — do ograniczenia w produkcji |
| **Brak HSTS** | NISKI | HSTS zalezy od reverse proxy (Vercel/Railway) — warto zweryfikowac |

---

## Co mozna zrobic lepiej (rekomendacje)

### Priorytet KRYTYCZNY (przed produkcja Stripe):
1. **PremiumGuard** — NestJS guard sprawdzajacy Subscription.planId przy endpointach premium. Bez tego frontend-only gating jest latwy do obejscia.
2. **Stripe live mode** — przejscie z sandbox na produkcyjne klucze. Wlaczenie Stripe Radar (fraud detection). Konfiguracja webhookow produkcyjnych.
3. **RODO / prawne** — polityka prywatnosci, regulamin, cookie banner. Wymagane prawnie przy danych osobowych i platnosciach.

### Priorytet WYSOKI:
4. **Sentry** — integracja monitoringu bledow + exception filter (brak stack w prod). Punkt 2.6.2.
5. **Obsluga invoice.payment_failed** — email do ownera, grace period (np. 7 dni), automatyczna degradacja do free po braku platnosci.
6. **CI/CD** — GitHub Actions: lint, build, testy, deploy na staging/prod.
7. **Testy** — przynajmniej unit testy krytycznych serwisow (BillingService, AuthService, ShiftsService).

### Priorytet SREDNI:
8. **Webhook retry handling** — obsluga edge case'ow: customer.subscription.updated bez teamId w metadata.
9. **Plan pricing page w app** — strona /pricing widoczna z poziomu aplikacji (a nie tylko landing).
10. **Dark mode** — punkt 4.1, odroczony ale wart zrobienia.
11. **Grafiki landing page** — uzupelnienie placeholderow w public/landing/.
12. **Staging environment** — osobne srodowisko do testow przed deployem na produkcje.

---

## Pomysly na przyszlosc (po MVP produkcyjnym)

- **Aplikacja mobilna (React Native / Expo)** — naturalne rozszerzenie po stabilizacji PWA
- **Integracja z systemami kadrowymi** (Comarch, Sage, enova) — eksport danych do polskich systemow HR
- **AI sugestie grafiku** — automatyczne generowanie grafiku na podstawie dostepnosci, historii, preferencji
- **Multi-language (i18n)** — wersja angielska dla klientow miedzynarodowych
- **Marketplace integracji** — Zapier/Make triggers dla zmian w grafiku
- **Onboarding video** — krotkie video-walkthroughs zamiast tylko tour po aplikacji
- **Metryki biznesowe dla ownera** — dashboard: retencja pracownikow, sredni czas react na gielda, fill rate zmian
- **Powiadomienia SMS** — dla krytycznych sytuacji (np. nieobsadzona zmiana w ciagu 2h)

---

## Notatki techniczne

- **Stack**: Next.js 16 + NestJS 11 + PostgreSQL + Prisma
- **Auth**: NextAuth.js (Google OAuth + Credentials)
- **Email**: Resend API
- **Pliki**: Cloudinary (avatary)
- **Platnosci**: Stripe (sandbox — Checkout Session, Customer Portal, Webhook)
- **Hosting**: Vercel (frontend, domeny staffer.pl / app.staffer.pl) + Railway/Neon (backend/DB planowane)
