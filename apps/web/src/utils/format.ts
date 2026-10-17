import { GameMode, GameResult, ResultReason } from '@shashka/shared-types';
import { useSettingsStore } from '../stores/settings';

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

function getCurLang(): 'uz' | 'ru' | 'en' {
  try {
    return useSettingsStore.getState().language || 'uz';
  } catch {
    return 'uz';
  }
}

export function getGameModeLabel(mode: GameMode): string {
  const lang = getCurLang();
  switch (mode) {
    case GameMode.CLASSIC:
      return lang === 'ru' ? 'Классика' : lang === 'en' ? 'Classic' : 'Klassik';
    case GameMode.BLITZ:
      return lang === 'ru' ? 'Блиц (3 мин)' : lang === 'en' ? 'Blitz (3m)' : 'Blits (3 daqiqa)';
    case GameMode.RAPID:
      return lang === 'ru' ? 'Рапид (10 мин)' : lang === 'en' ? 'Rapid (10m)' : 'Rapid (10 daqiqa)';
    case GameMode.GIVEAWAY:
      return lang === 'ru' ? 'Поддавки' : lang === 'en' ? 'Giveaway' : 'Teskari shashka (Poddavki)';
    case GameMode.BOT:
      return lang === 'ru' ? 'Игра против бота' : lang === 'en' ? 'Play vs Bot' : "Botga qarshi o'yin";
    case GameMode.CUSTOM:
      return lang === 'ru' ? 'Особый режим' : lang === 'en' ? 'Custom mode' : 'Maxsus rejim';
    default:
      return mode;
  }
}

export function getResultReasonLabel(reason: ResultReason | null | undefined): string {
  if (!reason) return '';
  const lang = getCurLang();

  const labels: Record<ResultReason, { uz: string; ru: string; en: string }> = {
    [ResultReason.ALL_PIECES_CAPTURED]: {
      uz: "Barcha toshlar yeb bo'lindi",
      ru: 'Все шашки уничтожены',
      en: 'All pieces captured',
    },
    [ResultReason.NO_LEGAL_MOVES]: {
      uz: "Yurish uchun imkoniyat yo'q (qamal)",
      ru: 'Нет доступных ходов (запирание)',
      en: 'No legal moves available (locked)',
    },
    [ResultReason.RESIGNATION]: {
      uz: "O'yinchi taslim bo'ldi",
      ru: 'Игрок сдался',
      en: 'Player resigned',
    },
    [ResultReason.TIMEOUT]: {
      uz: 'Vaqt tugadi',
      ru: 'Время вышло',
      en: 'Time is up',
    },
    [ResultReason.DISCONNECTION]: {
      uz: 'Aloqa uzildi',
      ru: 'Связь прервана',
      en: 'Connection lost',
    },
    [ResultReason.DRAW_AGREEMENT]: {
      uz: "O'zaro durang kelishuvi",
      ru: 'Ничья по согласию сторон',
      en: 'Draw by mutual agreement',
    },
    [ResultReason.THREEFOLD_REPETITION]: {
      uz: '3 marta bir xil holat takrorlandi',
      ru: 'Троекратное повторение позиции',
      en: 'Threefold repetition of position',
    },
    [ResultReason.FIFTEEN_MOVE_RULE]: {
      uz: '15 yurish qoidasi (durang)',
      ru: 'Правило 15 ходов (ничья)',
      en: '15-move rule (draw)',
    },
    [ResultReason.ABORTED_BY_SERVER]: {
      uz: "Server tomonidan to'xtatildi",
      ru: 'Прервано сервером',
      en: 'Aborted by server',
    },
  };

  const item = labels[reason];
  if (item) {
    return item[lang] || item.uz;
  }
  return reason;
}

export function getGameResultLabel(result: GameResult | null | undefined, myColor?: string): {
  title: string;
  isWin: boolean;
  isLoss: boolean;
  isDraw: boolean;
  variant: 'success' | 'danger' | 'warning' | 'neutral';
} {
  const lang = getCurLang();

  if (!result) {
    const title = lang === 'ru' ? 'В игре' : lang === 'en' ? 'In progress' : "O'yinda";
    return { title, isWin: false, isLoss: false, isDraw: false, variant: 'neutral' };
  }

  if (result === GameResult.DRAW) {
    const title = lang === 'ru' ? 'Ничья!' : lang === 'en' ? 'Draw!' : 'Durang!';
    return { title, isWin: false, isLoss: false, isDraw: true, variant: 'warning' };
  }

  const whiteWon = result === GameResult.WHITE_WON;
  const iWon = myColor ? (myColor === 'WHITE' ? whiteWon : !whiteWon) : whiteWon;

  if (iWon) {
    const title = lang === 'ru' ? 'Победа!' : lang === 'en' ? 'Victory!' : "G'alaba!";
    return { title, isWin: true, isLoss: false, isDraw: false, variant: 'success' };
  } else {
    const title = lang === 'ru' ? 'Поражение!' : lang === 'en' ? 'Defeat!' : "Mag'lubiyat!";
    return { title, isWin: false, isLoss: true, isDraw: false, variant: 'danger' };
  }
}

