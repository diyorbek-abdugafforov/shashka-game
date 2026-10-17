import { useAuthStore } from '../stores/auth';

export function useAuth() {
  const user = useAuthStore((s) => s.user);
  const wallet = useAuthStore((s) => s.wallet);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);
  const error = useAuthStore((s) => s.error);
  const login = useAuthStore((s) => s.login);
  const logout = useAuthStore((s) => s.logout);
  const checkSession = useAuthStore((s) => s.checkSession);

  return {
    user,
    wallet,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    checkSession,
  };
}
