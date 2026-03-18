/**
 * Bazowa ścieżka aplikacji (dashboard).
 * Na app.staffer.pl middleware rewrite'uje / → /app, więc URL jest czysty.
 * Na localhost i staffer.pl aplikacja jest pod /app.
 */
export const APP_BASE = "/app";

export const AUTH_BASE = "/auth";

export const paths = {
  home: APP_BASE,
  panel: `${APP_BASE}/panel`,
  grafik: `${APP_BASE}/grafik`,
  team: `${APP_BASE}/team`,
  profile: `${APP_BASE}/profile`,
  settings: `${APP_BASE}/settings`,
  announcements: `${APP_BASE}/announcements`,
  dostepnosc: `${APP_BASE}/dostepnosc`,
  podsumowanie: `${APP_BASE}/podsumowanie`,
  billing: `${APP_BASE}/billing`,
  reports: `${APP_BASE}/reports`,
  export: `${APP_BASE}/export`,
  templates: `${APP_BASE}/templates`,
} as const;

export const authPaths = {
  login: `${AUTH_BASE}/login`,
  register: `${AUTH_BASE}/register`,
  onboarding: `${AUTH_BASE}/onboarding`,
} as const;
