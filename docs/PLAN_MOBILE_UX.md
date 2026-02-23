# Plan Mobile UX — ShiftApp

## Cel
Dopracowanie działania mobilnego w przeglądarce: responsywność, czytelność, brak overflow, działanie przy większej ilości danych (np. 30 pracowników).

## Kolejność prac

### 1. Layout bazowy (DashboardLayout) ✅
- [x] Bottom nav: 6 elementów — skrócone etykiety (Podsum., Dostępn.), min-h 56px, touch-manipulation
- [x] Safe area dla notcha (safe-area-pb)
- [x] Padding dolny pb-24, min-h-0 overflow-auto na main

### 2. Pulpit (strona główna) ✅
- [x] Nagłówek: text-xl sm:text-2xl, truncate
- [x] Data: line-clamp-2
- [x] Statystyki 2x2 — OK
- [x] Kod zaproszenia: text-sm sm:text-lg, break-all, truncate
- [x] Kolumny: 1 na mobile

### 3. Grafik ✅
- [x] Header: flex-col sm:flex-row, flex-wrap
- [x] Widok „Moje zmiany”: flex-col sm:flex-row na kartach, truncate
- [x] ScheduleGrid: max-h 60vh/70vh, overflow-x/y-auto, sticky 1. kolumna
- [x] Giełda, Dostępność: overflow-x-auto, min-w na tabelach

### 4. ScheduleGrid (30+ pracowników) ✅
- [x] Tabela: min-w 80/120px, overscroll-x-contain, touch scrolling
- [x] Sticky header + sticky pierwsza kolumna (shadow)
- [x] Kolumny: mniejsze paddingi na mobile
- [x] Touch targets: min-h 44px, touch-manipulation

### 5. Podsumowanie ✅
- [x] Toggle + nawigacja — flex-wrap
- [x] SummaryPanel: max-h 240/280px, touch scroll
- [x] MonthlyCalendarView: w-full min-w-0 overflow-hidden

### 6. Zespół ✅
- [x] Siatka 1 kolumna
- [x] Truncate nagłówków, max-w na email
- [x] Responsive headers

### 7. Ogłoszenia ✅
- [x] Formularz: w-full
- [x] Wrapper w-full min-w-0

### 8. Dostępność ✅
- [x] w-full min-w-0

### 9. Ustawienia ✅
- [x] Tabs: overflow-x-auto, touch scroll
- [x] flex-1 min-w-0 na przyciskach

### 10. Profil ✅
- [x] w-full min-w-0, responsywne

## Widoki per rola

| Rola      | Widoki używane                        |
|-----------|---------------------------------------|
| Pracownik | Pulpit, Grafik (Moje zmiany), Dostępność, Zespół, Profil |
| Menedżer  | + Podsumowanie, Ogłoszenia            |
| Właściciel| + Ustawienia                          |

## Kluczowe zasady
- Min touch target: 44x44px
- Truncate / line-clamp zamiast overflow
- Sticky nagłówki w długich tabelach
- `overflow-x-auto` dla tabel — naturalny scroll
- `min-w-0` na flex children żeby truncate działał
