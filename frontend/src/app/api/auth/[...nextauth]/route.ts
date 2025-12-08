import NextAuth, { type NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

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
        // Po pierwszym logowaniu, user zawiera dane z Google
        // Musimy pobrać userId z backendu (sync)
        // Na razie używamy email jako identyfikator, ale w produkcji trzeba będzie zsynchronizować
        token.email = user.email;
        token.name = user.name;
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
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };