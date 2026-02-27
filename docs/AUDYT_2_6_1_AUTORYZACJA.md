# Audyt bezpieczeństwa 2.6.1 — Autoryzacja (Access Control / IDOR)

**Data:** 2025-02-27  
**Zakres:** Weryfikacja IDOR — czy zalogowany użytkownik może uzyskać dane innego zespołu/pracownika?

## Metodologia

Przejrzano wszystkie endpointy API pod kątem:
- Weryfikacji `teamId` / `membership` przed zwróceniem danych
- Filtrowania zapytań do bazy według zespołu użytkownika
- Braku możliwości wyliczenia (enumeration) danych innych zespołów przez podanie ID

## Wyniki audytu

### Endpointy sprawdzone i poprawne (OK)

| Moduł | Endpoint | Weryfikacja |
|-------|----------|-------------|
| **Shifts** | GET / | membership → teamId |
| **Shifts** | GET /marketplace | membership → teamId |
| **Shifts** | GET /summary | membership → teamId |
| **Shifts** | GET /:id | membership + shift.teamId |
| **Shifts** | POST / | membership, role OWNER/MANAGER |
| **Shifts** | PATCH /:id | membership + shift.teamId |
| **Shifts** | DELETE /:id | membership + shift.teamId |
| **Shifts** | POST /publish | membership + teamId |
| **Shifts** | POST /copy-week/* | requireManager |
| **Shifts** | GET /:id/validate-assignment/:userId | membership + shift.teamId |
| **Shifts** | POST /:id/assignments | membership + shift.teamId |
| **Shifts** | PATCH/DELETE assignments | membership + assignment.shift.teamId |
| **Shifts** | POST assignments/claim | membership + shift.teamId |
| **Shifts** | PATCH assignments/release | assignment.userId === requester (tylko właściciel przypisania) |
| **Shifts** | GET /team/members | membership → teamId |
| **Shifts** | PATCH /teams/members/:targetId | membership + targetMembership.teamId |
| **Availability** | POST / | getMembership → teamId |
| **Availability** | GET /me | getMembership → teamId |
| **Availability** | GET /team | membership + role OWNER/MANAGER |
| **Availability** | DELETE /slots/:slotId | slot.userId === requester |
| **Users** | GET / | user.teamId |
| **Users** | GET /:id | user.teamId === requesterTeamId |
| **Users** | POST shadow-profile | RolesGuard + user.teamId |
| **Announcements** | GET/POST/DELETE/:id/read | membership + announcement.teamId |
| **Notifications** | GET /, unread-count, read | userId + teamId |
| **Notifications** | POST :id/read | notification.userId === requester |
| **Team-settings** | GET/PATCH/* | requireAdmin (membership) |
| **Positions** | GET/POST/PATCH/DELETE | requireManager/requireMember → teamId |
| **Positions** | POST employees/:userId | membership + targetMembership.teamId |

### Luki znalezione i naprawione

#### 1. GET /shifts/users/all — IDOR (KRYTYCZNA)

**Problem:** Zwracał wszystkich użytkowników z bazy bez filtrowania po zespole. Każdy zalogowany użytkownik mógł wyliczyć dane (email, imię, rola) wszystkich użytkowników w systemie.

**Naprawa:** 
- Przekazanie `userId` do serwisu
- Pobranie membership i filtrowanie `where: { teamId: membership.teamId }`
- Zwracanie wyłącznie członków własnego zespołu

#### 2. GET /positions/employees/:userId — IDOR

**Problem:** Brak weryfikacji, czy `targetUserId` należy do zespołu requestera. Można było wyświetlić stanowiska dowolnego użytkownika przez enumerację ID.

**Naprawa:**
- Przekazanie `requesterId` do serwisu
- Weryfikacja `targetUser.teamId === membership.teamId`
- Rzucenie `ForbiddenException` przy braku dostępu

### Uwagi do dalszego audytu

| Element | Status | Uwagi |
|---------|--------|-------|
| **syncUser** (GET /shifts/users/sync) | @Public() | Endpoint bez JWT. Używany przez frontend do synchronizacji użytkownika po OAuth. Rozważyć: wymaganie JWT + weryfikacja zgodności email z tokenem. Temat na audyt autentykacji. |
| **JWT role vs membership.role** | OK | JWT zwraca `user.role` z modelu User. Serwisy korzystają z `TeamMembership.role` (pobierane z bazy). Należy dbać o synchronizację user.role przy zmianie membership. |

## Podsumowanie

- **Endpointy sprawdzone:** ~35
- **Luki krytyczne naprawione:** 2
- **Status:** Autoryzacja (punkt 2.6.1) — audyt ukończony, luki usunięte
