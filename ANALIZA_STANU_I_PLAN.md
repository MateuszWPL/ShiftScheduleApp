# 📊 Analiza Stanu Aplikacji vs. Wymagania

## ✅ CO JUŻ MAMY (Gotowe)

### 1. **Autentykacja & Bezpieczeństwo**
- ✅ Google OAuth (NextAuth.js)
- ✅ JWT authentication (NestJS Passport)
- ✅ Secure endpoints (wszystkie wymagają JWT)
- ✅ DTO validation (class-validator)

### 2. **Model Danych**
- ✅ `MembershipStatus` enum (PENDING, ACTIVE, REJECTED, LEFT)
- ✅ `TeamMembership` model z:
  - `requestedAt` ✅
  - `approvedAt` ✅
  - `approvedBy` ✅
- ✅ Role enum (OWNER, MANAGER, EMPLOYEE)

### 3. **Approval Queue**
- ✅ `GET /shifts/teams/pending` - lista oczekujących
- ✅ `POST /shifts/teams/pending/:id/approve` - akceptacja
- ✅ `POST /shifts/teams/pending/:id/reject` - odrzucenie
- ✅ `GET /shifts/teams/my-membership` - status użytkownika

### 4. **Flow Dołączania**
- ✅ `POST /shifts/teams/join` - tworzy PENDING
- ✅ `PendingView` - ekran oczekiwania
- ✅ Automatyczne przekierowanie po dołączeniu

### 5. **Zaproszenia**
- ✅ Kod zespołu (12 znaków, nanoid)
- ✅ Generowanie przy tworzeniu teamu

---

## ❌ CZEGO BRAKUJE (Do Implementacji)

### 1. **Email + Hasło Authentication** 🔴 PRIORYTET 1
**Status:** Brak implementacji
- ❌ Brak pola `password` w User model
- ❌ Brak hashowania (bcrypt)
- ❌ Brak endpointów rejestracji/logowania email+hasło
- ❌ Brak Credentials Provider w NextAuth

**Wymagane zmiany:**
- Backend: `POST /auth/register`, `POST /auth/login`
- Frontend: Formularz rejestracji/logowania
- NextAuth: Credentials Provider

### 2. **Weryfikacja Emaila** 🔴 PRIORYTET 2
**Status:** Brak implementacji
- ❌ Brak pola `emailVerified` w User
- ❌ Brak `emailVerificationToken`
- ❌ Brak endpointu weryfikacji
- ❌ Brak wysyłania emaili

**Wymagane zmiany:**
- Backend: `POST /auth/verify-email`, `POST /auth/resend-verification`
- Frontend: Ekran weryfikacji, blokada przed weryfikacją
- Email service (nodemailer lub SendGrid)

### 3. **Kolory Brandowe** 🟡 PRIORYTET 3
**Status:** Nie zastosowane
- Orange: `#FF8400`
- Vista Bleu: `#8FACDB`
- Amande: `#F9DFC6`
- Blue oxxfrod: `#DB0829`

**Wymagane zmiany:**
- Tailwind config: dodać custom colors
- Zastosować w UI (przyciski, akcenty, statusy)

### 4. **Linki Zaproszeniowe** 🟡 PRIORYTET 4
**Status:** Tylko kod, brak linków
- ❌ Brak generowania linków
- ❌ Brak endpointu do obsługi linków

**Wymagane zmiany:**
- Backend: `GET /teams/invite/:code` (redirect)
- Frontend: Auto-join przez link

### 5. **MFA/2FA** 🟢 OPCJONALNE
**Status:** Nie wymagane na razie
- Można dodać później

---

## 🎯 PLAN DZIAŁANIA (Priorytety)

### **ETAP 1: Email + Hasło Authentication** (Najważniejsze)
**Czas:** ~2-3h

1. **Backend:**
   - Dodać `password` (hashed) i `emailVerified` do User model
   - Migracja Prisma
   - `POST /auth/register` - rejestracja z hashowaniem
   - `POST /auth/login` - logowanie z weryfikacją hasła
   - DTOs: `RegisterDto`, `LoginDto`

2. **Frontend:**
   - Dodać Credentials Provider do NextAuth
   - Stworzyć formularz rejestracji (`RegisterForm.tsx`)
   - Stworzyć formularz logowania (`LoginForm.tsx`)
   - Zaktualizować stronę logowania (wybór: Google vs Email+Hasło)

### **ETAP 2: Weryfikacja Emaila** (Wymagane dla Email+Hasło)
**Czas:** ~2-3h

1. **Backend:**
   - Dodać `emailVerificationToken` i `emailVerified` do User
   - Migracja Prisma
   - Email service (nodemailer)
   - `POST /auth/verify-email/:token`
   - `POST /auth/resend-verification`
   - Middleware: blokada dla niezweryfikowanych (przy join/create team)

2. **Frontend:**
   - Ekran weryfikacji (`VerifyEmailView.tsx`)
   - Blokada dostępu przed weryfikacją
   - Resend verification button

### **ETAP 3: Kolory Brandowe** (Szybkie, estetyczne)
**Czas:** ~30min

1. **Frontend:**
   - Zaktualizować `tailwind.config.ts`
   - Zastosować kolory w komponentach (przyciski, statusy, akcenty)

### **ETAP 4: Linki Zaproszeniowe** (Rozszerzenie)
**Czas:** ~1h

1. **Backend:**
   - `GET /teams/invite/:code` - endpoint redirect
   - Zwraca JSON z danymi teamu (dla frontend)

2. **Frontend:**
   - Strona `/invite/:code` - auto-join
   - Generowanie linków w UI managera

---

## 📋 SZCZEGÓŁOWY CHECKLIST

### Email + Hasło Auth
- [ ] Backend: Dodać `password` (String, nullable) do User
- [ ] Backend: Dodać `emailVerified` (Boolean, default false) do User
- [ ] Backend: Migracja Prisma
- [ ] Backend: Zainstalować `bcrypt` i `@types/bcrypt`
- [ ] Backend: `POST /auth/register` endpoint
- [ ] Backend: `POST /auth/login` endpoint
- [ ] Backend: DTOs z walidacją
- [ ] Frontend: Credentials Provider w NextAuth
- [ ] Frontend: RegisterForm component
- [ ] Frontend: LoginForm component
- [ ] Frontend: Update login page (wybór metody)

### Weryfikacja Emaila
- [ ] Backend: Dodać `emailVerificationToken` (String, nullable) do User
- [ ] Backend: Migracja Prisma
- [ ] Backend: Zainstalować `nodemailer` lub SendGrid
- [ ] Backend: Email service
- [ ] Backend: `POST /auth/verify-email/:token`
- [ ] Backend: `POST /auth/resend-verification`
- [ ] Backend: Middleware - blokada dla niezweryfikowanych
- [ ] Frontend: VerifyEmailView component
- [ ] Frontend: Resend verification button

### Kolory Brandowe
- [ ] Frontend: tailwind.config.ts - dodać custom colors
- [ ] Frontend: Zastosować w przyciskach
- [ ] Frontend: Zastosować w statusach
- [ ] Frontend: Zastosować w akcentach

### Linki Zaproszeniowe
- [ ] Backend: `GET /teams/invite/:code` endpoint
- [ ] Frontend: `/invite/:code` page
- [ ] Frontend: Auto-join przez link
- [ ] Frontend: Generowanie linków w UI

---

## 🚀 CO MOŻEMY ZROBIĆ TERAZ?

**Rekomendacja:** Zacząć od **ETAP 1 (Email + Hasło Authentication)**

**Dlaczego:**
1. To fundament - bez tego nie ma pełnej funkcjonalności
2. Weryfikacja emaila (ETAP 2) wymaga tego jako podstawy
3. Pozostałe (kolory, linki) można zrobić równolegle lub później

**Alternatywa:** Jeśli chcesz szybki efekt wizualny, możemy zacząć od **ETAP 3 (Kolory Brandowe)** - to zajmie 30min i od razu poprawi wygląd.

---

## ❓ PYTANIA DO USTALENIA

1. **Email Service:** Nodemailer (SMTP) czy SendGrid/Resend (API)? 
   - Nodemailer: darmowe, wymaga SMTP
   - SendGrid/Resend: płatne, łatwiejsze w użyciu

2. **MFA/2FA:** Kiedy implementować? (Teraz czy później?)

3. **Premium Features:** Kiedy zaczynamy? (Po podstawach auth?)

4. **Kolejność:** Email+Hasło → Weryfikacja → Kolory → Linki? Czy inaczej?

