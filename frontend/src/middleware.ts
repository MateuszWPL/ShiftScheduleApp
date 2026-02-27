import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const APP_HOST = "app.staffer.pl";
const DASHBOARD_PATHS = [
  "",
  "panel",
  "grafik",
  "team",
  "profile",
  "settings",
  "announcements",
  "dostepnosc",
  "podsumowanie",
];

function isAppHost(host: string): boolean {
  return host === APP_HOST || host === `www.${APP_HOST}`;
}

export function middleware(request: NextRequest) {
  const host = request.headers.get("host") || "";
  const pathname = request.nextUrl.pathname;

  // Na app.staffer.pl: rewrite / i ścieżki dashboardu do /app/*
  if (isAppHost(host)) {
    const base = pathname === "/" ? "" : pathname.replace(/^\//, "").split("/")[0];
    if (pathname === "/" || DASHBOARD_PATHS.includes(base)) {
      const internalPath = pathname === "/" ? "/app" : `/app${pathname}`;
      return NextResponse.rewrite(new URL(internalPath, request.url));
    }
  }

  // Na staffer.pl / www / localhost: redirect /app* do app.staffer.pl (tylko w produkcji)
  if (!host.includes("localhost") && pathname.startsWith("/app")) {
    return NextResponse.redirect(new URL(`https://${APP_HOST}${pathname}`, request.url), 301);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/panel",
    "/panel/:path*",
    "/grafik",
    "/grafik/:path*",
    "/team",
    "/team/:path*",
    "/profile",
    "/profile/:path*",
    "/settings",
    "/settings/:path*",
    "/announcements",
    "/announcements/:path*",
    "/dostepnosc",
    "/dostepnosc/:path*",
    "/podsumowanie",
    "/podsumowanie/:path*",
    "/app",
    "/app/:path*",
  ],
};
