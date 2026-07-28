import { z } from 'zod';
import { id, ID_PREFIXES } from '@/lib/common';

export const bedSchema = z.object({
  bedId: id(ID_PREFIXES.bed),
  roomId: id(ID_PREFIXES.room),
  propertyId: id(ID_PREFIXES.property),
  label: z.string().min(1).max(10), // e.g. "A", "B", "1"
  rentAmount: z.number().positive(),
  isOccupied: z.boolean().default(false),
});

export type Bed = z.infer<typeof bedSchema>;