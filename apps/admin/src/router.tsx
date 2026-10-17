import React from 'react';
import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { LoginPage } from '@/pages/LoginPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { UsersPage } from '@/pages/UsersPage';
import { UserDetailPage } from '@/pages/UserDetailPage';
import { GamesPage } from '@/pages/GamesPage';
import { ReportsPage } from '@/pages/ReportsPage';
import { ShopPage } from '@/pages/ShopPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { AuditLogPage } from '@/pages/AuditLogPage';

/**
 * Route Auth Guard
 * Redirects unauthenticated visitors to /login
 */
const ProtectedRoute: React.FC = () => {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

/**
 * Section Permission Guard
 */
const SectionGuard: React.FC<{
  section: 'dashboard' | 'users' | 'games' | 'reports' | 'shop' | 'settings' | 'audit';
  children: React.ReactElement;
}> = ({ section, children }) => {
  const { canAccess } = useAuthStore();

  if (!canAccess(section)) {
    return (
      <div className="p-8 text-center bg-zinc-900 border border-zinc-800 rounded-xl">
        <h3 className="text-lg font-bold text-rose-400">Ruxsat cheklangan (Access Denied)</h3>
        <p className="text-xs text-zinc-400 mt-1">
          Ushbu boʻlimga kirish uchun sizning rolingizda yetarli vakolat mavjud emas.
        </p>
      </div>
    );
  }

  return children;
};

export const router = createBrowserRouter(
  [
    {
      path: '/login',
      element: <LoginPage />,
    },
    {
      path: '/',
      element: <ProtectedRoute />,
      children: [
        {
          element: <AdminLayout />,
          children: [
            {
              index: true,
              element: <Navigate to="/dashboard" replace />,
            },
            {
              path: 'dashboard',
              element: (
                <SectionGuard section="dashboard">
                  <DashboardPage />
                </SectionGuard>
              ),
            },
            {
              path: 'users',
              element: (
                <SectionGuard section="users">
                  <UsersPage />
                </SectionGuard>
              ),
            },
            {
              path: 'users/:id',
              element: (
                <SectionGuard section="users">
                  <UserDetailPage />
                </SectionGuard>
              ),
            },
            {
              path: 'games',
              element: (
                <SectionGuard section="games">
                  <GamesPage />
                </SectionGuard>
              ),
            },
            {
              path: 'reports',
              element: (
                <SectionGuard section="reports">
                  <ReportsPage />
                </SectionGuard>
              ),
            },
            {
              path: 'shop',
              element: (
                <SectionGuard section="shop">
                  <ShopPage />
                </SectionGuard>
              ),
            },
            {
              path: 'settings',
              element: (
                <SectionGuard section="settings">
                  <SettingsPage />
                </SectionGuard>
              ),
            },
            {
              path: 'audit',
              element: (
                <SectionGuard section="audit">
                  <AuditLogPage />
                </SectionGuard>
              ),
            },
          ],
        },
      ],
    },
    {
      path: '*',
      element: <Navigate to="/dashboard" replace />,
    },
  ],
  {
    basename: '/admin',
  },
);
