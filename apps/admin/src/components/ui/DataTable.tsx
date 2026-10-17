import React from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '@/utils/cn';
import { LoadingSpinner } from './LoadingSpinner';
import { EmptyState } from './EmptyState';
import { Pagination } from './Pagination';

export interface Column<T> {
  key: string;
  header: React.ReactNode;
  render?: (row: T, index: number) => React.ReactNode;
  sortable?: boolean;
  className?: string;
  headerClassName?: string;
  width?: string;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T, index: number) => string | number;
  isLoading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  onRowClick?: (row: T) => void;
  // Sorting
  sortKey?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (key: string) => void;
  // Pagination
  pagination?: {
    page: number;
    totalPages: number;
    total?: number;
    limit?: number;
    onPageChange: (newPage: number) => void;
  };
  className?: string;
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  isLoading = false,
  emptyTitle = 'Maʼlumotlar topilmadi',
  emptyDescription = 'Hozircha koʻrsatish uchun hech qanday maʼlumot yoʻq',
  onRowClick,
  sortKey,
  sortDirection,
  onSort,
  pagination,
  className,
}: DataTableProps<T>): React.ReactElement {
  return (
    <div className={cn('bg-zinc-900/90 border border-zinc-800 rounded-xl overflow-hidden shadow-sm', className)}>
      <div className="overflow-x-auto min-h-[300px] flex flex-col justify-between">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-950/60 text-zinc-400 font-medium text-xs">
              {columns.map((col) => {
                const isSorted = sortKey === col.key;
                return (
                  <th
                    key={col.key}
                    style={{ width: col.width }}
                    className={cn(
                      'px-4 py-3 select-none tracking-wider uppercase font-semibold text-[11px]',
                      col.sortable && 'cursor-pointer hover:text-zinc-200 transition-colors',
                      col.headerClassName,
                    )}
                    onClick={() => {
                      if (col.sortable && onSort) {
                        onSort(col.key);
                      }
                    }}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{col.header}</span>
                      {col.sortable && (
                        <span className="text-zinc-500">
                          {isSorted ? (
                            sortDirection === 'asc' ? (
                              <ArrowUp className="w-3.5 h-3.5 text-amber-500" />
                            ) : (
                              <ArrowDown className="w-3.5 h-3.5 text-amber-500" />
                            )
                          ) : (
                            <ArrowUpDown className="w-3.5 h-3.5 opacity-40 hover:opacity-100" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/80">
            {isLoading ? (
              <tr>
                <td colSpan={columns.length} className="py-16">
                  <LoadingSpinner text="Maʼlumotlar yuklanmoqda..." />
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-12">
                  <EmptyState title={emptyTitle} description={emptyDescription} />
                </td>
              </tr>
            ) : (
              data.map((row, index) => {
                const key = keyExtractor(row, index);
                return (
                  <tr
                    key={key}
                    onClick={() => onRowClick && onRowClick(row)}
                    className={cn(
                      'group transition-colors duration-150',
                      onRowClick ? 'cursor-pointer hover:bg-zinc-800/60' : 'hover:bg-zinc-800/30',
                    )}
                  >
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={cn('px-4 py-3 text-zinc-300 group-hover:text-zinc-100', col.className)}
                      >
                        {col.render
                          ? col.render(row, index)
                          : ((row as Record<string, unknown>)[col.key] as React.ReactNode)}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {pagination && (
        <Pagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          total={pagination.total}
          limit={pagination.limit}
          onPageChange={pagination.onPageChange}
        />
      )}
    </div>
  );
}
