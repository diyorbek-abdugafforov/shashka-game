import { GameMode, GameResult, ResultReason } from '@shashka/shared-types';

export function formatTimeLeft(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(s / 60);
  const secs = s % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function formatMilliseconds(ms: number): string {
  return formatTimeLeft(Math.floor(ms / 1000));
}

export function formatDate(dateString: string): string {
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;

    const day = d.getDate().toString().padStart(2, '0');
    const months = [
      'Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyun',
      'Iyul', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek'
    ];
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');

    return `${day}-${month}, ${year} ${hours}:${minutes}`;
  } catch {
    return dateString;
  }
}

export function formatRating(rating: number): string {
  return Math.round(rating).toString();
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat('uz-UZ').format(n);
}

export function getGameModeLabel(mode: GameMode): string {
  switch (mode) {
    case GameMode.CLASSIC:
      return 'Klassik';
    case GameMode.BLITZ:
      return 'Blits (3 daqiqa)';
    case GameMode.RAPID:
      return 'Rapid (10 daqiqa)';
    case GameMode.GIVEAWAY:
      return 'Teskari shashka (Poddavki)';
    case GameMode.BOT:
      return "Botga qarshi o'yin";
    case GameMode.CUSTOM:
      return 'Maxsus rejim';
    default:
      return mode;
  }
}

export function getResultReasonLabel(reason: ResultReason | null | undefined): string {
  if (!reason) return '';
  switch (reason) {
    case ResultReason.ALL_PIECES_CAPTURED:
      return 'Barcha toshlar yeb bo\'lindi';
    case ResultReason.NO_LEGAL_MOVES:
      return 'Yurish uchun imkoniyat yo\'q (qamal)';
    case ResultReason.RESIGNATION:
      return 'O\'yinchi taslim bo\'ldi';
    case ResultReason.TIMEOUT:
      return 'Vaqt tugadi';
    case ResultReason.DISCONNECTION:
      return 'Aloqa uzildi';
    case ResultReason.DRAW_AGREEMENT:
      return 'O\'zaro durang kelishuvi';
    case ResultReason.THREEFOLD_REPETITION:
      return '3 marta bir xil holat takrorlandi';
    case ResultReason.FIFTEEN_MOVE_RULE:
      return '15 yurish qoidasi (durang)';
    case ResultReason.ABORTED_BY_SERVER:
      return 'Server tomonidan to\'xtatildi';
    default:
      return reason;
  }
}

export function getGameResultLabel(result: GameResult | null | undefined, myColor?: string): {
  title: string;
  isWin: boolean;
  isLoss: boolean;
  isDraw: boolean;
  variant: 'success' | 'danger' | 'warning' | 'neutral';
} {
  if (!result) {
    return { title: 'O\'yinda', isWin: false, isLoss: false, isDraw: false, variant: 'neutral' };
  }

  if (result === GameResult.DRAW) {
    return { title: 'Durang', isWin: false, isLoss: false, isDraw: true, variant: 'warning' };
  }

  const whiteWon = result === GameResult.WHITE_WON;
  const iWon = myColor ? (myColor === 'WHITE' ? whiteWon : !whiteWon) : whiteWon;

  if (iWon) {
    return { title: 'G\'alaba!', isWin: true, isLoss: false, isDraw: false, variant: 'success' };
  } else {
    return { title: 'Mag\'lubiyat', isWin: false, isLoss: true, isDraw: false, variant: 'danger' };
  }
}
