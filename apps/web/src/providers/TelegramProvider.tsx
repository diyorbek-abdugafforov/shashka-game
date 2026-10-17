import React, { createContext, useContext, useEffect, useState } from 'react';
import { expandTelegramApp, getTelegramWebApp, isTelegramWebApp } from '../utils/telegram';
import { useAuthStore } from '../stores/auth';

interface TelegramContextValue {
  isReady: boolean;
  isInsideTelegram: boolean;
  colorScheme: 'light' | 'dark';
}

const TelegramContext = createContext<TelegramContextValue>({
  isReady: false,
  isInsideTelegram: false,
  colorScheme: 'dark',
});

export const TelegramProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isReady, setIsReady] = useState(false);
  const [colorScheme, setColorScheme] = useState<'light' | 'dark'>('dark');
  const checkSession = useAuthStore((state) => state.checkSession);

  useEffect(() => {
    expandTelegramApp();
    const tg = getTelegramWebApp();

    if (tg) {
      setColorScheme(tg.colorScheme || 'dark');
    }

    // Initialize authentication
    checkSession().finally(() => {
      setIsReady(true);
    });
  }, [checkSession]);

  return (
    <TelegramContext.Provider
      value={{
        isReady,
        isInsideTelegram: isTelegramWebApp(),
        colorScheme,
      }}
    >
      {children}
    </TelegramContext.Provider>
  );
};

export const useTelegram = () => useContext(TelegramContext);
