"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { generalFunctions } from "@/lib/generalFunctions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/status-badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircle } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
type PaymentStatus = "paid" | "pending" | "partial";

interface Property { propertyId: string; name: string; }
interface Guest { guestId: string; name: string; phone: string; }
interface Tenancy { tenancyId: string; guestId: string; roomId: string; bedId: string; isActive: boolean; }
interface Room { roomId: string; roomNumber: string; bedCount: number; }
interface Pricing { propertyPricingId: string; bedCount: number; rentAmount: number; }

interface PaymentRecord {
  status: PaymentStatus;
  amount: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function monthLabel(yyyymm: string) {
  const [y, m] = yyyymm.split("-");
  return new Date(Number(y), Number(m) - 1).toLocaleString("en-IN", {
    month: "short",
    year: "numeric",
  });
}

/** Generate last N months in YYYY-MM format */
function buildMonths(n = 4): string[] {
  const months: string[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  return months;
}

async function api<T>(path: string): Promise<T> {
  const { url, options } = await generalFunctions.createRequest(path);
  const res = await fetch(url, options);
  if (!res.ok) throw new Error("Request failed");
  return res.json();
}

// ─── PaymentCell ──────────────────────────────────────────────────────────────
function PaymentCell({
  rent,
  record,
  onSave,
}: {
  rent: number;
  record: PaymentRecord;
  onSave: (s: PaymentStatus, a: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const [s, setS] = useState<PaymentStatus>(record.status);
  const [a, setA] = useState(record.amount);

  const handleOpen = (v: boolean) => {
    setOpen(v);
    if (v) { setS(record.status); setA(record.amount); }
  };

  return (
    <Popover open={open} onOpenChange={handleOpen}>
      <PopoverTrigger asChild>
        <button className="focus:outline-none focus:ring-2 focus:ring-ring rounded-full">
          <StatusBadge status={record.status} />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 rounded-xl">
        <div className="space-y-3">
          <div className="text-sm font-medium">Update payment</div>
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={s} onValueChange={(v) => {
              const ns = v as PaymentStatus;
              setS(ns);
              if (ns === "paid") setA(rent);
              if (ns === "pending") setA(0);
            }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Amount paid (₹)</Label>
            <Input type="number" value={a} onChange={(e) => setA(Number(e.target.value))} />
            <div className="text-[11px] text-muted-foreground">Rent ₹{rent.toLocaleString("en-IN")}</div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={() => { onSave(s, a); setOpen(false); }}>Save</Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function PaymentsPage() {
  const { data: session } = useSession();
  const months = buildMonths(4);

  // Local-only payment records: { [guestId_month]: PaymentRecord }
  const [payments, setPayments] = useState<Record<string, PaymentRecord>>({});

  const updatePayment = (guestId: string, month: string, s: PaymentStatus, a: number) => {
    setPayments((prev) => ({ ...prev, [`${guestId}_${month}`]: { status: s, amount: a } }));
  };

  const getPayment = (guestId: string, month: string): PaymentRecord =>
    payments[`${guestId}_${month}`] ?? { status: "pending", amount: 0 };

  // ── Live data ──────────────────────────────────────────────────────────────
  const { data: property, isLoading: loadingProp } = useQuery<Property | null>({
    queryKey: ["owner-property"],
    queryFn: () => api("/properties/me"),
    enabled: !!session?.accessToken,
  });

  const pid = property?.propertyId;

  const { data: guests = [], isLoading: loadingGuests } = useQuery<Guest[]>({
    queryKey: ["property-guests", pid],
    queryFn: () => api(`/tenancies/property/${pid}/guests`),
    enabled: !!pid,
  });

  const { data: tenancies = [] } = useQuery<Tenancy[]>({
    queryKey: ["property-tenancies", pid],
    queryFn: () => api(`/tenancies/property/${pid}/active`),
    enabled: !!pid,
  });

  const { data: rooms = [] } = useQuery<Room[]>({
    queryKey: ["rooms", pid],
    queryFn: () => api(`/properties/${pid}/rooms`),
    enabled: !!pid,
  });

  const { data: pricings = [] } = useQuery<Pricing[]>({
    queryKey: ["pricings", pid],
    queryFn: () => api(`/property-pricings/${pid}`),
    enabled: !!pid,
  });

  /** Derive rent for a guest by: tenancy → roomId → room.bedCount → pricing.rentAmount */
  const getRentForGuest = (guestId: string): number => {
    const tenancy = tenancies.find((t) => t.guestId === guestId);
    if (!tenancy) return 0;
    const room = rooms.find((r) => r.roomId === tenancy.roomId);
    if (!room) return 0;
    const pricing = pricings.find((p) => p.bedCount === room.bedCount);
    return pricing?.rentAmount ?? 0;
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
        <p className="text-sm text-muted-foreground">Complete onboarding setup first.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Payment Tracker</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Click any cell to update status. Rent is derived from room sharing type.
        </p>
      </div>

      <Card className="rounded-xl border shadow-none overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground sticky left-0 bg-muted/40 z-10 min-w-[200px]">
                  Guest
                </th>
                {months.map((m) => (
                  <th key={m} className="text-left px-4 py-3 font-medium text-muted-foreground min-w-[140px]">
                    {monthLabel(m)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {guests.length === 0 && (
                <tr>
                  <td colSpan={months.length + 1} className="text-center text-sm text-muted-foreground py-10">
                    No active guests yet.
                  </td>
                </tr>
              )}
              {guests.map((g) => {
                const rent = getRentForGuest(g.guestId);
                return (
                  <tr key={g.guestId} className="border-t">
                    <td className="px-4 py-3 sticky left-0 bg-background">
                      <div className="font-medium">{g.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {rent > 0 ? `₹${rent.toLocaleString("en-IN")}/mo` : "Rent not set"}
                      </div>
                    </td>
                    {months.map((m) => {
                      const rec = getPayment(g.guestId, m);
                      return (
                        <td key={m} className="px-4 py-3">
                          <PaymentCell
                            rent={rent}
                            record={rec}
                            onSave={(s, a) => updatePayment(g.guestId, m, s, a)}
                          />
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <p className="text-xs text-center text-muted-foreground">
        Payment status is tracked locally for this session. Persistent payment records are coming soon.
      </p>
    </div>
  );
}
