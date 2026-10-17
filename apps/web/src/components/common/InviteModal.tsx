import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GameMode } from '@shashka/shared-types';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { gamesApi } from '../../api/games';
import { triggerHaptic } from '../../utils/telegram';
import {
  Share2,
  Copy,
  Check,
  Send,
  Zap,
  Clock,
  Timer,
  Shuffle,
  Users,
  Swords,
} from 'lucide-react';
import { cn } from '../../utils/cn';

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InviteModal: React.FC<InviteModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [selectedMode, setSelectedMode] = useState<GameMode>(GameMode.CLASSIC);
  const [isLoading, setIsLoading] = useState(false);
  const [gameId, setGameId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const BOT_USERNAME = 'wikipediyauzrobot';

  const modes = [
    {
      id: GameMode.CLASSIC,
      title: 'Klassik (5 daqiqa)',
      icon: Clock,
      color: 'text-indigo-400',
    },
    {
      id: GameMode.BLITZ,
      title: 'Blits (3 daqiqa)',
      icon: Zap,
      color: 'text-amber-400',
    },
    {
      id: GameMode.RAPID,
      title: 'Rapid (10 daqiqa)',
      icon: Timer,
      color: 'text-emerald-400',
    },
    {
      id: GameMode.GIVEAWAY,
      title: 'Teskari shashka',
      icon: Shuffle,
      color: 'text-violet-400',
    },
  ];

  const handleCreateRoom = async () => {
    setIsLoading(true);
    triggerHaptic('medium');
    try {
      const res = await gamesApi.createInviteGame(selectedMode);
      if (res?.data?.id) {
        setGameId(res.data.id);
      } else {
        // Fallback room ID if offline/standalone
        const fallbackId = 'room_' + Math.random().toString(36).substring(2, 9);
        setGameId(fallbackId);
      }
    } catch {
      const fallbackId = 'room_' + Math.random().toString(36).substring(2, 9);
      setGameId(fallbackId);
    } finally {
      setIsLoading(false);
    }
  };

  const shareWebUrl = gameId
    ? `${window.location.origin}/#/game/online/${gameId}`
    : '';

  const shareTgUrl = gameId
    ? `https://t.me/${BOT_USERNAME}?start=game_${gameId}`
    : '';

  const handleCopy = async () => {
    const urlToCopy = shareTgUrl || shareWebUrl;
    try {
      await navigator.clipboard.writeText(urlToCopy);
      setCopied(true);
      triggerHaptic('success');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleShareTelegram = () => {
    triggerHaptic('light');
    const shareText = encodeURIComponent(
      "Salom! Men bilan rus shashkasi o'yinida kuch sinashmoqchimisiz? Ushbu havolaga bosing:",
    );
    const tgShareUrl = `https://t.me/share/url?url=${encodeURIComponent(
      shareTgUrl || shareWebUrl,
    )}&text=${shareText}`;
    window.open(tgShareUrl, '_blank');
  };

  const handleJoinNow = () => {
    if (!gameId) return;
    triggerHaptic('medium');
    onClose();
    navigate(`/game/online/${gameId}`);
  };

  const handleReset = () => {
    setGameId(null);
    setCopied(false);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleReset}
      title="Do'st bilan o'ynash"
    >
      <div className="flex flex-col gap-4 py-2">
        {!gameId ? (
          <>
            <p className="text-xs text-zinc-400 -mt-1">
              Do'stingizni taklif qiling va boshqa qurilmadan birga o'ynang
            </p>
            <span className="text-xs font-semibold text-zinc-300">
              O'yin rejimini tanlang:
            </span>
            <div className="grid grid-cols-2 gap-2">
              {modes.map((m) => {
                const Icon = m.icon;
                const isSelected = selectedMode === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => {
                      triggerHaptic('selection');
                      setSelectedMode(m.id);
                    }}
                    className={cn(
                      'flex items-center gap-2 p-2.5 rounded-xl border text-left text-xs font-medium transition-all select-none',
                      isSelected
                        ? 'border-indigo-500 bg-indigo-950/40 text-white shadow-xs'
                        : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700',
                    )}
                  >
                    <Icon className={cn('w-4 h-4 shrink-0', m.color)} />
                    <span className="truncate">{m.title}</span>
                  </button>
                );
              })}
            </div>

            <Button
              variant="primary"
              size="lg"
              fullWidth
              isLoading={isLoading}
              onClick={handleCreateRoom}
              leftIcon={<Share2 className="w-4 h-4" />}
              className="mt-2"
            >
              Taklif havolasini yaratish
            </Button>
          </>
        ) : (
          <div className="flex flex-col gap-3.5">
            <div className="p-3 bg-emerald-950/30 border border-emerald-800/60 rounded-xl text-center space-y-1">
              <span className="text-xs font-bold text-emerald-400 flex items-center justify-center gap-1.5">
                <Check className="w-4 h-4" />
                O'yin xonasi tayyor!
              </span>
              <p className="text-[11px] text-zinc-400">
                Ushbu havolani do'stingizga yuboring. U havolani ochganida o'yin darhol boshlanadi.
              </p>
            </div>

            {/* Link Box */}
            <div className="flex items-center gap-2 p-2 bg-zinc-900 border border-zinc-800 rounded-xl">
              <input
                type="text"
                readOnly
                value={shareTgUrl || shareWebUrl}
                className="bg-transparent text-xs text-zinc-300 font-mono flex-1 outline-hidden select-all px-1 truncate"
              />
              <button
                onClick={handleCopy}
                className={cn(
                  'px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0',
                  copied
                    ? 'bg-emerald-600 text-white'
                    : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200',
                )}
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Nusxalandi!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Nusxalash</span>
                  </>
                )}
              </button>
            </div>

            {/* Telegram Share Button */}
            <Button
              variant="secondary"
              size="md"
              fullWidth
              onClick={handleShareTelegram}
              leftIcon={<Send className="w-4 h-4 text-sky-400" />}
            >
              Telegram orqali do'stga yuborish
            </Button>

            {/* Enter Game Button */}
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={handleJoinNow}
              leftIcon={<Swords className="w-4 h-4" />}
            >
              O'yin xonasiga kirish
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
};
