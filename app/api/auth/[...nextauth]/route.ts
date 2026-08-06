import { generalFunctions } from "@/lib/generalFunctions";
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const clientId = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

if (!clientId || !clientSecret) {
  throw new Error("Missing Google OAuth environment variables.");
}

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "openid email profile",
        },
      },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      session.user = {
        userId: token.userId as string,
        name: token.name ?? "",
        email: token.email ?? "",
        image: token.picture ?? null,
      };

      session.accessToken = token.backendAccessToken;
      return session;
    },
    async redirect() {
      return "/dashboard";
    },
    async jwt({ token, account, profile }) {
      if (account && profile) {
        // First login only
        const url = generalFunctions.createUrl("/auth/signup");

        const res = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            idToken: account.id_token,
          }),
        });

        const data = await res.json();

        token.userId = data.user.userId;
        token.backendAccessToken = data.token;
      }

      return token;
    },
  },
  pages: {
    signIn: "/signup",
  },
  session: {
    strategy: "jwt",
  },
});

export { handler as GET, handler as POST };
