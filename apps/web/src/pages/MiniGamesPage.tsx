import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageContainer } from '../components/layout/PageContainer';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { useAuth } from '../hooks/useAuth';
import { useAuthStore } from '../stores/auth';
import { formatNumber } from '../utils/format';
import { triggerHaptic } from '../utils/telegram';
import { playCoinSound, playWinSound, playClickSound, playLoseSound } from '../utils/sound';
import { useTranslation, Language } from '../i18n';
import { usersApi } from '../api/users';
import {
  Sparkles,
  Gift,
  Dices,
  Trophy,
  CheckCircle2,
  HelpCircle,
  Coins,
  ArrowRight,
  RotateCw,
} from 'lucide-react';
import { cn } from '../utils/cn';

interface Puzzle {
  id: number;
  title: string;
  description: string;
  diagram: string;
  question: string;
  options: { id: string; text: string; isCorrect: boolean }[];
  reward: number;
  explanation: string;
}

const PUZZLES_DATA: Record<Language, Puzzle[]> = {
  uz: [
    {
      id: 1,
      title: 'Uch karra zarba (Kombinatsiya)',
      description: 'Oqlar bilan yurib bitta harakatda qora toshlarni ketma-ket urib damkaga chiqing.',
      diagram: '⚪ c3 toshidan e5 va g7 orqali h8 damka maydoniga',
      question: "Qaysi katak orqali zarba beriladi?",
      options: [
        { id: 'a', text: 'c3 -> e5 -> g7 -> h8 (Uchta tosh uriladi)', isCorrect: true },
        { id: 'b', text: 'd2 -> e3 oddiy yurish', isCorrect: false },
        { id: 'c', text: 'b4 -> c5 zarbasiz yurish', isCorrect: false },
      ],
      reward: 300,
      explanation: "Ajoyib! c3 dan ketma-ket 3 ta tosh urilib, h8 katagida damkaga aylanadi!",
    },
    {
      id: 2,
      title: "Tosh qurbon qilish (Podsechka)",
      description: "Raqibni majburiy urishga majburlab, so'ngra uning orqa qatorini yorib o'ting.",
      diagram: '⚪ e3 toshi f4 ga beriladi, qora tosh f4 ni urishga majbur',
      question: "Kombinatsiyani qanday boshlash kerak?",
      options: [
        { id: 'a', text: "e3 toshini f4 ga qurbon qilish", isCorrect: true },
        { id: 'b', text: "c1 toshini d2 ga surish", isCorrect: false },
        { id: 'c', text: "Damkadan qochish", isCorrect: false },
      ],
      reward: 400,
      explanation: "To'g'ri! Shashka qoidasiga ko'ra urish majburiy, shuning uchun raqib qopqonga tushadi!",
    },
    {
      id: 3,
      title: "Damkani qamab qo'yish (Qopqon)",
      description: "Katta yo'ldagi (katta diagonal) raqib damkasini chetga surib burchakka qamash.",
      diagram: '⚪ a1-h8 katta yo‘li nazoratga olinadi',
      question: "Damkani zararsizlantirish uchun eng to'g'ri yo'l qaysi?",
      options: [
        { id: 'a', text: "Katta yo'lni (a1-h8) to'sib qo'yish", isCorrect: true },
        { id: 'b', text: "Chetga qochish", isCorrect: false },
        { id: 'c', text: "Toshni bekorga berish", isCorrect: false },
      ],
      reward: 500,
      explanation: "Barakalla! Katta yo'lni qo'lga kiritgan tomon shashkada 95% hollarda g'alaba qozonadi!",
    },
  ],
  ru: [
    {
      id: 1,
      title: 'Тройной удар (Комбинация)',
      description: 'Белыми в один ход забейте шашки соперника и пройдите в дамки.',
      diagram: '⚪ c3 через e5 и g7 на поле h8 в дамки',
      question: 'Какой путь удара правильный?',
      options: [
        { id: 'a', text: 'c3 -> e5 -> g7 -> h8 (Бьются 3 шашки)', isCorrect: true },
        { id: 'b', text: 'd2 -> e3 тихий ход', isCorrect: false },
        { id: 'c', text: 'b4 -> c5 обычный ход', isCorrect: false },
      ],
      reward: 300,
      explanation: 'Отлично! С c3 снимаются 3 шашки и шашка превращается в дамку на h8!',
    },
    {
      id: 2,
      title: 'Жертва шашки (Подсечка)',
      description: 'Заставьте соперника бить вашу шашку и прорвите его оборону.',
      diagram: '⚪ шашка e3 отдается на f4, черные обязаны бить',
      question: 'С чего начать комбинацию?',
      options: [
        { id: 'a', text: 'Пожертвовать шашку e3 на f4', isCorrect: true },
        { id: 'b', text: 'Пойти c1 на d2', isCorrect: false },
        { id: 'c', text: 'Убежать от дамки', isCorrect: false },
      ],
      reward: 400,
      explanation: 'Верно! По правилам русских шашек бой обязателен, противник в ловушке!',
    },
    {
      id: 3,
      title: 'Поимка дамки (Капкан)',
      description: 'Перекройте главную дорогу сопернику и зажмите дамку в углу.',
      diagram: '⚪ контроль большой диагонали a1-h8',
      question: 'Как надежно нейтрализовать дамку соперника?',
      options: [
        { id: 'a', text: 'Перекрыть большую дорогу (a1-h8)', isCorrect: true },
        { id: 'b', text: 'Убежать на край', isCorrect: false },
        { id: 'c', text: 'Отдать шашку зря', isCorrect: false },
      ],
      reward: 500,
      explanation: 'Молодец! Занятие большой дороги обеспечивает победу в 95% партий!',
    },
  ],
  en: [
    {
      id: 1,
      title: 'Triple Jump Combination',
      description: 'Play with White, jump 3 opponent pieces in a single sequence and become a King.',
      diagram: '⚪ c3 through e5 and g7 to h8 King square',
      question: 'Which move sequence is the correct strike?',
      options: [
        { id: 'a', text: 'c3 -> e5 -> g7 -> h8 (Capture 3 pieces)', isCorrect: true },
        { id: 'b', text: 'd2 -> e3 quiet move', isCorrect: false },
        { id: 'c', text: 'b4 -> c5 normal move', isCorrect: false },
      ],
      reward: 300,
      explanation: 'Awesome! Capturing 3 checkers from c3 promotes directly to King on h8!',
    },
    {
      id: 2,
      title: 'Piece Sacrifice (Tactic)',
      description: 'Force the opponent to capture your piece and break through their back rank.',
      diagram: '⚪ e3 piece sacrificed to f4, black must take',
      question: 'How should you initiate this tactic?',
      options: [
        { id: 'a', text: 'Sacrifice e3 piece to f4', isCorrect: true },
        { id: 'b', text: 'Move c1 to d2', isCorrect: false },
        { id: 'c', text: 'Retreat', isCorrect: false },
      ],
      reward: 400,
      explanation: 'Correct! Capture is mandatory in checkers, so the opponent falls right into the trap!',
    },
    {
      id: 3,
      title: 'Trapping the King',
      description: 'Control the main diagonal (a1-h8) and corner the opponent king.',
      diagram: '⚪ control the main diagonal a1-h8',
      question: 'What is the most effective way to neutralize the king?',
      options: [
        { id: 'a', text: 'Block the main diagonal (a1-h8)', isCorrect: true },
        { id: 'b', text: 'Flee to edge', isCorrect: false },
        { id: 'c', text: 'Give up a piece for nothing', isCorrect: false },
      ],
      reward: 500,
      explanation: 'Brilliant! Controlling the long diagonal wins Russian checkers games 95% of the time!',
    },
  ],
};

export const MiniGamesPage: React.FC = () => {
  const navigate = useNavigate();
  const { wallet } = useAuth();
  const { updateBalance } = useAuthStore();
  const { t, language } = useTranslation();

  const currentPuzzles = PUZZLES_DATA[language as Language] || PUZZLES_DATA.uz;

  const [activeTab, setActiveTab] = useState<'wheel' | 'puzzles'>('wheel');
  const [selectedBet, setSelectedBet] = useState(50);
  const [isRolling, setIsRolling] = useState(false);
  const [lastReward, setLastReward] = useState<number | null>(null);
  const [diceNumber, setDiceNumber] = useState<number | null>(null);
  const [diceMultiplier, setDiceMultiplier] = useState<number | null>(null);
  const [diceNetProfit, setDiceNetProfit] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [solvedPuzzles, setSolvedPuzzles] = useState<number[]>(() => {
    try {
      const stored = localStorage.getItem('shashka_solved_puzzles');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [feedback, setFeedback] = useState<{ [id: number]: { correct: boolean; msg: string } }>({});

  const handleRollDice = async () => {
    if (isRolling) return;
    const currentBalance = wallet?.balance ?? 0;

    if (currentBalance < selectedBet) {
      triggerHaptic('error');
      playLoseSound();
      setErrorMessage(
        language === 'ru'
          ? `Недостаточно монет! Для броска костей нужно минимум ${selectedBet} монет.`
          : language === 'en'
            ? `Not enough coins! You need at least ${selectedBet} coins to roll.`
            : `Tangangiz yetarli emas! Zar tashlash uchun kamida ${selectedBet} tanga kerak.`,
      );
      return;
    }

    setErrorMessage(null);
    setIsRolling(true);
    triggerHaptic('heavy');
    playClickSound();

    try {
      const res: any = await usersApi.rollDice(selectedBet);
      const data = res?.data || res;

      setTimeout(() => {
        setIsRolling(false);
        if (data && data.diceNumber) {
          setDiceNumber(data.diceNumber);
          setDiceMultiplier(data.multiplier);
          setLastReward(data.reward);
          setDiceNetProfit(data.netProfit);

          if (data.newBalance !== undefined) {
            useAuthStore.setState((s) => ({
              wallet: s.wallet ? { ...s.wallet, balance: data.newBalance } : s.wallet,
            }));
          } else {
            updateBalance(data.netProfit);
          }

          if (data.netProfit > 0) {
            triggerHaptic('success');
            playCoinSound();
            playWinSound();
          } else if (data.netProfit < 0) {
            triggerHaptic('error');
            playLoseSound();
          } else {
            triggerHaptic('medium');
            playCoinSound();
          }
        }
      }, 1000);
    } catch (err: any) {
      setIsRolling(false);
      triggerHaptic('error');
      playLoseSound();
      setErrorMessage(err?.message || 'Zar tashlashda xatolik yuz berdi');
    }
  };

  const handleSolvePuzzle = (puzzle: Puzzle) => {
    const chosenId = selectedAnswers[puzzle.id];
    if (!chosenId) {
      alert(
        language === 'ru'
          ? 'Пожалуйста, выберите вариант ответа!'
          : language === 'en'
            ? 'Please select an option first!'
            : "Iltimos, avval javob variantlaridan birini tanlang!",
      );
      return;
    }

    const option = puzzle.options.find((o) => o.id === chosenId);
    if (option?.isCorrect) {
      triggerHaptic('success');
      playWinSound();
      playCoinSound();
      setFeedback((prev) => ({
        ...prev,
        [puzzle.id]: { correct: true, msg: puzzle.explanation },
      }));

      if (!solvedPuzzles.includes(puzzle.id)) {
        updateBalance(puzzle.reward);
        const updated = [...solvedPuzzles, puzzle.id];
        setSolvedPuzzles(updated);
        try {
          localStorage.setItem('shashka_solved_puzzles', JSON.stringify(updated));
        } catch {}
      }
    } else {
      triggerHaptic('error');
      playLoseSound();
      setFeedback((prev) => ({
        ...prev,
        [puzzle.id]: { correct: false, msg: t('mini_puzzle_wrong') },
      }));
    }
  };

  return (
    <PageContainer
      headerProps={{
        title: t('mini_title'),
        showBack: true,
        onBack: () => navigate(-1),
        showBalance: true,
      }}
    >
      <div className="flex flex-col gap-4">
        {/* Navigation Tabs */}
        <div className="flex items-center p-1 bg-zinc-900 rounded-xl border border-zinc-800">
          <button
            onClick={() => {
              triggerHaptic('selection');
              setActiveTab('wheel');
            }}
            className={cn(
              'flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5',
              activeTab === 'wheel'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-zinc-400 hover:text-zinc-200',
            )}
          >
            <Dices className="w-4 h-4" />
            <span>{t('mini_tab_dice')}</span>
          </button>

          <button
            onClick={() => {
              triggerHaptic('selection');
              setActiveTab('puzzles');
            }}
            className={cn(
              'flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5',
              activeTab === 'puzzles'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-zinc-400 hover:text-zinc-200',
            )}
          >
            <Trophy className="w-4 h-4" />
            <span>{t('mini_tab_puzzles')}</span>
          </button>
        </div>

        {/* TAB 1: LUCKY DICE / BONUS ROLL */}
        {activeTab === 'wheel' && (
          <div className="flex flex-col gap-4">
            <Card className="p-6 text-center bg-gradient-to-b from-indigo-950/70 via-zinc-900 to-zinc-900 border-indigo-700/40 relative overflow-hidden">
              {/* Dice animation / result box */}
              <div className="w-24 h-24 rounded-3xl bg-indigo-600/20 border-2 border-indigo-500/40 flex flex-col items-center justify-center mx-auto mb-3 shadow-xl relative">
                {diceNumber ? (
                  <div className="flex flex-col items-center animate-in zoom-in-75 duration-300">
                    <span className="text-4xl font-black text-amber-300 font-mono">{diceNumber}</span>
                    <span className="text-[10px] font-bold text-indigo-300 mt-0.5">{diceMultiplier}x</span>
                  </div>
                ) : (
                  <Dices
                    className={cn(
                      'w-12 h-12 text-indigo-400 transition-transform duration-500',
                      isRolling && 'animate-spin',
                    )}
                  />
                )}
              </div>

              <h3 className="text-lg font-black text-zinc-100">
                {language === 'ru' ? 'Счастливые кости (Зарик)' : language === 'en' ? 'Lucky Dice' : 'Zar tashlash (Zarik)'}
              </h3>
              <p className="text-xs text-zinc-400 mt-1 max-w-xs mx-auto">
                {language === 'ru'
                  ? 'Выберите ставку, бросьте кости и умножьте свои монеты до 5 раз!'
                  : language === 'en'
                    ? 'Choose your bet, roll the dice and multiply your coins up to 5x!'
                    : "Garov tangasini tanlang, zar tashlang va tangalaringizni 5 barobargacha ko'paytiring!"}
              </p>

              {/* Bet Selector */}
              <div className="mt-4 flex flex-col gap-2">
                <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                  {language === 'ru' ? 'Выберите ставку (монеты):' : language === 'en' ? 'Select Bet (Coins):' : "Zar narxi (Tangada):"}
                </span>
                <div className="grid grid-cols-4 gap-1.5 p-1 bg-zinc-950/60 rounded-xl border border-zinc-800">
                  {[25, 50, 100, 250].map((bet) => (
                    <button
                      key={bet}
                      disabled={isRolling}
                      onClick={() => {
                        triggerHaptic('selection');
                        setSelectedBet(bet);
                        setErrorMessage(null);
                      }}
                      className={cn(
                        'py-1.5 rounded-lg text-xs font-bold transition-all',
                        selectedBet === bet
                          ? 'bg-amber-500 text-zinc-950 shadow-md font-black'
                          : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50',
                      )}
                    >
                      {bet}
                    </button>
                  ))}
                </div>
              </div>

              {/* Error Message if Insufficient Balance */}
              {errorMessage && (
                <div className="mt-3 p-2.5 rounded-xl bg-rose-950/80 border border-rose-800/80 text-rose-300 text-xs font-medium animate-shake">
                  {errorMessage}
                </div>
              )}

              {/* Outcome Banner */}
              {lastReward !== null && diceNetProfit !== null && !isRolling && (
                <div
                  className={cn(
                    'my-3 p-3 rounded-xl border text-sm font-black animate-fade-in flex items-center justify-center gap-2',
                    diceNetProfit > 0
                      ? 'bg-emerald-950/80 border-emerald-600/80 text-emerald-300'
                      : diceNetProfit < 0
                        ? 'bg-amber-950/80 border-amber-600/80 text-amber-300'
                        : 'bg-zinc-800/80 border-zinc-700 text-zinc-300',
                  )}
                >
                  <Coins className="w-5 h-5 text-amber-400" />
                  <span>
                    {diceNetProfit > 0
                      ? `+${formatNumber(lastReward)} tanga (Foyda: +${formatNumber(diceNetProfit)})!`
                      : `${lastReward} tanga qaytdi (${diceNetProfit} tanga)`}
                  </span>
                </div>
              )}

              {/* Roll Button */}
              <Button
                size="lg"
                variant="primary"
                onClick={handleRollDice}
                disabled={isRolling || (wallet?.balance ?? 0) < selectedBet}
                className="mt-3 w-full text-sm font-bold shadow-glow"
                leftIcon={<Sparkles className="w-4 h-4 text-amber-300" />}
              >
                {isRolling
                  ? language === 'ru' ? 'Кости бросаются...' : 'Zar tashlanmoqda...'
                  : (wallet?.balance ?? 0) < selectedBet
                    ? language === 'ru' ? `Недостаточно монет (${selectedBet} нужно)` : `Tangangiz yetarli emas (${selectedBet} kerak)`
                    : `${language === 'ru' ? 'Бросить зарик' : 'Zar tashlash'} (${selectedBet} tanga)`}
              </Button>
            </Card>

            {/* Multiplier Paytable */}
            <Card className="p-4 bg-zinc-900/60 border-zinc-800">
              <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2.5">
                {language === 'ru' ? 'Таблица выигрышей по числу на кубике' : "Zar raqami bo'yicha yutuqlar"}
              </h4>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2 rounded-xl bg-zinc-800/70 border border-zinc-700/60">
                  <span className="text-zinc-400 block text-[10px]">1-2 tushsa</span>
                  <span className="font-bold text-amber-300">0.5x - 0.8x</span>
                </div>
                <div className="p-2 rounded-xl bg-zinc-800/70 border border-zinc-700/60">
                  <span className="text-zinc-400 block text-[10px]">3-4 tushsa</span>
                  <span className="font-bold text-emerald-400">1.2x - 1.8x</span>
                </div>
                <div className="p-2 rounded-xl bg-zinc-800/70 border border-zinc-700/60">
                  <span className="text-zinc-400 block text-[10px]">5-6 (Jekpot!)</span>
                  <span className="font-bold text-amber-400 font-mono">2.5x - 5.0x</span>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* TAB 2: TACTICAL CHECKERS PUZZLES */}
        {activeTab === 'puzzles' && (
          <div className="flex flex-col gap-3.5">
            {currentPuzzles.map((puzzle) => {
              const isSolved = solvedPuzzles.includes(puzzle.id);
              const fb = feedback[puzzle.id];

              return (
                <Card
                  key={puzzle.id}
                  className="p-4 bg-zinc-900/70 border-zinc-800 flex flex-col gap-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-indigo-400">
                          {language === 'ru' ? 'Задача' : language === 'en' ? 'Puzzle' : 'Jumboq'} #{puzzle.id}
                        </span>
                        {isSolved && (
                          <Badge variant="success" size="sm">
                            {t('mini_puzzle_solved')}
                          </Badge>
                        )}
                      </div>
                      <h4 className="text-sm font-bold text-zinc-100 mt-0.5">
                        {puzzle.title}
                      </h4>
                    </div>

                    <div className="flex items-center gap-1 font-bold text-amber-300 text-xs px-2.5 py-1 bg-amber-500/10 rounded-full border border-amber-500/20">
                      <Coins className="w-3.5 h-3.5 text-amber-400" />
                      <span>+{puzzle.reward}</span>
                    </div>
                  </div>

                  <p className="text-xs text-zinc-400">{puzzle.description}</p>

                  <div className="p-2.5 rounded-xl bg-zinc-800/70 border border-zinc-700/50 text-xs font-mono text-zinc-300 flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-indigo-400 shrink-0" />
                    <span>{puzzle.diagram}</span>
                  </div>

                  <div className="flex flex-col gap-2 mt-1">
                    <span className="text-xs font-semibold text-zinc-200">
                      {puzzle.question}
                    </span>

                    {puzzle.options.map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => {
                          triggerHaptic('selection');
                          setSelectedAnswers((prev) => ({ ...prev, [puzzle.id]: opt.id }));
                        }}
                        className={cn(
                          'p-2.5 rounded-xl border text-left text-xs transition-all flex items-center justify-between',
                          selectedAnswers[puzzle.id] === opt.id
                            ? 'bg-indigo-950/60 border-indigo-500 text-indigo-200'
                            : 'bg-zinc-800/50 border-zinc-700/70 text-zinc-300 hover:border-zinc-600',
                        )}
                      >
                        <span>{opt.text}</span>
                        {selectedAnswers[puzzle.id] === opt.id && (
                          <span className="w-2 h-2 rounded-full bg-indigo-400" />
                        )}
                      </button>
                    ))}
                  </div>

                  {fb && (
                    <div
                      className={cn(
                        'p-2.5 rounded-xl text-xs font-semibold mt-1',
                        fb.correct
                          ? 'bg-emerald-950/80 border border-emerald-600/80 text-emerald-200'
                          : 'bg-rose-950/80 border border-rose-600/80 text-rose-200',
                      )}
                    >
                      {fb.msg}
                    </div>
                  )}

                  <Button
                    size="sm"
                    variant={isSolved ? 'secondary' : 'primary'}
                    onClick={() => handleSolvePuzzle(puzzle)}
                    className="mt-1"
                  >
                    {isSolved ? t('mini_puzzle_retry') : t('mini_puzzle_submit')}
                  </Button>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </PageContainer>
  );
};
