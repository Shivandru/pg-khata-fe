import { z } from 'zod';
import { id, ID_PREFIXES, dateOnly } from '@/lib/common';

export const tenancySchema = z.object({
  tenancyId: id(ID_PREFIXES.tenancy),
  guestId: id(ID_PREFIXES.guest),
  bedId: id(ID_PREFIXES.bed),
  startDate: dateOnly,
  endDate: dateOnly.nullable().default(null),
  agreedRent: z.number().positive(),
  isActive: z.boolean().default(true),
});

// What POST /tenancies accepts — endDate and isActive are system-managed,
// never set directly by the client
export const createTenancySchema = tenancySchema.omit({
  tenancyId: true,
  endDate: true,
  isActive: true,
});

// What PUT /tenancies/:id/vacate accepts
export const vacateTenancySchema = z.object({
  endDate: dateOnly,
});