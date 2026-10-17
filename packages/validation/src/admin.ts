import { z } from 'zod';
import { UserRole, ReportStatus } from '@shashka/shared-types';

export const adminUserFilterSchema = z.object({
  search: z.string().trim().optional(),
  role: z.nativeEnum(UserRole).optional(),
  isBanned: z.coerce.boolean().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const adminBanUserSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  reason: z.string().trim().min(3, 'Ban reason must be at least 3 characters'),
  bannedUntil: z.string().datetime().optional().nullable(),
});

export const adminUnbanUserSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  reason: z.string().trim().min(3, 'Unban reason must be at least 3 characters'),
});

export const adminAdjustBalanceSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  amount: z.number().int().refine((val) => val !== 0, 'Amount cannot be zero'),
  reason: z.string().trim().min(3, 'Adjustment reason must be at least 3 characters'),
});

export const adminUpdateRoleSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  role: z.nativeEnum(UserRole),
});

export const adminResolveReportSchema = z.object({
  reportId: z.string().uuid('Invalid report ID'),
  status: z.enum([ReportStatus.RESOLVED, ReportStatus.REJECTED]),
  actionNote: z.string().trim().optional(),
});

export const adminUpdateSettingSchema = z.object({
  key: z.string().trim().min(1),
  value: z.string().min(1),
  description: z.string().trim().optional(),
});

export const adminToggleFeatureFlagSchema = z.object({
  key: z.string().trim().min(1),
  enabled: z.boolean(),
});

export type AdminUserFilterInput = z.infer<typeof adminUserFilterSchema>;
export type AdminBanUserInput = z.infer<typeof adminBanUserSchema>;
export type AdminUnbanUserInput = z.infer<typeof adminUnbanUserSchema>;
export type AdminAdjustBalanceInput = z.infer<typeof adminAdjustBalanceSchema>;
export type AdminUpdateRoleInput = z.infer<typeof adminUpdateRoleSchema>;
export type AdminResolveReportInput = z.infer<typeof adminResolveReportSchema>;
export type AdminUpdateSettingInput = z.infer<typeof adminUpdateSettingSchema>;
export type AdminToggleFeatureFlagInput = z.infer<typeof adminToggleFeatureFlagSchema>;
