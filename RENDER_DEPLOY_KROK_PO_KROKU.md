# 🚀 Render.com Deploy - Krok po Kroku

## Problem
Błąd: `Cannot find module '/opt/render/project/src/backend/dist/main'`

**Przyczyna:** Render uruchamia komendy z roota repo, ale backend jest w podfolderze `backend/`. NestJS kompiluje do `dist/src/main.js`, nie `dist/main.js`.

---

## KROK 1: Konfiguracja Render Dashboard - Backend

### 1.1. Root Directory
Render Dashboard → Twój Backend Service → Settings → **Root Directory:**
```
backend
```

### 1.2. Build Command
Render Dashboard → Settings → **Build Command:**
```bash
npm install && npx prisma generate && npm run build
```

### 1.3. Start Command
Render Dashboard → Settings → **Start Command:**
```bash
node dist/src/main
```
*(NestJS kompiluje do `dist/src/main.js`, nie `dist/main.js`)*

---

## KROK 2: Baza Danych PostgreSQL

### 2.1. Utwórz PostgreSQL Database w Render
1. Render Dashboard → **New +** → **PostgreSQL**
2. Nazwa: `shift-schedule-db` (lub dowolna)
3. Plan: **Free** (lub wyższy)
4. Region: wybierz najbliższy
5. Kliknij **Create Database**

### 2.2. Skopiuj Connection String
1. Po utworzeniu → **PostgreSQL** → Twój database
2. W sekcji **Connections** znajdź **Internal Database URL**
3. Skopiuj cały URL (zaczyna się od `postgresql://...`)

**Przykład:**
```
postgresql://user:password@dpg-xxxxx-a.oregon-postgres.render.com/dbname
```

---

## KROK 3: Zmienne Środowiskowe w Render

Render Dashboard → Twój Backend Service → **Environment**

### 3.1. Wymagane zmienne:

#### `DATABASE_URL`
- **Key:** `DATABASE_URL`
- **Value:** Wklej URL z Kroku 2.2
- **Sync:** ❌ (nie synchronizuj)

#### `JWT_SECRET`
- **Key:** `JWT_SECRET`
- **Value:** Wygeneruj losowy string (np. `openssl rand -base64 32`)
- **Sync:** ❌

#### `NEXTAUTH_SECRET`
- **Key:** `NEXTAUTH_SECRET`
- **Value:** Może być taki sam jak `JWT_SECRET`
- **Sync:** ❌

### 3.2. Opcjonalne (dla email weryfikacji):

#### `SMTP_HOST`
- **Key:** `SMTP_HOST`
- **Value:** `smtp.gmail.com` (dla Gmail)
- **Sync:** ❌

#### `SMTP_PORT`
- **Key:** `SMTP_PORT`
- **Value:** `587`
- **Sync:** ❌

#### `SMTP_USER`
- **Key:** `SMTP_USER`
- **Value:** Twój email Gmail
- **Sync:** ❌

#### `SMTP_PASS`
- **Key:** `SMTP_PASS`
- **Value:** Hasło aplikacji Gmail (nie zwykłe hasło!)
- **Sync:** ❌

#### `SMTP_FROM`
- **Key:** `SMTP_FROM`
- **Value:** `Shift Marketplace <twoj-email@gmail.com>`
- **Sync:** ❌

#### `FRONTEND_URL`
- **Key:** `FRONTEND_URL`
- **Value:** URL do frontendu (np. `https://twoja-app.vercel.app`)
- **Sync:** ❌

---

## KROK 4: Uruchomienie Migracji Prisma

### 4.1. Przez Render Shell (NAJŁATWIEJSZE)

1. Render Dashboard → Twój Backend Service → **Shell**
2. Wykonaj:
   ```bash
   npx prisma migrate deploy
   ```

### 4.2. Lokalnie (z produkcją)

1. Skopiuj `DATABASE_URL` z Render
2. Lokalnie:
   ```bash
   cd backend
   DATABASE_URL="<wklej-url-z-render>" npx prisma migrate deploy
   ```

---

## KROK 5: Sprawdzenie

### 5.1. Sprawdź logi w Render
Render Dashboard → Twój Backend Service → **Logs**

Powinno pokazać:
```
Application is running on: http://localhost:3001
```

### 5.2. Sprawdź czy migracje działają
W Shell:
```bash
npx prisma migrate status
```

Powinno pokazać wszystkie migracje jako "Applied".

### 5.3. Test endpointu
Otwórz w przeglądarce:
```
https://shiftscheduleapp.onrender.com/
```

Powinno zwrócić odpowiedź (np. "Hello World" z AppController).

---

## KROK 6: Frontend (Vercel) - Zmienne Środowiskowe

### 6.1. Vercel Dashboard → Twój Projekt → Settings → Environment Variables

#### `NEXT_PUBLIC_API_URL`
- **Key:** `NEXT_PUBLIC_API_URL`
- **Value:** `https://shiftscheduleapp.onrender.com`
- **Environments:** Production, Preview, Development

#### `GOOGLE_CLIENT_ID`
- **Key:** `GOOGLE_CLIENT_ID`
- **Value:** Twój Google OAuth Client ID
- **Environments:** Production, Preview, Development

#### `GOOGLE_CLIENT_SECRET`
- **Key:** `GOOGLE_CLIENT_SECRET`
- **Value:** Twój Google OAuth Client Secret
- **Environments:** Production, Preview, Development

#### `NEXTAUTH_SECRET`
- **Key:** `NEXTAUTH_SECRET`
- **Value:** Ten sam co w backendzie (JWT_SECRET)
- **Environments:** Production, Preview, Development

#### `NEXTAUTH_URL`
- **Key:** `NEXTAUTH_URL`
- **Value:** URL do frontendu (np. `https://twoja-app.vercel.app`)
- **Environments:** Production, Preview, Development

---

## Troubleshooting

### Problem: "Cannot find module dist/main"
**Rozwiązanie:** Zmień Start Command na `node dist/src/main`

### Problem: "The column User.password does not exist"
**Rozwiązanie:** Uruchom `npx prisma migrate deploy` w Shell

### Problem: "Connection refused" do bazy danych
**Rozwiązanie:** 
- Sprawdź czy `DATABASE_URL` jest poprawny
- Upewnij się że używasz **Internal Database URL** (nie External)

### Problem: Build się nie wykonuje
**Rozwiązanie:**
- Sprawdź Root Directory: `backend`
- Sprawdź Build Command: `npm install && npx prisma generate && npm run build`

---

## Podsumowanie - Checklist

- [ ] Root Directory ustawione na `backend`
- [ ] Build Command: `npm install && npx prisma generate && npm run build`
- [ ] Start Command: `node dist/src/main`
- [ ] PostgreSQL Database utworzony
- [ ] `DATABASE_URL` ustawiony w Environment Variables
- [ ] `JWT_SECRET` ustawiony
- [ ] `NEXTAUTH_SECRET` ustawiony
- [ ] Migracje uruchomione (`npx prisma migrate deploy`)
- [ ] Backend działa (sprawdź logi)
- [ ] Frontend ma ustawione zmienne środowiskowe w Vercel

