import React from 'react';
import { cn } from '../utils.js';

export interface CheckerPieceProps {
  color: 'WHITE' | 'BLACK';
  isKing?: boolean;
  className?: string;
  onClick?: () => void;
  isSelected?: boolean;
}

export const CheckerPiece: React.FC<CheckerPieceProps> = ({
  color,
  isKing = false,
  className,
  onClick,
  isSelected = false,
}) => {
  const isWhite = color === 'WHITE';

  return (
    <div
      onClick={onClick}
      className={cn(
        'relative flex items-center justify-center rounded-full aspect-square w-full h-full cursor-pointer select-none transition-transform duration-150',
        isSelected && 'scale-110 ring-4 ring-amber-400 ring-offset-2 ring-offset-zinc-900',
        className,
      )}
    >
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full drop-shadow-md"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <radialGradient
            id={isWhite ? 'whitePieceGrad' : 'blackPieceGrad'}
            cx="35%"
            cy="35%"
            r="65%"
          >
            {isWhite ? (
              <>
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="60%" stopColor="#e2e8f0" />
                <stop offset="100%" stopColor="#94a3b8" />
              </>
            ) : (
              <>
                <stop offset="0%" stopColor="#475569" />
                <stop offset="70%" stopColor="#1e293b" />
                <stop offset="100%" stopColor="#0f172a" />
              </>
            )}
          </radialGradient>
        </defs>

        {/* Outer piece body */}
        <circle
          cx="50"
          cy="50"
          r="45"
          fill={`url(#${isWhite ? 'whitePieceGrad' : 'blackPieceGrad'})`}
          stroke={isWhite ? '#cbd5e1' : '#334155'}
          strokeWidth="3"
        />

        {/* Inner concentric ring */}
        <circle
          cx="50"
          cy="50"
          r="33"
          fill="none"
          stroke={isWhite ? '#cbd5e1' : '#334155'}
          strokeWidth="2.5"
          strokeDasharray="2 1"
        />
        <circle
          cx="50"
          cy="50"
          r="22"
          fill="none"
          stroke={isWhite ? '#94a3b8' : '#1e293b'}
          strokeWidth="2"
        />

        {/* King / Damka crown emblem */}
        {isKing && (
          <path
            d="M 32 64 L 68 64 L 65 42 L 57 50 L 50 36 L 43 50 L 35 42 Z"
            fill={isWhite ? '#d97706' : '#fbbf24'}
            stroke={isWhite ? '#b45309' : '#d97706'}
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        )}
      </svg>
    </div>
  );
};
