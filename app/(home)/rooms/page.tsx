"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { generalFunctions } from "@/lib/generalFunctions";
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
import { Plus, BedDouble, AlertCircle } from "lucide-react";
import {
  OwnerBuildStep,
  type PricingEntry,
  type RoomEntry,
} from "@/components/onboarding/OwnerBuildStep";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Property { propertyId: string; name: string; }
interface Room {
  roomId: string;
  propertyId: string;
  roomNumber: string;
  floor: number;
  bedCount: number;
  occupiedCount: number;
}
interface Bed { bedId: string; roomId: string; propertyId: string; label: string; isOccupied: boolean; }

// ─── API helper ───────────────────────────────────────────────────────────────
async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const { url, options } = await generalFunctions.createRequest(path, init);
  const res = await fetch(url, options);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Request failed" }));
    throw new Error(err.message ?? "Request failed");
  }
  return res.json();
}

export default function RoomsPage() {
  const { data: session } = useSession();
  const qc = useQueryClient();

  const [roomOpen, setRoomOpen] = useState(false);
  const [bedOpen, setBedOpen] = useState(false);
  const [roomForm, setRoomForm] = useState({ roomNumber: "", floor: "1", bedCount: "2" });
  const [bedForm, setBedForm] = useState({ roomId: "" });

  const [propertyName, setPropertyName] = useState("");
  const [propertyAddress, setPropertyAddress] = useState("");
  const [pricing, setPricing] = useState<PricingEntry[]>([
    { bedCount: 1, rentAmount: 15000 },
    { bedCount: 2, rentAmount: 8000 },
    { bedCount: 3, rentAmount: 7000 },
    { bedCount: 4, rentAmount: 6000 },
  ]);
  const [roomsDraft, setRoomsDraft] = useState<RoomEntry[]>([
    { roomNumber: "101", floor: 1, bedCount: 2 },
  ]);
  const [buildError, setBuildError] = useState("");

  const addDraftRoom = () =>
    setRoomsDraft((prev) => [...prev, { roomNumber: "", floor: 1, bedCount: 1 }]);
  const removeDraftRoom = (index: number) =>
    setRoomsDraft((prev) => prev.filter((_, idx) => idx !== index));
  const updateDraftRoom = (
    index: number,
    field: keyof RoomEntry,
    value: string | number,
  ) =>
    setRoomsDraft((prev) =>
      prev.map((r, idx) => (idx === index ? { ...r, [field]: value } : r)),
    );
  const updatePricing = (index: number, value: number) =>
    setPricing((prev) =>
      prev.map((p, idx) => (idx === index ? { ...p, rentAmount: value } : p)),
    );

  // ── Fetch owner's property ──────────────────────────────────────────────────
  const { data: property, isLoading: loadingProp } = useQuery<Property | null>({
    queryKey: ["owner-property"],
    queryFn: () => api("/properties/me"),
    enabled: !!session?.accessToken,
  });

  const pid = property?.propertyId;

  // ── Fetch rooms ─────────────────────────────────────────────────────────────
  const { data: rooms = [], isLoading: loadingRooms } = useQuery<Room[]>({
    queryKey: ["rooms", pid],
    queryFn: () => api(`/properties/${pid}/rooms`),
    enabled: !!pid,
  });

  // ── Fetch beds for all rooms ─────────────────────────────────────────────────
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

  const buildPropertyMutation = useMutation({
    mutationFn: async () => {
      if (!propertyName.trim() || !propertyAddress.trim()) {
        throw new Error("Property name and address are required.");
      }
      if (roomsDraft.some((r) => !r.roomNumber.trim())) {
        throw new Error("All rooms must have a room number.");
      }
      const { url, options } = await generalFunctions.createRequest("/build", {
        method: "POST",
        body: JSON.stringify({
          name: propertyName,
          address: propertyAddress,
          pricing,
          rooms: roomsDraft,
        }),
      });
      const res = await fetch(url, options);
      if (!res.ok) throw new Error("Failed to build property");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["owner-property"] }),
    onError: (err) =>
      setBuildError((err as Error).message ?? "Something went wrong."),
  });

  // ── Add room mutation ───────────────────────────────────────────────────────
  const addRoomMutation = useMutation({
    mutationFn: () =>
      api(`/room-setup/${pid}`, {
        method: "POST",
        body: JSON.stringify({
          roomNumber: roomForm.roomNumber,
          floor: Number(roomForm.floor),
          bedCount: Number(roomForm.bedCount),
        }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["rooms", pid] });
      setRoomForm({ roomNumber: "", floor: "1", bedCount: "2" });
      setRoomOpen(false);
    },
  });

  // ── Add bed mutation ────────────────────────────────────────────────────────
  const addBedMutation = useMutation({
    mutationFn: () =>
      api(`/bed-setup/${pid}/rooms/${bedForm.roomId}`, {
        method: "POST",
        body: JSON.stringify({ }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["all-beds", pid] });
      setBedForm({ roomId: "" });
      setBedOpen(false);
    },
  });

  const totalBeds = allBeds.length;
  const occupiedBeds = allBeds.filter((b) => b.isOccupied).length;

  if (loadingProp || loadingRooms) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!property) {
    return (
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Rooms & Beds</h1>
            <p className="text-sm text-muted-foreground mt-1">
              No property found. Create your first property to continue.
            </p>
          </div>
        </div>

        <Card className="rounded-xl border shadow-none p-6">
          <div className="flex items-start gap-3 mb-6">
            <AlertCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="font-medium">Property setup required</p>
              <p className="text-sm text-muted-foreground">
                You can create your property here anytime from the sidebar.
              </p>
            </div>
          </div>

          <OwnerBuildStep
            propertyName={propertyName}
            setPropertyName={setPropertyName}
            propertyAddress={propertyAddress}
            setPropertyAddress={setPropertyAddress}
            pricing={pricing}
            updatePricing={updatePricing}
            rooms={roomsDraft}
            addRoom={addDraftRoom}
            removeRoom={removeDraftRoom}
            updateRoom={updateDraftRoom}
            buildError={buildError}
            isBuilding={buildPropertyMutation.isPending}
            onSubmit={() => {
              setBuildError("");
              buildPropertyMutation.mutate();
            }}
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Rooms & Beds</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {rooms.length} rooms · {totalBeds} beds · {occupiedBeds} occupied
          </p>
        </div>
        <div className="flex gap-2">
          {/* Add Bed dialog */}
          <Dialog open={bedOpen} onOpenChange={setBedOpen}>
            <Button variant="outline" className="rounded-lg" onClick={() => setBedOpen(true)}>
              <Plus className="h-4 w-4 mr-1" /> Add Bed
            </Button>
            <DialogContent className="rounded-xl">
              <DialogHeader><DialogTitle>Add bed to a room</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label>Room</Label>
                  <Select value={bedForm.roomId} onValueChange={(v) => setBedForm({ ...bedForm, roomId: v })}>
                    <SelectTrigger><SelectValue placeholder="Select room" /></SelectTrigger>
                    <SelectContent>
                      {rooms.map((r) => (
                        <SelectItem key={r.roomId} value={r.roomId}>
                          Room {r.roomNumber} — Floor {r.floor}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {addBedMutation.error && (
                  <p className="text-xs text-destructive">{(addBedMutation.error as Error).message}</p>
                )}
              </div>
              <DialogFooter>
                <Button
                  disabled={!bedForm.roomId || addBedMutation.isPending}
                  onClick={() => addBedMutation.mutate()}
                >
                  {addBedMutation.isPending ? "Adding…" : "Add bed"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Add Room dialog */}
          <Dialog open={roomOpen} onOpenChange={setRoomOpen}>
            <Button className="rounded-lg" onClick={() => setRoomOpen(true)}>
              <Plus className="h-4 w-4 mr-1" /> Add Room
            </Button>
            <DialogContent className="rounded-xl">
              <DialogHeader><DialogTitle>Add room</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label>Room Number</Label>
                  <Input
                    placeholder="101"
                    value={roomForm.roomNumber}
                    onChange={(e) => setRoomForm({ ...roomForm, roomNumber: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Floor</Label>
                    <Select value={roomForm.floor} onValueChange={(v) => setRoomForm({ ...roomForm, floor: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((f) => (
                          <SelectItem key={f} value={String(f)}>Floor {f}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Beds</Label>
                    <Select value={roomForm.bedCount} onValueChange={(v) => setRoomForm({ ...roomForm, bedCount: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5, 6].map((b) => (
                          <SelectItem key={b} value={String(b)}>{b} bed{b > 1 ? "s" : ""}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {addRoomMutation.error && (
                  <p className="text-xs text-destructive">{(addRoomMutation.error as Error).message}</p>
                )}
              </div>
              <DialogFooter>
                <Button
                  disabled={!roomForm.roomNumber || addRoomMutation.isPending}
                  onClick={() => addRoomMutation.mutate()}
                >
                  {addRoomMutation.isPending ? "Adding…" : "Add room"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="rounded-xl border shadow-none p-2">
        {rooms.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
            <BedDouble className="h-8 w-8 text-muted-foreground" />
            <p className="font-medium text-sm">No rooms added yet</p>
            <p className="text-xs text-muted-foreground">Click "Add Room" to get started.</p>
          </div>
        ) : (
          <Accordion type="multiple" className="w-full">
            {rooms.map((room) => {
              const roomBeds = allBeds.filter((b) => b.roomId === room.roomId);
              const occ = roomBeds.filter((b) => b.isOccupied).length;
              return (
                <AccordionItem value={room.roomId} key={room.roomId} className="border-b last:border-b-0">
                  <AccordionTrigger className="px-4 hover:no-underline">
                    <div className="flex items-center justify-between w-full pr-4">
                      <div className="text-left">
                        <div className="font-medium">Room {room.roomNumber}</div>
                        <div className="text-xs text-muted-foreground">Floor {room.floor}</div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {occ}/{roomBeds.length} occupied
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
                      {roomBeds.map((bed) => (
                        <div
                          key={bed.bedId}
                          className="flex items-center justify-between rounded-lg border p-3"
                        >
                          <span className="text-sm font-medium">{bed.label}</span>
                          <span className={
                            bed.isOccupied
                              ? "inline-flex items-center rounded-full bg-primary/10 text-primary px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ring-primary/20"
                              : "inline-flex items-center rounded-full bg-muted text-muted-foreground px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ring-border"
                          }>
                            {bed.isOccupied ? "Occupied" : "Vacant"}
                          </span>
                        </div>
                      ))}
                      {roomBeds.length === 0 && (
                        <div className="text-sm text-muted-foreground">No beds in this room yet.</div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        )}
      </Card>
    </div>
  );
}
