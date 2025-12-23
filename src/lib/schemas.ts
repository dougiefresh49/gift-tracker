import { z } from "zod";

export const ProfileSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1),
});

export const GiftSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1),
  price: z.number().min(0),
  imageUrl: z.string().url().optional().or(z.literal("")),
  recipientId: z.string().uuid(),
  claimedById: z.string().uuid().nullable().optional(),
  isSanta: z.boolean().default(false),
  status: z.enum(["available", "claimed", "santa"]),
});

export const BudgetSchema = z.object({
  id: z.string().uuid().optional(),
  gifterId: z.string().uuid(),
  recipientId: z.string().uuid(),
  limitAmount: z.number().min(0),
});

export type Profile = z.infer<typeof ProfileSchema>;
export type Gift = z.infer<typeof GiftSchema>;
export type Budget = z.infer<typeof BudgetSchema>;

