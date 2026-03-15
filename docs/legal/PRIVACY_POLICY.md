# Polityka Prywatnosci — Staffer.pl

> **UWAGA:** To jest szablon do dostosowania przez prawnika przed wdrozeniem.
> Ostatnia aktualizacja: [DATA]

## 1. Administrator danych

Administratorem Twoich danych osobowych jest:

- **Nazwa firmy:** [PELNA NAZWA FIRMY]
- **Adres:** [ADRES SIEDZIBY]
- **NIP:** [NIP]
- **Email kontaktowy:** [EMAIL_KONTAKTOWY]

## 2. Jakie dane zbieramy

### Dane podane przez uzytkownika:
- Imie i nazwisko
- Adres email
- Zdjecie profilowe (avatar)
- Numer telefonu (opcjonalnie)
- Umiejetnosci / kwalifikacje (opcjonalnie)
- Notatki profilu (opcjonalnie)

### Dane dotyczace zespolu:
- Nazwa firmy / zespolu
- Kod zaproszenia do zespolu
- Stanowiska pracownikow
- Stawka godzinowa (podana przez managera)
- Grafik zmian i dostepnosc

### Dane techniczne (zbierane automatycznie):
- Adres IP
- Typ przegladarki i urzadzenia
- Dane sesji (cookies, tokeny JWT)
- Logi bledow (Sentry — bez danych osobowych)

### Dane platnosci:
- Platnosci sa przetwarzane przez Stripe Inc. Nie przechowujemy numerow kart ani danych platniczych na naszych serwerach.

## 3. Cele i podstawy prawne przetwarzania

| Cel | Podstawa prawna (RODO) | Okres przechowywania |
|-----|----------------------|---------------------|
| Swiadczenie uslugi (konto, grafik, zespol) | Art. 6 ust. 1 lit. b — wykonanie umowy | Przez czas trwania konta |
| Obsluga platnosci | Art. 6 ust. 1 lit. b — wykonanie umowy | Zgodnie z przepisami ksiegowymi (5 lat) |
| Komunikacja email (powiadomienia, grafik) | Art. 6 ust. 1 lit. f — uzasadniony interes | Do momentu rezygnacji z powiadomien |
| Bezpieczenstwo (logi, rate limiting) | Art. 6 ust. 1 lit. f — uzasadniony interes | 30 dni |
| Marketing (jesli wyrazono zgode) | Art. 6 ust. 1 lit. a — zgoda | Do cofniecia zgody |

## 4. Udostepnianie danych

Twoje dane moga byc udostepniane nastepujacym podmiotom:

| Podmiot | Cel | Lokalizacja |
|---------|-----|-------------|
| **Stripe Inc.** | Przetwarzanie platnosci | USA (Privacy Shield / SCC) |
| **Resend Inc.** | Wysylka emaili transakcyjnych | USA (SCC) |
| **Cloudinary Ltd.** | Przechowywanie zdjec (avatary) | USA/EU |
| **Vercel Inc.** | Hosting aplikacji frontend | USA/EU |
| **Railway Corp.** | Hosting backendu | USA |
| **Neon Inc.** | Hosting bazy danych | USA/EU |
| **Sentry (Functional Software)** | Monitoring bledow | USA (SCC) |
| **Google LLC** | Logowanie OAuth, synchronizacja kalendarza | USA (SCC) |

Dane sa przekazywane poza EOG na podstawie Standardowych Klauzul Umownych (SCC) lub decyzji o adekwatnosci.

## 5. Twoje prawa

Na podstawie RODO przysluguja Ci nastepujace prawa:

- **Prawo dostepu** — mozesz zadac informacji o swoich danych
- **Prawo do sprostowania** — mozesz poprawic swoje dane w profilu
- **Prawo do usuniecia** — mozesz zadac usuniecia konta i danych
- **Prawo do ograniczenia przetwarzania**
- **Prawo do przenoszenia danych** — mozesz wyeksportowac swoje dane (CSV)
- **Prawo do sprzeciwu** — wobec przetwarzania na podstawie uzasadnionego interesu
- **Prawo do cofniecia zgody** — w kazdym momencie, bez wplywu na zgodnosc przetwarzania przed cofnieciem

Aby skorzystac z tych praw, napisz na: [EMAIL_KONTAKTOWY]

## 6. Bezpieczenstwo danych

Stosujemy nastepujace srodki bezpieczenstwa:
- Szyfrowanie transmisji (TLS/HTTPS)
- Hashowanie hasel (bcrypt)
- Tokeny JWT z ograniczonym czasem zycia
- Ochrona przed atakami (Helmet, CORS, rate limiting, CSP)
- Walidacja danych wejsciowych
- Monitoring bledow (Sentry)
- Regularne backupy bazy danych

## 7. Pliki cookies

Uzywamy nastepujacych cookies:

| Nazwa | Typ | Cel | Wygasanie |
|-------|-----|-----|-----------|
| `next-auth.session-token` | Niezbedny | Sesja uzytkownika | Sesja |
| `next-auth.csrf-token` | Niezbedny | Ochrona CSRF | Sesja |

Nie uzywamy cookies marketingowych ani analitycznych stron trzecich.

Szczegoly w [Polityce Cookies](COOKIE_POLICY.md).

## 8. Zmiany polityki

O istotnych zmianach polityki prywatnosci poinformujemy za posrednictwem aplikacji lub emailem z co najmniej 14-dniowym wyprzedzeniem.

## 9. Kontakt

W sprawach dotyczacych ochrony danych osobowych prosimy o kontakt:
- Email: [EMAIL_KONTAKTOWY]
- Adres: [ADRES_FIRMY]

Masz prawo wniesc skarge do Prezesa Urzedu Ochrony Danych Osobowych (UODO), ul. Stawki 2, 00-193 Warszawa.
