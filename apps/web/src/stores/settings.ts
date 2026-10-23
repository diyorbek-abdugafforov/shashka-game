import { create } from 'zustand';

export type BoardThemeId =
  | 'classic'
  | 'wood'
  | 'emerald'
  | 'dark'
  | 'board-royal'
  | 'board-emerald-luxury'
  | 'board-midnight';

export type PieceSkinId =
  | 'classic'
  | 'piece-gold-marble'
  | 'piece-obsidian'
  | 'piece-neon';

interface SettingsState {
  soundEnabled: boolean;
  animationsEnabled: boolean;
  autoRotateBoard: boolean;
  hapticsEnabled: boolean;
  language: 'uz' | 'ru' | 'en';
  boardTheme: BoardThemeId;
  pieceSkin: PieceSkinId;

  toggleSound: () => void;
  toggleAnimations: () => void;
  toggleAutoRotate: () => void;
  toggleHaptics: () => void;
  setLanguage: (lang: 'uz' | 'ru' | 'en') => void;
  setBoardTheme: (theme: BoardThemeId) => void;
  setPieceSkin: (skin: PieceSkinId) => void;
}

const STORAGE_KEY = 'shashka_settings_v1';

function getInitialSettings(): Partial<SettingsState> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveSettings(state: Partial<SettingsState>): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage errors
  }
}

const initial = getInitialSettings();

export const useSettingsStore = create<SettingsState>((set, get) => ({
  soundEnabled: initial.soundEnabled ?? true,
  animationsEnabled: initial.animationsEnabled ?? true,
  autoRotateBoard: initial.autoRotateBoard ?? false,
  hapticsEnabled: initial.hapticsEnabled ?? true,
  language: initial.language ?? 'uz',
  boardTheme: initial.boardTheme ?? 'classic',
  pieceSkin: initial.pieceSkin ?? 'classic',

  toggleSound: () => {
    const next = !get().soundEnabled;
    set({ soundEnabled: next });
    saveSettings({ ...get(), soundEnabled: next });
  },

  toggleAnimations: () => {
    const next = !get().animationsEnabled;
    set({ animationsEnabled: next });
    saveSettings({ ...get(), animationsEnabled: next });
  },

  toggleAutoRotate: () => {
    const next = !get().autoRotateBoard;
    set({ autoRotateBoard: next });
    saveSettings({ ...get(), autoRotateBoard: next });
  },

  toggleHaptics: () => {
    const next = !get().hapticsEnabled;
    set({ hapticsEnabled: next });
    saveSettings({ ...get(), hapticsEnabled: next });
  },

  setLanguage: (language) => {
    set({ language });
    saveSettings({ ...get(), language });
  },

  setBoardTheme: (boardTheme) => {
    set({ boardTheme });
    saveSettings({ ...get(), boardTheme });
  },

  setPieceSkin: (pieceSkin) => {
    set({ pieceSkin });
    saveSettings({ ...get(), pieceSkin });
  },
}));
