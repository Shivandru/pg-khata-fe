"use client";

import { useState } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, UserPlus } from "lucide-react";

export default function GuestsPage() {
  const { guests, beds, rooms, addGuest, assignGuest, getGuestBed, getBedStatus } = useStore();
  const [addOpen, setAddOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", email: "" });
  const [assign, setAssign] = useState({
    guestId: "",
    bedId: "",
    startDate: new Date().toISOString().slice(0, 10),
    rent: 8500,
  });

  const vacantBeds = beds.filter((b) => getBedStatus(b.id) === "vacant");
  const unassignedGuests = guests.filter((g) => !getGuestBed(g.id));

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Guests</h1>
          <p className="text-sm text-muted-foreground mt-1">{guests.length} total guests</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="rounded-lg">
                <UserPlus className="h-4 w-4 mr-1" /> Assign to Bed
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-xl">
              <DialogHeader>
                <DialogTitle>Assign guest to bed</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label>Guest</Label>
                  <Select
                    value={assign.guestId}
                    onValueChange={(v) => setAssign({ ...assign, guestId: v })}
                  >
                    <SelectTrigger><SelectValue placeholder="Pick guest" /></SelectTrigger>
                    <SelectContent>
                      {unassignedGuests.length === 0 && (
                        <SelectItem value="_none" disabled>All guests assigned</SelectItem>
                      )}
                      {unassignedGuests.map((g) => (
                        <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Vacant bed</Label>
                  <Select
                    value={assign.bedId}
                    onValueChange={(v) => setAssign({ ...assign, bedId: v })}
                  >
                    <SelectTrigger><SelectValue placeholder="Pick vacant bed" /></SelectTrigger>
                    <SelectContent>
                      {vacantBeds.map((b) => {
                        const r = rooms.find((r) => r.id === b.roomId);
                        return (
                          <SelectItem key={b.id} value={b.id}>
                            {r?.name} · {b.label}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Start date</Label>
                    <Input
                      type="date"
                      value={assign.startDate}
                      onChange={(e) => setAssign({ ...assign, startDate: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Rent (₹)</Label>
                    <Input
                      type="number"
                      value={assign.rent}
                      onChange={(e) => setAssign({ ...assign, rent: Number(e.target.value) })}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  onClick={() => {
                    if (!assign.guestId || !assign.bedId) return;
                    assignGuest(assign.guestId, assign.bedId, assign.startDate, assign.rent);
                    setAssignOpen(false);
                  }}
                >
                  Assign
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-lg">
                <Plus className="h-4 w-4 mr-1" /> Add Guest
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-xl">
              <DialogHeader>
                <DialogTitle>Add guest</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label>Name</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Phone</Label>
                  <Input
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  onClick={() => {
                    if (!form.name) return;
                    addGuest(form);
                    setForm({ name: "", phone: "", email: "" });
                    setAddOpen(false);
                  }}
                >
                  Add guest
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="rounded-xl border shadow-none overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Room / Bed</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {guests.map((g) => {
              const info = getGuestBed(g.id);
              return (
                <TableRow key={g.id}>
                  <TableCell>
                    <Link
                      href={`/guest/${g.id}`}
                      className="font-medium hover:text-primary"
                    >
                      {g.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{g.phone}</TableCell>
                  <TableCell>
                    {info ? `${info.room?.name} · ${info.bed?.label}` : "—"}
                  </TableCell>
                  <TableCell>
                    {info ? (
                      <span className="inline-flex items-center rounded-full bg-primary/10 text-primary px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ring-primary/20">
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-muted text-muted-foreground px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ring-border">
                        Unassigned
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
