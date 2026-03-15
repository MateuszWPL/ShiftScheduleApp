import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const DASHBOARD_PATHS = [
  "panel",
  "grafik",
  "team",
  "profile",
  "settings",
  "announcements",
  "dostepnosc",
  "podsumowanie",
];

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const base =
    pathname === "/" ? "" : pathname.replace(/^\//, "").split("/")[0];

  if (pathname === "/" || DASHBOARD_PATHS.includes(base)) {
    const internalPath = pathname === "/" ? "/app" : `/app${pathname}`;
    return NextResponse.rewrite(new URL(internalPath, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/panel/:path*",
    "/grafik/:path*",
    "/team/:path*",
    "/profile/:path*",
    "/settings/:path*",
    "/announcements/:path*",
    "/dostepnosc/:path*",
    "/podsumowanie/:path*",
  ],
};
