"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Building2 } from "lucide-react";
import { generalFunctions } from "@/lib/generalFunctions";
import { RoleStep } from "./components/RoleStep";

// ─── Types ────────────────────────────────────────────────────────────────────
type Role = "owner" | "guest";

interface Property {
  propertyId: string;
  name: string;
  address: string;
}

// ─── API helpers ──────────────────────────────────────────────────────────────
async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const { url, options } = await generalFunctions.createRequest(path, init);
  const res = await fetch(url, options);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Request failed" }));
    throw new Error(err.message ?? "Request failed");
  }
  return res.json();
}

async function apiGetOptional<T>(path: string): Promise<T | null> {
  const { url, options } = await generalFunctions.createRequest(path);
  const res = await fetch(url, options);
  if (!res.ok) return null;
  return res.json();
}

// ─── Step indicator ───────────────────────────────────────────────────────────
function StepDot({ active, done }: { active: boolean; done: boolean }) {
  return (
    <div
      className={`h-2.5 w-2.5 rounded-full transition-all duration-300 ${
        done ? "bg-primary" : active ? "bg-primary scale-125" : "bg-muted"
      }`}
    />
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function OnboardingPage() {
  const { data: session, status, update: updateSession } = useSession();
  const router = useRouter();

  const [role, setRole] = useState<Role | null>(null);
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [isSubmittingRole, setIsSubmittingRole] = useState(false);

  // ── Query to check if owner's property already exists ──
  const { data: ownerProperty, isLoading: isCheckingProperty } =
    useQuery<Property | null>({
      queryKey: ["owner-property"],
      queryFn: () => apiGetOptional<Property>("/properties/me"),
      enabled: session?.user?.role === "owner",
      retry: false,
    });

  // ── Query to get user profile if page is refreshed to get phone ──
  const { data: userProfile } = useQuery<any>({
    queryKey: ["user-profile", session?.user?.userId],
    queryFn: () => apiRequest(`/users/${session?.user?.userId}`),
    enabled: !!session?.user?.userId,
  });

  // If phone is empty but userProfile has it, set it
  useEffect(() => {
    if (!phone && userProfile?.phone) {
      setPhone(userProfile.phone);
    }
  }, [phone, userProfile]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/signup");
      return;
    }

    if (session?.user?.role === "owner") {
      if (ownerProperty) {
        router.replace("/dashboard");
      } else if (!isCheckingProperty) {
        router.replace("/rooms");
      }
    } else if (session?.user?.role === "guest") {
      router.replace("/tenancy");
    }
  }, [
    session,
    status,
    ownerProperty,
    isCheckingProperty,
    router,
  ]);

  // ─── Step 1: Set role ──────────────────────────────────────────────────────
  const handleRoleSubmit = async () => {
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      setPhoneError("Enter a valid 10-digit Indian mobile number.");
      return;
    }
    setPhoneError("");
    if (!role) return;

    setIsSubmittingRole(true);
    try {
      const userId = session?.user?.userId;
      const { url, options } = await generalFunctions.createRequest(
        `/users/${userId}`,
        {
          method: "PATCH",
          body: JSON.stringify({ role, phone }),
        },
      );
      const res = await fetch(url, options);
      if (!res.ok) throw new Error("Failed to update role");
      const data = await res.json();

      // Refresh session with new role + token
      await updateSession({ accessToken: data.token, role: data.user.role });

      if (role === "owner") {
        // Register as owner (idempotent — if already exists, backend returns existing)
        const { url: ownerUrl, options: ownerOptions } =
          await generalFunctions.createRequest("/owner", {
            method: "POST",
            body: JSON.stringify({}),
          });
        const ownerRes = await fetch(ownerUrl, ownerOptions);
        if (!ownerRes.ok) {
          const err = await ownerRes
            .json()
            .catch(() => ({ message: "Failed to create owner profile" }));
          throw new Error(err.message ?? "Failed to create owner profile");
        }
        router.replace("/rooms");
      } else {
        // Register as guest (idempotent — if already exists, backend returns existing)
        const { url: guestUrl, options: guestOptions } =
          await generalFunctions.createRequest("/guests", {
            method: "POST",
            body: JSON.stringify({}),
          });
        const guestRes = await fetch(guestUrl, guestOptions);
        if (!guestRes.ok) {
          const err = await guestRes
            .json()
            .catch(() => ({ message: "Failed to create guest profile" }));
          throw new Error(err.message ?? "Failed to create guest profile");
        }
        router.replace("/tenancy");
      }
    } catch (err) {
      setPhoneError("Something went wrong. Please try again.");
    } finally {
      setIsSubmittingRole(false);
    }
  };

  // ───────────────────────────────────────────────────────────────────────────
  // RENDER
  // ───────────────────────────────────────────────────────────────────────────

  // Block render while session is loading or we're mid-redirect (already has role)
  const isChecking =
    status === "loading" ||
    !session ||
    (session?.user?.role === "owner" && isCheckingProperty);

  if (isChecking) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">
            Checking your account…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden">
      {/* Background gradient orbs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-violet-500/10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-2xl">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg mb-4">
            <Building2 className="h-7 w-7" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">PG Khata</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Let's set up your account
          </p>
        </div>

        {/* Step indicators */}
        <div className="mb-6 flex justify-center gap-2">
          <StepDot active done={false} />
        </div>

        {/* ── Step 1: Role + Phone ── */}
        <RoleStep
          role={role}
          setRole={setRole}
          phone={phone}
          setPhone={setPhone}
          phoneError={phoneError}
          setPhoneError={setPhoneError}
          isSubmitting={isSubmittingRole}
          onContinue={handleRoleSubmit}
        />
      </div>
    </div>
  );
}
