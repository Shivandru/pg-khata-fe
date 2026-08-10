"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { generalFunctions } from "@/lib/generalFunctions";
import { Building2, DoorOpen, BedDouble, CalendarDays, IndianRupee } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  GuestTenancyStep,
  type BedOption,
  type PropertyOption,
  type RoomOption,
} from "@/components/onboarding/GuestTenancyStep";

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
interface RoomWithOccupancy extends RoomOption {}
interface BedWithOccupied {
  bedId: string;
  label: string;
  isOccupied: boolean;
}

async function apiGet<T>(path: string): Promise<T> {
  const { url, options } = await generalFunctions.createRequest(path);
  const res = await fetch(url, options);
  // Treat missing resources as "no data" for onboarding/setup flows.
  // Backend returns 404 when the user has no tenancy yet.
  if (!res.ok) return null as T;
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
  const queryClient = useQueryClient();
  const router = useRouter();

  const { data: tenancy, isLoading, isError } = useQuery<Tenancy | null>({
    queryKey: ["tenancy-me"],
    queryFn: () => apiGet("/tenancies/me"),
    enabled: !!session?.accessToken,
    retry: false,
  });

  const [selectedPropertyId, setSelectedPropertyId] = useState("");
  const [selectedRoomId, setSelectedRoomId] = useState("");
  const [selectedBedId, setSelectedBedId] = useState("");
  const [startDate, setStartDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [tenancyError, setTenancyError] = useState("");
  const [tenancyInfo, setTenancyInfo] = useState("");

  const { data: properties = [] } = useQuery<PropertyOption[]>({
    queryKey: ["properties"],
    queryFn: () => apiGet("/properties"),
    enabled: !!session?.accessToken && (!tenancy || isError),
  });

  const { data: rooms = [] } = useQuery<RoomWithOccupancy[]>({
    queryKey: ["rooms", selectedPropertyId],
    queryFn: () => apiGet(`/properties/${selectedPropertyId}/rooms`),
    enabled: !!session?.accessToken && !!selectedPropertyId && (!tenancy || isError),
  });

  const { data: beds = [] } = useQuery<BedWithOccupied[]>({
    queryKey: ["beds", selectedPropertyId, selectedRoomId],
    queryFn: () =>
      apiGet(`/properties/${selectedPropertyId}/rooms/${selectedRoomId}/beds`),
    enabled:
      !!session?.accessToken &&
      !!selectedPropertyId &&
      !!selectedRoomId &&
      (!tenancy || isError),
  });

  const availableBeds: BedOption[] = beds
    .filter((b) => !b.isOccupied)
    .map((b) => ({ bedId: b.bedId, label: b.label }));

    console.log({beds});
    console.log({availableBeds});

  const registerTenancy = useMutation({
    mutationFn: async () => {
      if (!selectedPropertyId || !selectedRoomId || !selectedBedId || !startDate) {
        throw new Error("Please fill all fields.");
      }

      const payload = {
        propertyId: selectedPropertyId,
        roomId: selectedRoomId,
        bedId: selectedBedId,
        startDate,
      };

      const attemptRegister = async () => {
        const { url, options } = await generalFunctions.createRequest(
          "/tenancies/register",
          { method: "POST", body: JSON.stringify(payload) },
        );
        return fetch(url, options);
      };

      let res = await attemptRegister();
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "Request failed" }));

        // Backend requires a guest profile; ensure it exists and retry once.
        if (res.status === 404 && err?.message === "Guest profile not found.") {
          const { url: guestUrl, options: guestOptions } =
            await generalFunctions.createRequest("/guests", {
              method: "POST",
              body: JSON.stringify({}),
            });
          const guestRes = await fetch(guestUrl, guestOptions);
          if (!guestRes.ok) {
            const guestErr = await guestRes
              .json()
              .catch(() => ({ message: "Failed to create guest profile" }));
            throw new Error(guestErr.message ?? "Failed to create guest profile");
          }
          res = await attemptRegister();
          if (!res.ok) {
            const err2 = await res
              .json()
              .catch(() => ({ message: "Request failed" }));
            throw new Error(err2.message ?? "Failed to register tenancy");
          }
          return res.json();
        }

        throw new Error(err.message ?? "Failed to register tenancy");
      }
      return res.json();
    },
    onSuccess: () => {
      setTenancyError("");
      setTenancyInfo(
        "Tenancy registered. If you still see this form, your tenancy may not be active yet.",
      );
      queryClient.invalidateQueries({ queryKey: ["tenancy-me"] });
      router.refresh();
    },
    onError: (err) =>
      setTenancyError((err as Error).message ?? "Something went wrong."),
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
        <Card className="rounded-xl border shadow-none p-6">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <DoorOpen className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="font-medium">No active tenancy found</p>
            <p className="text-sm text-muted-foreground mt-1">
              Register your tenancy here anytime from the sidebar.
            </p>
          </div>

          <GuestTenancyStep
            properties={properties}
            rooms={rooms as RoomOption[]}
            availableBeds={availableBeds}
            selectedPropertyId={selectedPropertyId}
            setSelectedPropertyId={setSelectedPropertyId}
            selectedRoomId={selectedRoomId}
            setSelectedRoomId={setSelectedRoomId}
            selectedBedId={selectedBedId}
            setSelectedBedId={setSelectedBedId}
            startDate={startDate}
            setStartDate={setStartDate}
            tenancyError={tenancyError}
            tenancyInfo={tenancyInfo}
            isRegistering={registerTenancy.isPending}
            onSubmit={() => {
              setTenancyError("");
              setTenancyInfo("");
              registerTenancy.mutate();
            }}
          />
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
