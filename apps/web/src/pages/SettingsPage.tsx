import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PageContainer } from '../components/layout/PageContainer';
import { Card } from '../components/ui/Card';
import { useSettingsStore, BoardThemeId } from '../stores/settings';
import { useTheme } from '../providers/ThemeProvider';
import { useAuth } from '../hooks/useAuth';
import { useTranslation, Language } from '../i18n';
import { triggerHaptic } from '../utils/telegram';
import {
  Volume2,
  VolumeX,
  Sparkles,
  Smartphone,
  RotateCw,
  Moon,
  Sun,
  Globe,
  Bot,
  Puzzle,
  Grid,
  ChevronRight,
  TrendingUp,
  CloudSun,
  Gem,
  SmartphoneNfc,
  Layers,
} from 'lucide-react';
import { cn } from '../utils/cn';

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, wallet } = useAuth();
  const { t, language, setLanguage } = useTranslation();
  const { theme, toggleTheme } = useTheme();

  const {
    soundEnabled,
    animationsEnabled,
    hapticsEnabled,
    autoRotateBoard,
    boardTheme,
    toggleSound,
    toggleAnimations,
    toggleHaptics,
    toggleAutoRotate,
    setBoardTheme,
  } = useSettingsStore();

  const handleToggle = (fn: () => void) => {
    triggerHaptic('selection');
    fn();
  };

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    triggerHaptic('selection');
    setLanguage(e.target.value as Language);
  };

  const gamesMenu = [
    {
      id: 'bot',
      title: language === 'ru' ? 'Играть с ботом' : language === 'en' ? 'Play vs Bot' : "Bot bilan O'ynash",
      desc: language === 'ru' ? 'Испытайте свои навыки' : language === 'en' ? 'Test your skill' : "Tajribangizni sinab ko'ring",
      icon: '🤖',
      bgColor: 'bg-purple-500/20 text-purple-400',
      action: () => navigate('/game/bot'),
    },
    {
      id: 'puzzles',
      title: language === 'ru' ? 'Задачи' : language === 'en' ? 'Puzzles' : 'Masalalar',
      desc: language === 'ru' ? 'Решайте тактические комбинации' : language === 'en' ? 'Solve checkers tactics' : "Rus shashkasi kombinatsiyalarini yeching",
      icon: '🧩',
      bgColor: 'bg-emerald-500/20 text-emerald-400',
      action: () => navigate('/mini-games'),
    },
    {
      id: 'international',
      title: language === 'ru' ? 'Международные шашки' : language === 'en' ? 'International Checkers' : 'Xalqaro shashka',
      desc: language === 'ru' ? 'Доска 10х10, сильный бот (Scan)' : language === 'en' ? '10x10 board, advanced bot' : "10×10 doska, kuchli bot (Scan) bilan o'ynang",
      icon: '🟥',
      bgColor: 'bg-rose-500/20 text-rose-400',
      action: () => navigate('/game/bot'),
    },
    {
      id: 'corners',
      title: language === 'ru' ? 'Уголки' : language === 'en' ? 'Corners' : 'Burchak',
      desc: '🏆 Yetakchi: Ch. T. H — Grossmeyster V',
      icon: '🟩',
      bgColor: 'bg-teal-500/20 text-teal-400',
      action: () => navigate('/modes'),
    },
    {
      id: 'offline',
      title: language === 'ru' ? 'Офлайн на двоих' : language === 'en' ? 'Offline 2 Players' : 'Offline 2 o\'yinchi',
      desc: language === 'ru' ? 'С другом на одном экране' : language === 'en' ? 'Pass and play' : "Do'stingiz bilan bir qurilmada",
      icon: '📱',
      bgColor: 'bg-sky-500/20 text-sky-400',
      action: () => navigate('/game/offline'),
    },
  ];

  return (
    <PageContainer
      headerProps={{
        title: language === 'ru' ? 'Меню' : language === 'en' ? 'Menu' : 'Menyu',
        showBack: false,
      }}
    >
      <div className="flex flex-col gap-4 pb-6">
        {/* User Card matching Screenshot 5 */}
        <div className="flex items-center justify-between p-3 rounded-2xl bg-zinc-900/90 border border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-base shadow-inner">
              {user?.displayName ? user.displayName.slice(0, 1).toUpperCase() : '👤'}
            </div>

            <div>
              <h4 className="text-xs font-bold text-zinc-100">
                {user?.displayName || "Diyorbek Abdug'afforov"}
              </h4>
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[10px] font-bold mt-1 w-fit">
                <span>{wallet?.balance || 351}</span>
                <Gem className="w-3 h-3 text-amber-400" />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Language dropdown */}
            <select
              value={language}
              onChange={handleLanguageChange}
              className="bg-zinc-800 text-zinc-200 text-xs font-bold rounded-xl px-2.5 py-1.5 border border-zinc-700 outline-none"
            >
              <option value="uz">uz UZB</option>
              <option value="ru">ru RUS</option>
              <option value="en">en ENG</option>
            </select>

            {/* Theme Toggle */}
            <button
              onClick={() => {
                triggerHaptic('selection');
                toggleTheme();
              }}
              className="w-8 h-8 rounded-xl bg-zinc-800 text-amber-400 border border-zinc-700 flex items-center justify-center active:scale-95 transition-all"
              title="Mavzuni almashtirish"
            >
              {theme === 'dark' ? <Moon className="w-4 h-4 fill-amber-400 text-amber-400" /> : <Sun className="w-4 h-4 text-amber-400" />}
            </button>
          </div>
        </div>

        {/* Live Info Widget: Weather & Currency Card */}
        <Card className="p-3.5 bg-gradient-to-r from-zinc-900 via-zinc-900 to-indigo-950/40 border-zinc-800 grid grid-cols-3 gap-2 text-center text-xs">
          {/* Weather */}
          <div className="flex flex-col items-center justify-center p-1.5 rounded-xl bg-zinc-850/60 border border-zinc-800">
            <span className="text-[10px] text-zinc-400 flex items-center gap-1">
              ☁️ Toshkent
            </span>
            <span className="font-bold text-zinc-200 mt-0.5">+20°C</span>
          </div>

          {/* USD */}
          <div className="flex flex-col items-center justify-center p-1.5 rounded-xl bg-zinc-850/60 border border-zinc-800">
            <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-0.5">
              USD ↗
            </span>
            <span className="font-bold text-zinc-200 mt-0.5">12 056</span>
            <span className="text-[9px] text-emerald-400">+0.37%</span>
          </div>

          {/* RUB */}
          <div className="flex flex-col items-center justify-center p-1.5 rounded-xl bg-zinc-850/60 border border-zinc-800">
            <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-0.5">
              RUB ↗
            </span>
            <span className="font-bold text-zinc-200 mt-0.5">144.16</span>
            <span className="text-[9px] text-emerald-400">+0.69%</span>
          </div>
        </Card>

        {/* Section: O'yinlar matching Screenshot 5 */}
        <div className="flex flex-col gap-2">
          <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider pl-1 flex items-center gap-1.5">
            <span>🎮</span>
            <span>O'YINLAR</span>
          </span>

          <Card className="divide-y divide-zinc-800/80 p-0 overflow-hidden bg-zinc-900/80 border-zinc-800">
            {gamesMenu.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  triggerHaptic('light');
                  item.action();
                }}
                className="flex items-center justify-between p-3.5 hover:bg-zinc-850/50 active:bg-zinc-850 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-lg shrink-0">
                    {item.icon}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-zinc-100">{item.title}</h4>
                    <p className="text-[11px] text-zinc-400 mt-0.5">{item.desc}</p>
                  </div>
                </div>

                <ChevronRight className="w-4 h-4 text-zinc-500" />
              </div>
            ))}
          </Card>
        </div>

        {/* Gameplay Preferences */}
        <div className="flex flex-col gap-2">
          <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider pl-1 flex items-center gap-1.5">
            <span>⚙️</span>
            <span>{t('settings_gameplay')}</span>
          </span>

          <Card className="divide-y divide-zinc-800/80 p-0 overflow-hidden bg-zinc-900/80 border-zinc-800">
            {/* Sound Toggle */}
            <div className="flex items-center justify-between p-3.5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                  {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </div>
                <div>
                  <div className="text-xs font-semibold text-zinc-100">{t('settings_sound')}</div>
                  <div className="text-[11px] text-zinc-400">{t('settings_sound_desc')}</div>
                </div>
              </div>
              <button
                onClick={() => handleToggle(toggleSound)}
                className={cn(
                  'w-11 h-6 rounded-full transition-colors relative flex items-center px-0.5',
                  soundEnabled ? 'bg-indigo-600' : 'bg-zinc-700',
                )}
                role="switch"
                aria-checked={soundEnabled}
              >
                <div
                  className={cn(
                    'w-5 h-5 rounded-full bg-white shadow-md transition-transform',
                    soundEnabled ? 'translate-x-5' : 'translate-x-0',
                  )}
                />
              </button>
            </div>

            {/* Animations Toggle */}
            <div className="flex items-center justify-between p-3.5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-violet-500/10 text-violet-400 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-zinc-100">{t('settings_anim')}</div>
                  <div className="text-[11px] text-zinc-400">{t('settings_anim_desc')}</div>
                </div>
              </div>
              <button
                onClick={() => handleToggle(toggleAnimations)}
                className={cn(
                  'w-11 h-6 rounded-full transition-colors relative flex items-center px-0.5',
                  animationsEnabled ? 'bg-indigo-600' : 'bg-zinc-700',
                )}
                role="switch"
                aria-checked={animationsEnabled}
              >
                <div
                  className={cn(
                    'w-5 h-5 rounded-full bg-white shadow-md transition-transform',
                    animationsEnabled ? 'translate-x-5' : 'translate-x-0',
                  )}
                />
              </button>
            </div>

            {/* Haptics Toggle */}
            <div className="flex items-center justify-between p-3.5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-zinc-100">{t('settings_haptics')}</div>
                  <div className="text-[11px] text-zinc-400">{t('settings_haptics_desc')}</div>
                </div>
              </div>
              <button
                onClick={() => handleToggle(toggleHaptics)}
                className={cn(
                  'w-11 h-6 rounded-full transition-colors relative flex items-center px-0.5',
                  hapticsEnabled ? 'bg-indigo-600' : 'bg-zinc-700',
                )}
                role="switch"
                aria-checked={hapticsEnabled}
              >
                <div
                  className={cn(
                    'w-5 h-5 rounded-full bg-white shadow-md transition-transform',
                    hapticsEnabled ? 'translate-x-5' : 'translate-x-0',
                  )}
                />
              </button>
            </div>
          </Card>
        </div>

        {/* About App */}
        <Card className="p-4 bg-zinc-900/40 border-zinc-800 text-center">
          <h4 className="text-xs font-bold text-zinc-200">Shashka Online · Telegram Mini App</h4>
          <p className="text-[11px] text-zinc-500 mt-1">@shashka_gamebot · Versiya 2.0.0</p>
        </Card>
      </div>
    </PageContainer>
  );
};
