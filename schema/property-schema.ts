import { id, ID_PREFIXES } from '@/lib/common';
import { z } from 'zod';



// Full shape — what a Property looks like once read from the DB
export const propertySchema = z.object({
  propertyId: id(ID_PREFIXES.property),
  name: z.string().min(2).max(100),
  address: z.string().min(5).max(300),
  ownerId: id(ID_PREFIXES.user),
});
 
export type Property = z.infer<typeof propertySchema>;

