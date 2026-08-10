"use client";

import { Building2, ChevronRight, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Role = "owner" | "guest";

export function RoleStep(props: {
  role: Role | null;
  setRole: (role: Role) => void;
  phone: string;
  setPhone: (phone: string) => void;
  phoneError: string;
  setPhoneError: (error: string) => void;
  isSubmitting: boolean;
  onContinue: () => void;
}) {
  const {
    role,
    setRole,
    phone,
    setPhone,
    phoneError,
    setPhoneError,
    isSubmitting,
    onContinue,
  } = props;

  return (
    <div className="rounded-2xl border bg-card p-8 shadow-xl">
      <h2 className="text-xl font-semibold mb-1">How will you use PG Khata?</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Choose your role. You can&apos;t change this later.
      </p>

      <div className="grid grid-cols-2 gap-4 mb-6">
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
            <div className="font-semibold text-sm">I&apos;m an Owner</div>
            <div className="text-xs text-muted-foreground mt-0.5">
              Manage property, rooms & tenants
            </div>
          </div>
          {role === "owner" && (
            <div className="absolute top-3 right-3 h-2 w-2 rounded-full bg-primary" />
          )}
        </button>

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
            <div className="font-semibold text-sm">I&apos;m a Guest</div>
            <div className="text-xs text-muted-foreground mt-0.5">
              View my tenancy & payments
            </div>
          </div>
          {role === "guest" && (
            <div className="absolute top-3 right-3 h-2 w-2 rounded-full bg-primary" />
          )}
        </button>
      </div>

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
        {phoneError && <p className="text-xs text-destructive">{phoneError}</p>}
      </div>

      <Button
        className="w-full gap-2"
        disabled={!role || !phone || isSubmitting}
        onClick={onContinue}
      >
        {isSubmitting ? "Saving..." : "Continue"}
        {!isSubmitting && <ChevronRight className="h-4 w-4" />}
      </Button>
    </div>
  );
}

