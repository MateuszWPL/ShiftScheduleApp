import type { Metadata } from "next";
import { LegalLayout } from "@/components/layout/LegalLayout";

export const metadata: Metadata = {
  title: "Regulamin | Staffer.pl",
  description: "Regulamin korzystania z serwisu Staffer.pl — zarządzanie grafikami zmian.",
};

export default function RegulaminPage() {
  return (
    <LegalLayout title="Regulamin Usługi Staffer.pl" lastUpdated="18 marca 2026">
      <h2>1. Postanowienia ogólne</h2>
      <p>
        Niniejszy Regulamin określa zasady korzystania z serwisu Staffer.pl (dalej „Serwis"),
        dostępnego pod adresem <strong>app.staffer.pl</strong>.
      </p>
      <p>Właścicielem i operatorem Serwisu jest:</p>
      <ul>
        <li><strong>Mateusz Woronowicz</strong></li>
        <li>
          E-mail:{" "}
          <a href="mailto:biuro@staffer.pl">biuro@staffer.pl</a>
        </li>
      </ul>
      <p>
        Usługa świadczona jest przez osobę fizyczną w ramach działalności nierejestrowanej
        na podstawie art. 5 ustawy Prawo przedsiębiorców.
      </p>
      <p>
        Serwis służy do zarządzania grafikami zmian, zespołami pracowniczymi oraz powiązanymi
        funkcjami dla firm i organizacji (B2B SaaS).
      </p>
      <p>
        Korzystanie z Serwisu oznacza akceptację niniejszego Regulaminu oraz{" "}
        <a href="/polityka-prywatnosci">Polityki Prywatności</a>.
      </p>

      <h2>2. Definicje</h2>
      <ul>
        <li><strong>Użytkownik</strong> — każda osoba fizyczna korzystająca z Serwisu, która zaakceptowała Regulamin</li>
        <li><strong>Administrator (Admin)</strong> — Użytkownik zakładający zespół lub posiadający uprawnienia do zarządzania grafikiem, zespołem i płatnościami</li>
        <li><strong>Pracownik (Employee)</strong> — członek zespołu z dostępem do grafiku i własnych danych</li>
        <li><strong>Konto</strong> — indywidualne konto Użytkownika w Serwisie</li>
        <li><strong>Zespół</strong> — jednostka organizacyjna gromadząca Użytkowników i dane</li>
        <li><strong>Subskrypcja</strong> — płatna usługa dostępna w planach Starter+ i Business+</li>
        <li><strong>Trial</strong> — 14-dniowy bezpłatny okres próbny przy pierwszym zakupie Starter+</li>
      </ul>

      <h2>3. Rejestracja i konto</h2>
      <p>
        Rejestracja wymaga podania adresu e-mail i hasła lub zalogowania przez Google OAuth.
        Użytkownik zobowiązuje się do podania prawdziwych danych i utrzymywania ich aktualności.
      </p>
      <p>
        Hasło musi mieć co najmniej 8 znaków. Użytkownik jest odpowiedzialny za poufność hasła
        i wszelkie działania podjęte z jego konta.
      </p>
      <p>
        Jedno konto może należeć do jednego aktywnego zespołu. Adres e-mail wymaga weryfikacji
        przed uzyskaniem pełnego dostępu do Serwisu.
      </p>
      <p>
        Operator może zablokować lub usunąć konto w przypadku naruszenia Regulaminu.
      </p>

      <h2>4. Plany cenowe i płatności</h2>
      <p>Serwis oferuje następujące plany:</p>
      <table>
        <thead>
          <tr>
            <th>Plan</th>
            <th>Cena</th>
            <th>Limit pracowników</th>
            <th>Główne funkcje</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Darmowy (FREE)</strong></td>
            <td>0 zł</td>
            <td>Do 5</td>
            <td>Grafik tygodniowy i miesięczny, giełda zmian, ogłoszenia, powiadomienia e-mail</td>
          </tr>
          <tr>
            <td><strong>Starter+</strong></td>
            <td>29 zł / mies.</td>
            <td>Do 15</td>
            <td>Raporty, eksport CSV, Google Calendar / iCal</td>
          </tr>
          <tr>
            <td><strong>Business+</strong></td>
            <td>79 zł / mies.</td>
            <td>Bez limitu</td>
            <td>Szablony grafiku, wszystkie funkcje</td>
          </tr>
        </tbody>
      </table>
      <p>
        Płatności przetwarzane są przez <strong>Stripe Inc.</strong> Akceptujemy karty płatnicze
        obsługiwane przez Stripe (Visa, Mastercard i inne).
      </p>
      <p>
        Przy pierwszym zakupie Starter+ przysługuje <strong>14-dniowy bezpłatny trial</strong> —
        jednorazowy na zespół. Plan Business+ nie obejmuje okresu próbnego.
      </p>
      <p>
        Subskrypcja odnawia się automatycznie co miesiąc. Użytkownik może ją anulować w dowolnym
        momencie przez Portal Stripe — dostęp do płatnych funkcji pozostaje aktywny do końca
        opłaconego okresu.
      </p>
      <p>
        W przypadku nieudanej płatności Stripe ponawia próby automatycznie. Po ich wyczerpaniu
        subskrypcja jest anulowana, a zespół wraca na plan Darmowy.
      </p>
      <p>
        <strong>Obniżenie planu (downgrade) nie jest możliwe bezpośrednio.</strong> Aby przejść
        na niższy plan, należy anulować subskrypcję przez Portal Stripe. Po zakończeniu opłaconego
        okresu plan zmienia się automatycznie na Darmowy.
      </p>
      <p>
        Upgrade (przejście na wyższy plan) możliwy jest w każdym momencie — rozliczenie następuje
        proporcjonalnie (proration). Ceny podane są w złotych polskich.
      </p>

      <h2>5. Limity i ograniczenia funkcji</h2>
      <p>
        Przekroczenie limitu pracowników dla aktywnego planu blokuje tworzenie nowych zmian
        i publikację grafiku, jednak nie usuwa istniejących danych.
      </p>
      <p>
        Funkcje oznaczone jako „Starter+" lub „Business+" wymagają aktywnej subskrypcji
        odpowiedniego planu lub aktywnego okresu próbnego. Bezpłatny trial przysługuje
        jednorazowo na zespół.
      </p>

      <h2>6. Zasady korzystania</h2>
      <p>Użytkownik zobowiązuje się do:</p>
      <ul>
        <li>Korzystania z Serwisu zgodnie z prawem i niniejszym Regulaminem</li>
        <li>Niepodejmowania prób nieautoryzowanego dostępu do danych innych Użytkowników</li>
        <li>Niestosowania automatycznych narzędzi do masowego pobierania danych (scraping)</li>
        <li>Nierozpowszechniania treści niezgodnych z prawem</li>
        <li>Niezakłócania działania infrastruktury Serwisu</li>
      </ul>
      <p>Administrator zespołu jest odpowiedzialny za:</p>
      <ul>
        <li>Poprawność danych wprowadzanych do systemu</li>
        <li>Przestrzeganie przepisów prawa pracy przy planowaniu grafiku</li>
        <li>Poinformowanie pracowników o korzystaniu z Serwisu i przetwarzaniu ich danych</li>
      </ul>

      <h2>7. Dostępność i jakość usługi</h2>
      <p>
        Operator dołoży starań, aby Serwis był dostępny nieprzerwanie, jednak nie gwarantuje
        dostępności na poziomie 100%. Planowane przerwy serwisowe będą, w miarę możliwości,
        ogłaszane z wyprzedzeniem.
      </p>
      <p>
        Operator zastrzega sobie prawo do zmiany, ograniczenia lub zakończenia wybranych funkcji
        Serwisu z powiadomieniem z co najmniej 14-dniowym wyprzedzeniem.
      </p>

      <h2>8. Odpowiedzialność</h2>
      <p>
        Serwis udostępniany jest w stanie „takim, jakim jest" (as is). Operator nie gwarantuje
        braku błędów ani nieprzerwanego działania.
      </p>
      <p>Operator nie ponosi odpowiedzialności za:</p>
      <ul>
        <li>Skutki błędnego planowania grafiku przez Użytkownika</li>
        <li>Przerwy wynikające z awarii dostawców zewnętrznych (Stripe, Google, Vercel, Railway, Neon)</li>
        <li>Utratę danych spowodowaną działaniami Użytkownika</li>
        <li>Szkody pośrednie, utracone korzyści ani straty wynikające z niemożności korzystania z Serwisu</li>
      </ul>
      <p>
        Odpowiedzialność Operatora jest ograniczona do kwoty opłat uiszczonych przez Użytkownika
        w ciągu ostatnich 12 miesięcy.
      </p>

      <h2>9. Własność intelektualna</h2>
      <p>
        Wszelkie prawa do Serwisu (kod, design, marka Staffer, logo) należą do Operatora i są
        chronione przepisami o własności intelektualnej. Użytkownik nie nabywa żadnych praw do
        kodu, designu ani marki Serwisu.
      </p>
      <p>
        Dane wprowadzone przez Użytkownika pozostają jego własnością. Użytkownik udziela Operatorowi
        niewyłącznej licencji na przetwarzanie tych danych wyłącznie w celu świadczenia usługi.
      </p>

      <h2>10. Usunięcie konta i danych</h2>
      <p>
        Użytkownik może w dowolnym momencie zażądać usunięcia konta, kontaktując się pod adresem:{" "}
        <a href="mailto:biuro@staffer.pl">biuro@staffer.pl</a>.
      </p>
      <p>
        Administrator zespołu może usunąć zespół — powoduje to trwałe usunięcie wszystkich danych
        zespołu (grafiki, zmiany, dostępność, ogłoszenia).
      </p>
      <p>
        Po usunięciu konta dane osobowe są usuwane w ciągu 30 dni, z wyjątkiem danych wymaganych
        przepisami podatkowymi i księgowymi (do 5 lat).
      </p>

      <h2>11. Zmiany Regulaminu</h2>
      <p>
        Operator zastrzega sobie prawo do zmiany Regulaminu. O istotnych zmianach Użytkownik zostanie
        powiadomiony z co najmniej <strong>14-dniowym wyprzedzeniem</strong> za pośrednictwem aplikacji
        lub e-maila. Dalsze korzystanie z Serwisu po wejściu w życie zmian oznacza ich akceptację.
      </p>

      <h2>12. Postanowienia końcowe</h2>
      <p>
        Regulamin podlega prawu polskiemu. Spory będą rozstrzygane przez sąd właściwy miejscowo
        dla Operatora.
      </p>
      <p>
        Jeżeli Użytkownik jest konsumentem, przysługują mu wszystkie prawa przewidziane dla konsumentów
        na mocy prawa polskiego i unijnego, niezależnie od postanowień niniejszego Regulaminu.
      </p>
      <p>
        W sprawach nieuregulowanych niniejszym Regulaminem zastosowanie mają przepisy Kodeksu cywilnego
        oraz ustawy o świadczeniu usług drogą elektroniczną.
      </p>
      <p>
        Kontakt: <a href="mailto:biuro@staffer.pl">biuro@staffer.pl</a>
      </p>
    </LegalLayout>
  );
}
