import React, { useState } from 'react';
import { X, Copy, Check, Share2, Instagram, MessageCircle, Send } from 'lucide-react';
import { PromptItem } from '../types';

interface ShareModalProps {
  prompt: PromptItem | null;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ prompt, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!prompt) return null;

  const currentUrl = typeof window !== 'undefined' ? window.location.href : 'https://dnprompt.app';
  const shareText = `Check out "${prompt.title}" on DN PROMPTS by Dharani Selvan!\n\nAI Prompt:\n${prompt.promptText.slice(0, 150)}...\n\n`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${shareText}\n${currentUrl}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleWhatsApp = () => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(
      `${shareText}\n${currentUrl}`
    )}`;
    window.open(url, '_blank');
  };

  const handleTelegram = () => {
    const url = `https://t.me/share/url?url=${encodeURIComponent(
      currentUrl
    )}&text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div
        className="relative w-full max-w-sm bg-[#121320] rounded-2xl border border-zinc-800 p-5 shadow-2xl flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <Share2 className="w-4 h-4 text-purple-400" />
            <h3 className="font-bold text-sm text-white font-['Outfit']">
              Share AI Prompt
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-zinc-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-3 p-2.5 rounded-xl bg-zinc-900 border border-zinc-800">
          <img
            src={prompt.imageUrl}
            alt={prompt.title}
            className="w-12 h-12 rounded-lg object-cover"
          />
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-bold text-white truncate">
              {prompt.title}
            </h4>
            <span className="text-[11px] text-zinc-400 block truncate">
              {prompt.category} • by Dharani Selvan
            </span>
          </div>
        </div>

        {/* Share buttons */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleWhatsApp}
            className="p-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 flex items-center justify-center gap-2 text-xs font-bold transition-all active:scale-95"
          >
            <MessageCircle className="w-4 h-4" />
            WhatsApp
          </button>
          <button
            onClick={handleTelegram}
            className="p-3 rounded-xl bg-sky-600/20 hover:bg-sky-600/30 text-sky-400 border border-sky-500/30 flex items-center justify-center gap-2 text-xs font-bold transition-all active:scale-95"
          >
            <Send className="w-4 h-4" />
            Telegram
          </button>
        </div>

        {/* Copy Link */}
        <button
          onClick={handleCopyLink}
          className="w-full py-2.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs flex items-center justify-center gap-2 border border-zinc-700 transition-all active:scale-95"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-emerald-400" />
              Share Link Copied!
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 text-purple-400" />
              Copy Shareable Link
            </>
          )}
        </button>
      </div>
    </div>
  );
};
