# Polityka Cookies — Staffer.pl

**Ostatnia aktualizacja: 18 marca 2026**

## 1. Czym są pliki cookies

Pliki cookies (ciasteczka) to małe pliki tekstowe zapisywane na urządzeniu użytkownika przez przeglądarkę internetową podczas korzystania ze strony. Służą do prawidłowego działania serwisu oraz zapamiętywania sesji użytkownika.

## 2. Jakie cookies używamy

Staffer.pl używa wyłącznie **cookies niezbędnych** do działania aplikacji. Nie stosujemy żadnych cookies analitycznych, reklamowych ani śledzących.

### Cookies niezbędne (wymagane do działania)

| Nazwa | Dostawca | Cel | Typ | Wygasanie |
|-------|----------|-----|-----|-----------|
| `next-auth.session-token` | Staffer.pl | Utrzymanie sesji zalogowanego użytkownika | HttpOnly, Secure, SameSite=Lax | Sesja przeglądarki |
| `next-auth.csrf-token` | Staffer.pl | Ochrona przed atakami CSRF | HttpOnly | Sesja przeglądarki |
| `next-auth.callback-url` | Staffer.pl | Przekierowanie po zalogowaniu | HttpOnly | Sesja przeglądarki |
| `cookie-consent` | Staffer.pl | Zapamiętanie zgody na cookies (localStorage) | localStorage | 1 rok |

### Cookies zewnętrzne (tylko podczas korzystania z tych usług)

| Dostawca | Kiedy | Cel | Polityka dostawcy |
|----------|-------|-----|-------------------|
| **Stripe Inc.** | Tylko podczas procesu płatności | Bezpieczna realizacja transakcji | [stripe.com/privacy](https://stripe.com/privacy) |
| **Google LLC** | Tylko przy logowaniu przez Google OAuth | Uwierzytelnianie | [policies.google.com](https://policies.google.com/privacy) |

## 3. Czego NIE używamy

Staffer.pl **nie używa**:
- Cookies analitycznych (Google Analytics, Hotjar, Mixpanel itp.)
- Cookies reklamowych / remarketingowych
- Cookies śledzących (tracking pixels, fingerprinting)
- Cookies profilujących stron trzecich
- Żadnych mechanizmów śledzenia zachowań użytkowników między sesjami

## 4. Podstawa prawna

Cookies niezbędne stosowane są na podstawie:
- Art. 6 ust. 1 lit. b RODO — wykonanie umowy (świadczenie usługi wymaga utrzymania sesji)
- Art. 6 ust. 1 lit. f RODO — uzasadniony interes (bezpieczeństwo, CSRF)
- Art. 173 ust. 3 pkt 1 Prawa telekomunikacyjnego — wyłączenie obowiązku uzyskania zgody dla cookies niezbędnych

Ze względu na brak cookies analitycznych i marketingowych, nie jest wymagana odrębna zgoda użytkownika na cookies — wystarczy akceptacja Regulaminu przy rejestracji.

## 5. Zarządzanie cookies

Użytkownik może zarządzać plikami cookies w ustawieniach przeglądarki:

- **Chrome:** Ustawienia → Prywatność i bezpieczeństwo → Pliki cookie i inne dane witryn
- **Firefox:** Ustawienia → Prywatność i bezpieczeństwo → Ciasteczka i dane witryn
- **Safari:** Preferencje → Prywatność → Zarządzaj danymi witryn
- **Edge:** Ustawienia → Prywatność, wyszukiwanie i usługi → Pliki cookie

> **Uwaga:** Wyłączenie cookies niezbędnych (`next-auth.*`) uniemożliwia zalogowanie się do Serwisu.

## 6. localStorage

Poza plikami cookies, Serwis używa `localStorage` przeglądarki wyłącznie do:
- Zapamiętania faktu zaakceptowania niniejszej informacji o cookies (`cookie-consent`)

Dane localStorage nie są przesyłane na serwer i są dostępne tylko w Twojej przeglądarce.

## 7. Zmiany polityki cookies

Polityka cookies może być aktualizowana. Data ostatniej zmiany widnieje na górze dokumentu. O istotnych zmianach poinformujemy w aplikacji.

## 8. Kontakt

Pytania dotyczące cookies: **biuro@staffer.pl**
