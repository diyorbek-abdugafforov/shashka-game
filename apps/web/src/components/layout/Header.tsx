import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Coins, Sun, Moon } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../providers/ThemeProvider';
import { formatNumber } from '../../utils/format';
import { triggerHaptic } from '../../utils/telegram';

export interface HeaderProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightAction?: React.ReactNode;
  showBalance?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  showBack = false,
  onBack,
  rightAction,
  showBalance = false,
}) => {
  const navigate = useNavigate();
  const { wallet } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const handleBack = () => {
    triggerHaptic('light');
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-14 px-4 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-850 max-w-md mx-auto w-full transition-colors">
      <div className="flex items-center gap-2.5 min-w-0">
        {showBack && (
          <button
            onClick={handleBack}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-zinc-300 hover:text-white hover:bg-zinc-800 active:scale-95 transition-colors -ml-1"
            aria-label="Orqaga"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        {title && (
          <h1 className="text-base font-bold text-zinc-100 truncate tracking-tight">
            {title}
          </h1>
        )}
      </div>

      <div className="flex items-center gap-2">
        {showBalance && wallet && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold">
            <Coins className="w-3.5 h-3.5 text-amber-400" />
            <span>{formatNumber(wallet.balance)}</span>
          </div>
        )}

        <button
          onClick={() => {
            triggerHaptic('selection');
            toggleTheme();
          }}
          className="w-8 h-8 rounded-xl flex items-center justify-center bg-zinc-800/80 border border-zinc-700/60 text-amber-400 hover:text-amber-300 active:scale-95 transition-all"
          title={theme === 'dark' ? "Yorug' rejim" : "Qorong'i rejim"}
          aria-label="Mavzuni almashtirish"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4 text-indigo-400" />}
        </button>

        {rightAction}
      </div>
    </header>
  );
};
