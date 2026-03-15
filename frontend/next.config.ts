import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          {
            key: "Content-Security-Policy",
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; font-src 'self' data:; connect-src 'self' https: *.sentry.io; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
          },
        ],
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  // Slug organizacji i projektu z Sentry (potrzebne do sourcemapów + release tracking)
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // Auth token do uploadowania sourcemapów podczas buildu (wymagany w CI/prod)
  authToken: process.env.SENTRY_AUTH_TOKEN,

  // Ukryj logi Sentry podczas buildu w produkcji
  silent: process.env.NODE_ENV === "production",

  // Wyślij sourcemapy do Sentry i ukryj je z publicznego bundla
  sourcemaps: {
    deleteSourcemapsAfterUpload: true,
  },

  // Wyłącz automatyczny routing do Sentry — obsłużymy to sami przez sentry.client.config.ts
  autoInstrumentServerFunctions: false,

  // Nie baw się w automatyczny tunnel — upraszcza CSP
  tunnelRoute: undefined,
});
