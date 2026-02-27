# Audyt bezpieczeństwa 2.6.1 — Autentykacja

**Data:** 2025-02-27  
**Zakres:** JWT, NextAuth — walidacja tokenów, konfiguracja sesji, ciasteczka.

## Checklista (OWASP ASVS)

| Wymaganie | Status | Szczegóły |
|-----------|--------|-----------|
| JWT: wykluczenie algorytmu "none" | ✅ | `algorithms: ['HS256']` w JwtStrategy (passport-jwt) |
| JWT: walidacja exp/iat | ✅ | `ignoreExpiration: false` — jsonwebtoken waliduje exp |
| JWT: jawne algorytmy przy podpisie | ✅ | `algorithm: 'HS256'` w JwtModule, AuthService, token route |
| NextAuth: secret w env | ✅ | `secret: process.env.NEXTAUTH_SECRET` + walidacja w produkcji |
| NextAuth: SameSite cookies | ✅ | `sameSite: 'lax'` (kompatybilne z OAuth redirect) |
| NextAuth: Secure flag | ✅ | `secure: process.env.NODE_ENV === 'production'` |
| NextAuth: HttpOnly | ✅ | `httpOnly: true` (domyślne, potwierdzone w konfiguracji) |

## Wprowadzone zmiany

### Backend (NestJS)

1. **jwt.strategy.ts**  
   - `algorithms: ['HS256']` — jawny zestaw dozwolonych algorytmów, odrzucenie `none` i innych słabych.

2. **auth.module.ts**  
   - `algorithm: 'HS256'` w `signOptions` JwtModule.

### Frontend (Next.js)

1. **api/auth/token/route.ts**  
   - `algorithm: 'HS256'` przy `jwt.sign()` (jsonwebtoken).

2. **api/auth/[...nextauth]/route.ts**  
   - Konfiguracja ciasteczek: `httpOnly`, `sameSite: 'lax'`, `secure` w produkcji.  
   - Walidacja: w produkcji wymagany jest `NEXTAUTH_SECRET` (wczesne wykrycie braku konfiguracji).

## Uwagi

| Element | Status | Uwagi |
|---------|--------|-------|
| **issuer / audience** | Opcjonalne | Nie wdrożone. W razie potrzeby można dodać w JWT dla wielosystemowych integracji. |
| **jsonwebtoken** | OK | Wersja 9.x nie wspiera domyślnie algorytmu "none". |
| **syncUser (public)** | Do rozważenia | Endpoint nadal publiczny. Możliwość ograniczenia wywołań w ramach audytu autoryzacji. |

## Podsumowanie

- Konfiguracja JWT i NextAuth zgodna z wymogami audytu.
- Algorytm `none` wyłączony, używany wyłącznie HS256.
- Ciasteczka sesji zabezpieczone (HttpOnly, SameSite, Secure w produkcji).
