import { z } from 'zod';
import { id, ID_PREFIXES } from '@/lib/common';

export const roleEnum = z.enum(['owner', 'guest']); // 'host' joins in Phase 3
export type Role = z.infer<typeof roleEnum>;

export const userSchema = z.object({
  userId: id(ID_PREFIXES.user),
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string(),
  role: roleEnum,
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Invalid Indian mobile number'),
  guestId: id(ID_PREFIXES.guest).nullable().default(null), // set when role === 'guest' (Phase 2+)
});

export type User = z.infer<typeof userSchema>;



