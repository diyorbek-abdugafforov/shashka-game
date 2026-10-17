import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';
import { Button } from './Button';
import { cn } from '../../utils/cn';

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Xatolik yuz berdi',
  message = 'Ma\'lumotlarni yuklashda muammo paydo bo\'ldi. Iltimos, qayta urinib ko\'ring.',
  onRetry,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center p-6 rounded-2xl border border-rose-900/30 bg-rose-950/10 text-zinc-100',
        className,
      )}
    >
      <div className="w-12 h-12 rounded-full bg-rose-950/60 border border-rose-800/40 flex items-center justify-center text-rose-400 mb-3">
        <AlertCircle className="w-6 h-6" />
      </div>
      <h3 className="text-sm font-semibold text-rose-300 mb-1">{title}</h3>
      <p className="text-xs text-zinc-400 max-w-xs mb-4">{message}</p>
      {onRetry && (
        <Button
          variant="secondary"
          size="sm"
          onClick={onRetry}
          leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
        >
          Qayta urinish
        </Button>
      )}
    </div>
  );
};
