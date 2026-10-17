import React from 'react';
import { useNavigate } from 'react-router-dom';
import { GameModel, GameResult } from '@shashka/shared-types';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Avatar } from '../ui/Avatar';
import { formatDate, getGameModeLabel, getGameResultLabel } from '../../utils/format';
import { ChevronRight } from 'lucide-react';

export interface GameCardProps {
  game: GameModel;
  myUserId?: string;
  opponentName?: string;
  opponentAvatar?: string | null;
  opponentRating?: number;
}

export const GameCard: React.FC<GameCardProps> = ({
  game,
  myUserId,
  opponentName = 'Raqib',
  opponentAvatar,
  opponentRating = 1200,
}) => {
  const navigate = useNavigate();

  const isWhite = myUserId ? game.whitePlayerId === myUserId : true;
  const myColor = isWhite ? 'WHITE' : 'BLACK';
  const resultInfo = getGameResultLabel(game.result, myColor);

  return (
    <Card
      hoverable
      onClick={() => navigate(`/games/${game.id}`)}
      className="flex items-center justify-between p-3.5 gap-3 border-zinc-850 hover:border-zinc-700"
    >
      <div className="flex items-center gap-3 min-w-0">
        <Avatar src={opponentAvatar} name={opponentName} size="md" />

        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-zinc-100 truncate">{opponentName}</span>
            <span className="text-xs text-zinc-400 font-mono">({opponentRating})</span>
          </div>

          <div className="flex items-center gap-2 text-xs text-zinc-400 mt-0.5">
            <span>{getGameModeLabel(game.mode)}</span>
            <span>•</span>
            <span>{game.moveCount} yurish</span>
          </div>

          <span className="text-[10px] text-zinc-500 mt-0.5">{formatDate(game.startedAt)}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <Badge variant={resultInfo.variant} size="md">
          {resultInfo.title}
        </Badge>
        <ChevronRight className="w-4 h-4 text-zinc-500" />
      </div>
    </Card>
  );
};
