import React, { useState, useEffect } from 'react';
import {
  X,
  Heart,
  Bookmark,
  Share2,
  Copy,
  Check,
  Sparkles,
  Star,
  Eye,
  Flame,
  Instagram,
  Youtube,
  ExternalLink,
  ChevronRight,
  Send,
} from 'lucide-react';
import { PromptItem } from '../types';
import { usePrompts } from '../contexts/PromptContext';
import { useAuth } from '../contexts/AuthContext';
import confetti from 'canvas-confetti';

interface PromptDetailModalProps {
  prompt: PromptItem | null;
  onClose: () => void;
  onSelectRelated: (prompt: PromptItem) => void;
  onOpenGpt: (prompt: PromptItem) => void;
}

export const PromptDetailModal: React.FC<PromptDetailModalProps> = ({
  prompt,
  onClose,
  onSelectRelated,
  onOpenGpt,
}) => {
  const {
    prompts,
    userLikedIds,
    userSavedIds,
    userRatings,
    toggleLike,
    toggleSave,
    recordView,
    recordUse,
    submitRating,
  } = usePrompts();
  const { user } = useAuth();

  const [copied, setCopied] = useState(false);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [showRatingSuccess, setShowRatingSuccess] = useState(false);

  useEffect(() => {
    if (prompt) {
      recordView(prompt.id);
    }
  }, [prompt?.id]);

  if (!prompt) return null;

  const isLiked = userLikedIds.has(prompt.id);
  const isSaved = userSavedIds.has(prompt.id);
  const userRating = userRatings[prompt.id] || 0;

  // Copy prompt handler
  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(prompt.promptText);
      await recordUse(prompt.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      try {
        confetti({
          particleCount: 25,
          spread: 60,
          origin: { y: 0.8 },
          colors: ['#a855f7', '#ec4899', '#3b82f6'],
        });
      } catch {}
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Open GPT handler
  const handleOpenGpt = () => {
    onOpenGpt(prompt);
  };

  // Rate handler
  const handleRate = async (starVal: number) => {
    await submitRating(prompt.id, starVal);
    setShowRatingSuccess(true);
    setTimeout(() => setShowRatingSuccess(false), 2500);
    try {
      confetti({
        particleCount: 40,
        spread: 70,
        origin: { y: 0.7 },
      });
    } catch {}
  };

  // Native share handler
  const handleShare = async () => {
    const shareData = {
      title: `${prompt.title} - DN PROMPTS`,
      text: `Check out this AI prompt on DN Prompts by Dharani Selvan:\n"${prompt.title}"\n${prompt.promptText.slice(0, 100)}...`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        // User cancelled or unsupported
      }
    } else {
      await navigator.clipboard.writeText(
        `${shareData.title}\n\nPrompt:\n${prompt.promptText}\n\n${window.location.href}`
      );
      alert('Prompt link & text copied to clipboard!');
    }
  };

  // Related suggestions: find prompts with same category or tags, excluding current
  const relatedPrompts = prompts
    .filter((p) => p.id !== prompt.id)
    .filter((p) => {
      if (p.category === prompt.category) return true;
      if (p.tags && prompt.tags) {
        return p.tags.some((t) => prompt.tags?.includes(t));
      }
      return false;
    })
    .slice(0, 4);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div
        className="relative w-full max-w-xl bg-[#11121d] rounded-t-3xl sm:rounded-3xl border border-zinc-800 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header bar */}
        <div className="sticky top-0 z-20 flex items-center justify-between px-5 py-3.5 bg-[#11121d]/90 backdrop-blur-md border-b border-zinc-800/80">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-extrabold tracking-wider px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
              {prompt.category}
            </span>
            {prompt.isDailyGenerated && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Daily AI Drop
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              title="Share"
              className="p-2 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              title="Close"
              className="p-2 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto px-5 py-4 space-y-5">
          {/* Main Hero Image */}
          <div className="relative w-full aspect-[4/5] rounded-2xl overflow-hidden bg-zinc-950 border border-zinc-800/80 shadow-inner group">
            <img
              src={prompt.imageUrl}
              alt={prompt.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />

            {/* Quick Floating Overlays on image */}
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
              <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 text-xs">
                <span className="flex items-center gap-1 text-amber-400 font-bold">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  {prompt.averageRating?.toFixed(1) || '5.0'}
                </span>
                <span className="text-zinc-500">•</span>
                <span className="flex items-center gap-1 text-zinc-300">
                  <Eye className="w-3.5 h-3.5 text-zinc-400" />
                  {prompt.viewsCount || 0} views
                </span>
                <span className="text-zinc-500">•</span>
                <span className="flex items-center gap-1 text-indigo-300">
                  <Flame className="w-3.5 h-3.5 text-orange-400" />
                  {prompt.usesCount || 0} uses
                </span>
              </div>

              {/* Heart & Save */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleLike(prompt)}
                  className={`p-2 rounded-full backdrop-blur-md transition-all active:scale-90 ${
                    isLiked
                      ? 'bg-rose-500 text-white shadow-lg shadow-rose-600/40'
                      : 'bg-black/60 text-white hover:bg-black/80'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                </button>
                <button
                  onClick={() => toggleSave(prompt)}
                  className={`p-2 rounded-full backdrop-blur-md transition-all active:scale-90 ${
                    isSaved
                      ? 'bg-amber-500 text-zinc-950 shadow-lg shadow-amber-500/40'
                      : 'bg-black/60 text-white hover:bg-black/80'
                  }`}
                >
                  <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
                </button>
              </div>
            </div>
          </div>

          {/* Title & Description */}
          <div>
            <h2 className="text-xl font-black text-white font-['Outfit'] tracking-tight">
              {prompt.title}
            </h2>
            {prompt.description && (
              <p className="text-sm text-zinc-400 mt-1.5 leading-relaxed">
                {prompt.description}
              </p>
            )}
          </div>

          {/* Full Prompt Box */}
          <div className="bg-[#181926] rounded-2xl p-4 border border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-purple-300">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                Prompt Text
              </div>
              <span className="text-[11px] text-zinc-500">
                {prompt.promptText.length} chars
              </span>
            </div>

            <div className="bg-zinc-950/70 p-3.5 rounded-xl border border-zinc-800/80 font-mono text-xs text-zinc-200 leading-relaxed max-h-48 overflow-y-auto selection:bg-purple-600">
              {prompt.promptText}
            </div>

            {/* Action Buttons Row */}
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                onClick={handleCopyPrompt}
                className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 ${
                  copied
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                    : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-200" />
                    Copied to Clipboard!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-purple-400" />
                    Copy Prompt
                  </>
                )}
              </button>

              <button
                onClick={handleOpenGpt}
                className="py-2.5 px-3 rounded-xl font-bold text-xs bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white shadow-lg shadow-emerald-950/40 flex items-center justify-center gap-2 active:scale-95 transition-all"
              >
                <Sparkles className="w-4 h-4 text-amber-200" />
                Open GPT
                <ExternalLink className="w-3 h-3 opacity-80" />
              </button>
            </div>
          </div>

          {/* Interactive Rating Section */}
          <div className="bg-[#181926]/70 rounded-2xl p-4 border border-zinc-800/80 flex flex-col items-center justify-center text-center gap-2">
            <span className="text-xs font-semibold text-zinc-300">
              Rate this AI Prompt
            </span>
            <div className="flex items-center gap-1.5 py-1">
              {[1, 2, 3, 4, 5].map((star) => {
                const isFilled =
                  (hoverRating !== null ? hoverRating : userRating) >= star;
                return (
                  <button
                    key={star}
                    type="button"
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(null)}
                    onClick={() => handleRate(star)}
                    className="p-1 text-zinc-600 hover:scale-125 transition-transform"
                  >
                    <Star
                      className={`w-6 h-6 transition-colors ${
                        isFilled
                          ? 'text-amber-400 fill-amber-400'
                          : 'text-zinc-600 hover:text-amber-300'
                      }`}
                    />
                  </button>
                );
              })}
            </div>
            {showRatingSuccess ? (
              <span className="text-xs font-bold text-emerald-400 animate-pulse">
                Thank you! Rating saved.
              </span>
            ) : userRating > 0 ? (
              <span className="text-[11px] text-zinc-400">
                You rated this {userRating} / 5 stars
              </span>
            ) : (
              <span className="text-[11px] text-zinc-500">
                Average {prompt.averageRating?.toFixed(1) || '5.0'} based on{' '}
                {prompt.ratingCount || 1} ratings
              </span>
            )}
          </div>

          {/* Social Links & Author Attribution */}
          <div className="flex items-center justify-between p-3.5 bg-gradient-to-r from-purple-950/20 to-zinc-900 rounded-2xl border border-zinc-800/80">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-purple-600 to-amber-400 p-[1.5px]">
                <div className="w-full h-full rounded-full bg-zinc-950 flex items-center justify-center text-xs font-bold text-white">
                  DS
                </div>
              </div>
              <div>
                <span className="text-xs font-bold text-white block">
                  {prompt.authorName || 'Dharani Selvan'}
                </span>
                <span className="text-[11px] text-zinc-400">
                  Creator &amp; Visual Director
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {prompt.instagramUrl && (
                <a
                  href={prompt.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Follow on Instagram"
                  className="p-2 rounded-full bg-pink-500/10 text-pink-400 hover:bg-pink-500/20 border border-pink-500/20 transition-colors"
                >
                  <Instagram className="w-4 h-4" />
                </a>
              )}
              {prompt.youtubeUrl && (
                <a
                  href={prompt.youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Subscribe on YouTube"
                  className="p-2 rounded-full bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition-colors"
                >
                  <Youtube className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>

          {/* Tags */}
          {prompt.tags && prompt.tags.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-zinc-400 tracking-wider uppercase">
                Tags &amp; Keywords
              </span>
              <div className="flex flex-wrap gap-1.5">
                {prompt.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-zinc-800/80 text-zinc-300 border border-zinc-700/60"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Suggested & Related Prompts */}
          {relatedPrompts.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-white font-['Outfit']">
                  Suggested &amp; Related
                </span>
                <span className="text-xs text-purple-400 font-semibold">
                  {prompt.category}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {relatedPrompts.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => onSelectRelated(item)}
                    className="group relative bg-[#181926] rounded-xl overflow-hidden border border-zinc-800 hover:border-purple-500/50 cursor-pointer transition-all"
                  >
                    <div className="aspect-[4/3] bg-zinc-900 overflow-hidden">
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="p-2">
                      <h4 className="text-xs font-bold text-zinc-200 group-hover:text-purple-300 line-clamp-1">
                        {item.title}
                      </h4>
                      <span className="text-[10px] text-zinc-400">
                        {item.category}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
