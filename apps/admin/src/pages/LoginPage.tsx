import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth';
import { Button } from '@/components/ui/Button';
import { ShieldCheck, Send, KeyRound, Sparkles } from 'lucide-react';
import { UserRole } from '@shashka/shared-types';

export const LoginPage: React.FC = () => {
  const [initData, setInitData] = useState('');
  const [activeTab, setActiveTab] = useState<'telegram' | 'dev'>('telegram');
  const { loginWithTelegram, loginDirect, isLoading, error } = useAuthStore();
  const navigate = useNavigate();

  const handleTelegramLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!initData.trim()) return;

    const success = await loginWithTelegram(initData.trim());
    if (success) {
      navigate('/dashboard');
    }
  };

  const handleQuickDevLogin = (role: UserRole) => {
    const roleNames: Record<UserRole, string> = {
      [UserRole.SUPER_ADMIN]: 'Super Administrator',
      [UserRole.ADMIN]: 'Bosh Administrator',
      [UserRole.MODERATOR]: 'Moderator Nodira',
      [UserRole.USER]: 'Oddiy Foydalanuvchi',
    };

    loginDirect('mock-jwt-token-admin-' + Date.now(), {
      id: 'admin-' + role.toLowerCase(),
      telegramId: '100099901',
      username: `${role.toLowerCase()}_uz`,
      displayName: roleNames[role],
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
      role,
      createdAt: new Date().toISOString(),
    });
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-amber-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-sky-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-8 relative z-10 backdrop-blur-xl">
        {/* Header Branding */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center font-black text-white text-3xl shadow-xl shadow-amber-900/40 mx-auto mb-4">
            Ш
          </div>
          <h2 className="text-2xl font-extrabold text-zinc-100 tracking-tight">
            Shashka Admin Paneli
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Boshqaruv tizimiga kirish uchun Telegram hisobingizdan foydalaning
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex rounded-lg bg-zinc-950 p-1 mb-6 border border-zinc-800 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('telegram')}
            className={`flex-1 py-1.5 rounded-md transition-colors ${
              activeTab === 'telegram'
                ? 'bg-amber-600 text-white'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Telegram Auth
          </button>
          <button
            onClick={() => setActiveTab('dev')}
            className={`flex-1 py-1.5 rounded-md transition-colors ${
              activeTab === 'dev'
                ? 'bg-amber-600 text-white'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Tezkor Kirish (Dev)
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-950/60 border border-rose-800 text-xs text-rose-300 font-medium">
            {error}
          </div>
        )}

        {activeTab === 'telegram' ? (
          <form onSubmit={handleTelegramLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-zinc-300">
                Telegram WebApp initData
              </label>
              <textarea
                value={initData}
                onChange={(e) => setInitData(e.target.value)}
                placeholder="query_id=...&user=...&auth_date=...&hash=..."
                rows={3}
                required
                className="w-full bg-zinc-950 text-xs font-mono text-zinc-200 placeholder-zinc-600 border border-zinc-800 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              size="lg"
              isLoading={isLoading}
              leftIcon={<Send className="w-4 h-4" />}
            >
              Telegram orqali kirish
            </Button>
          </form>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-zinc-400 mb-2">
              Rollar boʻyicha sinovdan oʻtkazish uchun tanlang:
            </p>

            <Button
              variant="secondary"
              className="w-full justify-between"
              onClick={() => handleQuickDevLogin(UserRole.SUPER_ADMIN)}
              leftIcon={<ShieldCheck className="w-4 h-4 text-purple-400" />}
            >
              <span>Super Admin sifatida</span>
              <span className="text-xs text-zinc-500">Toʻliq huquq</span>
            </Button>

            <Button
              variant="secondary"
              className="w-full justify-between"
              onClick={() => handleQuickDevLogin(UserRole.ADMIN)}
              leftIcon={<KeyRound className="w-4 h-4 text-amber-400" />}
            >
              <span>Admin sifatida</span>
              <span className="text-xs text-zinc-500">Sozlamalardan tashqari</span>
            </Button>

            <Button
              variant="secondary"
              className="w-full justify-between"
              onClick={() => handleQuickDevLogin(UserRole.MODERATOR)}
              leftIcon={<Sparkles className="w-4 h-4 text-sky-400" />}
            >
              <span>Moderator sifatida</span>
              <span className="text-xs text-zinc-500">Users, Reports, Games</span>
            </Button>
          </div>
        )}

        <div className="mt-8 pt-4 border-t border-zinc-800 text-center">
          <p className="text-[11px] text-zinc-500">
            Faqat tizim maʼmurlari va moderatorlar uchun moʻljallangan. Barcha harakatlar audit
            jurnalida qayd etiladi.
          </p>
        </div>
      </div>
    </div>
  );
};
