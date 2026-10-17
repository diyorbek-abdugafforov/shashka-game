// Safe Telegram WebApp API interface

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
}

interface TelegramWebApp {
  initData: string;
  initDataUnsafe: {
    query_id?: string;
    user?: TelegramUser;
    auth_date?: number;
    hash?: string;
    start_param?: string;
  };
  colorScheme: 'light' | 'dark';
  themeParams: Record<string, string>;
  isExpanded: boolean;
  viewportHeight: number;
  viewportStableHeight: number;
  headerColor: string;
  backgroundColor: string;
  BackButton: {
    isVisible: boolean;
    show: () => void;
    hide: () => void;
    onClick: (cb: () => void) => void;
    offClick: (cb: () => void) => void;
  };
  MainButton: {
    text: string;
    color: string;
    textColor: string;
    isVisible: boolean;
    isActive: boolean;
    isProgressVisible: boolean;
    setText: (text: string) => void;
    onClick: (cb: () => void) => void;
    offClick: (cb: () => void) => void;
    show: () => void;
    hide: () => void;
    enable: () => void;
    disable: () => void;
    showProgress: (leaveActive?: boolean) => void;
    hideProgress: () => void;
    setParams: (params: Record<string, unknown>) => void;
  };
  HapticFeedback: {
    impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
    notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
    selectionChanged: () => void;
  };
  ready: () => void;
  expand: () => void;
  close: () => void;
  openLink: (url: string) => void;
  openTelegramLink: (url: string) => void;
}

declare global {
  interface Window {
    Telegram?: {
      WebApp?: TelegramWebApp;
    };
  }
}

export function getTelegramWebApp(): TelegramWebApp | null {
  if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
    return window.Telegram.WebApp;
  }
  return null;
}

export function isTelegramWebApp(): boolean {
  const tg = getTelegramWebApp();
  return Boolean(tg && tg.initData);
}

export function getTelegramUser(): TelegramUser | null {
  const tg = getTelegramWebApp();
  return tg?.initDataUnsafe?.user || null;
}

export function getTelegramInitData(): string {
  const tg = getTelegramWebApp();
  return tg?.initData || '';
}

export function expandTelegramApp(): void {
  const tg = getTelegramWebApp();
  if (tg) {
    tg.ready();
    tg.expand();
  }
}

export function triggerHaptic(
  type: 'light' | 'medium' | 'heavy' | 'selection' | 'error' | 'success' | 'warning' = 'light',
): void {
  try {
    const tg = getTelegramWebApp();
    if (!tg?.HapticFeedback) return;

    if (type === 'selection') {
      tg.HapticFeedback.selectionChanged();
    } else if (type === 'error' || type === 'success' || type === 'warning') {
      tg.HapticFeedback.notificationOccurred(type);
    } else {
      tg.HapticFeedback.impactOccurred(type);
    }
  } catch {
    // Haptics not supported or failed
  }
}

let activeBackBtnHandler: (() => void) | null = null;

export function showBackButton(onClick: () => void): void {
  const tg = getTelegramWebApp();
  if (!tg?.BackButton) return;

  if (activeBackBtnHandler) {
    tg.BackButton.offClick(activeBackBtnHandler);
  }
  activeBackBtnHandler = onClick;
  tg.BackButton.onClick(onClick);
  tg.BackButton.show();
}

export function hideBackButton(): void {
  const tg = getTelegramWebApp();
  if (!tg?.BackButton) return;

  if (activeBackBtnHandler) {
    tg.BackButton.offClick(activeBackBtnHandler);
    activeBackBtnHandler = null;
  }
  tg.BackButton.hide();
}

export function closeTelegramApp(): void {
  const tg = getTelegramWebApp();
  if (tg) {
    tg.close();
  }
}

export function openTelegramLink(url: string): void {
  const tg = getTelegramWebApp();
  if (tg) {
    tg.openTelegramLink(url);
  } else {
    window.open(url, '_blank');
  }
}
