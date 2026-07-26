"use client";

import { useState } from "react";
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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Plus } from "lucide-react";

export default function RoomsPage() {
  const { rooms, beds, addRoom, addBed, getBedStatus } = useStore();
  const [roomOpen, setRoomOpen] = useState(false);
  const [bedOpen, setBedOpen] = useState(false);
  const [roomForm, setRoomForm] = useState({ name: "", floor: "" });
  const [bedForm, setBedForm] = useState({ roomId: "", label: "" });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Rooms & Beds</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {rooms.length} rooms · {beds.length} beds
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={bedOpen} onOpenChange={setBedOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="rounded-lg">
                <Plus className="h-4 w-4 mr-1" /> Add Bed
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-xl">
              <DialogHeader>
                <DialogTitle>Add bed</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label>Room</Label>
                  <Select
                    value={bedForm.roomId}
                    onValueChange={(v) => setBedForm({ ...bedForm, roomId: v })}
                  >
                    <SelectTrigger><SelectValue placeholder="Select room" /></SelectTrigger>
                    <SelectContent>
                      {rooms.map((r) => (
                        <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Bed label</Label>
                  <Input
                    placeholder="Bed 3"
                    value={bedForm.label}
                    onChange={(e) => setBedForm({ ...bedForm, label: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  onClick={() => {
                    if (!bedForm.roomId || !bedForm.label) return;
                    addBed(bedForm);
                    setBedForm({ roomId: "", label: "" });
                    setBedOpen(false);
                  }}
                >
                  Add bed
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={roomOpen} onOpenChange={setRoomOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-lg">
                <Plus className="h-4 w-4 mr-1" /> Add Room
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-xl">
              <DialogHeader>
                <DialogTitle>Add room</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label>Name</Label>
                  <Input
                    placeholder="Room 301"
                    value={roomForm.name}
                    onChange={(e) => setRoomForm({ ...roomForm, name: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Floor</Label>
                  <Input
                    placeholder="3rd Floor"
                    value={roomForm.floor}
                    onChange={(e) => setRoomForm({ ...roomForm, floor: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  onClick={() => {
                    if (!roomForm.name) return;
                    addRoom(roomForm);
                    setRoomForm({ name: "", floor: "" });
                    setRoomOpen(false);
                  }}
                >
                  Add room
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="rounded-xl border shadow-none p-2">
        <Accordion type="multiple" className="w-full">
          {rooms.map((room) => {
            const roomBeds = beds.filter((b) => b.roomId === room.id);
            const occ = roomBeds.filter((b) => getBedStatus(b.id) === "occupied").length;
            return (
              <AccordionItem value={room.id} key={room.id} className="border-b last:border-b-0">
                <AccordionTrigger className="px-4 hover:no-underline">
                  <div className="flex items-center justify-between w-full pr-4">
                    <div className="text-left">
                      <div className="font-medium">{room.name}</div>
                      <div className="text-xs text-muted-foreground">{room.floor}</div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {occ}/{roomBeds.length} occupied
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
                    {roomBeds.map((bed) => {
                      const status = getBedStatus(bed.id);
                      return (
                        <div
                          key={bed.id}
                          className="flex items-center justify-between rounded-lg border p-3"
                        >
                          <span className="text-sm">{bed.label}</span>
                          <span
                            className={
                              status === "occupied"
                                ? "inline-flex items-center rounded-full bg-primary/10 text-primary px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ring-primary/20"
                                : "inline-flex items-center rounded-full bg-muted text-muted-foreground px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ring-border"
                            }
                          >
                            {status === "occupied" ? "Occupied" : "Vacant"}
                          </span>
                        </div>
                      );
                    })}
                    {roomBeds.length === 0 && (
                      <div className="text-sm text-muted-foreground">No beds yet.</div>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </Card>
    </div>
  );
}
