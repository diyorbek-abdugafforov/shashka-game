import { z } from 'zod';
import { GameMode, ReportReason } from '@shashka/shared-types';

export const updateProfileSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(2, 'Display name must be at least 2 characters')
    .max(30, 'Display name cannot exceed 30 characters')
    .optional(),
  avatarUrl: z.string().url('Invalid avatar URL').optional().or(z.literal('')),
  language: z.string().min(2).max(5).default('ru'),
});

export const leaderboardQuerySchema = z.object({
  mode: z.nativeEnum(GameMode).default(GameMode.CLASSIC),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export const purchaseItemSchema = z.object({
  itemId: z.string().uuid('Invalid item ID'),
});

export const equipItemSchema = z.object({
  userInventoryId: z.string().uuid('Invalid inventory ID'),
});

export const createReportSchema = z.object({
  reportedUserId: z.string().uuid().optional(),
  reportedGameId: z.string().uuid().optional(),
  reason: z.nativeEnum(ReportReason),
  description: z
    .string()
    .trim()
    .min(5, 'Report description must be at least 5 characters')
    .max(1000, 'Report description cannot exceed 1000 characters'),
}).refine(
  (data) => data.reportedUserId || data.reportedGameId,
  {
    message: 'Either reportedUserId or reportedGameId must be provided',
    path: ['reportedUserId'],
  },
);

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type LeaderboardQueryInput = z.infer<typeof leaderboardQuerySchema>;
export type PurchaseItemInput = z.infer<typeof purchaseItemSchema>;
export type EquipItemInput = z.infer<typeof equipItemSchema>;
export type CreateReportInput = z.infer<typeof createReportSchema>;
