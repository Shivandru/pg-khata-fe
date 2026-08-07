import { type NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

export const authOptions: NextAuthOptions = {
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
        role: token.role as "owner" | "guest" | null,
      };

      session.accessToken = token.backendAccessToken as string;

      return session;
    },

    async redirect({ url, baseUrl }) {
      // Honor explicit callbackUrl, fall back to baseUrl (/)
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },

    async jwt({ token, account, profile, trigger, session }) {
      if (trigger === "update" && session) {
        if (session.accessToken) {
          token.backendAccessToken = session.accessToken;
        }
        if (session.role !== undefined) {
          token.role = session.role;
        }
        return token;
      }

      if (account && profile) {
        const url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/signup`;

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
        token.role = data.user.role;
        console.log("Backend token:", data.token);
        console.log("Stored token:", token.backendAccessToken);
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
};
