import { cn } from "@/lib/utils";
import type { PaymentStatus } from "@/lib/store";

export function StatusBadge({ status, className }: { status: PaymentStatus; className?: string }) {
  const map: Record<PaymentStatus, string> = {
    paid: "bg-primary/10 text-primary ring-primary/20",
    pending: "bg-warning/15 text-warning-foreground ring-warning/30",
    partial: "bg-muted text-warning-foreground ring-border",
  };
  const label = { paid: "Paid", pending: "Pending", partial: "Partial" }[status];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        map[status],
        className,
      )}
    >
      {label}
    </span>
  );
}
