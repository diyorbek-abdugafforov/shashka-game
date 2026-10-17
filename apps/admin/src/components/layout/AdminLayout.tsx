import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export const AdminLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  const getPageTitle = (pathname: string): string => {
    if (pathname.startsWith('/users/')) return 'Foydalanuvchi profili';
    if (pathname.startsWith('/users')) return 'Foydalanuvchilar boshqaruvi';
    if (pathname.startsWith('/games')) return 'Oʻyinlar monitoringi';
    if (pathname.startsWith('/reports')) return 'Shikoyatlar va Moderatsiya';
    if (pathname.startsWith('/shop')) return 'Doʻkon mahsulotlari';
    if (pathname.startsWith('/settings')) return 'Tizim sozlamalari';
    if (pathname.startsWith('/audit')) return 'Audit va Amallar tarixi';
    return 'Boshqaruv paneli';
  };

  const title = getPageTitle(location.pathname);

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100 overflow-hidden">
      {/* Sidebar */}
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />

      {/* Main Content Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <Header title={title} onToggleSidebar={() => setCollapsed(!collapsed)} />

        {/* Scrollable Page Body */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-zinc-950/60">
          <div className="max-w-7xl mx-auto w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
