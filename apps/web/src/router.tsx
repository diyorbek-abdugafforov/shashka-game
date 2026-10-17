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

export const router = createBrowserRouter([
  {
    path: '/',
    element: <HomePage />,
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
    path: '/tournaments',
    element: <Navigate to="/leaderboard" replace />,
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);
