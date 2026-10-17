import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PageContainer } from '../components/layout/PageContainer';
import { Card } from '../components/ui/Card';
import { useSettingsStore, BoardThemeId } from '../stores/settings';
import { useTheme } from '../providers/ThemeProvider';
import { useTranslation } from '../i18n';
import {
  Volume2,
  VolumeX,
  Sparkles,
  Smartphone,
  RotateCw,
  Palette,
  Moon,
  Sun,
  Globe,
  Info,
  ExternalLink,
} from 'lucide-react';
import { cn } from '../utils/cn';
import { triggerHaptic } from '../utils/telegram';

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const {
    soundEnabled,
    animationsEnabled,
    hapticsEnabled,
    autoRotateBoard,
    language,
    boardTheme,
    toggleSound,
    toggleAnimations,
    toggleHaptics,
    toggleAutoRotate,
    setLanguage,
    setBoardTheme,
  } = useSettingsStore();

  const { theme, toggleTheme } = useTheme();

  const handleToggle = (fn: () => void) => {
    triggerHaptic('selection');
    fn();
  };

  const boardThemes: { id: BoardThemeId; label: string; previewDark: string; previewLight: string }[] = [
    { id: 'classic', label: language === 'ru' ? 'Классика' : language === 'en' ? 'Classic' : 'Klassik', previewDark: '#6b472e', previewLight: '#dfcead' },
    { id: 'wood', label: language === 'ru' ? 'Дерево' : language === 'en' ? 'Wood' : 'Yog\'och', previewDark: '#784627', previewLight: '#d8b898' },
    { id: 'emerald', label: language === 'ru' ? 'Изумруд' : language === 'en' ? 'Emerald' : 'Zumrad', previewDark: '#0f4a38', previewLight: '#e2f1e8' },
    { id: 'dark', label: language === 'ru' ? 'Тёмный' : language === 'en' ? 'Midnight' : 'To\'q ko\'k', previewDark: '#182030', previewLight: '#3b475e' },
  ];

  return (
    <PageContainer
      headerProps={{
        title: t('settings_title'),
        showBack: true,
        onBack: () => navigate(-1),
      }}
    >
      <div className="flex flex-col gap-5">
        {/* Gameplay Preferences */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider pl-1">
            {t('settings_gameplay')}
          </span>

          <Card className="divide-y divide-zinc-800/80 p-0 overflow-hidden bg-zinc-900/60 border-zinc-800">
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

            {/* Offline Auto-rotate Toggle */}
            <div className="flex items-center justify-between p-3.5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
                  <RotateCw className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-zinc-100">{t('settings_autorotate')}</div>
                  <div className="text-[11px] text-zinc-400">{t('settings_autorotate_desc')}</div>
                </div>
              </div>
              <button
                onClick={() => handleToggle(toggleAutoRotate)}
                className={cn(
                  'w-11 h-6 rounded-full transition-colors relative flex items-center px-0.5',
                  autoRotateBoard ? 'bg-indigo-600' : 'bg-zinc-700',
                )}
                role="switch"
                aria-checked={autoRotateBoard}
              >
                <div
                  className={cn(
                    'w-5 h-5 rounded-full bg-white shadow-md transition-transform',
                    autoRotateBoard ? 'translate-x-5' : 'translate-x-0',
                  )}
                />
              </button>
            </div>
          </Card>
        </div>

        {/* Board Theme Selection */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider pl-1">
            {t('settings_board_theme')}
          </span>

          <div className="grid grid-cols-2 gap-2.5">
            {boardThemes.map((t) => {
              const isSelected = boardTheme === t.id;
              return (
                <Card
                  key={t.id}
                  hoverable
                  onClick={() => {
                    triggerHaptic('selection');
                    setBoardTheme(t.id);
                  }}
                  className={cn(
                    'p-3 flex items-center justify-between border-2 transition-all',
                    isSelected
                      ? 'border-indigo-500 bg-indigo-950/20 shadow-xs'
                      : 'border-zinc-800 bg-zinc-900/40 hover:border-zinc-700',
                  )}
                >
                  <span className="text-xs font-semibold text-zinc-200">{t.label}</span>
                  <div className="w-7 h-7 rounded-lg overflow-hidden border border-zinc-700 grid grid-cols-2 grid-rows-2">
                    <div style={{ backgroundColor: t.previewLight }} />
                    <div style={{ backgroundColor: t.previewDark }} />
                    <div style={{ backgroundColor: t.previewDark }} />
                    <div style={{ backgroundColor: t.previewLight }} />
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Language & Theme */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider pl-1">
            {t('settings_lang_and_theme')}
          </span>

          <Card className="divide-y divide-zinc-800/80 p-0 overflow-hidden bg-zinc-900/60 border-zinc-800">
            {/* Language */}
            <div className="flex items-center justify-between p-3.5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
                  <Globe className="w-4 h-4" />
                </div>
                <div className="text-xs font-semibold text-zinc-100">{t('settings_lang')}</div>
              </div>

              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as any)}
                className="bg-zinc-800 text-zinc-200 text-xs font-medium rounded-lg px-2.5 py-1.5 border border-zinc-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="uz">O'zbekcha</option>
                <option value="ru">Русский</option>
                <option value="en">English</option>
              </select>
            </div>

            {/* Telegram Theme Sync */}
            <div className="flex items-center justify-between p-3.5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
                  {theme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                </div>
                <div>
                  <div className="text-xs font-semibold text-zinc-100">{t('settings_theme')}</div>
                  <div className="text-[11px] text-zinc-400">
                    {theme === 'dark' ? t('settings_theme_dark') : t('settings_theme_light')}
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleToggle(toggleTheme)}
                className="text-xs font-semibold text-indigo-400 px-3 py-1.5 rounded-lg bg-indigo-950/40 border border-indigo-800/50 hover:bg-indigo-900/40"
              >
                {t('settings_theme_btn')}
              </button>
            </div>
          </Card>
        </div>

        {/* About App */}
        <Card className="p-4 bg-zinc-900/40 border-zinc-800 text-center">
          <h4 className="text-xs font-bold text-zinc-200">{t('settings_about')}</h4>
          <p className="text-[11px] text-zinc-500 mt-1">{t('settings_version')}</p>
        </Card>
      </div>
    </PageContainer>
  );
};
