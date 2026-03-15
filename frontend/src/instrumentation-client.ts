import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  environment: process.env.NEXT_PUBLIC_SENTRY_ENV ?? "production",

  tracesSampleRate: 0.1,

  replaysSessionSampleRate: 0.01,
  replaysOnErrorSampleRate: 0.1,

  beforeBreadcrumb(breadcrumb) {
    if (breadcrumb.category === "console") return null;
    if (breadcrumb.data?.url) {
      try {
        const url = new URL(breadcrumb.data.url as string);
        url.search = "";
        breadcrumb.data.url = url.toString();
      } catch {
        /* ignore */
      }
    }
    return breadcrumb;
  },

  sendDefaultPii: false,

  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
});
