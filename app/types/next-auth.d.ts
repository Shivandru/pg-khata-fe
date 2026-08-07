import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    accessToken: string;
    user: {
      userId: string;
      name: string;
      email: string;
      image?: string | null;
      role: "owner" | "guest" | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId: string;
    backendAccessToken: string;
    role: "owner" | "guest" | null;
  }
}