"use client";

import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { generalFunctions } from "@/lib/generalFunctions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Users, BedDouble, CreditCard } from "lucide-react";
import Link from "next/link";

interface Property { propertyId: string; name: string; address: string; }
interface Room { roomId: string; roomNumber: string; floor: number; bedCount: number; occupiedCount: number; }
interface Bed { bedId: string; label: string; isOccupied: boolean; }
interface Guest { guestId: string; name: string; phone: string; }

async function api<T>(path: string): Promise<T> {
  const { url, options } = await generalFunctions.createRequest(path);
  const res = await fetch(url, options);
  if (!res.ok) throw new Error("Request failed");
  return res.json();
}

export default function DashboardPage() {
  const { data: session } = useSession();

  const { data: property, isLoading: loadingProp } = useQuery<Property | null>({
    queryKey: ["owner-property"],
    queryFn: () => api("/properties/me"),
    enabled: !!session?.accessToken,
  });

  const pid = property?.propertyId;

  const { data: rooms = [] } = useQuery<Room[]>({
    queryKey: ["rooms", pid],
    queryFn: () => api(`/properties/${pid}/rooms`),
    enabled: !!pid,
  });

  const { data: allBeds = [] } = useQuery<Bed[]>({
    queryKey: ["all-beds", pid, rooms.map((r) => r.roomId).join(",")],
    queryFn: async () => {
      const results = await Promise.all(
        rooms.map((r) => api<Bed[]>(`/properties/${pid}/rooms/${r.roomId}/beds`))
      );
      return results.flat();
    },
    enabled: !!pid && rooms.length > 0,
  });

  const { data: guests = [] } = useQuery<Guest[]>({
    queryKey: ["property-guests", pid],
    queryFn: () => api(`/tenancies/property/${pid}/guests`),
    enabled: !!pid,
  });

  const occupiedBeds = allBeds.filter((b) => b.isOccupied).length;
  const occupancyPct = allBeds.length > 0 ? Math.round((occupiedBeds / allBeds.length) * 100) : 0;

  const stats = [
    {
      title: "Total Rooms",
      value: loadingProp ? "—" : rooms.length,
      sub: `${allBeds.length} beds total`,
      icon: Building2,
      href: "/rooms",
      color: "text-blue-600",
      bg: "bg-blue-500/10",
    },
    {
      title: "Occupancy",
      value: loadingProp ? "—" : `${occupancyPct}%`,
      sub: `${occupiedBeds} / ${allBeds.length} beds occupied`,
      icon: BedDouble,
      href: "/rooms",
      color: "text-violet-600",
      bg: "bg-violet-500/10",
    },
    {
      title: "Active Guests",
      value: loadingProp ? "—" : guests.length,
      sub: "current tenants",
      icon: Users,
      href: "/guest",
      color: "text-emerald-600",
      bg: "bg-emerald-500/10",
    },
    {
      title: "Payments",
      value: "—",
      sub: "track in Payments tab",
      icon: CreditCard,
      href: "/payments",
      color: "text-amber-600",
      bg: "bg-amber-500/10",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        {property && (
          <p className="text-sm text-muted-foreground mt-1">
            {property.name} · {property.address}
          </p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Link href={s.href} key={s.title}>
            <Card className="rounded-xl border shadow-none hover:shadow-md hover:border-primary/30 transition-all cursor-pointer group">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {s.title}
                </CardTitle>
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${s.bg}`}>
                  <s.icon className={`h-4 w-4 ${s.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{s.value}</div>
                <p className="text-xs text-muted-foreground mt-1">{s.sub}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Recent guests */}
      {guests.length > 0 && (
        <div>
          <h2 className="text-base font-semibold mb-3">Recent Tenants</h2>
          <Card className="rounded-xl border shadow-none overflow-hidden">
            <div className="divide-y">
              {guests.slice(0, 5).map((g) => (
                <div key={g.guestId} className="flex items-center gap-4 px-5 py-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-semibold">
                    {g.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{g.name}</p>
                    <p className="text-xs text-muted-foreground">{g.phone || "No phone"}</p>
                  </div>
                  <span className="ml-auto inline-flex items-center rounded-full bg-emerald-500/10 text-emerald-600 px-2 py-0.5 text-xs font-medium ring-1 ring-inset ring-emerald-500/20">
                    Active
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}