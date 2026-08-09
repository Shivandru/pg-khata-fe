"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  Building2,
  Users,
  ChevronRight,
  Plus,
  Trash2,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { generalFunctions } from "@/lib/generalFunctions";

// ─── Types ────────────────────────────────────────────────────────────────────
type Role = "owner" | "guest";

interface Property {
  propertyId: string;
  name: string;
  address: string;
}
interface Room {
  roomId: string;
  roomNumber: string;
  floor: number;
  bedCount: number;
  occupiedCount: number;
}
interface Bed {
  bedId: string;
  label: string;
  isOccupied: boolean;
}
interface RoomEntry {
  roomNumber: string;
  floor: number;
  bedCount: number;
}
interface PricingEntry {
  bedCount: number;
  rentAmount: number;
}

// ─── API helpers ──────────────────────────────────────────────────────────────
async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const { url, options } = await generalFunctions.createRequest(path, init);
  const res = await fetch(url, options);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Request failed" }));
    throw new Error(err.message ?? "Request failed");
  }
  return res.json();
}

// ─── Step indicator ───────────────────────────────────────────────────────────
function StepDot({ active, done }: { active: boolean; done: boolean }) {
  return (
    <div
      className={`h-2.5 w-2.5 rounded-full transition-all duration-300 ${
        done ? "bg-primary" : active ? "bg-primary scale-125" : "bg-muted"
      }`}
    />
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function OnboardingPage() {
  const { data: session, status, update: updateSession } = useSession();
  const router = useRouter();

  // Step state
  const [step, setStep] = useState<"role" | "owner-build" | "guest-tenancy">(
    "role",
  );
  const [role, setRole] = useState<Role | null>(null);
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [isSubmittingRole, setIsSubmittingRole] = useState(false);

  // ── Owner build state ──
  const [propertyName, setPropertyName] = useState("");
  const [propertyAddress, setPropertyAddress] = useState("");
  const [pricing, setPricing] = useState<PricingEntry[]>([
    { bedCount: 1, rentAmount: 15000 },
    { bedCount: 2, rentAmount: 8000 },
    { bedCount: 3, rentAmount: 7000 },
    { bedCount: 4, rentAmount: 6000 },
  ]);
  const [rooms, setRooms] = useState<RoomEntry[]>([
    { roomNumber: "101", floor: 1, bedCount: 2 },
  ]);
  const [buildError, setBuildError] = useState("");
  const [isBuildingProperty, setIsBuildingProperty] = useState(false);

  // ── Guest tenancy state ──
  const [selectedPropertyId, setSelectedPropertyId] = useState("");
  const [selectedRoomId, setSelectedRoomId] = useState("");
  const [selectedBedId, setSelectedBedId] = useState("");
  const [startDate, setStartDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [tenancyError, setTenancyError] = useState("");
  const [isRegisteringTenancy, setIsRegisteringTenancy] = useState(false);

  // ── Queries for guest flow ──
  const { data: properties = [] } = useQuery<Property[]>({
    queryKey: ["properties"],
    queryFn: () => apiRequest("/properties"),
    enabled: step === "guest-tenancy",
  });

  const { data: fetchedRooms = [] } = useQuery<Room[]>({
    queryKey: ["rooms", selectedPropertyId],
    queryFn: () => apiRequest(`/properties/${selectedPropertyId}/rooms`),
    enabled: !!selectedPropertyId && step === "guest-tenancy",
  });

  const { data: beds = [] } = useQuery<Bed[]>({
    queryKey: ["beds", selectedPropertyId, selectedRoomId],
    queryFn: () =>
      apiRequest(
        `/properties/${selectedPropertyId}/rooms/${selectedRoomId}/beds`,
      ),
    enabled:
      !!selectedPropertyId && !!selectedRoomId && step === "guest-tenancy",
  });

  const availableBeds = beds.filter((b) => !b.isOccupied);

  // ── Query to check if owner's property already exists ──
  const { data: ownerProperty, isLoading: isCheckingProperty } =
    useQuery<Property | null>({
      queryKey: ["owner-property"],
      queryFn: () => apiRequest("/properties/me"),
      enabled: session?.user?.role === "owner",
      retry: false,
    });

  // ── Query to check if guest profile already exists ──
  const { data: guestProfile, isLoading: isCheckingGuest } = useQuery({
    queryKey: ["check-guest"],
    queryFn: () => apiRequest<any>("/guests/me"),
    enabled: session?.user?.role === "guest",
    retry: false,
  });

  // ── Query to get user profile if page is refreshed to get phone ──
  const { data: userProfile } = useQuery<any>({
    queryKey: ["user-profile", session?.user?.userId],
    queryFn: () => apiRequest(`/users/${session?.user?.userId}`),
    enabled: !!session?.user?.userId,
  });

  // If phone is empty but userProfile has it, set it
  useEffect(() => {
    if (!phone && userProfile?.phone) {
      setPhone(userProfile.phone);
    }
  }, [phone, userProfile]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/signup");
      return;
    }

    if (session?.user?.role === "owner") {
      if (ownerProperty) {
        router.replace("/dashboard");
      } else if (!isCheckingProperty) {
        setStep("owner-build");
      }
    } else if (session?.user?.role === "guest") {
      if (guestProfile) {
        router.replace("/tenancy");
      } else if (!isCheckingGuest) {
        setStep("guest-tenancy");
      }
    }
  }, [
    session,
    status,
    ownerProperty,
    isCheckingProperty,
    guestProfile,
    isCheckingGuest,
    router,
  ]);

  // ─── Step 1: Set role ──────────────────────────────────────────────────────
  const handleRoleSubmit = async () => {
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      setPhoneError("Enter a valid 10-digit Indian mobile number.");
      return;
    }
    setPhoneError("");
    if (!role) return;

    setIsSubmittingRole(true);
    try {
      const userId = session?.user?.userId;
      const { url, options } = await generalFunctions.createRequest(
        `/users/${userId}`,
        {
          method: "PATCH",
          body: JSON.stringify({ role, phone }),
        },
      );
      const res = await fetch(url, options);
      if (!res.ok) throw new Error("Failed to update role");
      const data = await res.json();

      // Refresh session with new role + token
      await updateSession({ accessToken: data.token, role: data.user.role });

      if (role === "owner") {
        // Register as owner (idempotent — if already exists, backend returns existing)
        const { url: ownerUrl, options: ownerOptions } =
          await generalFunctions.createRequest("/owner", {
            method: "POST",
            body: JSON.stringify({}),
          });
        const guestRes = await fetch(ownerUrl, ownerOptions);
        if (!guestRes.ok) {
          const err = await guestRes
            .json()
            .catch(() => ({ message: "Failed to create guest profile" }));
          throw new Error(err.message ?? "Failed to create guest profile");
        }
        setStep("owner-build");
      } else {
        // Register as guest (idempotent — if already exists, backend returns existing)
        const { url: guestUrl, options: guestOptions } =
          await generalFunctions.createRequest("/guests", {
            method: "POST",
            body: JSON.stringify({}),
          });
        const guestRes = await fetch(guestUrl, guestOptions);
        if (!guestRes.ok) {
          const err = await guestRes
            .json()
            .catch(() => ({ message: "Failed to create guest profile" }));
          throw new Error(err.message ?? "Failed to create guest profile");
        }
        setStep("guest-tenancy");
      }
    } catch (err) {
      setPhoneError("Something went wrong. Please try again.");
    } finally {
      setIsSubmittingRole(false);
    }
  };

  // ─── Owner: Build property ─────────────────────────────────────────────────
  const addRoom = () =>
    setRooms((prev) => [...prev, { roomNumber: "", floor: 1, bedCount: 1 }]);
  const removeRoom = (i: number) =>
    setRooms((prev) => prev.filter((_, idx) => idx !== i));
  const updateRoom = (
    i: number,
    field: keyof RoomEntry,
    value: string | number,
  ) =>
    setRooms((prev) =>
      prev.map((r, idx) => (idx === i ? { ...r, [field]: value } : r)),
    );
  const updatePricing = (i: number, value: number) =>
    setPricing((prev) =>
      prev.map((p, idx) => (idx === i ? { ...p, rentAmount: value } : p)),
    );

  const handleBuildProperty = async () => {
    if (!propertyName.trim() || !propertyAddress.trim()) {
      setBuildError("Property name and address are required.");
      return;
    }
    if (rooms.some((r) => !r.roomNumber.trim())) {
      setBuildError("All rooms must have a room number.");
      return;
    }
    setBuildError("");
    setIsBuildingProperty(true);
    try {
      const { url, options } = await generalFunctions.createRequest("/build", {
        method: "POST",
        body: JSON.stringify({
          name: propertyName,
          address: propertyAddress,
          pricing,
          rooms,
        }),
      });
      const res = await fetch(url, options);
      if (!res.ok) throw new Error("Failed to build property");
      router.push("/dashboard");
    } catch (err) {
      setBuildError("Something went wrong. Please try again.");
    } finally {
      setIsBuildingProperty(false);
    }
  };

  // ─── Guest: Register tenancy ───────────────────────────────────────────────
  const handleRegisterTenancy = async () => {
    if (
      !selectedPropertyId ||
      !selectedRoomId ||
      !selectedBedId ||
      !startDate
    ) {
      setTenancyError("Please fill all fields.");
      return;
    }
    setTenancyError("");
    setIsRegisteringTenancy(true);
    try {
      // Register tenancy
      const { url: tenancyUrl, options: tenancyOptions } =
        await generalFunctions.createRequest("/tenancies/register", {
          method: "POST",
          body: JSON.stringify({
            propertyId: selectedPropertyId,
            roomId: selectedRoomId,
            bedId: selectedBedId,
            startDate,
          }),
        });
      const res = await fetch(tenancyUrl, tenancyOptions);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message ?? "Failed to register tenancy");
      }
      router.push("/tenancy");
    } catch (err: any) {
      setTenancyError(
        err?.message ?? "Something went wrong. Please try again.",
      );
    } finally {
      setIsRegisteringTenancy(false);
    }
  };

  // ───────────────────────────────────────────────────────────────────────────
  // RENDER
  // ───────────────────────────────────────────────────────────────────────────

  // Block render while session is loading or we're mid-redirect (already has role)
  const isChecking =
    status === "loading" ||
    !session ||
    (session?.user?.role === "owner" && isCheckingProperty) ||
    (session?.user?.role === "guest" && isCheckingGuest) ||
    (session?.user?.role === "guest" && !!guestProfile);

  if (isChecking) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">
            Checking your account…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden">
      {/* Background gradient orbs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-violet-500/10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-2xl">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg mb-4">
            <Building2 className="h-7 w-7" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">PG Khata</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Let's set up your account
          </p>
        </div>

        {/* Step indicators */}
        <div className="mb-6 flex justify-center gap-2">
          <StepDot active={step === "role"} done={step !== "role"} />
          <StepDot
            active={step === "owner-build" || step === "guest-tenancy"}
            done={false}
          />
        </div>

        {/* ── Step 1: Role + Phone ── */}
        {step === "role" && (
          <div className="rounded-2xl border bg-card p-8 shadow-xl">
            <h2 className="text-xl font-semibold mb-1">
              How will you use PG Khata?
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              Choose your role. You can't change this later.
            </p>

            <div className="grid grid-cols-2 gap-4 mb-6">
              {/* Owner card */}
              <button
                onClick={() => setRole("owner")}
                className={`group relative flex flex-col items-center gap-3 rounded-xl border-2 p-6 text-left transition-all duration-200 hover:border-primary/70 hover:bg-primary/5 ${
                  role === "owner"
                    ? "border-primary bg-primary/5 shadow-[0_0_0_4px_hsl(var(--primary)/0.15)]"
                    : "border-border"
                }`}
              >
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-xl transition-colors ${
                    role === "owner"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  <Building2 className="h-6 w-6" />
                </div>
                <div className="text-center">
                  <div className="font-semibold text-sm">I'm an Owner</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    Manage property, rooms & tenants
                  </div>
                </div>
                {role === "owner" && (
                  <div className="absolute top-3 right-3 h-2 w-2 rounded-full bg-primary" />
                )}
              </button>

              {/* Guest card */}
              <button
                onClick={() => setRole("guest")}
                className={`group relative flex flex-col items-center gap-3 rounded-xl border-2 p-6 text-left transition-all duration-200 hover:border-primary/70 hover:bg-primary/5 ${
                  role === "guest"
                    ? "border-primary bg-primary/5 shadow-[0_0_0_4px_hsl(var(--primary)/0.15)]"
                    : "border-border"
                }`}
              >
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-xl transition-colors ${
                    role === "guest"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  <Users className="h-6 w-6" />
                </div>
                <div className="text-center">
                  <div className="font-semibold text-sm">I'm a Guest</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    View my tenancy & payments
                  </div>
                </div>
                {role === "guest" && (
                  <div className="absolute top-3 right-3 h-2 w-2 rounded-full bg-primary" />
                )}
              </button>
            </div>

            {/* Phone */}
            <div className="space-y-1.5 mb-6">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="9876543210"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value.replace(/\D/g, "").slice(0, 10));
                  setPhoneError("");
                }}
                className={phoneError ? "border-destructive" : ""}
              />
              {phoneError && (
                <p className="text-xs text-destructive">{phoneError}</p>
              )}
            </div>

            <Button
              className="w-full gap-2"
              disabled={!role || !phone || isSubmittingRole}
              onClick={handleRoleSubmit}
            >
              {isSubmittingRole ? "Saving..." : "Continue"}
              {!isSubmittingRole && <ChevronRight className="h-4 w-4" />}
            </Button>
          </div>
        )}

        {/* ── Step 2a: Owner — Build Property ── */}
        {step === "owner-build" && (
          <div className="rounded-2xl border bg-card p-8 shadow-xl">
            {/* <button
              onClick={() => setStep("role")}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back
            </button> */}
            <h2 className="text-xl font-semibold mb-1">Build Your Property</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Set up your PG — name, pricing, floors and rooms.
            </p>

            <div className="space-y-5">
              {/* Property details */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Property Name</Label>
                  <Input
                    placeholder="Sunrise Gents PG"
                    value={propertyName}
                    onChange={(e) => setPropertyName(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Address</Label>
                  <Input
                    placeholder="Near Metro Station, Bengaluru"
                    value={propertyAddress}
                    onChange={(e) => setPropertyAddress(e.target.value)}
                  />
                </div>
              </div>

              {/* Pricing */}
              <div>
                <Label className="mb-2 block">Pricing by Sharing</Label>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {pricing.map((p, i) => (
                    <div key={p.bedCount} className="space-y-1">
                      <p className="text-xs text-muted-foreground font-medium">
                        {p.bedCount}-Sharing
                      </p>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">
                          ₹
                        </span>
                        <Input
                          type="number"
                          className="pl-6"
                          value={p.rentAmount}
                          onChange={(e) =>
                            updatePricing(i, Number(e.target.value))
                          }
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Rooms */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Rooms</Label>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 gap-1 text-xs"
                    onClick={addRoom}
                  >
                    <Plus className="h-3 w-3" /> Add Room
                  </Button>
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {rooms.map((room, i) => (
                    <div
                      key={i}
                      className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 items-center rounded-lg border bg-muted/30 px-3 py-2"
                    >
                      <div className="space-y-0.5">
                        <p className="text-[10px] text-muted-foreground">
                          Room No.
                        </p>
                        <Input
                          className="h-7 text-xs"
                          placeholder="101"
                          value={room.roomNumber}
                          onChange={(e) =>
                            updateRoom(i, "roomNumber", e.target.value)
                          }
                        />
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-[10px] text-muted-foreground">
                          Floor
                        </p>
                        <Select
                          value={String(room.floor)}
                          onValueChange={(v) =>
                            updateRoom(i, "floor", Number(v))
                          }
                        >
                          <SelectTrigger className="h-7 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((f) => (
                              <SelectItem key={f} value={String(f)}>
                                Floor {f}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-[10px] text-muted-foreground">
                          Beds
                        </p>
                        <Select
                          value={String(room.bedCount)}
                          onValueChange={(v) =>
                            updateRoom(i, "bedCount", Number(v))
                          }
                        >
                          <SelectTrigger className="h-7 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {[1, 2, 3, 4, 5, 6].map((b) => (
                              <SelectItem key={b} value={String(b)}>
                                {b} Bed{b > 1 ? "s" : ""}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <button
                        className="text-muted-foreground hover:text-destructive transition-colors"
                        onClick={() => removeRoom(i)}
                        disabled={rooms.length === 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {buildError && (
                <p className="text-sm text-destructive">{buildError}</p>
              )}

              <Button
                className="w-full gap-2"
                disabled={isBuildingProperty}
                onClick={handleBuildProperty}
              >
                {isBuildingProperty
                  ? "Creating..."
                  : "Create Property & Continue"}
                {!isBuildingProperty && <ChevronRight className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        )}

        {/* ── Step 2b: Guest — Tenancy Details ── */}
        {step === "guest-tenancy" && (
          <div className="rounded-2xl border bg-card p-8 shadow-xl">
            {/* <button
              onClick={() => setStep("role")}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back
            </button> */}
            <h2 className="text-xl font-semibold mb-1">
              Enter Your Tenancy Details
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              Select your property, room, and bed from the available options.
            </p>

            <div className="space-y-4">
              {/* Property */}
              <div className="space-y-1.5">
                <Label>Property</Label>
                <Select
                  value={selectedPropertyId}
                  onValueChange={(v) => {
                    setSelectedPropertyId(v);
                    setSelectedRoomId("");
                    setSelectedBedId("");
                  }}
                >
                  <SelectTrigger id="property-select">
                    <SelectValue placeholder="Select a property" />
                  </SelectTrigger>
                  <SelectContent>
                    {properties.length === 0 && (
                      <SelectItem value="-" disabled>
                        No properties available
                      </SelectItem>
                    )}
                    {properties.map((p) => (
                      <SelectItem key={p.propertyId} value={p.propertyId}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Room */}
              <div className="space-y-1.5">
                <Label>Room</Label>
                <Select
                  value={selectedRoomId}
                  onValueChange={(v) => {
                    setSelectedRoomId(v);
                    setSelectedBedId("");
                  }}
                  disabled={!selectedPropertyId}
                >
                  <SelectTrigger id="room-select">
                    <SelectValue
                      placeholder={
                        selectedPropertyId
                          ? "Select a room"
                          : "Select a property first"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {fetchedRooms.length === 0 && (
                      <SelectItem value="-" disabled>
                        No rooms available
                      </SelectItem>
                    )}
                    {fetchedRooms.map((r) => (
                      <SelectItem key={r.roomId} value={r.roomId}>
                        Room {r.roomNumber} — Floor {r.floor} (
                        {r.bedCount - r.occupiedCount} beds free)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Bed */}
              <div className="space-y-1.5">
                <Label>Bed</Label>
                <Select
                  value={selectedBedId}
                  onValueChange={setSelectedBedId}
                  disabled={!selectedRoomId}
                >
                  <SelectTrigger id="bed-select">
                    <SelectValue
                      placeholder={
                        selectedRoomId ? "Select a bed" : "Select a room first"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {availableBeds.length === 0 && (
                      <SelectItem value="-" disabled>
                        No available beds
                      </SelectItem>
                    )}
                    {availableBeds.map((b) => (
                      <SelectItem key={b.bedId} value={b.bedId}>
                        {b.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Start date */}
              <div className="space-y-1.5">
                <Label htmlFor="start-date">Move-in Date</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              {tenancyError && (
                <p className="text-sm text-destructive">{tenancyError}</p>
              )}

              <Button
                className="w-full gap-2"
                disabled={
                  isRegisteringTenancy ||
                  !selectedPropertyId ||
                  !selectedRoomId ||
                  !selectedBedId ||
                  !startDate
                }
                onClick={handleRegisterTenancy}
              >
                {isRegisteringTenancy ? "Registering..." : "Confirm Tenancy"}
                {!isRegisteringTenancy && <ChevronRight className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
