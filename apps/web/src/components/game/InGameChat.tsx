import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, Smile, X, ChevronDown } from 'lucide-react';
import { useSocketContext } from '../../providers/SocketProvider';
import { useAuth } from '../../hooks/useAuth';
import { triggerHaptic } from '../../utils/telegram';
import { cn } from '../../utils/cn';

interface ChatMsg {
  senderId: string;
  senderName: string;
  message: string;
  isSticker?: boolean;
  time: string;
}

const QUICK_PHRASES = [
  'Salom! 👋',
  'Yaxshi yurish! 👍',
  "Ajoyib kombinatsiya! 🔥",
  "Tezroq o'yna 🙂",
  'Durrang qilamizmi? 🤝',
  'Omad tilayman! ✨',
  'Qoyil! 👏',
  "Taslim bo'l 😜",
];

const STICKERS = ['♟️', '👑', '🔥', '💥', '👏', '🏆', '😎', '🤔', '🤝', '⚡', '🎉', '💪'];

export interface InGameChatProps {
  gameId: string;
}

export const InGameChat: React.FC<InGameChatProps> = ({ gameId }) => {
  const { socket, sendChatMessage } = useSocketContext();
  const { user } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showStickers, setShowStickers] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!socket) return;

    const handleMessage = (data: {
      gameId: string;
      senderId: string;
      senderName: string;
      message: string;
      isSticker?: boolean;
      createdAt?: string;
    }) => {
      if (data.gameId !== gameId) return;

      const newMsg: ChatMsg = {
        senderId: data.senderId,
        senderName: data.senderName,
        message: data.message,
        isSticker: data.isSticker,
        time: new Date(data.createdAt || Date.now()).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
      };

      setMessages((prev) => [...prev, newMsg]);

      if (!isOpen) {
        setUnreadCount((c) => c + 1);
        triggerHaptic('light');
      }
    };

    socket.on('chat:message', handleMessage);

    return () => {
      socket.off('chat:message', handleMessage);
    };
  }, [socket, gameId, isOpen]);

  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
      setTimeout(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
      }, 50);
    }
  }, [isOpen, messages]);

  const handleSend = (textToSend?: string, isSticker = false) => {
    const text = textToSend ?? inputText.trim();
    if (!text) return;

    triggerHaptic('light');
    sendChatMessage(gameId, text, isSticker);

    if (!textToSend) {
      setInputText('');
    }
    setShowStickers(false);
  };

  return (
    <>
      {/* Floating or docked chat toggle pill */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => {
            triggerHaptic('selection');
            setIsOpen((prev) => !prev);
          }}
          className="relative px-3 py-1.5 rounded-xl bg-zinc-850 hover:bg-zinc-800 text-zinc-200 border border-zinc-750 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs active:scale-95"
        >
          <MessageSquare className="w-4 h-4 text-indigo-400" />
          <span>O'yin chati</span>
          {unreadCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-rose-500 text-white font-bold text-[10px] flex items-center justify-center animate-pulse">
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Chat Drawer / Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end justify-center p-3 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-4 flex flex-col gap-3 shadow-2xl max-h-[75vh] animate-in slide-in-from-bottom duration-200">
            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-zinc-100">Jonli o'yin chati</h3>
                  <span className="text-[10px] text-zinc-400">Raqibingiz bilan muloqot</span>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-7 h-7 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick phrases bar */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-nowrap">
              {QUICK_PHRASES.map((phrase, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(phrase)}
                  className="px-2.5 py-1 rounded-lg bg-zinc-800/80 hover:bg-zinc-750 text-zinc-300 text-[11px] font-medium transition-colors border border-zinc-700/60 shrink-0 active:scale-95"
                >
                  {phrase}
                </button>
              ))}
            </div>

            {/* Messages body */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto max-h-56 flex flex-col gap-2 p-1 pr-2"
            >
              {messages.length === 0 ? (
                <div className="py-8 text-center text-zinc-500 text-xs">
                  Xabarlar yo'q. Birinchi bo'lib salom yo'llang! 👋
                </div>
              ) : (
                messages.map((m, idx) => {
                  const isMe = m.senderId === user?.id;
                  return (
                    <div
                      key={idx}
                      className={cn(
                        'flex flex-col max-w-[80%]',
                        isMe ? 'self-end items-end' : 'self-start items-start',
                      )}
                    >
                      <div
                        className={cn(
                          'p-2.5 rounded-2xl text-xs break-words shadow-xs',
                          m.isSticker
                            ? 'text-3xl bg-transparent p-1'
                            : isMe
                              ? 'bg-indigo-600 text-white rounded-br-xs'
                              : 'bg-zinc-800 border border-zinc-750 text-zinc-200 rounded-bl-xs',
                        )}
                      >
                        {!isMe && !m.isSticker && (
                          <span className="block text-[10px] font-bold text-indigo-400 mb-0.5">
                            {m.senderName}
                          </span>
                        )}
                        <span>{m.message}</span>
                      </div>
                      <span className="text-[9px] text-zinc-500 mt-0.5 px-1">{m.time}</span>
                    </div>
                  );
                })
              )}
            </div>

            {/* Stickers picker toggle */}
            {showStickers && (
              <div className="grid grid-cols-6 gap-2 p-2 bg-zinc-850 rounded-2xl border border-zinc-750 animate-in fade-in duration-150">
                {STICKERS.map((st, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(st, true)}
                    className="h-10 text-2xl flex items-center justify-center hover:bg-zinc-700/60 rounded-xl active:scale-90 transition-transform"
                  >
                    {st}
                  </button>
                ))}
              </div>
            )}

            {/* Input row */}
            <div className="flex items-center gap-1.5 pt-1 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setShowStickers((v) => !v)}
                className="w-9 h-9 rounded-xl bg-zinc-800 text-zinc-400 hover:text-amber-400 flex items-center justify-center transition-colors shrink-0"
                title="Stikerlar"
              >
                <Smile className="w-5 h-5" />
              </button>
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Xabar yozing..."
                className="flex-1 bg-zinc-800 text-zinc-100 text-xs rounded-xl px-3 py-2.5 border border-zinc-700 outline-none focus:border-indigo-500 placeholder:text-zinc-500"
              />
              <button
                type="button"
                onClick={() => handleSend()}
                disabled={!inputText.trim()}
                className="w-9 h-9 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center transition-all disabled:opacity-40 shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
