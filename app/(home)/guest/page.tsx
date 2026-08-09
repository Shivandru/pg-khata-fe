"use client";

import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { generalFunctions } from "@/lib/generalFunctions";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Users, AlertCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Property {
  propertyId: string;
  name: string;
}
interface Guest {
  guestId: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
}
interface Tenancy {
  tenancyId: string;
  guestId: string;
  propertyId: string;
  roomId: string;
  bedId: string;
  startDate: string;
  isActive: boolean;
}
interface Room {
  roomId: string;
  roomNumber: string;
  floor: number;
}
interface Bed {
  bedId: string;
  label: string;
}

// ─── API helper ───────────────────────────────────────────────────────────────
async function api<T>(path: string): Promise<T> {
  const { url, options } = await generalFunctions.createRequest(path);
  const res = await fetch(url, options);
  if (!res.ok) throw new Error("Request failed");
  return res.json();
}

export default function GuestsPage() {
  const { data: session } = useSession();

  // Fetch owner's property
  const { data: property, isLoading: loadingProp } = useQuery<Property | null>({
    queryKey: ["owner-property"],
    queryFn: () => api("/properties/me"),
    enabled: !!session?.accessToken,
  });

  const pid = property?.propertyId;

  // Fetch active guests for this property
  const { data: guests = [], isLoading: loadingGuests } = useQuery<Guest[]>({
    queryKey: ["property-guests", pid],
    queryFn: () => api(`/tenancies/property/${pid}/guests`),
    enabled: !!pid,
  });

  // Fetch active tenancies for room/bed info
  const { data: tenancies = [] } = useQuery<Tenancy[]>({
    queryKey: ["property-tenancies", pid],
    queryFn: () => api(`/tenancies/property/${pid}/active`),
    enabled: !!pid,
  });

  // Fetch rooms for display
  const { data: rooms = [] } = useQuery<Room[]>({
    queryKey: ["rooms", pid],
    queryFn: () => api(`/properties/${pid}/rooms`),
    enabled: !!pid,
  });

  // Fetch all beds for all rooms
  const { data: allBeds = [] } = useQuery<Bed[]>({
    queryKey: ["all-beds-guest", pid, rooms.map((r) => r.roomId).join(",")],
    queryFn: async () => {
      const results = await Promise.all(
        rooms.map((r) =>
          api<
            {
              bedId: string;
              roomId: string;
              label: string;
              isOccupied: boolean;
            }[]
          >(`/properties/${pid}/rooms/${r.roomId}/beds`),
        ),
      );
      return results.flat();
    },
    enabled: !!pid && rooms.length > 0,
  });

  const getGuestTenancy = (guestId: string) =>
    tenancies.find((t) => t.guestId === guestId);

  const getRoomLabel = (roomId: string) => {
    const r = rooms.find((r) => r.roomId === roomId);
    return r ? `Room ${r.roomNumber}` : "—";
  };

  const getBedLabel = (bedId: string) => {
    const b = allBeds.find((b) => b.bedId === bedId);
    return b?.label ?? "—";
  };

  const isLoading = loadingProp || loadingGuests;

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!property) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3 text-center">
        <AlertCircle className="h-8 w-8 text-muted-foreground" />
        <p className="font-medium">No property found</p>
        <p className="text-sm text-muted-foreground">
          Complete onboarding setup first.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Guests</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {guests.length} active tenant{guests.length !== 1 ? "s" : ""} in{" "}
            {property.name}
          </p>
        </div>
      </div>

      {/* <Card className="rounded-xl border shadow-none overflow-hidden">
        {guests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
            <Users className="h-8 w-8 text-muted-foreground" />
            <p className="font-medium">No active guests yet</p>
            <p className="text-sm text-muted-foreground">
              Guests will appear here once they register a tenancy.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Room / Bed</TableHead>
                <TableHead>Move-in</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {guests.map((g) => {
                const tenancy = getGuestTenancy(g.guestId);
                return (
                  <TableRow key={g.guestId}>
                    <TableCell className="font-medium">{g.name}</TableCell>
                    <TableCell className="text-muted-foreground">{g.phone || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{g.email || "—"}</TableCell>
                    <TableCell>
                      {tenancy
                        ? `${getRoomLabel(tenancy.roomId)} · ${getBedLabel(tenancy.bedId)}`
                        : "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {tenancy
                        ? new Date(tenancy.startDate).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center rounded-full bg-emerald-500/10 text-emerald-600 px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ring-emerald-500/20">
                        Active
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card> */}
      <Card className="rounded-xl border shadow-none overflow-hidden">
        {guests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
            <Users className="h-8 w-8 text-muted-foreground" />
            <p className="font-medium">No active guests yet</p>
            <p className="text-sm text-muted-foreground">
              Guests will appear here once they register a tenancy.
            </p>
          </div>
        ) : (
          <>
            {/* Mobile */}
            <div className="divide-y md:hidden">
              {guests.map((g) => {
                const tenancy = getGuestTenancy(g.guestId);

                return (
                  <div key={g.guestId} className="p-4 space-y-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-11 w-11 shrink-0">
                        <AvatarImage src={g.avatar ?? undefined} alt={g.name} />
                        <AvatarFallback>
                          {g.name
                            .split(" ")
                            .slice(0, 2)
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{g.name}</p>
                        <p className="text-sm text-muted-foreground truncate">
                          {g.phone || g.email || "—"}
                        </p>
                      </div>

                      <span className="shrink-0 inline-flex items-center rounded-full bg-emerald-500/10 text-emerald-600 px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ring-emerald-500/20">
                        Active
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Room / Bed
                        </p>
                        <p className="mt-1 font-medium">
                          {tenancy
                            ? `${getRoomLabel(tenancy.roomId)} · ${getBedLabel(
                                tenancy.bedId,
                              )}`
                            : "—"}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-muted-foreground">Move-in</p>
                        <p className="mt-1 font-medium">
                          {tenancy
                            ? new Date(tenancy.startDate).toLocaleDateString(
                                "en-IN",
                                {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                },
                              )
                            : "—"}
                        </p>
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground truncate">
                      {g.email || "No email"}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Desktop */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Guest</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Room / Bed</TableHead>
                    <TableHead>Move-in</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {guests.map((g) => {
                    const tenancy = getGuestTenancy(g.guestId);

                    return (
                      <TableRow key={g.guestId}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                              <AvatarImage
                                src={g.avatar ?? undefined}
                                alt={g.name}
                              />
                              <AvatarFallback>
                                {g.name
                                  .split(" ")
                                  .slice(0, 2)
                                  .map((n) => n[0])
                                  .join("")
                                  .toUpperCase()}
                              </AvatarFallback>
                            </Avatar>

                            <span className="font-medium">{g.name}</span>
                          </div>
                        </TableCell>

                        <TableCell className="text-muted-foreground">
                          {g.phone || "—"}
                        </TableCell>

                        <TableCell className="text-muted-foreground">
                          {g.email || "—"}
                        </TableCell>

                        <TableCell>
                          {tenancy
                            ? `${getRoomLabel(tenancy.roomId)} · ${getBedLabel(
                                tenancy.bedId,
                              )}`
                            : "—"}
                        </TableCell>

                        <TableCell className="text-muted-foreground">
                          {tenancy
                            ? new Date(tenancy.startDate).toLocaleDateString(
                                "en-IN",
                                {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                },
                              )
                            : "—"}
                        </TableCell>

                        <TableCell>
                          <span className="inline-flex items-center rounded-full bg-emerald-500/10 text-emerald-600 px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ring-emerald-500/20">
                            Active
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
