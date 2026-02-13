/** Minimalna długość slotu dostępności (minuty) */
export const MIN_AVAILABILITY_MINUTES = 4 * 60; // 4 godziny

/** Maksymalna liczba slotów w jednym żądaniu (ochrona przed nadużyciem) */
export const MAX_SLOTS_PER_REQUEST = 50;

/** Maksymalny zakres dni dla zapytań (from–to) – skalowalność */
export const MAX_QUERY_RANGE_DAYS = 31;
