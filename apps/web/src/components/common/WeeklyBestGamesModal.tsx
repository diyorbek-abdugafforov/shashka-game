import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Crown, Star, Play, X, Calendar, Flame, Swords } from 'lucide-react';
import { gamesApi } from '../../api/games';
import { Modal } from '../ui/Modal';
import { triggerHaptic } from '../../utils/telegram';

export interface WeeklyBestGamesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WeeklyBestGamesModal: React.FC<WeeklyBestGamesModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [ratingGameId, setRatingGameId] = useState<string | null>(null);
  const [selectedStars, setSelectedStars] = useState(5);

  const { data: featuredGames = [], isLoading } = useQuery({
    queryKey: ['featured-weekly-games'],
    queryFn: () => gamesApi.getFeaturedWeekly(),
    enabled: isOpen,
    staleTime: 60000,
  });

  const rateMutation = useMutation({
    mutationFn: ({ gameId, rating }: { gameId: string; rating: number }) =>
      gamesApi.rateGame(gameId, rating),
    onSuccess: () => {
      triggerHaptic('success');
      setRatingGameId(null);
      queryClient.invalidateQueries({ queryKey: ['featured-weekly-games'] });
    },
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Haftaning eng chiroyli o'yinlari">
      <div className="flex flex-col gap-3 py-1">
        <p className="text-xs text-zinc-400">
          Ushbu haftadagi eng tezkor motlar, yuqori darajali kombinatsiyalar va qoyilmaqom yurishlar:
        </p>

        {isLoading ? (
          <div className="py-8 text-center text-xs text-zinc-400">O'yinlar yuklanmoqda...</div>
        ) : featuredGames.length === 0 ? (
          <div className="py-8 text-center text-xs text-zinc-500">
            Hozircha haftalik eng sara o'yinlar ro'yxati shakllanmoqda...
          </div>
        ) : (
          <div className="flex flex-col gap-2.5 max-h-[60vh] overflow-y-auto pr-1">
            {featuredGames.map((game: any) => {
              const whiteName = game.whitePlayer?.displayName || 'Oq o\'yinchi';
              const blackName = game.blackPlayer?.displayName || 'Qora o\'yinchi';
              const movesCount = game.moves?.length || game.moveCount || 0;
              const dateStr = new Date(game.createdAt).toLocaleString([], {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={game.id}
                  className="p-3 rounded-2xl bg-zinc-850/80 border border-zinc-750 flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-100">
                      <Flame className="w-3.5 h-3.5 text-amber-400" />
                      <span>{whiteName}</span>
                      <span className="text-zinc-500">vs</span>
                      <span>{blackName}</span>
                    </div>

                    <div className="flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                      <Star className="w-3 h-3 fill-amber-400" />
                      <span>{game.ratingScore ? Number(game.ratingScore).toFixed(1) : '5.0'}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-zinc-400 border-t border-zinc-750/60 pt-1.5">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-zinc-500" />
                      {dateStr}
                    </span>
                    <span>{movesCount} ta yurish</span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => {
                        triggerHaptic('light');
                        onClose();
                        navigate(`/games/${game.id}`);
                      }}
                      className="flex-1 py-1.5 px-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-xs"
                    >
                      <Play className="w-3.5 h-3.5 fill-white" />
                      <span>O'yinni ko'rish</span>
                    </button>

                    <button
                      onClick={() => {
                        triggerHaptic('selection');
                        setRatingGameId(ratingGameId === game.id ? null : game.id);
                      }}
                      className="py-1.5 px-3 rounded-xl bg-zinc-750 hover:bg-zinc-700 text-amber-300 font-bold text-xs flex items-center justify-center gap-1 transition-all active:scale-95 border border-amber-500/30"
                    >
                      <Star className="w-3.5 h-3.5" />
                      <span>Baholash</span>
                    </button>
                  </div>

                  {/* Rating inline picker */}
                  {ratingGameId === game.id && (
                    <div className="flex items-center justify-between p-2 rounded-xl bg-zinc-900 border border-zinc-700 mt-1 animate-in fade-in">
                      <span className="text-[11px] text-zinc-300 font-medium">Baho qo'ying:</span>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => {
                              setSelectedStars(star);
                              rateMutation.mutate({ gameId: game.id, rating: star });
                            }}
                            className="p-1 hover:scale-125 transition-transform"
                          >
                            <Star
                              className={`w-4 h-4 ${
                                star <= selectedStars
                                  ? 'text-amber-400 fill-amber-400'
                                  : 'text-zinc-600'
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Modal>
  );
};
