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
  const [isRolling, setIsRolling] = useState(false);
  const [lastReward, setLastReward] = useState<number | null>(null);

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

  const handleRollDice = () => {
    if (isRolling) return;
    setIsRolling(true);
    triggerHaptic('heavy');
    playClickSound();

    const rewards = [150, 250, 300, 500, 750, 1000];
    const chosen = rewards[Math.floor(Math.random() * rewards.length)]!;

    setTimeout(() => {
      setIsRolling(false);
      setLastReward(chosen);
      updateBalance(chosen);
      triggerHaptic('success');
      playCoinSound();
      playWinSound();
    }, 1200);
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
              <div className="w-20 h-20 rounded-3xl bg-indigo-600/20 border-2 border-indigo-500/40 flex items-center justify-center mx-auto mb-4 shadow-xl">
                <Dices
                  className={cn(
                    'w-10 h-10 text-indigo-400 transition-transform duration-500',
                    isRolling && 'animate-spin',
                  )}
                />
              </div>

              <h3 className="text-lg font-black text-zinc-100">{t('mini_dice_title')}</h3>
              <p className="text-xs text-zinc-400 mt-1 max-w-xs mx-auto">
                {t('mini_dice_desc')}
              </p>

              {lastReward !== null && (
                <div className="my-4 p-3 bg-emerald-950/80 border border-emerald-600/80 rounded-xl text-emerald-300 text-sm font-black animate-fade-in flex items-center justify-center gap-2">
                  <Coins className="w-5 h-5 text-amber-400" />
                  <span>+{formatNumber(lastReward)} {t('coins')}!</span>
                </div>
              )}

              <Button
                size="lg"
                variant="primary"
                onClick={handleRollDice}
                disabled={isRolling}
                className="mt-4 w-full text-sm font-bold shadow-glow"
                leftIcon={<Sparkles className="w-4 h-4 text-amber-300" />}
              >
                {isRolling ? t('mini_dice_rolling') : t('mini_dice_roll_btn')}
              </Button>
            </Card>

            <Card className="p-4 bg-zinc-900/60 border-zinc-800">
              <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">
                {language === 'ru' ? 'Таблица наград' : language === 'en' ? 'Reward Table' : 'Mukofotlar jadvali'}
              </h4>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2.5 rounded-xl bg-zinc-800/80 border border-zinc-700/60">
                  <span className="text-zinc-400 block text-[10px]">
                    {language === 'ru' ? '1-уровень' : language === 'en' ? 'Tier 1' : '1-daraja'}
                  </span>
                  <span className="font-bold text-amber-300">150 {t('coins')}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-zinc-800/80 border border-zinc-700/60">
                  <span className="text-zinc-400 block text-[10px]">
                    {language === 'ru' ? '2-уровень' : language === 'en' ? 'Tier 2' : '2-daraja'}
                  </span>
                  <span className="font-bold text-amber-300">300 {t('coins')}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-zinc-800/80 border border-zinc-700/60">
                  <span className="text-zinc-400 block text-[10px]">
                    {language === 'ru' ? 'Джекпот' : language === 'en' ? 'Jackpot' : 'Jekpot'}
                  </span>
                  <span className="font-bold text-emerald-400">1000 {t('coins')}</span>
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
