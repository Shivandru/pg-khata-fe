"use client";

import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { generalFunctions } from "@/lib/generalFunctions";
import { User, Mail, Phone, Shield } from "lucide-react";
import { Card } from "@/components/ui/card";
import Image from "next/image";

interface User {
  userId: string;
  name: string;
  email: string;
  provider: "google";
  role: "owner" | "guest" | null;
  phone?: string;
  avatar?: string | null;
}

interface GuestProfile {
  guestId: string;
  userId: string;
  kycInfo: Record<string, unknown>;
}

interface OwnerProfile {
  ownerId: string;
  userId: string;
  kycInfo: Record<string, unknown>;
  bankDetails: Record<string, unknown>;
}

interface ProfileResponse extends User {
  guestProfile?: GuestProfile;
  ownerProfile?: OwnerProfile;
}

async function apiGet<T>(path: string): Promise<T> {
  const { url, options } = await generalFunctions.createRequest(path);
  const res = await fetch(url, options);
  if (!res.ok) throw new Error("Request failed");
  return res.json();
}

function ProfileField({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-xl border bg-muted/30 p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="mt-0.5 font-medium truncate">{value}</p>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { data: session } = useSession();

const { data: profile, isLoading } = useQuery<ProfileResponse>({
  queryKey: ["profile-me"],
  queryFn: () => apiGet("/profile/me"),
  enabled: !!session?.accessToken,
});

  const role = session?.user?.role ?? "—";
  const avatarUrl = profile?.avatar ?? null;
const avatarInitials = (profile?.name ?? "?")
  .split(" ")
  .slice(0, 2)
  .map((n) => n[0])
  .join("")
  .toUpperCase();

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Your account information. Contact support to make changes.
        </p>
      </div>

      {/* Avatar card */}
      <Card className="rounded-xl border shadow-none overflow-hidden">
        <div className="bg-gradient-to-r from-primary/20 via-primary/10 to-transparent h-20" />
        <div className="px-6 pb-6 -mt-10">
          {/* <div className="inline-flex h-20 w-20 items-center justify-center rounded-full overflow-hidden bg-primary text-primary-foreground text-2xl font-bold shadow-lg ring-4 ring-background">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <Image src={avatarUrl} alt={avatarInitials} className="h-full w-full object-cover" />
            ) : (
              <span>{avatarInitials}</span>
            )}
          </div> */}
          <div className="relative h-24 w-24 overflow-hidden rounded-full shadow-lg ring-4 ring-background">
  {avatarUrl ? (
    <Image
      src={avatarUrl}
      alt={avatarInitials}
      fill
      className="object-cover"
    />
  ) : (
    <span>{avatarInitials}</span>
  )}
</div>
          <div className="mt-3">
            <h2 className="text-xl font-bold">{profile?.name ?? session?.user?.name}</h2>
            <span className="inline-flex items-center gap-1 mt-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary capitalize">
              <Shield className="h-3 w-3" />
              {role}
            </span>
          </div>
        </div>
      </Card>

      {/* Fields */}
      <div className="grid gap-3 sm:grid-cols-2">
        <ProfileField
          icon={<User className="h-5 w-5" />}
          label="Full Name"
          value={profile?.name ?? session?.user?.name ?? "—"}
        />
        <ProfileField
          icon={<Mail className="h-5 w-5" />}
          label="Email"
          value={profile?.email ?? session?.user?.email ?? "—"}
        />
        {profile?.phone && (
          <ProfileField
            icon={<Phone className="h-5 w-5" />}
            label="Phone"
            value={profile.phone}
          />
        )}
        <ProfileField
          icon={<Shield className="h-5 w-5" />}
          label="Account Role"
          value={role.charAt(0).toUpperCase() + role.slice(1)}
        />
      </div>

      <p className="text-xs text-center text-muted-foreground">
        Profile information is read-only. Editing will be available in a future update.
      </p>
    </div>
  );
}
