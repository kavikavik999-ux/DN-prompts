import React, { useState } from 'react';
import {
  Sparkles,
  TrendingUp,
  ChevronRight,
  Flame,
  Star,
  RefreshCw,
  SlidersHorizontal,
} from 'lucide-react';
import { PromptItem, PromptCategory } from '../types';
import { PromptCard } from './PromptCard';
import { PROMPT_CATEGORIES } from '../data/categoriesData';
import { usePrompts } from '../contexts/PromptContext';

interface HomeFeedProps {
  onSelectPrompt: (prompt: PromptItem) => void;
  onOpenGpt: (prompt: PromptItem) => void;
  onOpenShare: (prompt: PromptItem) => void;
  onNavigateToSearchWithCategory: (category: PromptCategory) => void;
}

export const HomeFeed: React.FC<HomeFeedProps> = ({
  onSelectPrompt,
  onOpenGpt,
  onOpenShare,
  onNavigateToSearchWithCategory,
}) => {
  const { prompts, loading, refreshing, refreshData } = usePrompts();
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [carouselIndex, setCarouselIndex] = useState(0);

  // Featured prompts for top carousel
  const featuredPrompts = prompts.filter((p) => p.isFeatured || p.rank === 1).slice(0, 5);
  const activeFeatured = featuredPrompts[carouselIndex] || featuredPrompts[0] || prompts[0];

  // Trending prompts for horizontal ranking row
  const trendingPrompts = [...prompts]
    .sort((a, b) => (b.usesCount + b.likesCount) - (a.usesCount + a.likesCount))
    .slice(0, 6);

  // Filtered prompts for the 2-column feed
  const displayPrompts = prompts.filter((p) => {
    if (selectedCategory === 'All') return true;
    return p.category === selectedCategory;
  });

  return (
    <div className="pb-28 max-w-2xl mx-auto space-y-6 px-4 pt-3">
      {/* Pull / Refresh indicator */}
      {refreshing && (
        <div className="flex items-center justify-center gap-2 py-2 text-xs font-semibold text-purple-400 bg-purple-950/30 rounded-xl border border-purple-500/20 animate-pulse">
          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          Fetching latest prompts...
        </div>
      )}

      {/* Featured Large Hero Card (Prompt Deck Inspired) */}
      {activeFeatured && (
        <section aria-label="Featured Prompt" className="relative group">
          <div
            onClick={() => onSelectPrompt(activeFeatured)}
            className="relative w-full aspect-[4/5] sm:aspect-[16/11] rounded-3xl overflow-hidden bg-zinc-900 border border-zinc-800/80 shadow-2xl shadow-purple-950/20 cursor-pointer"
          >
            <img
              src={activeFeatured.imageUrl}
              alt={activeFeatured.title}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            {/* Dark vignette overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-black/20 pointer-events-none" />

            {/* Top Featured tag */}
            <div className="absolute top-4 left-4 flex items-center gap-2">
              <span className="flex items-center gap-1 text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-amber-500 text-zinc-950 shadow-lg">
                ★ FEATURED
              </span>
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white border border-white/10">
                {activeFeatured.category}
              </span>
            </div>

            {/* Bottom info */}
            <div className="absolute bottom-4 inset-x-4 space-y-2">
              <h2 className="text-xl sm:text-2xl font-black text-white font-['Outfit'] tracking-tight drop-shadow-md line-clamp-2">
                {activeFeatured.title}
              </h2>
              <p className="text-xs sm:text-sm text-zinc-300 line-clamp-2 drop-shadow leading-relaxed">
                {activeFeatured.description || activeFeatured.promptText}
              </p>

              {/* Stats & Quick actions */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-3 text-xs font-semibold text-zinc-300">
                  <span className="flex items-center gap-1 text-amber-400">
                    <Star className="w-4 h-4 fill-current" />
                    {activeFeatured.averageRating?.toFixed(1) || '5.0'}
                  </span>
                  <span className="flex items-center gap-1 text-orange-400">
                    <Flame className="w-4 h-4" />
                    {activeFeatured.usesCount || 0} uses
                  </span>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenGpt(activeFeatured);
                  }}
                  className="px-3.5 py-1.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-950/40 hover:from-emerald-400 hover:to-teal-400 active:scale-95 transition-all flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                  Open GPT
                </button>
              </div>
            </div>
          </div>

          {/* Dots Indicator */}
          {featuredPrompts.length > 1 && (
            <div className="flex items-center justify-center gap-1.5 pt-3">
              {featuredPrompts.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCarouselIndex(idx)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    carouselIndex === idx
                      ? 'w-6 bg-purple-500'
                      : 'w-1.5 bg-zinc-700 hover:bg-zinc-500'
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {/* Trending Now Section */}
      <section aria-label="Trending Prompts">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-rose-500" />
              <h3 className="font-extrabold text-base text-white font-['Outfit']">
                Trending now
              </h3>
            </div>
            <p className="text-xs text-zinc-400">Hottest prompts this week</p>
          </div>

          <button
            onClick={() => onNavigateToSearchWithCategory('Portrait')}
            className="flex items-center gap-0.5 text-xs font-bold text-purple-400 hover:text-purple-300 group"
          >
            See all
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {/* Horizontal Ranked Carousel */}
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory">
          {trendingPrompts.map((item, index) => (
            <div
              key={item.id}
              onClick={() => onSelectPrompt(item)}
              className="snap-start shrink-0 w-36 sm:w-44 bg-[#131420] rounded-2xl overflow-hidden border border-zinc-800/80 hover:border-purple-500/50 cursor-pointer group shadow-md transition-all flex flex-col"
            >
              <div className="relative aspect-[3/4] bg-zinc-900 overflow-hidden">
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <span className="absolute top-2 left-2 text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-400 text-zinc-950 shadow-md">
                  #{index + 1}
                </span>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <span className="absolute bottom-2 left-2 text-[10px] font-bold text-zinc-300 uppercase tracking-wider">
                  {item.category}
                </span>
              </div>
              <div className="p-2.5">
                <h4 className="text-xs font-bold text-white group-hover:text-purple-300 truncate">
                  {item.title}
                </h4>
                <div className="flex items-center justify-between text-[10px] text-zinc-400 mt-1">
                  <span className="flex items-center gap-0.5 text-amber-400 font-semibold">
                    ★ {item.averageRating?.toFixed(1) || '5.0'}
                  </span>
                  <span className="flex items-center gap-0.5 text-orange-400">
                    <Flame className="w-2.5 h-2.5" />
                    {item.usesCount || 0}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Category Pills Filter */}
      <section aria-label="Category Filter">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('All')}
            className={`shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all ${
              selectedCategory === 'All'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/30'
                : 'bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 border border-zinc-800'
            }`}
          >
            ✦ All
          </button>
          {PROMPT_CATEGORIES.map((cat) => (
            <button
              key={cat.name}
              onClick={() => setSelectedCategory(cat.name)}
              className={`shrink-0 px-3.5 py-2 rounded-full text-xs font-bold transition-all ${
                selectedCategory === cat.name
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/30'
                  : 'bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 border border-zinc-800'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </section>

      {/* 2-Column Gallery Grid (Screenshot 2 Inspired) */}
      <section aria-label="Gallery Feed">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-extrabold text-base text-white font-['Outfit']">
            {selectedCategory === 'All' ? 'Latest Prompts' : `${selectedCategory} Prompts`}
          </h3>
          <span className="text-xs text-zinc-500 font-semibold">
            {displayPrompts.length} prompts
          </span>
        </div>

        {displayPrompts.length === 0 ? (
          <div className="p-8 text-center bg-zinc-900/50 rounded-2xl border border-zinc-800 space-y-2">
            <p className="text-sm font-semibold text-zinc-300">
              No prompts found in {selectedCategory}
            </p>
            <p className="text-xs text-zinc-500">
              Try selecting another category or check back soon for daily drops!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3.5 sm:gap-4">
            {displayPrompts.map((item, index) => (
              <PromptCard
                key={item.id}
                prompt={item}
                rank={selectedCategory === 'All' && index < 3 ? index + 1 : undefined}
                onSelect={onSelectPrompt}
                onOpenGpt={onOpenGpt}
                onOpenShare={onOpenShare}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
