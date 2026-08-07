"use client";

import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { generalFunctions } from "@/lib/generalFunctions";
import { Building2, DoorOpen, BedDouble, CalendarDays, IndianRupee } from "lucide-react";
import { Card } from "@/components/ui/card";

interface Tenancy {
  tenancyId: string;
  propertyId: string;
  roomId: string;
  bedId: string;
  startDate: string;
  endDate: string | null;
  isActive: boolean;
}

interface Property {
  propertyId: string;
  name: string;
  address: string;
}

interface Room {
  roomId: string;
  roomNumber: string;
  floor: number;
  bedCount: number;
}

interface Bed {
  bedId: string;
  label: string;
}

async function apiGet<T>(path: string): Promise<T> {
  const { url, options } = await generalFunctions.createRequest(path);
  const res = await fetch(url, options);
  if (!res.ok) throw new Error("Request failed");
  return res.json();
}

function InfoTile({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-4 rounded-xl border bg-muted/30 p-4 transition-all hover:bg-muted/50">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        {icon}
      </div>
      <div>
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="mt-0.5 font-semibold">{value}</p>
      </div>
    </div>
  );
}

export default function TenancyPage() {
  const { data: session } = useSession();

  const { data: tenancy, isLoading, isError } = useQuery<Tenancy | null>({
    queryKey: ["tenancy-me"],
    queryFn: () => apiGet("/tenancies/me"),
    enabled: !!session?.accessToken,
  });

  const { data: property } = useQuery<Property>({
    queryKey: ["property", tenancy?.propertyId],
    queryFn: () => apiGet(`/properties/${tenancy!.propertyId}`),
    enabled: !!tenancy?.propertyId,
  });

  const { data: room } = useQuery<Room>({
    queryKey: ["room", tenancy?.propertyId, tenancy?.roomId],
    queryFn: () =>
      apiGet(`/properties/${tenancy!.propertyId}/rooms/${tenancy!.roomId}`),
    enabled: !!tenancy?.propertyId && !!tenancy?.roomId,
  });

  const { data: bed } = useQuery<Bed | undefined>({
    queryKey: ["bed", tenancy?.propertyId, tenancy?.roomId, tenancy?.bedId],
    queryFn: () =>
      apiGet<Bed[]>(
        `/properties/${tenancy!.propertyId}/rooms/${tenancy!.roomId}/beds`
      ).then((beds) => beds.find((b) => b.bedId === tenancy!.bedId)),
    enabled: !!tenancy?.propertyId && !!tenancy?.roomId && !!tenancy?.bedId,
  });

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (isError || !tenancy) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Tenancy Details</h1>
          <p className="text-sm text-muted-foreground mt-1">Your current living arrangement.</p>
        </div>
        <Card className="flex flex-col items-center justify-center py-16 text-center rounded-xl border shadow-none">
          <DoorOpen className="h-10 w-10 text-muted-foreground mb-3" />
          <p className="font-medium">No active tenancy found</p>
          <p className="text-sm text-muted-foreground mt-1">
            You don't have an active tenancy yet. Please contact your property owner.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Tenancy Details</h1>
          <p className="text-sm text-muted-foreground mt-1">Your current living arrangement.</p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-600 ring-1 ring-emerald-500/20">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Active Tenancy
        </span>
      </div>

      {/* Property banner */}
      {property && (
        <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-6">
          <div className="absolute right-0 top-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full bg-primary/10 blur-2xl" />
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Property</p>
              <h2 className="text-lg font-bold">{property.name}</h2>
              <p className="text-sm text-muted-foreground mt-0.5">{property.address}</p>
            </div>
          </div>
        </div>
      )}

      {/* Info tiles */}
      <div className="grid gap-3 sm:grid-cols-2">
        {room && (
          <InfoTile
            icon={<DoorOpen className="h-5 w-5" />}
            label="Room"
            value={`Room ${room.roomNumber} — Floor ${room.floor}`}
          />
        )}
        {bed && (
          <InfoTile
            icon={<BedDouble className="h-5 w-5" />}
            label="Bed"
            value={bed.label}
          />
        )}
        <InfoTile
          icon={<CalendarDays className="h-5 w-5" />}
          label="Move-in Date"
          value={new Date(tenancy.startDate).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        />
        {tenancy.endDate && (
          <InfoTile
            icon={<CalendarDays className="h-5 w-5" />}
            label="Move-out Date"
            value={new Date(tenancy.endDate).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          />
        )}
      </div>
    </div>
  );
}
