import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { authOptions } from "../[...nextauth]/route";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized - no session" }, { status: 401 });
    }

    if ((session as any).accessToken) {
      return NextResponse.json({ token: (session as any).accessToken });
    }

    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    const syncResponse = await fetch(
      `${API_URL}/shifts/users/sync?email=${encodeURIComponent(session.user.email)}&name=${encodeURIComponent(session.user.name || "")}`
    );

    if (!syncResponse.ok) {
      return NextResponse.json({ error: "Failed to sync user" }, { status: 500 });
    }

    const dbUser = await syncResponse.json();

    const secret = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET;

    if (!secret) {
      return NextResponse.json({ error: "JWT secret is not configured" }, { status: 500 });
    }

    const token = jwt.sign(
      {
        sub: dbUser.id,
        email: dbUser.email,
        v: dbUser.tokenVersion ?? 0,
      },
      secret,
      {
        expiresIn: "7d",
        algorithm: "HS256",
      }
    );

    return NextResponse.json({ token });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

