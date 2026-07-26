import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

export type BedStatus = "vacant" | "occupied";
export type PaymentStatus = "paid" | "pending" | "partial";

export interface Room {
  id: string;
  name: string;
  floor: string;
}
export interface Bed {
  id: string;
  roomId: string;
  label: string;
}
export interface Guest {
  id: string;
  name: string;
  phone: string;
  email: string;
  joinedAt: string;
}
export interface Tenancy {
  id: string;
  guestId: string;
  bedId: string;
  startDate: string;
  endDate?: string;
  rent: number;
}
export interface Payment {
  id: string;
  guestId: string;
  month: string; // YYYY-MM
  status: PaymentStatus;
  amount: number;
  rent: number;
}

const MONTHS = ["2026-05", "2026-06", "2026-07"];

const seed = () => {
  const rooms: Room[] = [
    { id: "r1", name: "Room 101", floor: "1st Floor" },
    { id: "r2", name: "Room 102", floor: "1st Floor" },
    { id: "r3", name: "Room 103", floor: "1st Floor" },
    { id: "r4", name: "Room 201", floor: "2nd Floor" },
    { id: "r5", name: "Room 202", floor: "2nd Floor" },
    { id: "r6", name: "Room 203", floor: "2nd Floor" },
  ];
  const beds: Bed[] = [];
  rooms.forEach((r, i) => {
    const count = i % 2 === 0 ? 3 : 2;
    for (let b = 1; b <= count; b++) {
      beds.push({ id: `${r.id}-b${b}`, roomId: r.id, label: `Bed ${b}` });
    }
  });
  const guests: Guest[] = [
    { id: "g1", name: "Aarav Sharma", phone: "+91 98100 11111", email: "aarav@example.com", joinedAt: "2026-05-01" },
    { id: "g2", name: "Priya Menon", phone: "+91 98100 22222", email: "priya@example.com", joinedAt: "2026-05-05" },
    { id: "g3", name: "Rohan Gupta", phone: "+91 98100 33333", email: "rohan@example.com", joinedAt: "2026-05-10" },
    { id: "g4", name: "Ishita Verma", phone: "+91 98100 44444", email: "ishita@example.com", joinedAt: "2026-05-12" },
    { id: "g5", name: "Kabir Nair", phone: "+91 98100 55555", email: "kabir@example.com", joinedAt: "2026-06-01" },
    { id: "g6", name: "Meera Iyer", phone: "+91 98100 66666", email: "meera@example.com", joinedAt: "2026-06-03" },
    { id: "g7", name: "Vihaan Patel", phone: "+91 98100 77777", email: "vihaan@example.com", joinedAt: "2026-06-10" },
    { id: "g8", name: "Ananya Rao", phone: "+91 98100 88888", email: "ananya@example.com", joinedAt: "2026-06-15" },
    { id: "g9", name: "Devansh Singh", phone: "+91 98100 99999", email: "devansh@example.com", joinedAt: "2026-07-01" },
    { id: "g10", name: "Sara Khan", phone: "+91 98101 00000", email: "sara@example.com", joinedAt: "2026-07-05" },
  ];
  const tenancies: Tenancy[] = [
    { id: "t1", guestId: "g1", bedId: "r1-b1", startDate: "2026-05-01", rent: 8500 },
    { id: "t2", guestId: "g2", bedId: "r1-b2", startDate: "2026-05-05", rent: 8500 },
    { id: "t3", guestId: "g3", bedId: "r2-b1", startDate: "2026-05-10", rent: 9000 },
    { id: "t4", guestId: "g4", bedId: "r3-b1", startDate: "2026-05-12", rent: 8500 },
    { id: "t5", guestId: "g5", bedId: "r4-b1", startDate: "2026-06-01", rent: 9500 },
    { id: "t6", guestId: "g6", bedId: "r4-b2", startDate: "2026-06-03", rent: 9500 },
    { id: "t7", guestId: "g7", bedId: "r5-b1", startDate: "2026-06-10", rent: 9000 },
    { id: "t8", guestId: "g8", bedId: "r6-b1", startDate: "2026-06-15", rent: 8500 },
    { id: "t9", guestId: "g9", bedId: "r6-b2", startDate: "2026-07-01", rent: 8500 },
    { id: "t10", guestId: "g10", bedId: "r2-b2", startDate: "2026-07-05", rent: 9000 },
  ];
  const payments: Payment[] = [];
  const statuses: PaymentStatus[] = ["paid", "paid", "paid", "pending", "partial"];
  tenancies.forEach((t) => {
    MONTHS.forEach((m, mi) => {
      if (t.startDate.slice(0, 7) > m) return;
      const s = statuses[(parseInt(t.id.slice(1)) + mi) % statuses.length];
      payments.push({
        id: `${t.guestId}-${m}`,
        guestId: t.guestId,
        month: m,
        status: s,
        amount: s === "paid" ? t.rent : s === "partial" ? Math.round(t.rent / 2) : 0,
        rent: t.rent,
      });
    });
  });
  return { rooms, beds, guests, tenancies, payments };
};

interface Store {
  rooms: Room[];
  beds: Bed[];
  guests: Guest[];
  tenancies: Tenancy[];
  payments: Payment[];
  months: string[];
  addRoom: (r: Omit<Room, "id">) => void;
  addBed: (b: Omit<Bed, "id">) => void;
  addGuest: (g: Omit<Guest, "id" | "joinedAt">) => void;
  assignGuest: (guestId: string, bedId: string, startDate: string, rent: number) => void;
  vacateGuest: (guestId: string) => void;
  updatePayment: (guestId: string, month: string, status: PaymentStatus, amount: number) => void;
  getBedStatus: (bedId: string) => BedStatus;
  getGuestBed: (guestId: string) => { bed?: Bed; room?: Room; tenancy?: Tenancy } | undefined;
}

const StoreCtx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const initial = useMemo(seed, []);
  const [rooms, setRooms] = useState(initial.rooms);
  const [beds, setBeds] = useState(initial.beds);
  const [guests, setGuests] = useState(initial.guests);
  const [tenancies, setTenancies] = useState(initial.tenancies);
  const [payments, setPayments] = useState(initial.payments);

  const value: Store = {
    rooms, beds, guests, tenancies, payments, months: MONTHS,
    addRoom: (r) => setRooms((prev) => [...prev, { ...r, id: `r${Date.now()}` }]),
    addBed: (b) => setBeds((prev) => [...prev, { ...b, id: `b${Date.now()}` }]),
    addGuest: (g) =>
      setGuests((prev) => [...prev, { ...g, id: `g${Date.now()}`, joinedAt: new Date().toISOString().slice(0, 10) }]),
    assignGuest: (guestId, bedId, startDate, rent) => {
      setTenancies((prev) => [
        ...prev.filter((t) => !(t.guestId === guestId && !t.endDate)),
        { id: `t${Date.now()}`, guestId, bedId, startDate, rent },
      ]);
    },
    vacateGuest: (guestId) => {
      const today = new Date().toISOString().slice(0, 10);
      setTenancies((prev) => prev.map((t) => (t.guestId === guestId && !t.endDate ? { ...t, endDate: today } : t)));
    },
    updatePayment: (guestId, month, status, amount) => {
      setPayments((prev) => {
        const id = `${guestId}-${month}`;
        const existing = prev.find((p) => p.id === id);
        const rent = existing?.rent ?? tenancies.find((t) => t.guestId === guestId)?.rent ?? 0;
        if (existing) return prev.map((p) => (p.id === id ? { ...p, status, amount } : p));
        return [...prev, { id, guestId, month, status, amount, rent }];
      });
    },
    getBedStatus: (bedId) =>
      tenancies.some((t) => t.bedId === bedId && !t.endDate) ? "occupied" : "vacant",
    getGuestBed: (guestId) => {
      const tenancy = tenancies.find((t) => t.guestId === guestId && !t.endDate);
      if (!tenancy) return undefined;
      const bed = beds.find((b) => b.id === tenancy.bedId);
      const room = bed ? rooms.find((r) => r.id === bed.roomId) : undefined;
      return { bed, room, tenancy };
    },
  };

  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreCtx);
  if (!ctx) throw new Error("useStore outside provider");
  return ctx;
}

export const monthLabel = (m: string) => {
  const [y, mo] = m.split("-");
  const d = new Date(parseInt(y), parseInt(mo) - 1, 1);
  return d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
};
