import React, { useState } from 'react';
import { X, Sparkles, Copy, Check, ExternalLink, Info, Image as ImageIcon } from 'lucide-react';
import { PromptItem } from '../types';
import { usePrompts } from '../contexts/PromptContext';

interface OpenGptModalProps {
  prompt: PromptItem | null;
  onClose: () => void;
}

export const OpenGptModal: React.FC<OpenGptModalProps> = ({ prompt, onClose }) => {
  const { recordUse } = usePrompts();
  const [copied, setCopied] = useState(false);

  if (!prompt) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(prompt.promptText);
      await recordUse(prompt.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleLaunch = async () => {
    await recordUse(prompt.id);
    // Encode prompt into ChatGPT search query parameter
    const encoded = encodeURIComponent(prompt.promptText);
    const url = `https://chatgpt.com/?q=${encoded}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div
        className="relative w-full max-w-md bg-[#121320] rounded-2xl border border-zinc-800 p-5 shadow-2xl flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-black text-sm text-white font-['Outfit']">
                Open in ChatGPT
              </h3>
              <span className="text-[11px] text-zinc-400">
                Automatic prompt text import
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Selected prompt preview */}
        <div className="space-y-1.5">
          <span className="text-xs font-semibold text-zinc-300">
            Selected Prompt ({prompt.category}):
          </span>
          <div className="p-3 bg-zinc-950/80 rounded-xl border border-zinc-800 font-mono text-xs text-zinc-300 max-h-36 overflow-y-auto leading-relaxed">
            {prompt.promptText}
          </div>
        </div>

        {/* Clarification banner about image attachments */}
        <div className="p-3 rounded-xl bg-purple-950/20 border border-purple-500/30 flex gap-2.5 text-xs text-purple-200 leading-relaxed">
          <Info className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
          <p>
            Your prompt text will transfer automatically to ChatGPT. To use a reference photo, click the{' '}
            <strong className="text-white">+ or attachment icon</strong> inside ChatGPT after opening.
          </p>
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-2 pt-1">
          <button
            onClick={handleLaunch}
            className="w-full py-3 px-4 rounded-xl font-bold text-xs bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            <Sparkles className="w-4 h-4 text-amber-200" />
            Launch ChatGPT with Prompt
            <ExternalLink className="w-3.5 h-3.5 opacity-80" />
          </button>

          <button
            onClick={handleCopy}
            className="w-full py-2.5 px-4 rounded-xl font-bold text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                Copied to Clipboard!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-purple-400" />
                Copy Prompt as Fallback
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
