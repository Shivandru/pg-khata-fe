import { z } from 'zod';
import { id, ID_PREFIXES } from '@/lib/common';

export const guestSchema = z.object({
  guestId: id(ID_PREFIXES.guest),
  name: z.string().min(2).max(100),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Invalid Indian mobile number'),
  email: z.string().email().optional().or(z.literal('')),
  kycInfo: z.record(z.string(), z.any()).optional().default({}),
  // Stays null until Phase 2 guest self-service login is introduced.
  // Tenancy/PaymentRecord reference guestId directly, so linking a userId
  // later never requires touching those collections.
  userId: id(ID_PREFIXES.user).nullable().default(null),
});

export type Guest = z.infer<typeof guestSchema>;