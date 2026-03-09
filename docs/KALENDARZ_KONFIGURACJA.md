# Integracja z kalendarzem

Ta funkcja jest dostępna od planu **Starter+**. Pozwala pracownikom synchronizować zmiany z grafiku bezpośrednio z Google Calendar (jednym kliknięciem) lub eksportować jako plik iCal.

---

## 1. Synchronizacja z Google Calendar (zalecana)

Najwygodniejsza opcja — zmiany z grafiku trafiają automatycznie do kalendarza Google.

### Jak to działa

1. Na stronie **Grafik** (`/app/grafik`) lub **Eksport danych** (`/app/export`) kliknij przycisk **„Połącz z Google Calendar"**.
2. Zostaniesz przekierowany do strony logowania Google — zaloguj się i zaakceptuj uprawnienia (dodawanie wydarzeń do kalendarza).
3. Po powrocie do aplikacji przycisk zmieni się na **„Synchronizuj"**.
4. Kliknij **„Synchronizuj"** — zmiany z wybranego tygodnia (lub zakresu dat) automatycznie pojawią się w Twoim Google Calendar.

### Szczegóły techniczne

- Aplikacja korzysta z **Google Calendar API** (scope: `calendar.events`).
- Tokeny OAuth (access + refresh) są przechowywane w tabeli `GoogleCalendarToken` w bazie.
- Przy synchronizacji:
  - nowe zmiany są **dodawane** jako wydarzenia,
  - istniejące zmiany (rozpoznawane po `stafferShiftId` w `extendedProperties`) są **aktualizowane**,
  - każde wydarzenie ma przypomnienie 1h przed zmianą.
- Token jest automatycznie odświeżany (refresh token), więc użytkownik nie musi się ponownie logować.
- Przycisk z rozwijanym menu pozwala: synchronizować, otworzyć Google Calendar, lub rozłączyć konto.

### Konfiguracja (dla administratora)

Aby synchronizacja działała, potrzebne jest:

1. **Włączenie Google Calendar API** w Google Cloud Console.
2. **Dodanie scope** `https://www.googleapis.com/auth/calendar.events` do ekranu zgody OAuth.
3. **Dodanie URI przekierowania** w konfiguracji OAuth:
   - Lokalnie: `http://localhost:3000/app/calendar-callback`
   - Produkcja: `https://app.staffer.pl/app/calendar-callback`
4. **Zmienne środowiskowe** w backendzie (opcjonalne — domyślnie używa tych samych co logowanie Google):
   - `GOOGLE_CALENDAR_CLIENT_ID` (lub `GOOGLE_CLIENT_ID`)
   - `GOOGLE_CALENDAR_CLIENT_SECRET` (lub `GOOGLE_CLIENT_SECRET`)
   - `GOOGLE_CALENDAR_REDIRECT_URI`

---

## 2. Plik .ics z zakresem dat (jednorazowy)

Na stronie **Eksport danych** w aplikacji (`/app/export`) możesz:

- wybrać zakres dat (tydzień, miesiąc, ostatnie 90 dni),
- kliknąć **Pobierz .ics** z Twoimi zmianami.

Taki plik możesz zaimportować jednorazowo do dowolnego kalendarza (Apple Calendar, Outlook itp.).

---

## 3. Stały link do subskrypcji kalendarza

W kafelku iCal na stronie eksportu możesz użyć przycisku **Kopiuj link subskrypcji**:

1. Backend generuje losowy token przypisany do użytkownika.
2. Tworzony jest adres: `https://BACKEND_URL/calendar/feed/<token>.ics`
3. Link jest kopiowany do schowka.

### Jak dodać w Google Calendar

1. Otwórz Google Calendar → **„Dodaj kalendarz" → „Z adresu URL"**.
2. Wklej link i zapisz.
3. Kalendarz będzie się automatycznie odświeżał (co ~5 minut z cache, co ~30 min w Google).

---

## 4. Bezpieczeństwo i limity

- Synchronizacja z Google Calendar wymaga jawnej zgody użytkownika (OAuth consent).
- Tokeny OAuth są przechowywane w bazie, per-użytkownik.
- Link subskrypcji iCal zawiera długi, losowy token — nie da się go zgadnąć.
- Jeśli plan zespołu spadnie do **Free**, synchronizacja i feed przestaną działać.
- Użytkownik może w każdej chwili **rozłączyć** Google Calendar z poziomu menu w aplikacji.
