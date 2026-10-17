import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { PageContainer } from '../components/layout/PageContainer';
import { GameCard } from '../components/common/GameCard';
import { Skeleton } from '../components/ui/Skeleton';
import { ErrorState } from '../components/ui/ErrorState';
import { EmptyState } from '../components/ui/EmptyState';
import { Button } from '../components/ui/Button';
import { gamesApi } from '../api/games';
import { useAuth } from '../hooks/useAuth';
import { History, Swords } from 'lucide-react';

export const GameHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['my-games-history', page],
    queryFn: () => gamesApi.getMyGames({ page, limit: 15 }),
    staleTime: 30000,
  });

  const games = data?.items || [];
  const meta = data?.meta;

  return (
    <PageContainer
      headerProps={{
        title: 'O\'yinlar arxivi',
        showBack: true,
        onBack: () => navigate(-1),
      }}
    >
      <div className="flex flex-col gap-3">
        {isLoading ? (
          <div className="flex flex-col gap-2.5">
            <Skeleton className="h-18" />
            <Skeleton className="h-18" />
            <Skeleton className="h-18" />
            <Skeleton className="h-18" />
          </div>
        ) : isError ? (
          <ErrorState
            title="Tarixni yuklab bo'lmadi"
            message="Server bilan bog'lanishda xatolik yuz berdi."
            onRetry={refetch}
          />
        ) : games.length === 0 ? (
          <EmptyState
            icon={<History className="w-6 h-6 text-indigo-400" />}
            title="O'yinlar tarixi bo'sh"
            description="Siz hali onlayn o'yinlarda qatnashmadingiz. Birinchi o'yinni boshlang!"
            actionLabel="O'yin boshlash"
            onAction={() => navigate('/modes')}
          />
        ) : (
          <>
            <div className="flex flex-col gap-2.5">
              {games.map((game) => (
                <GameCard key={game.id} game={game} myUserId={user?.id} />
              ))}
            </div>

            {/* Pagination Controls */}
            {meta && meta.totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 pb-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={!meta.hasPrev}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Oldingi
                </Button>
                <span className="text-xs text-zinc-400 font-mono">
                  {meta.page} / {meta.totalPages}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={!meta.hasNext}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Keyingi
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </PageContainer>
  );
};
