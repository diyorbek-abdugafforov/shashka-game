import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './Button';
import { cn } from '@/utils/cn';

export interface PaginationProps {
  page: number;
  totalPages: number;
  total?: number;
  limit?: number;
  onPageChange: (newPage: number) => void;
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  page,
  totalPages,
  total,
  limit,
  onPageChange,
  className,
}) => {
  if (totalPages <= 1 && (!total || total <= (limit || 10))) {
    return null;
  }

  // Generate page numbers
  const pages: (number | 'ellipsis')[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push('ellipsis');
    const start = Math.max(2, page - 1);
    const end = Math.min(totalPages - 1, page + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (page < totalPages - 2) pages.push('ellipsis');
    pages.push(totalPages);
  }

  const startItem = total !== undefined && limit !== undefined ? (page - 1) * limit + 1 : undefined;
  const endItem =
    total !== undefined && limit !== undefined ? Math.min(page * limit, total) : undefined;

  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row items-center justify-between gap-3 px-2 py-3 border-t border-zinc-800 text-xs text-zinc-400',
        className,
      )}
    >
      <div>
        {total !== undefined && startItem !== undefined && endItem !== undefined ? (
          <span>
            Jami <span className="font-semibold text-zinc-200">{total}</span> tadan{' '}
            <span className="font-semibold text-zinc-200">{startItem}</span> -{' '}
            <span className="font-semibold text-zinc-200">{endItem}</span> koʻrsatilmoqda
          </span>
        ) : (
          <span>
            Sahifa <span className="font-semibold text-zinc-200">{page}</span> /{' '}
            <span className="font-semibold text-zinc-200">{totalPages}</span>
          </span>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        <Button
          variant="outline"
          size="xs"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          leftIcon={<ChevronLeft className="w-3.5 h-3.5" />}
        >
          Oldingi
        </Button>

        <div className="flex items-center gap-1">
          {pages.map((p, idx) => {
            if (p === 'ellipsis') {
              return (
                <span key={`ellipsis-${idx}`} className="px-1 text-zinc-600">
                  ...
                </span>
              );
            }
            const isCurrent = p === page;
            return (
              <button
                key={p}
                onClick={() => onPageChange(p)}
                className={cn(
                  'min-w-7 h-7 px-2 rounded text-xs font-medium transition-colors select-none',
                  isCurrent
                    ? 'bg-amber-600 text-white font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800',
                )}
              >
                {p}
              </button>
            );
          })}
        </div>

        <Button
          variant="outline"
          size="xs"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
        >
          Keyingi
        </Button>
      </div>
    </div>
  );
};
