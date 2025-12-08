import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const handler = NextAuth({
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
  callbacks: {
    // To uruchamia się po udanym logowaniu
    async session({ session, token }) {
      return session;
    },
  },
});

export { handler as GET, handler as POST };