# Przegląd: bezpieczeństwo i optymalizacja

## Backend

### Autoryzacja i uprawnienia
- **Availability**: cały kontroler za `JwtAuthGuard`; `GET /team` tylko dla OWNER/MANAGER (w serwisie).
- **Shifts**: endpointy za JWT; tworzenie/edycja zmian i przypisań tylko OWNER/MANAGER; claim/release po `assignmentId` z blokadą w transakcji.
- **Users/Team**: edycja pracownika tylko OWNER/MANAGER; członkostwo po `teamId`.

### Walidacja
- **Availability**: min. 4 h na slot, `end > start`, brak nakładania slotów użytkownika, zakres zapytań max 31 dni, max 50 slotów w jednym żądaniu.
- **Shifts**: DTO z `class-validator` (daty, `endTime > startTime`), przypisania w granicach zespołu.

### Skalowalność
- Indeksy w DB: `(userId, startDateTime)` i `(teamId, startDateTime)` dla availability; `(teamId, startTime)` dla shifts.
- Ograniczenie zakresu dat (31 dni) i liczby slotów (50) ogranicza rozmiar odpowiedzi i obciążenie.

### Rate limiting
- Globalny Throttler (np. 100 req/min); endpointy publiczne (auth, sync) z osobnymi limitami gdzie potrzeba.

## Frontend

### Dane wrażliwe
- Token JWT tylko z sesji NextAuth (route `/api/auth/token`); brak tokena w zmiennych `NEXT_PUBLIC_*`.
- W API używany jest wyłącznie `NEXT_PUBLIC_API_URL` (adres backendu).

### UX time pickera (krok F)
- Klik w pasmo dodaje blok; przeciąganie przesuwa; uchwyty lewo/prawo zmieniają długość.
- Po puszczeniu przeciągania nie jest rejestrowany „klik” (brak przypadkowego drugiego bloku).
- Snapping do 15 min; min. długość bloku (4 h dostępność, 1 h zmiana) wymuszona w UI i na backendzie.

## Sugestie na później
- Testy jednostkowe dla `claimAssignment` i tworzenia availability (nakładanie, min. 4 h).
- Opcjonalnie: `PATCH /availability/slots/:id` do zmiany godziny slotu (obecnie tylko create + delete).
- Monitoring błędów (np. Sentry) w produkcji.
