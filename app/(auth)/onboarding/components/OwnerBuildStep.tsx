// "use client";

// import { ChevronRight, Plus, Trash2 } from "lucide-react";
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

// type RoomEntry = { roomNumber: string; floor: number; bedCount: number };
// type PricingEntry = { bedCount: number; rentAmount: number };

// export function OwnerBuildStep(props: {
//   propertyName: string;
//   setPropertyName: (value: string) => void;
//   propertyAddress: string;
//   setPropertyAddress: (value: string) => void;
//   pricing: PricingEntry[];
//   updatePricing: (index: number, value: number) => void;
//   rooms: RoomEntry[];
//   addRoom: () => void;
//   removeRoom: (index: number) => void;
//   updateRoom: (
//     index: number,
//     field: keyof RoomEntry,
//     value: string | number,
//   ) => void;
//   buildError: string;
//   isBuilding: boolean;
//   onSubmit: () => void;
// }) {
//   const {
//     propertyName,
//     setPropertyName,
//     propertyAddress,
//     setPropertyAddress,
//     pricing,
//     updatePricing,
//     rooms,
//     addRoom,
//     removeRoom,
//     updateRoom,
//     buildError,
//     isBuilding,
//     onSubmit,
//   } = props;

//   return (
//     <div className="rounded-2xl border bg-card p-8 shadow-xl">
//       <h2 className="text-xl font-semibold mb-1">Build Your Property</h2>
//       <p className="text-sm text-muted-foreground mb-6">
//         Set up your PG — name, pricing, floors and rooms.
//       </p>

//       <div className="space-y-5">
//         <div className="grid gap-4 sm:grid-cols-2">
//           <div className="space-y-1.5">
//             <Label>Property Name</Label>
//             <Input
//               placeholder="Sunrise Gents PG"
//               value={propertyName}
//               onChange={(e) => setPropertyName(e.target.value)}
//             />
//           </div>
//           <div className="space-y-1.5">
//             <Label>Address</Label>
//             <Input
//               placeholder="Near Metro Station, Bengaluru"
//               value={propertyAddress}
//               onChange={(e) => setPropertyAddress(e.target.value)}
//             />
//           </div>
//         </div>

//         <div>
//           <Label className="mb-2 block">Pricing by Sharing</Label>
//           <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
//             {pricing.map((p, i) => (
//               <div key={p.bedCount} className="space-y-1">
//                 <p className="text-xs text-muted-foreground font-medium">
//                   {p.bedCount}-Sharing
//                 </p>
//                 <div className="relative">
//                   <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">
//                     ₹
//                   </span>
//                   <Input
//                     type="number"
//                     className="pl-6"
//                     value={p.rentAmount}
//                     onChange={(e) => updatePricing(i, Number(e.target.value))}
//                   />
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>

//         <div>
//           <div className="flex items-center justify-between mb-2">
//             <Label>Rooms</Label>
//             <Button
//               size="sm"
//               variant="outline"
//               className="h-7 gap-1 text-xs"
//               onClick={addRoom}
//             >
//               <Plus className="h-3 w-3" /> Add Room
//             </Button>
//           </div>
//           <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
//             {rooms.map((room, i) => (
//               <div
//                 key={i}
//                 className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 items-center rounded-lg border bg-muted/30 px-3 py-2"
//               >
//                 <div className="space-y-0.5">
//                   <p className="text-[10px] text-muted-foreground">Room No.</p>
//                   <Input
//                     className="h-7 text-xs"
//                     placeholder="101"
//                     value={room.roomNumber}
//                     onChange={(e) => updateRoom(i, "roomNumber", e.target.value)}
//                   />
//                 </div>
//                 <div className="space-y-0.5">
//                   <p className="text-[10px] text-muted-foreground">Floor</p>
//                   <Select
//                     value={String(room.floor)}
//                     onValueChange={(v) => updateRoom(i, "floor", Number(v))}
//                   >
//                     <SelectTrigger className="h-7 text-xs">
//                       <SelectValue />
//                     </SelectTrigger>
//                     <SelectContent>
//                       {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((f) => (
//                         <SelectItem key={f} value={String(f)}>
//                           Floor {f}
//                         </SelectItem>
//                       ))}
//                     </SelectContent>
//                   </Select>
//                 </div>
//                 <div className="space-y-0.5">
//                   <p className="text-[10px] text-muted-foreground">Beds</p>
//                   <Select
//                     value={String(room.bedCount)}
//                     onValueChange={(v) => updateRoom(i, "bedCount", Number(v))}
//                   >
//                     <SelectTrigger className="h-7 text-xs">
//                       <SelectValue />
//                     </SelectTrigger>
//                     <SelectContent>
//                       {[1, 2, 3, 4, 5, 6].map((b) => (
//                         <SelectItem key={b} value={String(b)}>
//                           {b} Bed{b > 1 ? "s" : ""}
//                         </SelectItem>
//                       ))}
//                     </SelectContent>
//                   </Select>
//                 </div>
//                 <button
//                   className="text-muted-foreground hover:text-destructive transition-colors"
//                   onClick={() => removeRoom(i)}
//                   disabled={rooms.length === 1}
//                 >
//                   <Trash2 className="h-4 w-4" />
//                 </button>
//               </div>
//             ))}
//           </div>
//         </div>

//         {buildError && <p className="text-sm text-destructive">{buildError}</p>}

//         <Button className="w-full gap-2" disabled={isBuilding} onClick={onSubmit}>
//           {isBuilding ? "Creating..." : "Create Property & Continue"}
//           {!isBuilding && <ChevronRight className="h-4 w-4" />}
//         </Button>
//       </div>
//     </div>
//   );
// }

