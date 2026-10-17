import { create } from 'zustand';
import { UserRole, type UserModel, type WalletModel } from '@shashka/shared-types';
import { authApi } from '../api/auth';
import { getApiAuthToken, setApiAuthToken } from '../api/client';
import { getTelegramInitData, getTelegramUser } from '../utils/telegram';

interface AuthState {
  user: UserModel | null;
  wallet: WalletModel | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  setUser: (user: UserModel | null) => void;
  setWallet: (wallet: WalletModel | null) => void;
  setToken: (token: string | null) => void;
  login: (initData?: string) => Promise<boolean>;
  checkSession: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  wallet: null,
  token: getApiAuthToken(),
  isAuthenticated: Boolean(getApiAuthToken()),
  isLoading: true,
  error: null,

  setUser: (user) => set({ user, isAuthenticated: Boolean(user) }),
  setWallet: (wallet) => set({ wallet }),
  setToken: (token) => {
    setApiAuthToken(token);
    set({ token, isAuthenticated: Boolean(token) });
  },

  login: async (overrideInitData?: string) => {
    set({ isLoading: true, error: null });
    try {
      const initData = overrideInitData || getTelegramInitData();
      if (!initData) {
        // Fallback demo user if running standalone outside Telegram for local testing
        const tgUser = getTelegramUser();
        let uniqueGuestId = 'guest-user-1';
        try {
          let stored = localStorage.getItem('shashka_guest_id');
          if (!stored) {
            stored = 'guest_' + Math.random().toString(36).substring(2, 9);
            localStorage.setItem('shashka_guest_id', stored);
          }
          uniqueGuestId = stored;
        } catch {}

        const fallbackUser: UserModel = {
          id: tgUser?.id ? String(tgUser.id) : uniqueGuestId,
          username: tgUser?.username || `shashkachi_${uniqueGuestId.slice(-4)}`,
          displayName: tgUser?.first_name ? `${tgUser.first_name} ${tgUser.last_name || ''}`.trim() : 'Foydalanuvchi',
          avatarUrl: tgUser?.photo_url || null,
          language: 'uz',
          role: UserRole.USER,
          isBot: false,
          isBanned: false,
          bannedUntil: null,
          banReason: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        const fallbackWallet: WalletModel = {
          id: 'wallet-1',
          userId: fallbackUser.id,
          balance: 1000,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        set({
          user: fallbackUser,
          wallet: fallbackWallet,
          isAuthenticated: true,
          isLoading: false,
        });
        return true;
      }

      const response = await authApi.loginWithTelegram(initData);
      set({
        user: response.user,
        token: response.token,
        isAuthenticated: true,
        isLoading: false,
      });

      // Also fetch wallet session
      try {
        const session = await authApi.getCurrentSession();
        set({ wallet: session.wallet });
      } catch {
        // Wallet load non-critical
      }

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Avtorizatsiyadan o\'tib bo\'lmadi';
      const tgUser = getTelegramUser();
      let uniqueGuestId = 'guest-player';
      try {
        let stored = localStorage.getItem('shashka_guest_id');
        if (!stored) {
          stored = 'guest_' + Math.random().toString(36).substring(2, 9);
          localStorage.setItem('shashka_guest_id', stored);
        }
        uniqueGuestId = stored;
      } catch {}

      const guestUser: UserModel = {
        id: tgUser?.id ? String(tgUser.id) : uniqueGuestId,
        username: tgUser?.username || `shashkachi_${uniqueGuestId.slice(-4)}`,
        displayName: tgUser?.first_name ? `${tgUser.first_name} ${tgUser.last_name || ''}`.trim() : 'O\'yinchi',
        avatarUrl: tgUser?.photo_url || null,
        language: 'uz',
        role: UserRole.USER,
        isBot: false,
        isBanned: false,
        bannedUntil: null,
        banReason: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      set({
        user: guestUser,
        isAuthenticated: true,
        isLoading: false,
        error: message,
      });
      return false;
    }
  },

  checkSession: async () => {
    const token = getApiAuthToken();
    if (!token) {
      await get().login();
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const session = await authApi.getCurrentSession();
      set({
        user: session.user,
        wallet: session.wallet,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch {
      // Token might be expired, attempt login with Telegram
      await get().login();
    }
  },

  logout: async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore
    } finally {
      set({
        user: null,
        wallet: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },
}));
