# Migracja na docelową domenę staffer.pl

Przewodnik konfiguracji domeny wykupionej w Seohost z hostingiem na Vercel.

---

## Co będziesz konfigurować

| Domena | Treść | Cel |
|--------|-------|-----|
| **staffer.pl** | Landing, blog, cennik | Strona marketingowa |
| **www.staffer.pl** | Przekierowanie → staffer.pl | Dobra praktyka SEO |
| **app.staffer.pl** | Aplikacja (dashboard) | Produkt |

---

## KROK 1: Projekt na Vercel

1. Zaloguj się na [vercel.com](https://vercel.com) i otwórz swój projekt (frontend).
2. **Settings** → **Domains** (w menu po lewej).
3. Jeśli projekt nie jest jeszcze wdrożony – najpierw zdeployuj (połącz repo GitHub i wykonaj deploy).

---

## KROK 2: Dodanie domen w Vercel

1. Na stronie **Domains** kliknij **Add Domain**.
2. Wpisz `staffer.pl` i potwierdź.
3. Vercel może zaproponować dodanie `www.staffer.pl` – zatwierdź.
4. Kliknij ponownie **Add Domain** i dodaj `app.staffer.pl`.

Na liście domen pojawią się 3 wpisy, wszystkie w statusie „Invalid Configuration” (to normalne przed konfiguracją DNS).

---

## KROK 3: Wybór metody DNS

Masz dwie ścieżki:

### Opcja A: Nameservery Vercel (zalecana)

- Jedna zmiana u rejestratora
- DNS zarządzany w Vercel
- Automatyczne certyfikaty SSL
- Wildcard dla subdomen

### Opcja B: Rekordy DNS u Seohost

- DNS zostaje w Seohost
- Trzeba ręcznie dodać rekordy A i CNAME

---

## KROK 4A: Nameservery Vercel (zalecane)

### 4A.1. Wildcard w Vercel (opcjonalnie, dla app.staffer.pl)

1. W **Domains** dodaj domenę `*.staffer.pl` (jeśli chcesz obsługiwać dowolne subdomeny).
2. Dla `app.staffer.pl` zwykle wystarczy dodać subdomenę ręcznie.

### 4A.2. Nameservery w panelu Vercel

1. W Vercel dla domeny `staffer.pl` wybierz metodę **Nameservers**.
2. Skopiuj adresy:
   ```
   ns1.vercel-dns.com
   ns2.vercel-dns.com
   ```

### 4A.3. Delegacja domeny w Seohost

1. Zaloguj się do [panelu klienta Seohost](https://seohost.pl).
2. **Domeny** → **Domeny**.
3. Wybierz domenę **staffer.pl**.
4. **Ustawienia DNS** → **Delegacja na serwery DNS**.
5. Wpisz:
   - Serwer 1: `ns1.vercel-dns.com`
   - Serwer 2: `ns2.vercel-dns.com`
6. Zapisz zmiany.

### 4A.4. Po delegacji

- Vercel sam utworzy potrzebne rekordy (A, CNAME).
- SSL jest wydawany automatycznie.
- Propagacja DNS zwykle trwa **15 minut – 24 godziny**.

---

## KROK 4B: Rekordy DNS w Seohost (aktualne wartości z Vercel)

Jeśli zarządzasz strefą DNS w Seohost (edytor strefy DNS), wprowadź poniższe zmiany.
Użyj **dokładnych wartości** wyświetlanych w Vercel dla Twojego projektu (mogą się różnić).

**Ważne — rekordy NS dla Vercel:**  
Jeśli masz w strefie rekordy `staffer.pl. NS ns1.vercel-dns.com` i `ns2.vercel-dns.com` — **usuń je**.
Przy tych rekordach cała strefa byłaby delegowana do Vercel i poczta (@staffer.pl) przestałaby działać.
Zostaw nameservery Seohost i zmień tylko rekordy A oraz CNAME jak poniżej.

### 1. staffer.pl (apex) — rekord A

| Obecny (błędny) | Poprawny |
|-----------------|----------|
| staffer.pl. **A** 185.200.44.2 | staffer.pl. **A** **216.198.79.1** |

**Akcja:** Edytuj rekord A dla `@` / `staffer.pl` i ustaw IP na **216.198.79.1**.

### 2. www.staffer.pl — rekord CNAME

| Obecny (błędny) | Poprawny |
|-----------------|----------|
| www **A** 185.200.44.2 | www **CNAME** **d489f61d9cc222b3.vercel-dns-017.com.** |

**Akcja:**
- Usuń rekord **A** dla `www` (185.200.44.2).
- Dodaj rekord **CNAME**:
  - Nazwa: `www`
  - Wartość: `d489f61d9cc222b3.vercel-dns-017.com.` (z kropką na końcu, jeśli wymaga panel)

### 3. app.staffer.pl — subdomena aplikacji

Najpierw dodaj domenę **app.staffer.pl** w Vercel (Domains → Add Domain).
Vercel pokaże wymagany rekord CNAME (np. `xxx.vercel-dns-xxx.com`).

**Akcja:** Dodaj rekord **CNAME**:
- Nazwa: `app`
- Wartość: (skopiuj z Vercel – np. `d489f61d9cc222b3.vercel-dns-017.com` lub inny dla subdomeny)

### 4. Rekordy poczty — zostaw bez zmian

Nie zmieniaj rekordów: MX, TXT (SPF, DKIM, DMARC), SRV, ftp, mail, pop, smtp — dotyczą poczty i innych usług.

---

## KROK 5: Weryfikacja w Vercel

1. Wróć do **Settings** → **Domains**.
2. Odczekaj kilka minut i odśwież stronę.
3. Status powinien zmienić się na **Valid Configuration**.
4. SSL (np. Let’s Encrypt) jest konfigurowany automatycznie.

Jeśli status pozostaje „Invalid”:
- Sprawdź poprawność nameserverów lub rekordów DNS.
- Użyj [whatsmydns.net](https://www.whatsmydns.net) – sprawdź, czy rekordy się propagują.

---

## KROK 6: Zmienne środowiskowe w Vercel

1. **Settings** → **Environment Variables**.
2. Dodaj (dla Production i Preview, jeśli chcesz):

| Nazwa | Wartość |
|-------|---------|
| `NEXT_PUBLIC_SITE_URL` | `https://staffer.pl` |
| `NEXT_PUBLIC_APP_URL` | `https://app.staffer.pl` |

3. Zapisz i wykonaj **Redeploy** projektu, aby zmienne się wczytały.

---

## KROK 7: Przekierowanie starej domeny (np. vercel.app)

1. W **Domains** kliknij trzy kropki przy domenie `*.vercel.app`.
2. Włącz **Redirect to** i ustaw `https://staffer.pl` (opcjonalnie).

Dzięki temu stare linki przekierują na docelową domenę.

---

## KROK 8: Test działania

- [ ] `https://staffer.pl` – landing page  
- [ ] `https://www.staffer.pl` – przekierowanie na staffer.pl  
- [ ] `https://app.staffer.pl` – logowanie / dashboard  
- [ ] `https://staffer.pl/cennik` – cennik  
- [ ] `https://staffer.pl/blog` – blog  

---

## Typowe problemy

### „Domain not found” / „Invalid Configuration”

- Poczekaj na propagację DNS (nawet do 24–48 h).
- Sprawdź, czy nameservery lub rekordy są poprawne.
- Zweryfikuj DNS: [whatsmydns.net](https://www.whatsmydns.net).

### SSL nie działa

- Vercel zwykle automatycznie wydaje certyfikat.
- Odczekaj kilka minut i odśwież stronę.
- Upewnij się, że domena w Vercel ma status **Valid**.

### app.staffer.pl nie działa

- Sprawdź, czy subdomena `app.staffer.pl` jest dodana w Vercel.
- Sprawdź middleware – `APP_HOST` powinien być ustawiony na `app.staffer.pl`.

### Poczta e‑mail (jeśli używasz @staffer.pl)

- Przy nameserverach Vercel musisz dodać rekordy MX w panelu Vercel.
- W Vercel: **Domains** → wybierz domenę → **DNS Records** → dodaj rekordy MX według instrukcji dostawcy poczty.

---

## Checklist przed migracją

- [ ] Projekt jest zdeployowany na Vercel
- [ ] Domena staffer.pl dodana w Vercel
- [ ] Domena www.staffer.pl dodana w Vercel
- [ ] Domena app.staffer.pl dodana w Vercel
- [ ] Nameservery zmienione w Seohost LUB rekordy DNS dodane ręcznie
- [ ] `NEXT_PUBLIC_SITE_URL` i `NEXT_PUBLIC_APP_URL` ustawione
- [ ] Redeploy projektu po zmianie zmiennych
- [ ] Sprawdzone działanie wszystkich trzech domen
