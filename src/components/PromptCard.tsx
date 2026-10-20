import React, { useState } from 'react';
import {
  Heart,
  Bookmark,
  Share2,
  Sparkles,
  Eye,
  Star,
  Copy,
  Check,
  ExternalLink,
  Flame,
} from 'lucide-react';
import { PromptItem } from '../types';
import { usePrompts } from '../contexts/PromptContext';

interface PromptCardProps {
  prompt: PromptItem;
  rank?: number;
  onSelect: (prompt: PromptItem) => void;
  onOpenGpt: (prompt: PromptItem) => void;
  onOpenShare: (prompt: PromptItem) => void;
}

export const PromptCard: React.FC<PromptCardProps> = ({
  prompt,
  rank,
  onSelect,
  onOpenGpt,
  onOpenShare,
}) => {
  const { userLikedIds, userSavedIds, toggleLike, toggleSave, recordUse } = usePrompts();
  const [copied, setCopied] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  const isLiked = userLikedIds.has(prompt.id);
  const isSaved = userSavedIds.has(prompt.id);

  const handleCopyPrompt = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(prompt.promptText);
      await recordUse(prompt.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await toggleLike(prompt);
  };

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await toggleSave(prompt);
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    onOpenShare(prompt);
  };

  const handleOpenGptClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onOpenGpt(prompt);
  };

  // Fallback image if broken
  const displayImage = imgError
    ? 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=800&q=80'
    : prompt.imageUrl;

  return (
    <div
      onClick={() => onSelect(prompt)}
      className="group relative bg-[#131420] rounded-2xl overflow-hidden border border-zinc-800/80 hover:border-purple-500/50 transition-all duration-300 shadow-lg hover:shadow-2xl hover:shadow-purple-950/20 flex flex-col cursor-pointer"
    >
      {/* Image container */}
      <div className="relative w-full aspect-[3/4] bg-zinc-900 overflow-hidden">
        {/* Loading skeleton */}
        {!imgLoaded && !imgError && (
          <div className="absolute inset-0 bg-gradient-to-tr from-zinc-900 via-zinc-800 to-zinc-900 animate-pulse" />
        )}

        <img
          src={displayImage}
          alt={prompt.title}
          loading="lazy"
          onLoad={() => setImgLoaded(true)}
          onError={() => {
            setImgError(true);
            setImgLoaded(true);
          }}
          className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${
            imgLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        />

        {/* Gradient dark overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#131420] via-transparent to-black/30 pointer-events-none" />

        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-1 pointer-events-none">
          <div className="flex items-center gap-1.5 flex-wrap">
            {rank !== undefined && rank > 0 && (
              <span className="pointer-events-auto text-[11px] font-black px-2 py-0.5 rounded-full bg-emerald-500/90 text-zinc-950 shadow-md backdrop-blur-md">
                #{rank}
              </span>
            )}
            <span className="pointer-events-auto text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-zinc-200 border border-white/10">
              {prompt.category}
            </span>
            {prompt.isDailyGenerated && (
              <span className="pointer-events-auto text-[9px] font-bold tracking-tight px-1.5 py-0.5 rounded-full bg-purple-600/80 text-white backdrop-blur-md">
                Daily AI
              </span>
            )}
          </div>

          {/* Quick Like Heart on top-right */}
          <button
            onClick={handleLike}
            aria-label={isLiked ? 'Unlike prompt' : 'Like prompt'}
            className={`pointer-events-auto p-2 rounded-full backdrop-blur-md transition-all active:scale-90 ${
              isLiked
                ? 'bg-rose-500 text-white shadow-lg shadow-rose-600/40'
                : 'bg-black/50 text-white/80 hover:bg-black/75 hover:text-white'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Floating Quick Action: Open GPT or Copy overlay at bottom of image */}
        <div className="absolute bottom-2 right-2 flex items-center gap-1.5">
          <button
            onClick={handleCopyPrompt}
            title="Copy prompt text"
            className="p-1.5 rounded-lg bg-black/70 backdrop-blur-md text-zinc-300 hover:text-white hover:bg-black border border-white/10 active:scale-90 transition-all text-xs flex items-center gap-1"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>
          <button
            onClick={handleOpenGptClick}
            title="Open in ChatGPT"
            className="px-2 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-[10px] font-bold tracking-wide backdrop-blur-md shadow-md hover:from-emerald-500 hover:to-teal-500 active:scale-95 transition-all flex items-center gap-1"
          >
            <Sparkles className="w-3 h-3 text-amber-200" />
            GPT
          </button>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-3.5 flex flex-col flex-1 justify-between gap-2.5">
        <div>
          <h3 className="font-bold text-sm text-zinc-100 group-hover:text-purple-300 transition-colors line-clamp-1 font-['Outfit']">
            {prompt.title}
          </h3>
          <p className="text-[12px] text-zinc-400 line-clamp-2 mt-1 leading-relaxed">
            {prompt.description || prompt.promptText}
          </p>
        </div>

        {/* Stats Row */}
        <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-2 border-t border-zinc-800/80">
          <div className="flex items-center gap-2.5">
            {/* Rating */}
            <div className="flex items-center gap-1 text-amber-400 font-semibold">
              <Star className="w-3.5 h-3.5 fill-current" />
              <span>{prompt.averageRating?.toFixed(1) || '5.0'}</span>
            </div>
            {/* Views */}
            <div className="flex items-center gap-1" title="Views">
              <Eye className="w-3 h-3 text-zinc-500" />
              <span>{prompt.viewsCount || 0}</span>
            </div>
            {/* Uses */}
            <div className="flex items-center gap-1 text-indigo-300" title="Uses (Copied / Opened GPT)">
              <Flame className="w-3 h-3 text-orange-400" />
              <span>{prompt.usesCount || 0}</span>
            </div>
          </div>

          {/* Action icon buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={handleSave}
              title={isSaved ? 'Remove from bookmarks' : 'Bookmark prompt'}
              className={`p-1.5 rounded-md hover:bg-zinc-800 transition-colors ${
                isSaved ? 'text-amber-400' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-current' : ''}`} />
            </button>
            <button
              onClick={handleShare}
              title="Share prompt"
              className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
