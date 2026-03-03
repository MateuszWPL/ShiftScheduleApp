# Integracja z kalendarzem (iCal)

Ta funkcja jest dostępna od planu **Starter+**. Pozwala pracownikom dodać swoje zmiany do zewnętrznego kalendarza (Google Calendar, Apple Calendar, Outlook itp.).

## 1. Plik .ics z zakresem dat

Na stronie **Eksport danych** w aplikacji (`/app/export`) możesz:

- wybrać zakres dat (tydzień, miesiąc, ostatnie 90 dni),
- kliknąć kafelek **Kalendarz (Google / Apple / Outlook)**,
- przyciskiem **Pobierz** pobrać plik `*.ics` z Twoimi zmianami.

Taki plik możesz zaimportować jednorazowo do dowolnego kalendarza.

## 2. Stały link do subskrypcji kalendarza

W tym samym kafelku możesz użyć przycisku **Kopiuj link subskrypcji**. Działa on tak:

1. Backend generuje (lub odnajduje istniejący) losowy token przypisany do użytkownika.
2. Tworzony jest adres w formacie:

   `https://TWÓJ_BACKEND_URL/calendar/feed/<token>.ics`

3. Link jest kopiowany do schowka.

### Jak dodać link w Google Calendar

1. Otwórz Google Calendar w przeglądarce.
2. W lewym panelu kliknij **„Dodaj kalendarz” → „Z adresu URL”**.
3. Wklej skopiowany link `.../calendar/feed/<token>.ics`.
4. Zapisz – nowy kalendarz pojawi się na liście i będzie się automatycznie odświeżał.

Analogicznie możesz użyć tego samego linku w Apple Calendar czy Outlook.

## 3. Bezpieczeństwo i limity

- Link zawiera długi, losowy token – nie da się go „zgadnąć”.
- Jeśli plan zespołu spadnie do **Free**, feed przestanie zwracać dane (funkcja wymaga planu Starter+).
- Właściciel konta może w każdej chwili odwołać link (przycisk „Odwołaj link” – do dodania w kolejnej iteracji, jeśli potrzebne) i wygenerować nowy.

## 4. Co trzeba mieć skonfigurowane

Dla iCal / linku subskrypcji **nie potrzebujesz dodatkowej konfiguracji w Google Cloud** – wszystko działa na standardowym formacie iCalendar, który obsługują główne kalendarze.

Jeśli w przyszłości będziesz chciał:

- wysyłać wydarzenia bezpośrednio do Google Calendar (bez linku),
- reagować na zmiany w zewnętrznym kalendarzu,

potrzebne będzie:

- włączenie **Google Calendar API** w Google Cloud Console,
- dodanie scope `https://www.googleapis.com/auth/calendar.events` do ekranu zgody OAuth,
- endpoint OAuth do podpinania kalendarza pracownika,
- tabela na tokeny (access/refresh) w bazie.

