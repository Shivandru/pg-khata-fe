"use client";

import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { generalFunctions } from "@/lib/generalFunctions";

type Role = "owner" | "guest";

interface Property {
  propertyId: string;
}

interface Tenancy {
  tenancyId: string;
  isActive: boolean;
}

async function apiGet<T>(path: string): Promise<T> {
  const { url, options } = await generalFunctions.createRequest(path);
  const res = await fetch(url, options);
  if (!res.ok) return null as T;
  return res.json();
}

export function useOnboardingStatus() {
  const { data: session, status: sessionStatus } = useSession();
  const role = session?.user?.role as Role | null | undefined;

  const ownerProperty = useQuery<Property | null>({
    queryKey: ["owner-property"],
    queryFn: () => apiGet<Property>("/properties/me"),
    enabled: sessionStatus === "authenticated" && role === "owner",
    retry: false,
  });

  const tenancy = useQuery<Tenancy | null>({
    queryKey: ["tenancy-me"],
    queryFn: () => apiGet<Tenancy>("/tenancies/me"),
    enabled: sessionStatus === "authenticated" && role === "guest",
    retry: false,
  });

  const isChecking =
    sessionStatus === "loading" ||
    (role === "owner" && ownerProperty.isLoading) ||
    (role === "guest" && tenancy.isLoading);

  const isComplete =
    role === "owner"
      ? !!ownerProperty.data?.propertyId
      : role === "guest"
        ? !!tenancy.data?.tenancyId && tenancy.data?.isActive !== false
        : false;

  return {
    role,
    sessionStatus,
    isChecking,
    isComplete,
    ownerProperty,
    tenancy,
  };
}

