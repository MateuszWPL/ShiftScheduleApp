import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  environment: process.env.NEXT_PUBLIC_SENTRY_ENV ?? "production",

  // Na serwerze logujemy wszystkie błędy, ale tylko 10% transakcji
  tracesSampleRate: 0.1,

  sendDefaultPii: false,
});
