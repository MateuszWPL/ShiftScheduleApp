import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { authOptions } from "../[...nextauth]/route";

// Endpoint który zwraca JWT token dla backendu
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    console.log("[TOKEN] Session:", session ? "exists" : "null");

    if (!session?.user?.email) {
      console.log("[TOKEN] No session or email");
      return NextResponse.json({ error: "Unauthorized - no session" }, { status: 401 });
    }

    // Pobierz userId z backendu (sync user)
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    const syncResponse = await fetch(
      `${API_URL}/shifts/users/sync?email=${encodeURIComponent(session.user.email)}&name=${encodeURIComponent(session.user.name || "")}`
    );

    if (!syncResponse.ok) {
      return NextResponse.json({ error: "Failed to sync user" }, { status: 500 });
    }

    const dbUser = await syncResponse.json();

    // Generuj JWT token w formacie który NestJS może zweryfikować
    const secret = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || "your-secret-key-change-in-production";
    
    const token = jwt.sign(
      {
        sub: dbUser.id, // userId - standard JWT claim
        email: dbUser.email,
      },
      secret,
      {
        expiresIn: "7d", // Token ważny 7 dni
      }
    );

    return NextResponse.json({ token });
  } catch (error) {
    console.error("Error generating token:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

