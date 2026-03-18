import type { Metadata } from "next";
import { LegalLayout } from "@/components/layout/LegalLayout";

export const metadata: Metadata = {
  title: "Polityka Cookies | Staffer.pl",
  description: "Polityka cookies serwisu Staffer.pl — używamy wyłącznie niezbędnych plików cookies.",
};

export default function PolitykaCookies() {
  return (
    <LegalLayout title="Polityka Cookies" lastUpdated="18 marca 2026">
      <h2>1. Czym są pliki cookies</h2>
      <p>
        Pliki cookies (ciasteczka) to małe pliki tekstowe zapisywane na urządzeniu przez przeglądarkę
        internetową podczas korzystania ze strony. Służą do prawidłowego działania serwisu
        i zapamiętywania sesji użytkownika.
      </p>

      <h2>2. Jakie cookies używamy</h2>
      <p>
        Staffer.pl używa wyłącznie <strong>cookies niezbędnych</strong> do działania aplikacji.
        Nie stosujemy żadnych cookies analitycznych, reklamowych ani śledzących.
      </p>

      <h3>Cookies niezbędne (wymagane do działania)</h3>
      <table>
        <thead>
          <tr>
            <th>Nazwa</th>
            <th>Dostawca</th>
            <th>Cel</th>
            <th>Wygasanie</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>next-auth.session-token</code></td>
            <td>Staffer.pl</td>
            <td>Utrzymanie sesji zalogowanego użytkownika (HttpOnly, Secure, SameSite=Lax)</td>
            <td>Sesja przeglądarki</td>
          </tr>
          <tr>
            <td><code>next-auth.csrf-token</code></td>
            <td>Staffer.pl</td>
            <td>Ochrona przed atakami CSRF (HttpOnly)</td>
            <td>Sesja przeglądarki</td>
          </tr>
          <tr>
            <td><code>next-auth.callback-url</code></td>
            <td>Staffer.pl</td>
            <td>Przekierowanie po zalogowaniu (HttpOnly)</td>
            <td>Sesja przeglądarki</td>
          </tr>
        </tbody>
      </table>

      <h3>Cookies zewnętrzne (tylko podczas korzystania z tych usług)</h3>
      <table>
        <thead>
          <tr>
            <th>Dostawca</th>
            <th>Kiedy</th>
            <th>Cel</th>
            <th>Polityka dostawcy</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Stripe Inc.</strong></td>
            <td>Tylko podczas płatności</td>
            <td>Bezpieczna realizacja transakcji</td>
            <td>
              <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer">
                stripe.com/privacy
              </a>
            </td>
          </tr>
          <tr>
            <td><strong>Google LLC</strong></td>
            <td>Tylko przy logowaniu przez Google</td>
            <td>Uwierzytelnianie OAuth</td>
            <td>
              <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">
                policies.google.com
              </a>
            </td>
          </tr>
        </tbody>
      </table>

      <h2>3. Czego NIE używamy</h2>
      <p>Staffer.pl <strong>nie używa</strong>:</p>
      <ul>
        <li>Cookies analitycznych (Google Analytics, Hotjar, Mixpanel itp.)</li>
        <li>Cookies reklamowych / remarketingowych</li>
        <li>Cookies śledzących (tracking pixels, fingerprinting)</li>
        <li>Cookies profilujących stron trzecich</li>
        <li>Żadnych mechanizmów śledzenia zachowań między sesjami</li>
      </ul>

      <h2>4. localStorage</h2>
      <p>
        Poza plikami cookies, Serwis używa <code>localStorage</code> przeglądarki wyłącznie do
        zapamiętania faktu zaakceptowania niniejszej informacji o cookies
        (klucz: <code>cookie-consent</code>). Dane <code>localStorage</code> nie są przesyłane na
        serwer i dostępne są tylko w Twojej przeglądarce.
      </p>

      <h2>5. Podstawa prawna</h2>
      <p>Cookies niezbędne stosowane są na podstawie:</p>
      <ul>
        <li>
          Art. 6 ust. 1 lit. b RODO — wykonanie umowy (świadczenie usługi wymaga utrzymania sesji)
        </li>
        <li>
          Art. 6 ust. 1 lit. f RODO — uzasadniony interes (bezpieczeństwo, ochrona CSRF)
        </li>
        <li>
          Art. 173 ust. 3 pkt 1 Prawa telekomunikacyjnego — wyłączenie obowiązku uzyskania
          zgody dla cookies niezbędnych
        </li>
      </ul>
      <p>
        Ze względu na brak cookies analitycznych i marketingowych, nie jest wymagana odrębna zgoda
        użytkownika na pliki cookies — wystarczy akceptacja Regulaminu przy rejestracji.
      </p>

      <h2>6. Zarządzanie cookies</h2>
      <p>Użytkownik może zarządzać plikami cookies w ustawieniach przeglądarki:</p>
      <ul>
        <li><strong>Chrome:</strong> Ustawienia → Prywatność i bezpieczeństwo → Pliki cookie</li>
        <li><strong>Firefox:</strong> Ustawienia → Prywatność i bezpieczeństwo → Ciasteczka</li>
        <li><strong>Safari:</strong> Preferencje → Prywatność → Zarządzaj danymi witryn</li>
        <li><strong>Edge:</strong> Ustawienia → Prywatność → Pliki cookie</li>
      </ul>
      <p>
        <strong>Uwaga:</strong> Wyłączenie cookies niezbędnych (next-auth.*) uniemożliwia zalogowanie
        się do Serwisu.
      </p>

      <h2>7. Zmiany polityki cookies</h2>
      <p>
        Polityka cookies może być aktualizowana. Data ostatniej zmiany widnieje na górze dokumentu.
        O istotnych zmianach poinformujemy w aplikacji.
      </p>

      <h2>8. Kontakt</h2>
      <p>
        Pytania dotyczące cookies:{" "}
        <a href="mailto:biuro@staffer.pl">biuro@staffer.pl</a>
      </p>
    </LegalLayout>
  );
}
