import React, { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { getDeepLinkGameId } from './utils/deepLink';

export const App: React.FC = () => {
  useEffect(() => {
    const gameId = getDeepLinkGameId();
    if (gameId && !window.location.pathname.includes(`/game/online/${gameId}`)) {
      router.navigate(`/game/online/${gameId}`);
    }
  }, []);

  return <RouterProvider router={router} />;
};

export default App;

