import NextAuth, { type NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

if (process.env.NODE_ENV === "production" && !process.env.NEXTAUTH_SECRET) {
  throw new Error("NEXTAUTH_SECRET must be set in production");
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "select_account",
        },
      },
    }),
    CredentialsProvider({
      name: "Email i Hasło",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Hasło", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email i hasło są wymagane");
        }

        try {
          const res = await fetch(`${API_URL}/auth/login`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });

          if (!res.ok) {
            const error = await res.json();
            throw new Error(error.message || "Błąd logowania");
          }

          const data = await res.json();
          
          return {
            id: data.user.id,
            email: data.user.email,
            name: data.user.name,
            accessToken: data.access_token,
            tokenVersionAtLogin: data.user.tokenVersion ?? 0,
          };
        } catch (error: any) {
          throw new Error(error.message || "Błąd logowania");
        }
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  cookies: {
    sessionToken: {
      name: "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
      },
    },
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.email = user.email;
        token.name = user.name;
        if ((user as any).accessToken) {
          token.accessToken = (user as any).accessToken;
        }
        if ((user as any).tokenVersionAtLogin !== undefined) {
          token.tokenVersionAtLogin = (user as any).tokenVersionAtLogin;
        } else if (account?.provider === "google" && user?.email) {
          const syncRes = await fetch(
            `${API_URL}/shifts/users/sync?email=${encodeURIComponent(user.email!)}&name=${encodeURIComponent(user.name || "")}`
          );
          if (syncRes.ok) {
            const dbUser = await syncRes.json();
            token.tokenVersionAtLogin = dbUser.tokenVersion ?? 0;
          }
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user = {
          ...session.user,
          email: token.email as string,
          name: token.name as string,
        };
        if (token.accessToken) {
          (session as any).accessToken = token.accessToken;
        }
        if (token.tokenVersionAtLogin !== undefined) {
          (session as any).tokenVersionAtLogin = token.tokenVersionAtLogin;
        }
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };