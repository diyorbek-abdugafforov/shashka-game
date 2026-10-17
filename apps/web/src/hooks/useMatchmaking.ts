import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GameMode } from '@shashka/shared-types';
import { useSocketContext } from '../providers/SocketProvider';

export function useMatchmaking(selectedMode: GameMode = GameMode.CLASSIC) {
  const navigate = useNavigate();
  const { isInQueue, queuePosition, currentMatch, joinQueue, leaveQueue } = useSocketContext();
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isInQueue) {
      setElapsedSeconds(0);
      timer = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setElapsedSeconds(0);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isInQueue]);

  // Navigate when match is found
  useEffect(() => {
    if (currentMatch) {
      navigate(`/game/online/${currentMatch.gameId}`);
    }
  }, [currentMatch, navigate]);

  const startSearching = (mode = selectedMode, rated = true) => {
    joinQueue(mode, rated);
  };

  const cancelSearching = () => {
    leaveQueue(selectedMode);
  };

  return {
    isInQueue,
    queuePosition,
    elapsedSeconds,
    startSearching,
    cancelSearching,
  };
}
