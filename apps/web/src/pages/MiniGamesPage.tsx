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

const PUZZLES: Puzzle[] = [
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
];

export const MiniGamesPage: React.FC = () => {
  const navigate = useNavigate();
  const { wallet } = useAuth();
  const { updateBalance } = useAuthStore();

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
      alert("Iltimos, avval javob variantlaridan birini tanlang!");
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
        [puzzle.id]: { correct: false, msg: "Noto'g'ri javob. Qayta urinib ko'ring!" },
      }));
    }
  };

  return (
    <PageContainer
      headerProps={{
        title: "Mini O'yinlar",
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
            <span>Omad Zari / Bonus</span>
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
            <span>Taktik Jumboqlar</span>
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

              <h3 className="text-lg font-black text-zinc-100">Kunlik Omad Zari</h3>
              <p className="text-xs text-zinc-400 mt-1 max-w-xs mx-auto">
                Zarni tashlang va 150 dan 1000 gacha bepul tangalarni qo'lga kiriting!
              </p>

              {lastReward !== null && (
                <div className="my-4 p-3 bg-emerald-950/80 border border-emerald-600/80 rounded-xl text-emerald-300 text-sm font-black animate-fade-in flex items-center justify-center gap-2">
                  <Coins className="w-5 h-5 text-amber-400" />
                  <span>+{formatNumber(lastReward)} tanga qo'shildi!</span>
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
                {isRolling ? 'Zar aylanmoqda...' : 'Zarni tashlash (Tanga olish)'}
              </Button>
            </Card>

            <Card className="p-4 bg-zinc-900/60 border-zinc-800">
              <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">
                Mukofotlar jadvali
              </h4>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2.5 rounded-xl bg-zinc-800/80 border border-zinc-700/60">
                  <span className="text-zinc-400 block text-[10px]">1-daraja</span>
                  <span className="font-bold text-amber-300">150 tanga</span>
                </div>
                <div className="p-2.5 rounded-xl bg-zinc-800/80 border border-zinc-700/60">
                  <span className="text-zinc-400 block text-[10px]">2-daraja</span>
                  <span className="font-bold text-amber-300">300 tanga</span>
                </div>
                <div className="p-2.5 rounded-xl bg-zinc-800/80 border border-zinc-700/60">
                  <span className="text-zinc-400 block text-[10px]">Jekpot</span>
                  <span className="font-bold text-emerald-400">1000 tanga</span>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* TAB 2: TACTICAL CHECKERS PUZZLES */}
        {activeTab === 'puzzles' && (
          <div className="flex flex-col gap-3.5">
            {PUZZLES.map((puzzle) => {
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
                          Jumboq #{puzzle.id}
                        </span>
                        {isSolved && (
                          <Badge variant="success" size="sm">
                            Yechildi
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
                    {isSolved ? 'Qayta tekshirish' : 'Javobni tasdiqlash'}
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
