"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { useStore, monthLabel } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ArrowLeft, LogOut, Mail, Phone } from "lucide-react";

export default function GuestProfile() {
  const params = useParams<{ guestId: string }>();
  const router = useRouter();
  const { guests, payments, getGuestBed, vacateGuest, months } = useStore();
  const guest = guests.find((g) => g.id === params.guestId);
  const [open, setOpen] = useState(false);

  if (!guest) return <div className="p-8 text-muted-foreground">Guest not found.</div>;

  const info = getGuestBed(guest.id);
  const history = payments.filter((p) => p.guestId === guest.id).sort((a, b) => a.month.localeCompare(b.month));

  return (
    <div className="space-y-6">
      <Link href="/guest" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to guests
      </Link>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{guest.name}</h1>
          <div className="text-sm text-muted-foreground mt-1 flex items-center gap-4 flex-wrap">
            <span className="inline-flex items-center gap-1"><Phone className="h-3.5 w-3.5" />{guest.phone}</span>
            <span className="inline-flex items-center gap-1"><Mail className="h-3.5 w-3.5" />{guest.email}</span>
          </div>
        </div>
        {info && (
          <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="rounded-lg text-destructive hover:text-destructive">
                <LogOut className="h-4 w-4 mr-1" /> Vacate guest
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="rounded-xl">
              <AlertDialogHeader>
                <AlertDialogTitle>End this tenancy?</AlertDialogTitle>
                <AlertDialogDescription>
                  {guest.name} will be marked as vacated today. The bed becomes vacant immediately.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    vacateGuest(guest.id);
                    setOpen(false);
                    router.push("/guest");
                  }}
                >
                  Vacate
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="rounded-xl border shadow-none">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Room / Bed</CardTitle></CardHeader>
          <CardContent><div className="text-lg font-medium">{info ? `${info.room?.name} · ${info.bed?.label}` : "Unassigned"}</div></CardContent>
        </Card>
        <Card className="rounded-xl border shadow-none">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Rent</CardTitle></CardHeader>
          <CardContent><div className="text-lg font-medium">{info ? `₹${info.tenancy?.rent.toLocaleString()}` : "—"}</div></CardContent>
        </Card>
        <Card className="rounded-xl border shadow-none">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Joined</CardTitle></CardHeader>
          <CardContent><div className="text-lg font-medium">{guest.joinedAt}</div></CardContent>
        </Card>
      </div>

      <Card className="rounded-xl border shadow-none overflow-hidden">
        <CardHeader><CardTitle className="text-base">Payment history</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Month</TableHead>
                <TableHead>Rent</TableHead>
                <TableHead>Paid</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.length === 0 && (
                <TableRow><TableCell colSpan={4} className="text-sm text-muted-foreground text-center py-8">No payments yet.</TableCell></TableRow>
              )}
              {history.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>{monthLabel(p.month)}</TableCell>
                  <TableCell>₹{p.rent.toLocaleString()}</TableCell>
                  <TableCell>₹{p.amount.toLocaleString()}</TableCell>
                  <TableCell><StatusBadge status={p.status} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="text-xs text-muted-foreground">
        Tracking {months.length} months of history.
      </div>
    </div>
  );
}
