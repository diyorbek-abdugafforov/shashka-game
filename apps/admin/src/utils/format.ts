import { format, formatDistanceToNow, isValid, parseISO } from 'date-fns';

/**
 * Format ISO date string to readable format
 * e.g., "16.10.2026 15:30"
 */
export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return '-';
  const parsed = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(parsed)) return '-';
  return format(parsed, 'dd.MM.yyyy HH:mm');
}

/**
 * Format ISO date string to date only
 * e.g., "16.10.2026"
 */
export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '-';
  const parsed = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(parsed)) return '-';
  return format(parsed, 'dd.MM.yyyy');
}

/**
 * Format relative time
 * e.g., "5 daqiqa oldin"
 */
export function formatRelativeTime(date: string | Date | null | undefined): string {
  if (!date) return '-';
  const parsed = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(parsed)) return '-';
  return formatDistanceToNow(parsed, { addSuffix: true });
}

/**
 * Format number with thousand separators
 * e.g., 1250000 -> "1 250 000"
 */
export function formatNumber(val: number | null | undefined): string {
  if (val === null || val === undefined || isNaN(val)) return '0';
  return new Intl.NumberFormat('uz-UZ').format(val);
}

/**
 * Format compact numbers for stats
 * e.g., 15400 -> "15.4K"
 */
export function formatCompactNumber(val: number | null | undefined): string {
  if (val === null || val === undefined || isNaN(val)) return '0';
  return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(val);
}

/**
 * Format coins / token balance
 */
export function formatCoins(amount: number | null | undefined): string {
  return `${formatNumber(amount)} 🪙`;
}

/**
 * Translate user roles
 */
export function getRoleBadgeInfo(role: string): { label: string; variant: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple' } {
  switch (role) {
    case 'SUPER_ADMIN':
      return { label: 'Super Admin', variant: 'purple' };
    case 'ADMIN':
      return { label: 'Admin', variant: 'warning' };
    case 'MODERATOR':
      return { label: 'Moderator', variant: 'info' };
    case 'SUPPORT':
      return { label: 'Support', variant: 'default' };
    default:
      return { label: 'Foydalanuvchi', variant: 'default' };
  }
}

/**
 * Translate game status
 */
export function getGameStatusInfo(status: string): { label: string; variant: 'default' | 'success' | 'warning' | 'danger' | 'info' } {
  switch (status) {
    case 'IN_PROGRESS':
      return { label: 'Oʻyinda', variant: 'info' };
    case 'FINISHED':
      return { label: 'Yakunlangan', variant: 'success' };
    case 'WAITING_FOR_PLAYERS':
      return { label: 'Kutilmoqda', variant: 'warning' };
    case 'ABORTED':
      return { label: 'Bekor qilingan', variant: 'danger' };
    default:
      return { label: status, variant: 'default' };
  }
}

/**
 * Translate game mode
 */
export function getGameModeLabel(mode: string): string {
  switch (mode) {
    case 'CLASSIC':
      return 'Klassik';
    case 'BLITZ':
      return 'Blitz (Tezkor)';
    case 'RAPID':
      return 'Rapid';
    case 'GIVEAWAY':
      return 'Poddavki (Teskari)';
    case 'BOT':
      return 'Bot bilan';
    case 'CUSTOM':
      return 'Maxsus';
    default:
      return mode;
  }
}

/**
 * Translate report status
 */
export function getReportStatusInfo(status: string): { label: string; variant: 'default' | 'success' | 'warning' | 'danger' | 'info' } {
  switch (status) {
    case 'PENDING':
      return { label: 'Yangi', variant: 'warning' };
    case 'UNDER_REVIEW':
      return { label: 'Koʻrib chiqilmoqda', variant: 'info' };
    case 'RESOLVED':
      return { label: 'Hal qilingan', variant: 'success' };
    case 'REJECTED':
      return { label: 'Rad etilgan', variant: 'danger' };
    default:
      return { label: status, variant: 'default' };
  }
}

/**
 * Translate report reason
 */
export function getReportReasonLabel(reason: string): string {
  switch (reason) {
    case 'CHEATING':
      return 'Firibgarlik (Cheating)';
    case 'OFFENSIVE_BEHAVIOR':
      return 'Haqoratli xatti-harakat';
    case 'STALLING':
      return 'Vaqtni choʻzish (Stalling)';
    case 'INAPPROPRIATE_PROFILE':
      return 'Notoʻgʻri profil maʼlumotlari';
    case 'OTHER':
      return 'Boshqa sabab';
    default:
      return reason;
  }
}
