import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageContainer } from '../components/layout/PageContainer';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { useTranslation } from '../i18n';
import { triggerHaptic } from '../utils/telegram';
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
} from 'lucide-react';
import { cn } from '../utils/cn';

interface Team {
  id: string;
  name: string;
  membersCount: number;
  avatar: string;
  badge?: string;
}

const TEAMS: Team[] = [
  { id: '1', name: 'My team', membersCount: 216, avatar: '🤝' },
  { id: '2', name: 'Shashka Online', membersCount: 177, avatar: '♟️' },
  { id: '3', name: 'Buyuklikni jamosi', membersCount: 154, avatar: '🏖️' },
];

export const TournamentsPage: React.FC = () => {
  const navigate = useNavigate();
  const { t, language } = useTranslation();
  const [activeTab, setActiveTab] = useState<'active' | 'finished'>('active');

  const handleAction = (msg: string) => {
    triggerHaptic('selection');
    alert(msg);
  };

  return (
    <PageContainer
      headerProps={{
        title: language === 'ru' ? 'Турниры' : language === 'en' ? 'Tournaments' : 'Turnirlar',
        rightAction: (
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleAction(language === 'ru' ? 'Создание турнира скоро будет доступно!' : "Yangi turnir yaratish tez kunda ochiladi!")}
              className="w-8 h-8 rounded-xl bg-zinc-850 hover:bg-zinc-800 text-zinc-300 flex items-center justify-center transition-colors active:scale-95"
              title="Yangi turnir"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleAction(language === 'ru' ? 'Новых сообщений нет' : "Yangi xabarlar yo'q")}
              className="w-8 h-8 rounded-xl bg-zinc-850 hover:bg-zinc-800 text-zinc-300 flex items-center justify-center transition-colors active:scale-95"
              title="Xabarlar"
            >
              <Mail className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleAction(language === 'ru' ? 'Регламент турниров' : "Turnir qoidalari va nizom")}
              className="w-8 h-8 rounded-xl bg-zinc-850 hover:bg-zinc-800 text-zinc-300 flex items-center justify-center transition-colors active:scale-95"
              title="Qoidalar"
            >
              <FileText className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                triggerHaptic('light');
                window.location.reload();
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
        {/* Teams Section Card */}
        <Card className="p-4 bg-gradient-to-b from-[#131b38] to-[#0d1329] border-indigo-900/40 relative overflow-hidden">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-bold text-zinc-100">
                {language === 'ru' ? 'Вступить в команду' : language === 'en' ? 'Join a Team' : "Jamoaga qo'shiling"}
              </h3>
            </div>
            <button
              onClick={() => handleAction("Barcha jamoalar ro'yxati tez kunda!")}
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-0.5"
            >
              <span>{language === 'ru' ? 'Все команды' : language === 'en' ? 'All teams' : 'Barcha jamoalar'}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <p className="text-xs text-zinc-400 mb-3">
            {language === 'ru'
              ? 'Сражайтесь в рядах команды и выигрывайте алмазы из призового фонда.'
              : language === 'en'
                ? 'Battle alongside your team and win diamonds from the prize pool.'
                : "Jamoa safida janglarda o'ynang va mukofot fondidan olmos yuting."}
          </p>

          <div className="flex flex-col gap-2">
            {TEAMS.map((team) => (
              <div
                key={team.id}
                onClick={() => handleAction(`${team.name} jamoasiga taklif yuborildi!`)}
                className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800/80 hover:border-indigo-600/60 active:scale-[0.99] transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-lg">
                    {team.avatar}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-zinc-200">{team.name}</h4>
                    <span className="text-[11px] text-zinc-400">
                      {team.membersCount} {language === 'ru' ? 'участников' : language === 'en' ? 'members' : "a'zo"}
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-500" />
              </div>
            ))}
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
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40'
                : 'bg-zinc-900 text-zinc-400 border border-zinc-800',
            )}
          >
            <Zap className="w-4 h-4" />
            <span>{language === 'ru' ? 'Новые (57)' : language === 'en' ? 'Active (57)' : 'Yangi (57)'}</span>
          </button>

          <button
            onClick={() => {
              triggerHaptic('selection');
              setActiveTab('finished');
            }}
            className={cn(
              'flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5',
              activeTab === 'finished'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40'
                : 'bg-zinc-900 text-zinc-400 border border-zinc-800',
            )}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{language === 'ru' ? 'Завершенные' : language === 'en' ? 'Finished' : 'Tugagan'}</span>
          </button>
        </div>

        {/* Section: Boshlangan / O'ynalmoqda */}
        <div className="flex flex-col gap-2">
          <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider pl-1 flex items-center gap-1.5">
            <span>📅</span>
            <span>{language === 'ru' ? 'НАЧАВШИЕСЯ ТУРНИРЫ' : language === 'en' ? 'STARTED TOURNAMENTS' : 'BOSHLANGAN'}</span>
          </span>

          {/* Tournament Item Card 1 */}
          <Card className="p-4 bg-gradient-to-r from-zinc-900 via-zinc-900 to-indigo-950/40 border-zinc-800 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center">
                  <Trophy className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-zinc-100">Haftalik Gran-pri #42</h4>
                  <div className="flex items-center gap-2 text-[11px] text-zinc-400 mt-0.5">
                    <span className="flex items-center gap-1">
                      <Globe className="w-3 h-3 text-indigo-400" /> Rus shashkasi
                    </span>
                    <span>·</span>
                    <span>64 ishtirokchi</span>
                  </div>
                </div>
              </div>

              <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-bold animate-pulse">
                {language === 'ru' ? 'Идет игра' : language === 'en' ? 'Live' : "O'ynalmoqda"}
              </span>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-zinc-800/80 text-xs">
              <span className="text-zinc-400">Mukofot jamg'armasi:</span>
              <span className="font-bold text-amber-300 flex items-center gap-1">
                <Coins className="w-3.5 h-3.5 text-amber-400" />
                50 000 tanga
              </span>
            </div>

            <Button
              variant="primary"
              size="sm"
              fullWidth
              onClick={() => navigate('/matchmaking')}
            >
              {language === 'ru' ? 'Смотреть / Присоединиться' : language === 'en' ? 'Watch / Join' : "Kuzatish / Ishtirok etish"}
            </Button>
          </Card>

          {/* Tournament Item Card 2 */}
          <Card className="p-4 bg-zinc-900/60 border-zinc-800 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-zinc-100">Tezkor Blits Kubogi</h4>
                  <div className="flex items-center gap-2 text-[11px] text-zinc-400 mt-0.5">
                    <span>3 daqiqa + 2 soniya</span>
                    <span>·</span>
                    <span>32 ishtirokchi</span>
                  </div>
                </div>
              </div>

              <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[10px] font-semibold">
                19:00 da boshlanadi
              </span>
            </div>

            <Button
              variant="secondary"
              size="sm"
              fullWidth
              onClick={() => handleAction("Turnirga ro'yxatdan o'tdingiz!")}
            >
              {language === 'ru' ? 'Зарегистрироваться' : language === 'en' ? 'Register' : "Ro'yxatdan o'tish"}
            </Button>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
};
