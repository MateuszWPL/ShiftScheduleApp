# Konfiguracja domen — staffer.pl, www.staffer.pl, app.staffer.pl

Checklist wymagany do działania logowania Google OAuth i całej aplikacji.

---

## 1. Google Cloud Console (najczęstsza przyczyna błędów OAuth)

Wejdź do [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials → wybierz swój OAuth 2.0 Client ID.

### Authorized JavaScript origins
Dodaj **dokładnie** te adresy (bez końcowego slasha):
```
https://app.staffer.pl
https://staffer.pl
https://www.staffer.pl
```

### Authorized redirect URIs
Dodaj **dokładnie** te adresy:
```
https://app.staffer.pl/api/auth/callback/google
https://staffer.pl/api/auth/callback/google
https://www.staffer.pl/api/auth/callback/google
```

**Ważne:** 
- Bez `www` przed `app` (app.staffer.pl, nie www.app.staffer.pl)
- Bez końcowego slasha
- Protokół `https://`
- Ścieżka musi być **dokładnie** `/api/auth/callback/google`

---

## 2. Vercel (frontend) — zmienne środowiskowe

W projekcie Vercel → Settings → Environment Variables ustaw:

| Zmienna | Wartość | Krytyczne? |
|---------|---------|------------|
| `NEXTAUTH_URL` | `https://app.staffer.pl` | **TAK** — bez tego Google OAuth nie zadziała |
| `NEXTAUTH_SECRET` | (silny losowy string) | **TAK** |
| `GOOGLE_CLIENT_ID` | (z Google Console) | **TAK** |
| `GOOGLE_CLIENT_SECRET` | (z Google Console) | **TAK** |
| `NEXT_PUBLIC_API_URL` | URL backendu, np. `https://xxx.onrender.com` | **TAK** |
| `NEXT_PUBLIC_SITE_URL` | `https://staffer.pl` | opcjonalne (metadata) |

**Po zmianie zmiennych:** zrób redeploy (Deployments → ⋮ przy ostatnim deployu → Redeploy).

---

## 3. Render (backend) — zmienne środowiskowe

W projekcie Render → Environment ustaw:

| Zmienna | Wartość |
|---------|---------|
| `FRONTEND_URL` | `https://app.staffer.pl,https://staffer.pl,https://www.staffer.pl` |

Backend rozdziela wartości przecinkiem i dopuszcza CORS z tych originów. Bez tego requesty z frontendu (np. `/api/auth/token`, `/shifts/users/sync`) zostaną zablokowane.

---

## 4. Baza danych (Neon)

**Nic nie trzeba zmieniać.** Domeny nie są zapisywane w bazie; użytkownicy są identyfikowani przez email.

---

## 5. Sprawdzenie przepływu

1. **Skąd użytkownik loguje się?**  
   Z `app.staffer.pl` (stąd middleware przekierowuje `/app` z staffer.pl/www).

2. **Callback OAuth**  
   NextAuth ustawia `redirect_uri` na `NEXTAUTH_URL + /api/auth/callback/google`, czyli `https://app.staffer.pl/api/auth/callback/google`.

3. **Middleware**  
   Nie obsługuje `/api/auth/*`, więc callback trafia do NextAuth bez zmian.

---

## 6. Typowe błędy

| Problem | Rozwiązanie |
|---------|-------------|
| `redirect_uri_mismatch` | Sprawdź Google Console — redirect URI musi być identyczny |
| `Access blocked: This app's request is invalid` | Dodaj wszystkie 3 domeny do Authorized JavaScript origins |
| CORS / blocked request | Ustaw `FRONTEND_URL` na Renderze z wszystkimi domenami |
| Cookie nie zapisuje się | Upewnij się, że logujesz się z `https://app.staffer.pl` (nie staffer.pl) |
| Błąd po zalogowaniu | Sprawdź `NEXTAUTH_URL` i redeploy na Vercelu |

---

## 7. Test po konfiguracji

1. Otwórz **https://app.staffer.pl** (bezpośrednio).
2. Kliknij „Zaloguj się przez Google”.
3. Zaloguj się przez Google.
4. Powinieneś wylądować na pulpicie aplikacji.

Jeśli pojawi się błąd, w Google OAuth sprawdź dokładny `redirect_uri` w komunikacie — ta sama wartość musi być w Authorized redirect URIs.
