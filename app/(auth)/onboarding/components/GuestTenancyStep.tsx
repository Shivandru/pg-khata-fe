// "use client";

// import { ChevronRight } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";

// type Property = { propertyId: string; name: string };
// type Room = {
//   roomId: string;
//   roomNumber: string;
//   floor: number;
//   bedCount: number;
//   occupiedCount: number;
// };
// type Bed = { bedId: string; label: string };

// export function GuestTenancyStep(props: {
//   properties: Property[];
//   rooms: Room[];
//   availableBeds: Bed[];
//   selectedPropertyId: string;
//   setSelectedPropertyId: (value: string) => void;
//   selectedRoomId: string;
//   setSelectedRoomId: (value: string) => void;
//   selectedBedId: string;
//   setSelectedBedId: (value: string) => void;
//   startDate: string;
//   setStartDate: (value: string) => void;
//   tenancyError: string;
//   isRegistering: boolean;
//   onSubmit: () => void;
// }) {
//   const {
//     properties,
//     rooms,
//     availableBeds,
//     selectedPropertyId,
//     setSelectedPropertyId,
//     selectedRoomId,
//     setSelectedRoomId,
//     selectedBedId,
//     setSelectedBedId,
//     startDate,
//     setStartDate,
//     tenancyError,
//     isRegistering,
//     onSubmit,
//   } = props;

//   return (
//     <div className="rounded-2xl border bg-card p-8 shadow-xl">
//       <h2 className="text-xl font-semibold mb-1">Enter Your Tenancy Details</h2>
//       <p className="text-sm text-muted-foreground mb-6">
//         Select your property, room, and bed from the available options.
//       </p>

//       <div className="space-y-4">
//         <div className="space-y-1.5">
//           <Label>Property</Label>
//           <Select
//             value={selectedPropertyId}
//             onValueChange={(v) => {
//               setSelectedPropertyId(v);
//               setSelectedRoomId("");
//               setSelectedBedId("");
//             }}
//           >
//             <SelectTrigger id="property-select">
//               <SelectValue placeholder="Select a property" />
//             </SelectTrigger>
//             <SelectContent>
//               {properties.length === 0 && (
//                 <SelectItem value="-" disabled>
//                   No properties available
//                 </SelectItem>
//               )}
//               {properties.map((p) => (
//                 <SelectItem key={p.propertyId} value={p.propertyId}>
//                   {p.name}
//                 </SelectItem>
//               ))}
//             </SelectContent>
//           </Select>
//         </div>

//         <div className="space-y-1.5">
//           <Label>Room</Label>
//           <Select
//             value={selectedRoomId}
//             onValueChange={(v) => {
//               setSelectedRoomId(v);
//               setSelectedBedId("");
//             }}
//             disabled={!selectedPropertyId}
//           >
//             <SelectTrigger id="room-select">
//               <SelectValue
//                 placeholder={
//                   selectedPropertyId ? "Select a room" : "Select a property first"
//                 }
//               />
//             </SelectTrigger>
//             <SelectContent>
//               {rooms.length === 0 && (
//                 <SelectItem value="-" disabled>
//                   No rooms available
//                 </SelectItem>
//               )}
//               {rooms.map((r) => (
//                 <SelectItem key={r.roomId} value={r.roomId}>
//                   Room {r.roomNumber} — Floor {r.floor} (
//                   {r.bedCount - r.occupiedCount} beds free)
//                 </SelectItem>
//               ))}
//             </SelectContent>
//           </Select>
//         </div>

//         <div className="space-y-1.5">
//           <Label>Bed</Label>
//           <Select
//             value={selectedBedId}
//             onValueChange={setSelectedBedId}
//             disabled={!selectedRoomId}
//           >
//             <SelectTrigger id="bed-select">
//               <SelectValue
//                 placeholder={selectedRoomId ? "Select a bed" : "Select a room first"}
//               />
//             </SelectTrigger>
//             <SelectContent>
//               {availableBeds.length === 0 && (
//                 <SelectItem value="-" disabled>
//                   No available beds
//                 </SelectItem>
//               )}
//               {availableBeds.map((b) => (
//                 <SelectItem key={b.bedId} value={b.bedId}>
//                   {b.label}
//                 </SelectItem>
//               ))}
//             </SelectContent>
//           </Select>
//         </div>

//         <div className="space-y-1.5">
//           <Label htmlFor="start-date">Move-in Date</Label>
//           <Input
//             id="start-date"
//             type="date"
//             value={startDate}
//             onChange={(e) => setStartDate(e.target.value)}
//           />
//         </div>

//         {tenancyError && <p className="text-sm text-destructive">{tenancyError}</p>}

//         <Button
//           className="w-full gap-2"
//           disabled={
//             isRegistering ||
//             !selectedPropertyId ||
//             !selectedRoomId ||
//             !selectedBedId ||
//             !startDate
//           }
//           onClick={onSubmit}
//         >
//           {isRegistering ? "Registering..." : "Confirm Tenancy"}
//           {!isRegistering && <ChevronRight className="h-4 w-4" />}
//         </Button>
//       </div>
//     </div>
//   );
// }

