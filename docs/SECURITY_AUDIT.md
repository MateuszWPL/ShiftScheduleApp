# Staffer.pl — Audyt bezpieczenstwa

> Przeniesione z ROADMAP.md. Research wykonany w ramach audytu 2.6.1 (luty 2026).

---

## Standardy i ramy

| Zrodlo | Zakres |
|--------|--------|
| **OWASP ASVS** | Application Security Verification Standard — wymagania techniczne i procesowe |
| **OWASP WSTG** | Web Security Testing Guide — metodologia testow penetracyjnych |
| **OWASP Top 10** | A01 Broken Access Control, A02 Cryptographic Failures, A03 Injection, A04 Insecure Design, A05 Security Misconfiguration, A06 Vulnerable Components, A07 Auth Failures, A08 Integrity Failures, A09 Logging Failures, A10 SSRF |
| **PCI DSS** | Obowiazuje przy platnosciach kartami — Stripe jako PSP przejmuje wiekszosc; nasza strona: minimalna ekspozycja, Checkout przez Stripe |

## Autentykacja i sesje

| Obszar | Mozliwosci / wymagania |
|--------|------------------------|
| **JWT** | Krotki czas zycia (np. 15 min access, 7 dni refresh); jti do revoke; algorytm RS256/ES256, NIGDY "none"; walidacja iss/aud/exp/iat/nbf |
| **NextAuth** | Explicit JWT secret w env (nie domyslny hash); session maxAge; cookies HttpOnly, Secure, SameSite=Strict |
| **CSRF** | SameSite cookies + token CSRF w naglowkach dla mutacji; double-submit cookie lub synchronizer token pattern |
| **Wyloguj wszedzie** | Endpoint revoke wszystkich sesji/tokenow uzytkownika; lista aktywnych sesji (opcjonalnie); blokada refresh tokenow po stronie serwera |

## Autoryzacja (Access Control)

| Obszar | Mozliwosci / wymagania |
|--------|------------------------|
| **IDOR** | Kazdy dostep do zasobu (shift, team, user, availability) — weryfikacja membership/role; nie polegac na ID z URL; UUID zamiast sekwencyjnych ID utrudnia enumeracje |
| **Role** | OWNER/MANAGER/EMPLOYEE — sprawdzanie w kazdym endpoincie; middleware/filtr per-resource |
| **Object-level** | Zapytania scoped do teamId uzytkownika; nigdy "SELECT * WHERE id = X" bez sprawdzenia przynaleznosci |

## Rate limiting

| Obszar | Mozliwosci / wymagania |
|--------|------------------------|
| **Per-user** | Klucz: userId (z JWT) + IP fallback; rozne limity: auth (np. 5/15min), API (np. 100/min), webhook (osobny endpoint) |
| **Token bucket** | Sustained RPS + burst; Redis do wspoldzielenia stanu miedzy instancjami |
| **Odpowiedzi** | HTTP 429, Retry-After, standard Problem Details |
| **Osobne limity** | Login, rejestracja, reset hasla — nizsze (np. 5/15min) — ochrona przed credential stuffing |

## Dane i szyfrowanie

| Obszar | Mozliwosci / wymagania |
|--------|------------------------|
| **W tranzycie** | TLS 1.2+; HSTS z max-age, includeSubDomains, preload |
| **W spoczynku** | PostgreSQL: szyfrowanie dysku (LUKS/EBS-KMS) na poziomie hosta; pgcrypto dla wrazliwych kolumn (opcjonalnie) |
| **Sekrety** | Env vars / secret manager; rotacja kluczy; brak w repo |

## Naglowki i frontend

| Obszar | Mozliwosci / wymagania |
|--------|------------------------|
| **CSP** | default-src 'self'; script-src bez unsafe-inline (nonces); frame-ancestors 'none'; form-action 'self'; start od report-only |
| **HSTS** | Strict-Transport-Security: max-age=31536000; includeSubDomains; preload |
| **X-Frame-Options** | DENY lub SAMEORIGIN |
| **X-Content-Type-Options** | nosniff |
| **Referrer-Policy** | strict-origin-when-cross-origin |

## Mobile / PWA

| Obszar | Mozliwosci / wymagania |
|--------|------------------------|
| **Phishing** | PWA moze byc zainstalowana jak "legitymacja" — edukacja uzytkownikow; weryfikacja domeny przy instalacji |
| **Service Worker** | Ograniczenia scope; brak skryptow z zewnetrznych zrodel |
| **Przechowywanie** | localStorage/sessionStorage — unikac tokenow (XSS); preferowac HttpOnly cookies |
| **Responsywnosc** | Brak overflow; czytelne pola formularzy; bezpieczne logowanie na urzadzeniach mobilnych |

## Platnosci (Stripe)

| Obszar | Mozliwosci / wymagania |
|--------|------------------------|
| **Checkout** | Stripe Hosted Checkout — karty nigdy nie przechodza przez nasze serwery (brak PCI scope dla pelnego SAQ) |
| **Webhook** | Weryfikacja Stripe-Signature (constructEvent); surowy body (bez parsowania przed weryfikacja); secret whsec_* w env; odrzucanie requestow z timestamp poza 5 min (ochrona przed replay) |
| **Idempotencja** | Obsluga zdarzen stripe — uzycie id eventu do unikniecia duplikatow przy retry |
| **PCI** | Nie przechowywac pelnych numerow kart; tylko ostatnie 4 cyfry / typ — jesli zwrocone przez Stripe |
| **Konto Stripe** | Wlaczyc Radar (fraud detection); testy w trybie testowym przed produkcja |

## Backup i odzyskiwanie

| Obszar | Mozliwosci / wymagania |
|--------|------------------------|
| **PostgreSQL** | pg_dump (logiczne) lub pgBackRest (fizyczne, PITR); harmonogram: np. dzienny full + WAL archiving |
| **Off-site** | Backupy w innym regionie/cloud storage (S3, GCS); szyfrowane |
| **Test restore** | Okresowe przywracanie na staging — weryfikacja integralnosci |
| **Retencja** | Min. 30 dni; dla platnosci/compliance — rozszerzyc do 1–7 lat wedlug RODO/ksiegowosci |

## Logowanie i monitoring

| Obszar | Mozliwosci / wymagania |
|--------|------------------------|
| **Bledy** | Sentry lub equivalent; kontekst (userId, requestId); brak stack trace w odpowiedzi API |
| **Audit log** | Dla platnosci — zalecany: kto, co, kiedy (np. zmiany subskrypcji, billing); retencja zgodna z RODO |
| **Logi operacyjne** | Bez hasel/tokenow; logowanie podejrzanych zdarzen (nieudane logowania, zmiany uprawnien) |

## Compliance (RODO/GDPR)

| Obszar | Mozliwosci / wymagania |
|--------|------------------------|
| **Polityka prywatnosci** | Administrator, cele, podstawa prawna, okres przechowywania, prawa uzytkownika |
| **Klauzule** | Przy kazdym formularzu — kto zbiera, po co, jak dlugo |
| **Zgody** | Swiadome, dobrowolne, udokumentowane; aktywne "Zgadzam sie" |
| **Privacy by default** | Minimalizacja danych; domyslna ochrona |

---

## Ocena bezpieczenstwa (stan na marzec 2026)

### Co jest dobrze zrobione:
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
- **Sentry** — zintegrowany na backendzie i frontendzie, exception filter bez stack trace w prod

### Ryzyka i braki:

| Ryzyko | Priorytet | Status |
|--------|-----------|--------|
| Brak RODO compliance (polityka prywatnosci, regulamin, cookie banner) | WYSOKI | Do zrobienia przed launchem |
| Brak CI/CD pipeline | SREDNI | Planowane |
| Brak testow automatycznych | SREDNI | Planowane |
| Logi z PII (emaile) | NISKI | Do ograniczenia |
| HSTS zalezy od reverse proxy | NISKI | Weryfikacja na Vercel/Railway |

### Audyty szczegolowe:
- [AUDYT_2_6_1_AUTORYZACJA.md](AUDYT_2_6_1_AUTORYZACJA.md) — naprawiono 2 luki (getAllUsers, getEmployeePositions)
- [AUDYT_2_6_1_AUTENTYKACJA.md](AUDYT_2_6_1_AUTENTYKACJA.md) — przegląd JWT, NextAuth, CSRF
