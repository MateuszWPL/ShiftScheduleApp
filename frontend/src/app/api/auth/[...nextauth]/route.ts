import NextAuth, { type NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

// Eksportujemy authOptions, żeby móc go użyć w innych miejscach (np. getServerSession)
export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "select_account", // Wymusza wybór konta przy każdym logowaniu
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
          
          // Zwracamy dane użytkownika dla NextAuth
          return {
            id: data.user.id,
            email: data.user.email,
            name: data.user.name,
            accessToken: data.access_token, // Zapisujemy token do użycia w callback
          };
        } catch (error: any) {
          throw new Error(error.message || "Błąd logowania");
        }
      },
    }),
  ],
  // Tajny klucz do szyfrowania ciasteczek
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt", // Używamy JWT strategy zamiast database sessions
  },
  callbacks: {
    // Dodajemy userId do tokena (będzie dostępny w session)
    async jwt({ token, user, account }) {
      if (user) {
        // Po pierwszym logowaniu
        token.email = user.email;
        token.name = user.name;
        
        // Jeśli to logowanie przez Credentials (email+hasło), mamy accessToken
        if ((user as any).accessToken) {
          token.accessToken = (user as any).accessToken;
        }
      }
      return token;
    },
    async session({ session, token }) {
      // Dodajemy token do session, żeby frontend mógł go użyć
      if (token) {
        session.user = {
          ...session.user,
          email: token.email as string,
          name: token.name as string,
        };
        // Token JWT będzie dostępny przez endpoint /api/auth/token
        // Dla Credentials mamy już token w accessToken
        if (token.accessToken) {
          (session as any).accessToken = token.accessToken;
        }
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };