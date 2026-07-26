"use client";

import { useState } from "react";
import { useStore, monthLabel, type PaymentStatus } from "@/lib/store";
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

export default function PaymentsPage() {
  const { guests, payments, months, tenancies, updatePayment, getGuestBed } = useStore();
  const activeGuests = guests.filter((g) => getGuestBed(g.id));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Payment Tracker</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Click any cell to update status and amount.
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
              {activeGuests.map((g) => {
                const rent = tenancies.find((t) => t.guestId === g.id && !t.endDate)?.rent ?? 0;
                return (
                  <tr key={g.id} className="border-t">
                    <td className="px-4 py-3 sticky left-0 bg-background">
                      <div className="font-medium">{g.name}</div>
                      <div className="text-xs text-muted-foreground">₹{rent.toLocaleString()}/mo</div>
                    </td>
                    {months.map((m) => {
                      const p = payments.find((p) => p.guestId === g.id && p.month === m);
                      return (
                        <td key={m} className="px-4 py-3">
                          <PaymentCell
                            guestId={g.id}
                            month={m}
                            rent={rent}
                            status={p?.status ?? "pending"}
                            amount={p?.amount ?? 0}
                            onSave={(s, a) => updatePayment(g.id, m, s, a)}
                          />
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
              {activeGuests.length === 0 && (
                <tr><td colSpan={months.length + 1} className="text-center text-sm text-muted-foreground py-10">No active guests yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function PaymentCell({
  guestId, month, rent, status, amount, onSave,
}: {
  guestId: string;
  month: string;
  rent: number;
  status: PaymentStatus;
  amount: number;
  onSave: (s: PaymentStatus, a: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const [s, setS] = useState<PaymentStatus>(status);
  const [a, setA] = useState(amount);

  return (
    <Popover open={open} onOpenChange={(v) => { setOpen(v); if (v) { setS(status); setA(amount); } }}>
      <PopoverTrigger asChild>
        <button className="focus:outline-none focus:ring-2 focus:ring-ring rounded-full">
          <StatusBadge status={status} />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 rounded-xl">
        <div className="space-y-3">
          <div>
            <div className="text-xs text-muted-foreground">{monthLabel(month)}</div>
            <div className="text-sm font-medium">Update payment</div>
          </div>
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={s} onValueChange={(v) => {
              const newS = v as PaymentStatus;
              setS(newS);
              if (newS === "paid") setA(rent);
              if (newS === "pending") setA(0);
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
            <div className="text-[11px] text-muted-foreground">Rent ₹{rent.toLocaleString()}</div>
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
