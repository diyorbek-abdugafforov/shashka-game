import { create } from 'zustand';
import { UserRole } from '@shashka/shared-types';
import { apiClient } from '@/api/client';

export interface AdminUser {
  id: string;
  telegramId?: string;
  username: string | null;
  displayName: string;
  avatarUrl: string | null;
  role: UserRole;
  createdAt?: string;
}

interface AuthState {
  user: AdminUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  loginWithTelegram: (initData: string) => Promise<boolean>;
  loginDirect: (token: string, user: AdminUser) => void;
  logout: () => void;
  checkAuth: () => Promise<void>;

  // Role permissions
  hasRole: (roles: UserRole | UserRole[]) => boolean;
  canAccess: (section: 'dashboard' | 'users' | 'games' | 'reports' | 'shop' | 'settings' | 'audit') => boolean;
  canPerformAction: (action: 'ban' | 'wallet' | 'resolve_report' | 'edit_shop' | 'manage_settings') => boolean;
}

const STORAGE_KEY_TOKEN = 'shashka_admin_token';
const STORAGE_KEY_USER = 'shashka_admin_user';

export const useAuthStore = create<AuthState>((set, get) => {
  // Initialize from localStorage
  const savedToken = localStorage.getItem(STORAGE_KEY_TOKEN);
  const savedUserJson = localStorage.getItem(STORAGE_KEY_USER);
  let initialUser: AdminUser | null = null;

  if (savedUserJson) {
    try {
      initialUser = JSON.parse(savedUserJson);
    } catch {
      localStorage.removeItem(STORAGE_KEY_USER);
    }
  }

  return {
    user: initialUser,
    token: savedToken,
    isAuthenticated: !!(savedToken && initialUser),
    isLoading: false,
    error: null,

    loginWithTelegram: async (initData: string) => {
      set({ isLoading: true, error: null });
      try {
        const response = await apiClient.post<{ token: string; user: AdminUser }>('/admin/auth/telegram', {
          initData,
        });

        const { token, user } = response;
        localStorage.setItem(STORAGE_KEY_TOKEN, token);
        localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));

        set({
          token,
          user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
        return true;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Kirishda xatolik yuz berdi';
        set({ isLoading: false, error: message });
        return false;
      }
    },

    loginDirect: (token: string, user: AdminUser) => {
      localStorage.setItem(STORAGE_KEY_TOKEN, token);
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
      set({
        token,
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    },

    logout: () => {
      localStorage.removeItem(STORAGE_KEY_TOKEN);
      localStorage.removeItem(STORAGE_KEY_USER);
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        error: null,
      });
    },

    checkAuth: async () => {
      const token = localStorage.getItem(STORAGE_KEY_TOKEN);
      if (!token) {
        set({ isAuthenticated: false, user: null });
        return;
      }
      try {
        const user = await apiClient.get<AdminUser>('/admin/auth/me');
        localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
        set({ user, isAuthenticated: true });
      } catch {
        // If auth fails, state is cleared by apiClient 401 handling
      }
    },

    hasRole: (roles: UserRole | UserRole[]) => {
      const user = get().user;
      if (!user) return false;
      const roleList = Array.isArray(roles) ? roles : [roles];
      return roleList.includes(user.role);
    },

    canAccess: (section) => {
      const user = get().user;
      if (!user) return false;

      // SUPER_ADMIN has full access
      if (user.role === UserRole.SUPER_ADMIN) return true;

      // ADMIN has all except system settings
      if (user.role === UserRole.ADMIN) {
        return section !== 'settings';
      }

      // MODERATOR can access users, reports, games, dashboard
      if (user.role === UserRole.MODERATOR) {
        return ['dashboard', 'users', 'reports', 'games'].includes(section);
      }

      // SUPPORT has view-only access to users, reports, dashboard
      if (user.role === 'SUPPORT' as unknown as UserRole) {
        return ['dashboard', 'users', 'reports'].includes(section);
      }

      return false;
    },

    canPerformAction: (action) => {
      const user = get().user;
      if (!user) return false;

      if (user.role === UserRole.SUPER_ADMIN) return true;

      if (user.role === UserRole.ADMIN) {
        return action !== 'manage_settings';
      }

      if (user.role === UserRole.MODERATOR) {
        return action === 'ban' || action === 'resolve_report';
      }

      return false;
    },
  };
});
