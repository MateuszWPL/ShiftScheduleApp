# ShiftApp B2B — Plan rozwoju aplikacji

## Status aktualny

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

### Co nie dziala / do usuniecia:
- Zamiana zmian (Swap Requests) — do usuniecia, niepotrzebne
- Panel Menadzera — juz przekierowany na Grafik
- Strona ustawien (Settings) — placeholder, do zrobienia

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

### 2.3 Lepszy profil pracownika (widok menadzera)
- [ ] Karta pracownika z pelna historia zmian
- [ ] Statystyki: srednia godzin/tydzien, frekwencja
- [ ] Notatki menadzera (prywatne)

### 2.4 Poprawki UX kalendarza
- [ ] Drag & resize zmian na kalendarzu (zmiana godzin przez przeciaganie krawedzi)
- [ ] Kolorowanie zmian wedlug roli (np. Kelner = niebieski, Kucharz = zielony)
- [ ] Filtrowanie kalendarza po pracowniku / roli
- [ ] Widok "Moje zmiany" dla pracownika (lista zamiast tabeli)

### 2.5 Onboarding
- [ ] Kreator pierwszego uruchomienia: zaloz firme -> zaproś zespol -> ustaw godziny -> dodaj pierwsza zmiane
- [ ] Tour po aplikacji (podswietlanie elementow z opisem)
- [ ] Pusty stan z CTA na kazdej stronie

### 2.6 Bezpieczenstwo produkcyjne
- [ ] Audyt bezpieczenstwa: sprawdzenie wszystkich endpointów
- [ ] CSRF protection
- [ ] Rate limiting per-user (nie tylko globalny)
- [ ] Sesje: mozliwosc wylogowania ze wszystkich urzadzen
- [ ] Logowanie bledow (Sentry lub podobne)
- [ ] Backup bazy danych

---

## FAZA 3 — Funkcje PREMIUM (platne)
> Priorytet: BIZNESOWY | Cel: Monetyzacja

### Model cenowy (propozycja):
- **Free**: do 5 pracownikow, podstawowe funkcje
- **Starter (29 zl/mies)**: do 15 pracownikow, eksport, raporty
- **Business (79 zl/mies)**: bez limitu pracownikow, wszystkie funkcje
- **Enterprise (indywidualnie)**: wiele lokalizacji, API, priorytetowe wsparcie

### 3.1 System subskrypcji (Stripe)
- [ ] Integracja Stripe Checkout + Customer Portal
- [ ] Model Subscription w bazie (planId, status, currentPeriodEnd, stripeCustomerId)
- [ ] Webhook Stripe do obslugi platnosci, anulowania, zmiany planu
- [ ] Middleware sprawdzajacy plan przy dostepie do funkcji premium
- [ ] Strona /pricing z planami cenowymi
- [ ] Strona /billing z historia platnosci i zarzadzaniem subskrypcja

### 3.2 Raporty i analizy [PREMIUM: Starter+]
- [ ] Dashboard raportow: godziny pracy, koszty, frekwencja
- [ ] Wykres: godziny na pracownika (tygodniowo / miesiecznie)
- [ ] Wykres: koszty wynagrodzen (na podstawie hourlyRate)
- [ ] Raport zgodnosci z Kodeksem Pracy (11h odpoczynku, normy tygodniowe)
- [ ] Filtrowanie raportow po okresie, pracowniku, roli

### 3.3 Eksport danych [PREMIUM: Starter+]
- [ ] Eksport grafiku do PDF (czytelny format do wydruku / wywieszenia)
- [ ] Eksport grafiku do Excel/CSV
- [ ] Eksport raportu godzin do CSV (do systemow kadrowych)
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
- [ ] Wdrozenie wlasnej palety kolorow (brand colors)
- [ ] Dark mode (opcjonalnie)
- [ ] Animacje i mikro-interakcje (framer-motion)
- [ ] Spójny design system (wszystkie komponenty)
- [ ] Ikony i ilustracje brandowe

### 4.2 Landing Page
- [ ] Strona glowna z prezentacja funkcji
- [ ] Sekcja cennikowa (pricing)
- [ ] Testimonials / social proof
- [ ] CTA do rejestracji
- [ ] SEO (meta tags, Open Graph, sitemap)
- [ ] Blog / baza wiedzy

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
FAZA 4    Landing page, kolory, prawne, DevOps
```

---

## Notatki techniczne

- **Stack**: Next.js 16 + NestJS 11 + PostgreSQL + Prisma
- **Auth**: NextAuth.js (Google OAuth + Credentials)
- **Email**: Resend API
- **Pliki**: Cloudinary (avatary)
- **Platnosci** (planowane): Stripe
- **Hosting** (planowane): Vercel (frontend) + Railway/Fly.io (backend) + Neon (PostgreSQL)
