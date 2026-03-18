# Polityka Prywatności — Staffer.pl

**Ostatnia aktualizacja: 18 marca 2026**

## 1. Administrator danych osobowych

Administratorem Twoich danych osobowych jest:

- **Imię i nazwisko:** Mateusz Woronowicz
- **Email kontaktowy:** biuro@staffer.pl
- **Serwis:** Staffer.pl, dostępny pod adresem app.staffer.pl

Usługa świadczona jest przez osobę fizyczną w ramach działalności nierejestrowanej na podstawie art. 5 ustawy Prawo przedsiębiorców.

## 2. Jakie dane zbieramy

### Dane podane przez użytkownika:
- Imię i nazwisko
- Adres e-mail
- Hasło (przechowywane wyłącznie w formie zahaszowanej — bcrypt)
- Zdjęcie profilowe / avatar (opcjonalnie, za pośrednictwem Cloudinary)
- Numer telefonu (opcjonalnie)
- Umiejętności / kwalifikacje (opcjonalnie)
- Notatki profilu (opcjonalnie)
- Stawka godzinowa (podawana przez managera, nie przez pracownika)

### Dane dotyczące zespołu:
- Nazwa firmy / zespołu
- Kod zaproszenia do zespołu
- Stanowiska pracowników i ich kolory
- Grafik zmian, przypisania, dostępność

### Dane techniczne (zbierane automatycznie):
- Adres IP (w logach serwera i rate limiting — przechowywany max. 30 dni)
- Typ przeglądarki i urządzenia
- Dane sesji (cookies JWT, next-auth tokens)
- Logi błędów — przekazywane do Sentry bez treści danych osobowych

### Dane płatności:
- Płatności są przetwarzane wyłącznie przez Stripe Inc. Nie przechowujemy numerów kart ani danych płatniczych na naszych serwerach. Otrzymujemy jedynie potwierdzenie transakcji i identyfikatory Stripe.

## 3. Cele i podstawy prawne przetwarzania

| Cel | Podstawa prawna (RODO) | Okres przechowywania |
|-----|----------------------|---------------------|
| Świadczenie usługi (konto, grafik, zespół) | Art. 6 ust. 1 lit. b — wykonanie umowy | Przez czas trwania konta |
| Obsługa płatności | Art. 6 ust. 1 lit. b — wykonanie umowy | Zgodnie z przepisami księgowymi (5 lat) |
| Powiadomienia e-mail (grafik, zmiany) | Art. 6 ust. 1 lit. f — uzasadniony interes | Do momentu rezygnacji z powiadomień |
| Bezpieczeństwo (logi, rate limiting) | Art. 6 ust. 1 lit. f — uzasadniony interes | 30 dni |
| Obsługa zgłoszeń i kontaktów | Art. 6 ust. 1 lit. f — uzasadniony interes | 12 miesięcy |

Nie przetwarzamy danych w celach marketingowych bez wyraźnej zgody.

## 4. Udostępnianie danych — podmioty przetwarzające

Twoje dane mogą być przekazywane wyłącznie następującym podmiotom, wyłącznie w zakresie niezbędnym do świadczenia usługi:

| Podmiot | Cel | Kraj | Podstawa przekazania |
|---------|-----|------|----------------------|
| **Stripe Inc.** | Przetwarzanie płatności | USA | SCC (art. 46 RODO) |
| **Resend Inc.** | Wysyłka e-maili transakcyjnych | USA | SCC |
| **Cloudinary Ltd.** | Przechowywanie zdjęć (avatary) | USA / EU | SCC |
| **Vercel Inc.** | Hosting aplikacji frontendowej | USA / EU | SCC |
| **Railway Corp.** | Hosting backendu API | USA | SCC |
| **Neon Inc.** | Hosting bazy danych PostgreSQL | USA / EU | SCC |
| **Sentry (Functional Software Inc.)** | Monitoring błędów (bez danych osobowych) | USA | SCC |
| **Google LLC** | Logowanie OAuth, synchronizacja kalendarza | USA | SCC |

Dane są przekazywane poza Europejski Obszar Gospodarczy wyłącznie na podstawie Standardowych Klauzul Umownych (SCC) przyjętych przez Komisję Europejską.

Nie sprzedajemy, nie wynajmujemy ani nie udostępniamy danych podmiotom trzecim w celach marketingowych.

## 5. Twoje prawa

Na podstawie RODO (Rozporządzenie UE 2016/679) przysługują Ci następujące prawa:

- **Prawo dostępu** (art. 15) — możesz żądać informacji o swoich danych
- **Prawo do sprostowania** (art. 16) — możesz poprawić swoje dane w profilu lub przez kontakt e-mail
- **Prawo do usunięcia** (art. 17) — możesz żądać usunięcia konta i wszystkich danych
- **Prawo do ograniczenia przetwarzania** (art. 18)
- **Prawo do przenoszenia danych** (art. 20) — możesz wyeksportować swoje dane (CSV) z poziomu aplikacji
- **Prawo do sprzeciwu** (art. 21) — wobec przetwarzania na podstawie uzasadnionego interesu
- **Prawo do cofnięcia zgody** (art. 7 ust. 3) — w każdym momencie, bez wpływu na zgodność przetwarzania przed cofnięciem

Aby skorzystać z tych praw, napisz na: **biuro@staffer.pl**. Odpowiemy w ciągu 30 dni.

Masz prawo wnieść skargę do **Prezesa Urzędu Ochrony Danych Osobowych (UODO)**, ul. Stawki 2, 00-193 Warszawa, www.uodo.gov.pl.

## 6. Bezpieczeństwo danych

Stosujemy następujące środki bezpieczeństwa:
- Szyfrowanie transmisji (TLS 1.2+/HTTPS)
- Hashowanie haseł (bcrypt, min. cost 10)
- Tokeny JWT z ograniczonym czasem życia i mechanizmem unieważniania (tokenVersion)
- Ochrona przed atakami (Helmet, CORS whitelist, rate limiting, CSP, X-Frame-Options)
- Walidacja i sanitizacja danych wejściowych (class-validator)
- Monitoring błędów (Sentry, bez stack trace w produkcji)
- Regularne backupy bazy danych (Neon PITR + pg_dump)
- Stripe webhook signature verification

## 7. Pliki cookies

Używamy wyłącznie niezbędnych plików cookies:

| Nazwa | Typ | Cel | Wygasanie |
|-------|-----|-----|-----------|
| `next-auth.session-token` | Niezbędny | Sesja zalogowanego użytkownika | Sesja przeglądarki |
| `next-auth.csrf-token` | Niezbędny | Ochrona przed atakami CSRF | Sesja przeglądarki |
| `next-auth.callback-url` | Niezbędny | Przekierowanie po zalogowaniu | Sesja przeglądarki |

Nie używamy cookies analitycznych, marketingowych ani śledzących. Szczegóły w [Polityce Cookies](/polityka-cookies).

## 8. Dzieci

Serwis jest przeznaczony wyłącznie dla osób pełnoletnich lub osób, które ukończyły 16 lat i uzyskały zgodę rodzica/opiekuna prawnego. Nie zbieramy świadomie danych dzieci poniżej 16 roku życia.

## 9. Zmiany polityki prywatności

O istotnych zmianach polityki prywatności poinformujemy za pośrednictwem aplikacji lub e-mailem z co najmniej **14-dniowym wyprzedzeniem**. Data ostatniej aktualizacji widnieje na górze dokumentu.

## 10. Kontakt

W sprawach dotyczących ochrony danych osobowych:
- **E-mail:** biuro@staffer.pl
- Odpowiadamy w ciągu 30 dni roboczych.
