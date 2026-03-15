import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  environment: process.env.NEXT_PUBLIC_SENTRY_ENV ?? "production",

  // Wysyłaj tylko 10% transakcji — nie przepalaj limitu darmowego planu
  tracesSampleRate: 0.1,

  // Replays tylko 1% sesji, 10% przy błędach
  replaysSessionSampleRate: 0.01,
  replaysOnErrorSampleRate: 0.1,

  // Nie wysyłaj breadcrumbs z console.log — może zawierać PII
  beforeBreadcrumb(breadcrumb) {
    if (breadcrumb.category === "console") return null;
    // Usuń query-string z URL, żeby nie trafiły tokeny (np. reset hasła)
    if (breadcrumb.data?.url) {
      try {
        const url = new URL(breadcrumb.data.url as string);
        url.search = "";
        breadcrumb.data.url = url.toString();
      } catch {
        // nie modyfikuj, jeśli URL niepoprawny
      }
    }
    return breadcrumb;
  },

  // Nie wysyłaj danych wrażliwych — tylko anonimowe ID
  sendDefaultPii: false,

  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
});
