export function getDeepLinkGameId(): string | null {
  if (typeof window === 'undefined') return null;

  try {
    // 1. Telegram WebApp start_param
    const tgParam = (window as any).Telegram?.WebApp?.initDataUnsafe?.start_param;
    if (tgParam) {
      const clean = tgParam.replace(/^(game_|room_|invite_|inv_)/, '').trim();
      if (clean) return clean;
    }

    // 2. URL search parameters
    const search = new URLSearchParams(window.location.search);
    const candidate =
      search.get('tgWebAppStartParam') ||
      search.get('startapp') ||
      search.get('game') ||
      search.get('room') ||
      search.get('invite');

    if (candidate) {
      const clean = candidate.replace(/^(game_|room_|invite_|inv_)/, '').trim();
      if (clean) return clean;
    }

    // 3. URL hash parameters (#/game/online/xyz or #game_xyz)
    const hash = window.location.hash;
    if (hash) {
      const routeMatch = hash.match(/game\/online\/([a-zA-Z0-9_-]+)/);
      if (routeMatch && routeMatch[1]) return routeMatch[1];

      const paramMatch = hash.match(/[?&#](?:tgWebAppStartParam|startapp|game|room)=([a-zA-Z0-9_-]+)/);
      if (paramMatch && paramMatch[1]) {
        return paramMatch[1].replace(/^(game_|room_|invite_|inv_)/, '').trim();
      }
    }
  } catch {
    // Ignore URL parsing errors
  }

  return null;
}
