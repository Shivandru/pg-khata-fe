"use client";

import Link from "next/link";
import { useStore, monthLabel } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { Building2, Users, CreditCard, BedDouble } from "lucide-react";

export default function DashboardPage() {
  const { rooms, beds, guests, tenancies, payments, months, getGuestBed, getBedStatus } = useStore();

  const currentMonth = months[months.length - 1];
  const occupiedBeds = beds.filter((b) => getBedStatus(b.id) === "occupied").length;
  const occupancyPct = beds.length > 0 ? Math.round((occupiedBeds / beds.length) * 100) : 0;

  const activeGuests = guests.filter((g) => getGuestBed(g.id));
  const currentMonthPayments = payments.filter((p) => p.month === currentMonth);
  const totalDue = currentMonthPayments.reduce((sum, p) => sum + p.rent, 0);
  const totalCollected = currentMonthPayments.reduce((sum, p) => sum + p.amount, 0);
  const collectionPct = totalDue > 0 ? Math.round((totalCollected / totalDue) * 100) : 0;
  const pendingCount = currentMonthPayments.filter((p) => p.status === "pending" || p.status === "partial").length;

  const stats = [
    {
      title: "Total Rooms",
      value: rooms.length,
      sub: `${beds.length} beds total`,
      icon: Building2,
      href: "/rooms",
    },
    {
      title: "Occupancy",
      value: `${occupancyPct}%`,
      sub: `${occupiedBeds} / ${beds.length} beds occupied`,
      icon: BedDouble,
      href: "/rooms",
    },
    {
      title: "Active Guests",
      value: activeGuests.length,
      sub: `${guests.length - activeGuests.length} unassigned`,
      icon: Users,
      href: "/guest",
    },
    {
      title: "Collection",
      value: `${collectionPct}%`,
      sub: `₹${totalCollected.toLocaleString()} / ₹${totalDue.toLocaleString()}`,
      icon: CreditCard,
      href: "/payments",
    },
  ];

  // Recent payment activity — last 5 entries from current month
  const recentPayments = currentMonthPayments
    .slice()
    .sort((a, b) => {
      const order = { pending: 0, partial: 1, paid: 2 };
      return order[a.status] - order[b.status];
    })
    .slice(0, 6);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Overview for <span className="font-medium">{monthLabel(currentMonth)}</span>
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Link key={s.title} href={s.href}>
            <Card className="rounded-xl border shadow-none hover:border-primary/40 hover:shadow-soft transition-all cursor-pointer group">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {s.title}
                </CardTitle>
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <s.icon className="h-4 w-4 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold tracking-tight">{s.value}</div>
                <p className="text-xs text-muted-foreground mt-1">{s.sub}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Pending alerts */}
      {pendingCount > 0 && (
        <div className="rounded-xl border border-warning/30 bg-warning/5 px-4 py-3 flex items-center gap-3">
          <CreditCard className="h-4 w-4 text-warning-foreground shrink-0" />
          <p className="text-sm text-warning-foreground">
            <span className="font-semibold">{pendingCount} payment{pendingCount > 1 ? "s" : ""}</span> pending or partial for {monthLabel(currentMonth)}.{" "}
            <Link href="/payments" className="underline underline-offset-2 hover:opacity-80">
              View tracker →
            </Link>
          </p>
        </div>
      )}

      {/* Recent payments for current month */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold">{monthLabel(currentMonth)} payments</h2>
          <Link href="/payments" className="text-xs text-primary hover:underline">
            View all →
          </Link>
        </div>
        <Card className="rounded-xl border shadow-none overflow-hidden">
          <div className="divide-y">
            {recentPayments.length === 0 && (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No payment records yet for this month.
              </div>
            )}
            {recentPayments.map((p) => {
              const guest = guests.find((g) => g.id === p.guestId);
              const tenancy = tenancies.find((t) => t.guestId === p.guestId && !t.endDate);
              return (
                <div key={p.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <Link href={`/guest/${p.guestId}`} className="text-sm font-medium hover:text-primary">
                      {guest?.name ?? p.guestId}
                    </Link>
                    <div className="text-xs text-muted-foreground">
                      ₹{p.amount.toLocaleString()} / ₹{(tenancy?.rent ?? p.rent).toLocaleString()}
                    </div>
                  </div>
                  <StatusBadge status={p.status} />
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}