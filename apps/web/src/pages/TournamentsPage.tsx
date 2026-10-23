import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageContainer } from '../components/layout/PageContainer';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { useTranslation } from '../i18n';
import { triggerHaptic } from '../utils/telegram';
import { tournamentsApi, type TournamentModel } from '../api/tournaments';
import {
  Trophy,
  Users,
  Plus,
  Mail,
  FileText,
  RotateCw,
  Zap,
  CheckCircle2,
  ChevronRight,
  Globe,
  Clock,
  Sparkles,
  Shield,
  Coins,
  Calendar,
  Check,
} from 'lucide-react';
import { cn } from '../utils/cn';

export const TournamentsPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t, language } = useTranslation();
  const [activeTab, setActiveTab] = useState<'active' | 'finished'>('active');

  // Create tournament modal state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [prizePool, setPrizePool] = useState(5000);
  const [maxPlayers, setMaxPlayers] = useState(32);
  const [startAfterMinutes, setStartAfterMinutes] = useState(30);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const { data: tournaments = [], isLoading, refetch } = useQuery({
    queryKey: ['tournaments-list'],
    queryFn: () => tournamentsApi.listTournaments(),
    staleTime: 15000,
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => tournamentsApi.createTournament(data),
    onSuccess: () => {
      triggerHaptic('success');
      setIsCreateOpen(false);
      setTitle('');
      setDescription('');
      setSuccessToast("Yangi turnir muvaffaqiyatli e'lon qilindi!");
      queryClient.invalidateQueries({ queryKey: ['tournaments-list'] });
      setTimeout(() => setSuccessToast(null), 3500);
    },
  });

  const joinMutation = useMutation({
    mutationFn: (id: string) => tournamentsApi.joinTournament(id),
    onSuccess: (res) => {
      triggerHaptic('success');
      setSuccessToast(res.message || "Turnirga muvaffaqiyatli ro'yxatdan o'tdingiz!");
      queryClient.invalidateQueries({ queryKey: ['tournaments-list'] });
      setTimeout(() => setSuccessToast(null), 3500);
    },
    onError: (err: any) => {
      triggerHaptic('error');
      alert(err.message || 'Xatolik yuz berdi');
    },
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const startTime = new Date(Date.now() + startAfterMinutes * 60000).toISOString();
    createMutation.mutate({
      title: title.trim(),
      description: description.trim() || undefined,
      prizePool: Number(prizePool) || 0,
      maxPlayers: Number(maxPlayers) || 32,
      startTime,
      mode: 'CLASSIC',
    });
  };

  const activeTournaments = tournaments.filter((t) => t.status === 'UPCOMING' || t.status === 'IN_PROGRESS');
  const finishedTournaments = tournaments.filter((t) => t.status === 'FINISHED');

  return (
    <PageContainer
      headerProps={{
        title: language === 'ru' ? 'Турниры' : language === 'en' ? 'Tournaments' : 'Turnirlar',
        rightAction: (
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                triggerHaptic('light');
                setIsCreateOpen(true);
              }}
              className="w-8 h-8 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center transition-colors active:scale-95 shadow-md shadow-indigo-950/40"
              title="Yangi turnir e'lon qilish"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                triggerHaptic('light');
                refetch();
              }}
              className="w-8 h-8 rounded-xl bg-zinc-850 hover:bg-zinc-800 text-zinc-300 flex items-center justify-center transition-colors active:scale-95"
              title="Yangilash"
            >
              <RotateCw className="w-4 h-4" />
            </button>
          </div>
        ),
      }}
    >
      <div className="flex flex-col gap-4 pb-6">
        {/* Success alert banner */}
        {successToast && (
          <div className="p-3 bg-emerald-950/90 border border-emerald-600/80 rounded-2xl text-emerald-200 text-xs font-semibold flex items-center gap-2 animate-fade-in">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successToast}</span>
          </div>
        )}

        {/* Hero Banner with Create Button */}
        <Card className="p-4 bg-gradient-to-r from-violet-950/80 via-indigo-950 to-zinc-900 border-indigo-700/50 relative overflow-hidden flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                <Trophy className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xs font-extrabold text-white">Shashka Gran-pri Turnirlari</h3>
                <span className="text-[11px] text-zinc-300">Sovg'ali chempionatlarda qatnashing</span>
              </div>
            </div>
            <button
              onClick={() => {
                triggerHaptic('medium');
                setIsCreateOpen(true);
              }}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-zinc-950 font-black text-[11px] shadow-md active:scale-95 transition-all flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Turnir e'lon qilish</span>
            </button>
          </div>
        </Card>

        {/* Tournament State Tabs */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              triggerHaptic('selection');
              setActiveTab('active');
            }}
            className={cn(
              'flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5',
              activeTab === 'active'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950/40'
                : 'bg-zinc-900 text-zinc-400 border border-zinc-800',
            )}
          >
            <Zap className="w-4 h-4" />
            <span>Faol turnirlar ({activeTournaments.length})</span>
          </button>

          <button
            onClick={() => {
              triggerHaptic('selection');
              setActiveTab('finished');
            }}
            className={cn(
              'flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5',
              activeTab === 'finished'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950/40'
                : 'bg-zinc-900 text-zinc-400 border border-zinc-800',
            )}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Tugagan ({finishedTournaments.length})</span>
          </button>
        </div>

        {/* Tournaments List */}
        <div className="flex flex-col gap-2.5">
          {isLoading ? (
            <div className="py-12 text-center text-xs text-zinc-400">Turnirlar yuklanmoqda...</div>
          ) : (activeTab === 'active' ? activeTournaments : finishedTournaments).length === 0 ? (
            <div className="p-8 rounded-3xl bg-zinc-900/60 border border-zinc-800/80 text-center flex flex-col items-center justify-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-zinc-800 text-zinc-400 flex items-center justify-center">
                <Trophy className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-zinc-200">Hozircha turnirlar mavjud emas</h4>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Yuqoridagi "+" tugmasini bosib yangi turnir e'lon qiling!
                </p>
              </div>
              <button
                onClick={() => {
                  triggerHaptic('medium');
                  setIsCreateOpen(true);
                }}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all active:scale-95 shadow-md"
              >
                Turnir e'lon qilish
              </button>
            </div>
          ) : (
            (activeTab === 'active' ? activeTournaments : finishedTournaments).map((t) => {
              const count = t.participantsCount || t.participants?.length || 0;
              const dateStr = new Date(t.startTime).toLocaleString([], {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <Card
                  key={t.id}
                  className="p-4 bg-gradient-to-r from-zinc-900 via-zinc-900 to-indigo-950/30 border-zinc-800 flex flex-col gap-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center shrink-0">
                        <Trophy className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-extrabold text-zinc-100">{t.title}</h4>
                        <div className="flex items-center gap-2 text-[11px] text-zinc-400 mt-0.5">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-indigo-400" />
                            {dateStr}
                          </span>
                          <span>·</span>
                          <span>{count} / {t.maxPlayers} ishtirokchi</span>
                        </div>
                      </div>
                    </div>

                    <span
                      className={cn(
                        'px-2.5 py-1 rounded-full text-[10px] font-bold',
                        t.status === 'IN_PROGRESS'
                          ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 animate-pulse'
                          : t.status === 'UPCOMING'
                            ? 'bg-indigo-500/10 border border-indigo-500/20 text-indigo-300'
                            : 'bg-zinc-800 text-zinc-400',
                      )}
                    >
                      {t.status === 'IN_PROGRESS'
                        ? "O'ynalmoqda"
                        : t.status === 'UPCOMING'
                          ? 'Kutilmoqda'
                          : 'Tugagan'}
                    </span>
                  </div>

                  {t.description && (
                    <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">
                      {t.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-zinc-800/80 text-xs">
                    <span className="text-zinc-400">Sovg'a jamg'armasi:</span>
                    <span className="font-extrabold text-amber-300 flex items-center gap-1">
                      <Coins className="w-3.5 h-3.5 text-amber-400" />
                      {t.prizePool} tanga
                    </span>
                  </div>

                  {activeTab === 'active' && (
                    <Button
                      variant="primary"
                      size="sm"
                      fullWidth
                      disabled={joinMutation.isPending}
                      onClick={() => joinMutation.mutate(t.id)}
                    >
                      {joinMutation.isPending ? "Ulanmoqda..." : "Ro'yxatdan o'tish (Qo'shilish)"}
                    </Button>
                  )}
                </Card>
              );
            })
          )}
        </div>
      </div>

      {/* CREATE TOURNAMENT MODAL */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Yangi turnir e'lon qilish"
      >
        <form onSubmit={handleCreateSubmit} className="flex flex-col gap-3 py-1">
          <div>
            <label className="text-xs font-semibold text-zinc-300 block mb-1">
              Turnir nomi *
            </label>
            <input
              type="text"
              required
              placeholder="Masalan: Oltin Shashka Kubogi #1"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-zinc-800 text-zinc-100 text-xs rounded-xl px-3 py-2.5 border border-zinc-700 outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-300 block mb-1">
              Tavsifi / Qoidasi
            </label>
            <input
              type="text"
              placeholder="G'oliblarga sovg'alar va almoslar beriladi"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-zinc-800 text-zinc-100 text-xs rounded-xl px-3 py-2.5 border border-zinc-700 outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1">
                Sovg'a (Tanga)
              </label>
              <input
                type="number"
                min="0"
                step="500"
                value={prizePool}
                onChange={(e) => setPrizePool(Number(e.target.value))}
                className="w-full bg-zinc-800 text-zinc-100 text-xs rounded-xl px-3 py-2.5 border border-zinc-700 outline-none focus:border-indigo-500 font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1">
                Ishtirokchilar soni
              </label>
              <select
                value={maxPlayers}
                onChange={(e) => setMaxPlayers(Number(e.target.value))}
                className="w-full bg-zinc-800 text-zinc-100 text-xs rounded-xl px-3 py-2.5 border border-zinc-700 outline-none focus:border-indigo-500"
              >
                <option value={8}>8 kishi</option>
                <option value={16}>16 kishi</option>
                <option value={32}>32 kishi</option>
                <option value={64}>64 kishi</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-300 block mb-1">
              Boshlanish vaqti
            </label>
            <select
              value={startAfterMinutes}
              onChange={(e) => setStartAfterMinutes(Number(e.target.value))}
              className="w-full bg-zinc-800 text-zinc-100 text-xs rounded-xl px-3 py-2.5 border border-zinc-700 outline-none focus:border-indigo-500"
            >
              <option value={5}>5 daqiqadan so'ng</option>
              <option value={15}>15 daqiqadan so'ng</option>
              <option value={30}>30 daqiqadan so'ng</option>
              <option value={60}>1 soatdan so'ng</option>
              <option value={180}>3 soatdan so'ng</option>
              <option value={1440}>Ertaga shu paytda</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800 mt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsCreateOpen(false)}
            >
              Bekor qilish
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={createMutation.isPending || !title.trim()}
            >
              {createMutation.isPending ? "E'lon qilinmoqda..." : "E'lon qilish"}
            </Button>
          </div>
        </form>
      </Modal>
    </PageContainer>
  );
};
