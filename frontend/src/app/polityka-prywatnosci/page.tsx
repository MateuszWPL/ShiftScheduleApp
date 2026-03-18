import type { Metadata } from "next";
import { LegalLayout } from "@/components/layout/LegalLayout";

export const metadata: Metadata = {
  title: "Polityka Prywatności | Staffer.pl",
  description: "Polityka prywatności serwisu Staffer.pl — jak przetwarzamy Twoje dane osobowe zgodnie z RODO.",
};

export default function PolitykaPrywatnosci() {
  return (
    <LegalLayout title="Polityka Prywatności" lastUpdated="18 marca 2026">
      <h2>1. Administrator danych osobowych</h2>
      <p>Administratorem Twoich danych osobowych jest:</p>
      <ul>
        <li><strong>Mateusz Woronowicz</strong></li>
        <li>E-mail: <a href="mailto:biuro@staffer.pl">biuro@staffer.pl</a></li>
        <li>Serwis: Staffer.pl, dostępny pod adresem app.staffer.pl</li>
      </ul>
      <p>
        Usługa świadczona jest przez osobę fizyczną w ramach działalności nierejestrowanej
        na podstawie art. 5 ustawy Prawo przedsiębiorców.
      </p>

      <h2>2. Jakie dane zbieramy</h2>

      <h3>Dane podane przez użytkownika</h3>
      <ul>
        <li>Imię i nazwisko</li>
        <li>Adres e-mail</li>
        <li>Hasło (przechowywane wyłącznie w formie zahaszowanej — bcrypt, nigdy w postaci jawnej)</li>
        <li>Zdjęcie profilowe / avatar (opcjonalnie, za pośrednictwem Cloudinary)</li>
        <li>Numer telefonu (opcjonalnie)</li>
        <li>Umiejętności / kwalifikacje (opcjonalnie)</li>
        <li>Notatki profilu (opcjonalnie)</li>
        <li>Stawka godzinowa (podawana przez managera, nie przez pracownika)</li>
      </ul>

      <h3>Dane dotyczące zespołu</h3>
      <ul>
        <li>Nazwa firmy / zespołu</li>
        <li>Kod zaproszenia do zespołu</li>
        <li>Stanowiska pracowników</li>
        <li>Grafik zmian, przypisania, dostępność pracowników</li>
      </ul>

      <h3>Dane techniczne (zbierane automatycznie)</h3>
      <ul>
        <li>Adres IP (w logach serwera i rate limiting — max. 30 dni)</li>
        <li>Typ przeglądarki i urządzenia</li>
        <li>Dane sesji (cookies JWT, tokeny next-auth)</li>
        <li>Logi błędów — przekazywane do Sentry bez treści danych osobowych</li>
      </ul>

      <h3>Dane płatności</h3>
      <p>
        Płatności przetwarzane są wyłącznie przez <strong>Stripe Inc.</strong> Nie przechowujemy
        numerów kart ani danych płatniczych na naszych serwerach. Otrzymujemy jedynie potwierdzenie
        transakcji i identyfikatory Stripe.
      </p>

      <h2>3. Cele i podstawy prawne przetwarzania</h2>
      <table>
        <thead>
          <tr>
            <th>Cel</th>
            <th>Podstawa prawna (RODO)</th>
            <th>Okres przechowywania</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Świadczenie usługi (konto, grafik, zespół)</td>
            <td>Art. 6 ust. 1 lit. b — wykonanie umowy</td>
            <td>Przez czas trwania konta</td>
          </tr>
          <tr>
            <td>Obsługa płatności</td>
            <td>Art. 6 ust. 1 lit. b — wykonanie umowy</td>
            <td>Zgodnie z przepisami księgowymi (5 lat)</td>
          </tr>
          <tr>
            <td>Powiadomienia e-mail (grafik, zmiany)</td>
            <td>Art. 6 ust. 1 lit. f — uzasadniony interes</td>
            <td>Do momentu rezygnacji z powiadomień</td>
          </tr>
          <tr>
            <td>Bezpieczeństwo (logi, rate limiting)</td>
            <td>Art. 6 ust. 1 lit. f — uzasadniony interes</td>
            <td>30 dni</td>
          </tr>
          <tr>
            <td>Obsługa zgłoszeń i kontaktów</td>
            <td>Art. 6 ust. 1 lit. f — uzasadniony interes</td>
            <td>12 miesięcy</td>
          </tr>
        </tbody>
      </table>
      <p>Nie przetwarzamy danych w celach marketingowych bez wyraźnej zgody.</p>

      <h2>4. Podmioty przetwarzające dane</h2>
      <p>
        Twoje dane mogą być przekazywane wyłącznie następującym podmiotom, wyłącznie w zakresie
        niezbędnym do świadczenia usługi:
      </p>
      <table>
        <thead>
          <tr>
            <th>Podmiot</th>
            <th>Cel</th>
            <th>Kraj</th>
            <th>Podstawa przekazania</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Stripe Inc.</strong></td>
            <td>Przetwarzanie płatności</td>
            <td>USA</td>
            <td>SCC (art. 46 RODO)</td>
          </tr>
          <tr>
            <td><strong>Resend Inc.</strong></td>
            <td>Wysyłka e-maili transakcyjnych</td>
            <td>USA</td>
            <td>SCC</td>
          </tr>
          <tr>
            <td><strong>Cloudinary Ltd.</strong></td>
            <td>Przechowywanie zdjęć (avatary)</td>
            <td>USA / EU</td>
            <td>SCC</td>
          </tr>
          <tr>
            <td><strong>Vercel Inc.</strong></td>
            <td>Hosting aplikacji frontendowej</td>
            <td>USA / EU</td>
            <td>SCC</td>
          </tr>
          <tr>
            <td><strong>Railway Corp.</strong></td>
            <td>Hosting backendu API</td>
            <td>USA</td>
            <td>SCC</td>
          </tr>
          <tr>
            <td><strong>Neon Inc.</strong></td>
            <td>Hosting bazy danych PostgreSQL</td>
            <td>USA / EU</td>
            <td>SCC</td>
          </tr>
          <tr>
            <td><strong>Sentry (Functional Software Inc.)</strong></td>
            <td>Monitoring błędów (bez danych osobowych)</td>
            <td>USA</td>
            <td>SCC</td>
          </tr>
          <tr>
            <td><strong>Google LLC</strong></td>
            <td>Logowanie OAuth, synchronizacja kalendarza</td>
            <td>USA</td>
            <td>SCC</td>
          </tr>
        </tbody>
      </table>
      <p>
        Dane przekazywane poza Europejski Obszar Gospodarczy (EOG) wyłącznie na podstawie
        Standardowych Klauzul Umownych (SCC) przyjętych przez Komisję Europejską.
        Nie sprzedajemy, nie wynajmujemy ani nie udostępniamy danych podmiotom trzecim
        w celach marketingowych.
      </p>

      <h2>5. Twoje prawa</h2>
      <p>Na podstawie RODO (Rozporządzenie UE 2016/679) przysługują Ci:</p>
      <ul>
        <li><strong>Prawo dostępu</strong> (art. 15) — możesz żądać informacji o swoich danych</li>
        <li><strong>Prawo do sprostowania</strong> (art. 16) — możesz poprawić dane w profilu lub e-mailem</li>
        <li><strong>Prawo do usunięcia</strong> (art. 17) — możesz żądać usunięcia konta i danych</li>
        <li><strong>Prawo do ograniczenia przetwarzania</strong> (art. 18)</li>
        <li>
          <strong>Prawo do przenoszenia danych</strong> (art. 20) — eksport CSV dostępny w aplikacji
        </li>
        <li>
          <strong>Prawo do sprzeciwu</strong> (art. 21) — wobec przetwarzania na podstawie
          uzasadnionego interesu
        </li>
        <li>
          <strong>Prawo do cofnięcia zgody</strong> (art. 7 ust. 3) — w każdym momencie, bez wpływu
          na wcześniejsze przetwarzanie
        </li>
      </ul>
      <p>
        Aby skorzystać z tych praw, napisz na:{" "}
        <a href="mailto:biuro@staffer.pl">biuro@staffer.pl</a>. Odpowiemy w ciągu 30 dni.
      </p>
      <p>
        Masz prawo wnieść skargę do{" "}
        <strong>Prezesa Urzędu Ochrony Danych Osobowych (UODO)</strong>, ul. Stawki 2,
        00-193 Warszawa, <a href="https://uodo.gov.pl" target="_blank" rel="noopener noreferrer">uodo.gov.pl</a>.
      </p>

      <h2>6. Bezpieczeństwo danych</h2>
      <p>Stosujemy następujące środki bezpieczeństwa:</p>
      <ul>
        <li>Szyfrowanie transmisji (TLS 1.2+/HTTPS)</li>
        <li>Hashowanie haseł (bcrypt, min. cost 10)</li>
        <li>Tokeny JWT z ograniczonym czasem życia i mechanizmem unieważniania (tokenVersion)</li>
        <li>Ochrona przed atakami: Helmet, CORS whitelist, rate limiting, CSP, X-Frame-Options DENY</li>
        <li>Walidacja i sanitizacja danych wejściowych (class-validator, whitelist)</li>
        <li>Monitoring błędów (Sentry, bez stack trace w produkcji)</li>
        <li>Regularne backupy bazy danych (Neon PITR + pg_dump)</li>
        <li>Weryfikacja podpisów webhooków Stripe</li>
      </ul>

      <h2>7. Pliki cookies</h2>
      <p>Używamy wyłącznie niezbędnych plików cookies do działania aplikacji:</p>
      <table>
        <thead>
          <tr>
            <th>Nazwa</th>
            <th>Cel</th>
            <th>Wygasanie</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>next-auth.session-token</code></td>
            <td>Sesja zalogowanego użytkownika</td>
            <td>Sesja przeglądarki</td>
          </tr>
          <tr>
            <td><code>next-auth.csrf-token</code></td>
            <td>Ochrona przed CSRF</td>
            <td>Sesja przeglądarki</td>
          </tr>
          <tr>
            <td><code>next-auth.callback-url</code></td>
            <td>Przekierowanie po zalogowaniu</td>
            <td>Sesja przeglądarki</td>
          </tr>
        </tbody>
      </table>
      <p>
        Nie używamy cookies analitycznych, marketingowych ani śledzących. Szczegóły w{" "}
        <a href="/polityka-cookies">Polityce Cookies</a>.
      </p>

      <h2>8. Dzieci</h2>
      <p>
        Serwis przeznaczony jest wyłącznie dla osób pełnoletnich lub osób, które ukończyły 16 lat
        i uzyskały zgodę rodzica/opiekuna prawnego. Nie zbieramy świadomie danych dzieci poniżej
        16 roku życia.
      </p>

      <h2>9. Zmiany polityki prywatności</h2>
      <p>
        O istotnych zmianach poinformujemy za pośrednictwem aplikacji lub e-mailem z co najmniej{" "}
        <strong>14-dniowym wyprzedzeniem</strong>. Data ostatniej aktualizacji widnieje na górze dokumentu.
      </p>

      <h2>10. Kontakt</h2>
      <p>
        W sprawach dotyczących ochrony danych osobowych:{" "}
        <a href="mailto:biuro@staffer.pl">biuro@staffer.pl</a>
        <br />
        Odpowiadamy w ciągu 30 dni roboczych.
      </p>
    </LegalLayout>
  );
}
