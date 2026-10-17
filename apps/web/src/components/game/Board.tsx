import React, { useMemo } from 'react';
import {
  PlayerColor,
  type BoardCoordinate,
  type BoardMatrix,
} from '@shashka/shared-types';
import { isDarkSquare, type Move as ValidatedMove } from '@shashka/game-engine';
import { Square } from './Square';
import { Piece } from './Piece';
import { useSettingsStore } from '../../stores/settings';
import { cn } from '../../utils/cn';

export interface BoardProps {
  board: BoardMatrix;
  currentTurn: PlayerColor;
  legalMoves: ValidatedMove[];
  selectedCoordinate: BoardCoordinate | null;
  lastMove: { from: BoardCoordinate; to: BoardCoordinate } | null;
  orientation?: PlayerColor;
  isInteractive?: boolean;
  isSubmittingMove?: boolean;
  onSelectPiece: (coord: BoardCoordinate | null) => void;
  onMakeMove: (move: ValidatedMove) => void;
  className?: string;
}

export const Board: React.FC<BoardProps> = ({
  board,
  currentTurn,
  legalMoves,
  selectedCoordinate,
  lastMove,
  orientation = PlayerColor.WHITE,
  isInteractive = true,
  isSubmittingMove = false,
  onSelectPiece,
  onMakeMove,
  className,
}) => {
  const { animationsEnabled, boardTheme } = useSettingsStore();

  const isFlipped = orientation === PlayerColor.BLACK;

  // Determine which pieces have mandatory capture moves
  const mandatoryCapturePieces = useMemo(() => {
    const hasCaptures = legalMoves.some((m) => Boolean(m.captures && m.captures.length > 0));
    if (!hasCaptures) return new Set<string>();

    const set = new Set<string>();
    for (const m of legalMoves) {
      if (m.captures && m.captures.length > 0) {
        set.add(`${m.from.row},${m.from.col}`);
      }
    }
    return set;
  }, [legalMoves]);

  // Legal moves available for the currently selected piece
  const selectedLegalMoves = useMemo(() => {
    if (!selectedCoordinate) return [];
    return legalMoves.filter(
      (m) =>
        m.from.row === selectedCoordinate.row &&
        m.from.col === selectedCoordinate.col,
    );
  }, [selectedCoordinate, legalMoves]);

  // Map of target coordinate -> ValidatedMove
  const legalTargetsMap = useMemo(() => {
    const map = new Map<string, ValidatedMove>();
    for (const m of selectedLegalMoves) {
      map.set(`${m.to.row},${m.to.col}`, m);
    }
    return map;
  }, [selectedLegalMoves]);

  // Handle click on square
  const handleSquareClick = (row: number, col: number) => {
    if (!isInteractive || isSubmittingMove) return;

    const clickedKey = `${row},${col}`;
    const legalMoveToTarget = legalTargetsMap.get(clickedKey);

    if (legalMoveToTarget) {
      // User tapped a valid destination square!
      onMakeMove(legalMoveToTarget);
      return;
    }

    const cellPiece = board[row]?.[col];

    // If tapping an active player piece, select it
    if (cellPiece && cellPiece.color === currentTurn) {
      if (selectedCoordinate?.row === row && selectedCoordinate?.col === col) {
        onSelectPiece(null); // Toggle off
      } else {
        onSelectPiece({ row, col });
      }
    } else {
      // Deselect when clicking elsewhere
      if (selectedCoordinate) {
        onSelectPiece(null);
      }
    }
  };

  // Generate rows in correct view order
  const displayRows = useMemo(() => {
    const rows = [0, 1, 2, 3, 4, 5, 6, 7];
    return isFlipped ? rows.reverse() : rows;
  }, [isFlipped]);

  const displayCols = useMemo(() => {
    const cols = [0, 1, 2, 3, 4, 5, 6, 7];
    return isFlipped ? cols.reverse() : cols;
  }, [isFlipped]);

  return (
    <div
      className={cn(
        'w-full max-w-[380px] aspect-square mx-auto p-1.5 sm:p-2 bg-gradient-to-b from-zinc-800 to-zinc-950 rounded-2xl shadow-2xl border border-zinc-700/80',
        className,
      )}
    >
      <div className="w-full h-full grid grid-cols-8 grid-rows-8 rounded-xl overflow-hidden border border-zinc-800/80 shadow-inner">
        {displayRows.map((r, rIdx) =>
          displayCols.map((c, cIdx) => {
            const isDark = isDarkSquare(r, c);
            const piece = board[r]?.[c];
            const coordKey = `${r},${c}`;

            const isSelected =
              selectedCoordinate?.row === r && selectedCoordinate?.col === c;

            const isLegalTarget = legalTargetsMap.has(coordKey);
            const targetMove = legalTargetsMap.get(coordKey);
            const isCaptureTarget = Boolean(targetMove && targetMove.captures && targetMove.captures.length > 0);

            const isLastMove = Boolean(
              lastMove &&
                ((lastMove.from.row === r && lastMove.from.col === c) ||
                  (lastMove.to.row === r && lastMove.to.col === c)),
            );

            const isMandatoryPiece = mandatoryCapturePieces.has(coordKey);

            // Coordinates notation labels on edges
            const showFile = rIdx === 7;
            const showRank = cIdx === 0;
            const fileLabel = String.fromCharCode('a'.charCodeAt(0) + c);
            const rankLabel = (8 - r).toString();
            const coordLabel = showRank && showFile ? `${fileLabel}${rankLabel}` : showRank ? rankLabel : showFile ? fileLabel : undefined;

            return (
              <Square
                key={`${r}-${c}`}
                row={r}
                col={c}
                isDark={isDark}
                isSelected={isSelected}
                isLegalTarget={isLegalTarget}
                isCaptureTarget={isCaptureTarget}
                isLastMove={isLastMove}
                theme={boardTheme}
                label={coordLabel}
                onClick={() => handleSquareClick(r, c)}
              >
                {piece && (
                  <Piece
                    color={(piece as any).color || (piece as any).player}
                    type={piece.type}
                    isSelected={isSelected}
                    isMandatoryCapture={isMandatoryPiece}
                    animated={animationsEnabled}
                  />
                )}
              </Square>
            );
          }),
        )}
      </div>
    </div>
  );
};
