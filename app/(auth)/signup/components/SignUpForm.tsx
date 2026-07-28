"use client";

import Image from "next/image";
import { signIn } from "next-auth/react";
import { GoogleButton } from "./GoogleButton";

export default function SignUpForm() {
  const handleGoogleLogin = async () => {
    signIn("google", { callbackUrl: "/dashboard" });
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center">
          <Image
            src="/logo.png"
            alt="Nest PG"
            width={64}
            height={64}
            className="mb-4 rounded-xl"
          />

          <h2 className="text-2xl font-bold">PG Khata</h2>

        </div>

        {/* Card */}
        <div className="rounded-2xl border bg-card p-8 shadow-xl">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold">
              Welcome 👋
            </h1>

            <p className="mt-2 text-muted-foreground">
              Sign in with Google to continue.
            </p>
          </div>

          <GoogleButton onClick={handleGoogleLogin} />
        </div>
      </div>
    </div>
  );
}