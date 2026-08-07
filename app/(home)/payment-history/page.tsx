"use client";

import { CreditCard, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";

type PaymentStatus = "paid" | "pending" | "upcoming";

interface PaymentRecord {
  month: string;
  label: string;
  amount: number;
  status: PaymentStatus;
}

const dummyPayments: PaymentRecord[] = [
  { month: "2026-08", label: "August 2026", amount: 8000, status: "upcoming" },
  { month: "2026-07", label: "July 2026", amount: 8000, status: "paid" },
  { month: "2026-06", label: "June 2026", amount: 8000, status: "paid" },
  { month: "2026-05", label: "May 2026", amount: 8000, status: "pending" },
];

const statusConfig: Record<
  PaymentStatus,
  { label: string; icon: React.ReactNode; badge: string; row: string }
> = {
  paid: {
    label: "Paid",
    icon: <CheckCircle2 className="h-4 w-4" />,
    badge:
      "bg-emerald-500/10 text-emerald-600 ring-emerald-500/20",
    row: "",
  },
  pending: {
    label: "Pending",
    icon: <AlertCircle className="h-4 w-4" />,
    badge: "bg-red-500/10 text-red-600 ring-red-500/20",
    row: "",
  },
  upcoming: {
    label: "Upcoming",
    icon: <Clock className="h-4 w-4" />,
    badge: "bg-muted text-muted-foreground ring-border",
    row: "",
  },
};

export default function PaymentHistoryPage() {
  const totalPaid = dummyPayments
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + p.amount, 0);
  const pending = dummyPayments.find((p) => p.status === "pending");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Payment History</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Your monthly rent payment timeline.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border bg-gradient-to-br from-emerald-500/10 to-transparent p-5">
          <p className="text-xs font-medium text-muted-foreground">Total Paid</p>
          <p className="mt-1 text-2xl font-bold">
            ₹{totalPaid.toLocaleString("en-IN")}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {dummyPayments.filter((p) => p.status === "paid").length} months
          </p>
        </div>
        {pending && (
          <div className="rounded-xl border bg-gradient-to-br from-red-500/10 to-transparent p-5">
            <p className="text-xs font-medium text-muted-foreground">Due</p>
            <p className="mt-1 text-2xl font-bold text-red-600">
              ₹{pending.amount.toLocaleString("en-IN")}
            </p>
            <p className="text-xs text-muted-foreground mt-1">{pending.label}</p>
          </div>
        )}
      </div>

      {/* Timeline */}
      <Card className="rounded-xl border shadow-none overflow-hidden">
        <div className="divide-y">
          {dummyPayments.map((p, i) => {
            const cfg = statusConfig[p.status];
            return (
              <div
                key={p.month}
                className="flex items-center justify-between px-5 py-4 transition-colors hover:bg-muted/30"
              >
                <div className="flex items-center gap-4">
                  {/* Timeline dot */}
                  <div className="relative flex flex-col items-center">
                    <div
                      className={`h-2.5 w-2.5 rounded-full ${
                        p.status === "paid"
                          ? "bg-emerald-500"
                          : p.status === "pending"
                          ? "bg-red-500"
                          : "bg-muted-foreground/40"
                      }`}
                    />
                    {i < dummyPayments.length - 1 && (
                      <div className="absolute top-3 h-full w-px bg-border" />
                    )}
                  </div>

                  {/* Info */}
                  <div>
                    <p className="font-medium text-sm">{p.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      ₹{p.amount.toLocaleString("en-IN")} / month
                    </p>
                  </div>
                </div>

                {/* Status badge */}
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${cfg.badge}`}
                >
                  {cfg.icon}
                  {cfg.label}
                </span>
              </div>
            );
          })}
        </div>
      </Card>

      <p className="text-xs text-center text-muted-foreground">
        Payment history is for display purposes only. Contact your property owner for issues.
      </p>
    </div>
  );
}
