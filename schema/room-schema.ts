import { z } from 'zod';
import { id, ID_PREFIXES } from '@/lib/common';

export const roomSchema = z.object({
  roomId: id(ID_PREFIXES.room),
  propertyId: id(ID_PREFIXES.property),
  roomNumber: z.string().min(1).max(20),
  floor: z.number().int().min(0).max(50),
  bedCount: z.number().int().nonnegative(),
  occupiedCount: z.number().int().nonnegative(),
});

export type Room = z.infer<typeof roomSchema>;