import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { GameModePage } from './pages/GameModePage';
import { BotGamePage } from './pages/BotGamePage';
import { OfflineGamePage } from './pages/OfflineGamePage';
import { MatchmakingPage } from './pages/MatchmakingPage';
import { OnlineGamePage } from './pages/OnlineGamePage';
import { ProfilePage } from './pages/ProfilePage';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { GameHistoryPage } from './pages/GameHistoryPage';
import { GameReplayPage } from './pages/GameReplayPage';
import { SettingsPage } from './pages/SettingsPage';
import { ShopPage } from './pages/ShopPage';
import { MiniGamesPage } from './pages/MiniGamesPage';

const RouteErrorBoundary: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center bg-zinc-950 text-zinc-100 max-w-md mx-auto">
      <div className="w-14 h-14 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center mb-4 text-2xl">
        ♟️
      </div>
      <h2 className="text-base font-bold mb-1.5">Sahifani yuklashda xatolik</h2>
      <p className="text-xs text-zinc-400 mb-5 max-w-xs">
        Iltimos, bosh sahifaga qayting yoki sahifani yangilang.
      </p>
      <button
        onClick={() => {
          window.location.href = '/';
        }}
        className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all shadow-md active:scale-95"
      >
        Bosh sahifaga qaytish
      </button>
    </div>
  );
};

export const router = createBrowserRouter([
  {
    path: '/',
    element: <HomePage />,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: '/modes',
    element: <GameModePage />,
  },
  {
    path: '/game/bot',
    element: <BotGamePage />,
  },
  {
    path: '/game/offline',
    element: <OfflineGamePage />,
  },
  {
    path: '/matchmaking',
    element: <MatchmakingPage />,
  },
  {
    path: '/game/online/:gameId',
    element: <OnlineGamePage />,
  },
  {
    path: '/profile',
    element: <ProfilePage />,
  },
  {
    path: '/leaderboard',
    element: <LeaderboardPage />,
  },
  {
    path: '/history',
    element: <GameHistoryPage />,
  },
  {
    path: '/games/:gameId',
    element: <GameReplayPage />,
  },
  {
    path: '/settings',
    element: <SettingsPage />,
  },
  {
    path: '/shop',
    element: <ShopPage />,
  },
  {
    path: '/mini-games',
    element: <MiniGamesPage />,
  },
  {
    path: '/tournaments',
    element: <Navigate to="/leaderboard" replace />,
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);
