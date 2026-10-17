import { arePositionsEqual, getPieceAt, isValidPosition } from './board.js';
import { Board, GameState, GameStatus, Move, PieceType, Player, Position } from './types.js';

const DIAG_DIRECTIONS: [number, number][] = [
  [-1, -1],
  [-1, 1],
  [1, -1],
  [1, 1],
];

function getBoard(stateOrBoard: GameState | Board): Board {
  if (Array.isArray(stateOrBoard)) {
    return stateOrBoard;
  }
  return stateOrBoard.board;
}

/**
 * Returns all non-capture moves for a piece at the given position.
 */
export function getSimpleMoves(stateOrBoard: GameState | Board, pos: Position): Move[] {
  const board = getBoard(stateOrBoard);
  const piece = getPieceAt(board, pos);
  if (!piece) {
    return [];
  }

  const moves: Move[] = [];

  if (piece.type === PieceType.MAN) {
    // White moves up (row - 1), Black moves down (row + 1)
    const forwardRowDelta = piece.player === Player.WHITE ? -1 : 1;
    const colDeltas = [-1, 1];

    for (const dc of colDeltas) {
      const target: Position = { row: pos.row + forwardRowDelta, col: pos.col + dc };
      if (isValidPosition(target) && getPieceAt(board, target) === null) {
        const isPromotion =
          (piece.player === Player.WHITE && target.row === 0) ||
          (piece.player === Player.BLACK && target.row === 7);

        moves.push({
          from: { ...pos },
          to: target,
          promotion: isPromotion ? true : undefined,
          path: [{ ...pos }, target],
        });
      }
    }
  } else {
    // King moves any distance diagonally
    for (const [dr, dc] of DIAG_DIRECTIONS) {
      let step = 1;
      while (true) {
        const target: Position = { row: pos.row + step * dr, col: pos.col + step * dc };
        if (!isValidPosition(target)) {
          break;
        }
        if (getPieceAt(board, target) !== null) {
          // Blocked by any piece
          break;
        }
        moves.push({
          from: { ...pos },
          to: target,
          path: [{ ...pos }, target],
        });
        step++;
      }
    }
  }

  return moves;
}

interface SingleJump {
  landing: Position;
  capturedPos: Position;
}

/**
 * Finds all single-step jumps available from a given position.
 */
function findSingleJumps(
  board: Board,
  currentPos: Position,
  pieceType: PieceType,
  player: Player,
  capturedPositions: Position[],
  visitedSquares: Position[]
): SingleJump[] {
  const jumps: SingleJump[] = [];

  const isPositionCaptured = (p: Position) =>
    capturedPositions.some((c) => arePositionsEqual(c, p));

  const isSquareVisited = (p: Position) =>
    visitedSquares.some((v) => arePositionsEqual(v, p));

  if (pieceType === PieceType.MAN) {
    // Regular pieces can jump diagonally forward AND backward (1 square jump over enemy)
    for (const [dr, dc] of DIAG_DIRECTIONS) {
      const enemyPos: Position = { row: currentPos.row + dr, col: currentPos.col + dc };
      const landingPos: Position = { row: currentPos.row + 2 * dr, col: currentPos.col + 2 * dc };

      if (!isValidPosition(enemyPos) || !isValidPosition(landingPos)) {
        continue;
      }

      const enemyPiece = getPieceAt(board, enemyPos);
      if (
        enemyPiece &&
        enemyPiece.player !== player &&
        !isPositionCaptured(enemyPos)
      ) {
        // Landing square must be empty on the board, not already captured, and not visited in this move
        const landingPiece = getPieceAt(board, landingPos);
        if (
          landingPiece === null &&
          !isPositionCaptured(landingPos) &&
          !isSquareVisited(landingPos)
        ) {
          jumps.push({ landing: landingPos, capturedPos: enemyPos });
        }
      }
    }
  } else {
    // King can capture from long range
    for (const [dr, dc] of DIAG_DIRECTIONS) {
      let step = 1;
      let enemyFound: Position | null = null;

      while (true) {
        const checkPos: Position = { row: currentPos.row + step * dr, col: currentPos.col + step * dc };
        if (!isValidPosition(checkPos)) {
          break;
        }

        const piece = getPieceAt(board, checkPos);
        const alreadyCaptured = isPositionCaptured(checkPos);

        if (piece !== null || alreadyCaptured) {
          if (enemyFound !== null) {
            // Cannot jump over two pieces in a row in the same direction
            break;
          }
          if (alreadyCaptured) {
            // Captured piece still blocks the king during the move
            break;
          }
          if (piece && piece.player === player) {
            // Friendly piece blocks
            break;
          }
          if (piece && piece.player !== player) {
            // Found enemy piece to jump
            enemyFound = checkPos;
          }
        } else {
          // Empty square
          if (enemyFound !== null) {
            // Empty square behind the enemy piece
            if (!isSquareVisited(checkPos)) {
              jumps.push({ landing: checkPos, capturedPos: enemyFound });
            }
          }
        }
        step++;
      }
    }
  }

  return jumps;
}

/**
 * Recursive multi-capture search.
 */
function searchCaptures(
  board: Board,
  startPos: Position,
  currentPos: Position,
  currentPieceType: PieceType,
  player: Player,
  capturedPositions: Position[],
  visitedSquares: Position[],
  path: Position[],
  hasPromoted: boolean,
  accumulatedMoves: Move[]
): void {
  const jumps = findSingleJumps(
    board,
    currentPos,
    currentPieceType,
    player,
    capturedPositions,
    visitedSquares
  );

  if (jumps.length === 0) {
    // No further jumps possible from this position
    if (capturedPositions.length > 0) {
      accumulatedMoves.push({
        from: { ...startPos },
        to: { ...currentPos },
        captures: capturedPositions.map((p) => ({ ...p })),
        promotion: hasPromoted ? true : undefined,
        path: path.map((p) => ({ ...p })),
      });
    }
    return;
  }

  // Must continue multi-capture
  for (const jump of jumps) {
    let nextPieceType = currentPieceType;
    let nextHasPromoted = hasPromoted;

    // Check promotion if piece is a MAN reaching the last row
    if (currentPieceType === PieceType.MAN) {
      const reachedLastRow =
        (player === Player.WHITE && jump.landing.row === 0) ||
        (player === Player.BLACK && jump.landing.row === 7);

      if (reachedLastRow) {
        nextPieceType = PieceType.KING;
        nextHasPromoted = true;
      }
    }

    searchCaptures(
      board,
      startPos,
      jump.landing,
      nextPieceType,
      player,
      [...capturedPositions, jump.capturedPos],
      [...visitedSquares, jump.landing],
      [...path, jump.landing],
      nextHasPromoted,
      accumulatedMoves
    );
  }
}

/**
 * Returns all capture sequences for a piece at the given position.
 */
export function getCaptures(stateOrBoard: GameState | Board, pos: Position): Move[] {
  const board = getBoard(stateOrBoard);
  const piece = getPieceAt(board, pos);
  if (!piece) {
    return [];
  }

  const moves: Move[] = [];
  searchCaptures(
    board,
    pos,
    pos,
    piece.type,
    piece.player,
    [],
    [pos],
    [pos],
    false,
    moves
  );

  return moves;
}

/**
 * Checks whether any capture move is available for the given player.
 */
export function isCaptureAvailable(stateOrBoard: GameState | Board, player: Player): boolean {
  const board = getBoard(stateOrBoard);

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r]?.[c];
      if (piece && piece.player === player) {
        const captures = getCaptures(board, { row: r, col: c });
        if (captures.length > 0) {
          return true;
        }
      }
    }
  }

  return false;
}

export function getLegalMoves(stateOrBoard: GameState | Board, player?: Player): Move[] {
  const board = getBoard(stateOrBoard);
  const currentPlayer = player ?? (Array.isArray(stateOrBoard) ? Player.WHITE : stateOrBoard.currentPlayer);
  const status = Array.isArray(stateOrBoard) ? GameStatus.PLAYING : stateOrBoard.status;

  if (status !== GameStatus.PLAYING) {
    return [];
  }

  const captureAvailable = isCaptureAvailable(board, currentPlayer);
  const legalMoves: Move[] = [];

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r]?.[c];
      if (piece && piece.player === player) {
        const pos = { row: r, col: c };
        if (captureAvailable) {
          const captures = getCaptures(board, pos);
          legalMoves.push(...captures);
        } else {
          const simple = getSimpleMoves(board, pos);
          legalMoves.push(...simple);
        }
      }
    }
  }

  return legalMoves;
}
