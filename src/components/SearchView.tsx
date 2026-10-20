import React, { useState, useMemo } from 'react';
import { Search, X, SlidersHorizontal, ArrowUpDown, Sparkles, Filter } from 'lucide-react';
import { PromptItem, PromptCategory } from '../types';
import { PromptCard } from './PromptCard';
import { PROMPT_CATEGORIES } from '../data/categoriesData';
import { usePrompts } from '../contexts/PromptContext';

interface SearchViewProps {
  initialCategory?: PromptCategory | null;
  onSelectPrompt: (prompt: PromptItem) => void;
  onOpenGpt: (prompt: PromptItem) => void;
  onOpenShare: (prompt: PromptItem) => void;
}

type SortOption = 'trending' | 'newest' | 'most_used' | 'top_rated' | 'most_liked';

export const SearchView: React.FC<SearchViewProps> = ({
  initialCategory,
  onSelectPrompt,
  onOpenGpt,
  onOpenShare,
}) => {
  const { prompts } = usePrompts();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>(
    initialCategory || 'All'
  );
  const [sortBy, setSortBy] = useState<SortOption>('trending');

  // Quick actor and keyword filters
  const quickFilters = [
    'Suriya',
    'Sai Pallavi',
    'Karthi',
    'Dhanush',
    'Jyothika',
    'Black Shirt',
    'Navaratri',
    'Saree',
    'Cinematic 8K',
  ];

  // Filtering and sorting logic
  const filteredPrompts = useMemo(() => {
    let result = [...prompts];

    // Search query matching: title, promptText, category, tags, description
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((p) => {
        const titleMatch = p.title.toLowerCase().includes(q);
        const textMatch = p.promptText.toLowerCase().includes(q);
        const catMatch = p.category.toLowerCase().includes(q);
        const descMatch = (p.description || '').toLowerCase().includes(q);
        const tagsMatch = p.tags?.some((t) => t.toLowerCase().includes(q));
        const authorMatch = (p.authorName || '').toLowerCase().includes(q);
        return titleMatch || textMatch || catMatch || descMatch || tagsMatch || authorMatch;
      });
    }

    // Category filter
    if (selectedCategory !== 'All') {
      result = result.filter((p) => p.category === selectedCategory);
    }

    // Sorting
    switch (sortBy) {
      case 'trending':
        result.sort((a, b) => (b.usesCount + b.likesCount * 2) - (a.usesCount + a.likesCount * 2));
        break;
      case 'newest':
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'most_used':
        result.sort((a, b) => (b.usesCount || 0) - (a.usesCount || 0));
        break;
      case 'top_rated':
        result.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
        break;
      case 'most_liked':
        result.sort((a, b) => (b.likesCount || 0) - (a.likesCount || 0));
        break;
    }

    return result;
  }, [prompts, searchQuery, selectedCategory, sortBy]);

  return (
    <div className="pb-28 max-w-2xl mx-auto space-y-5 px-4 pt-4">
      {/* Search Input Bar */}
      <div className="relative">
        <div className="relative flex items-center">
          <Search className="absolute left-4 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search prompts, actors, tags, categories..."
            className="w-full pl-11 pr-10 py-3 rounded-2xl bg-[#141524] border border-zinc-800 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 shadow-lg"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 p-1 rounded-full text-zinc-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Quick Actor & Theme Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-purple-400" />
          Hot:
        </span>
        {quickFilters.map((keyword) => (
          <button
            key={keyword}
            onClick={() => setSearchQuery(keyword)}
            className={`shrink-0 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
              searchQuery.toLowerCase() === keyword.toLowerCase()
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-zinc-900/90 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
            }`}
          >
            {keyword}
          </button>
        ))}
      </div>

      {/* Category and Sort Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-t border-zinc-800/80">
        {/* Category horizontal pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none flex-1">
          <button
            onClick={() => setSelectedCategory('All')}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
              selectedCategory === 'All'
                ? 'bg-purple-600 text-white'
                : 'bg-zinc-900 text-zinc-400 border border-zinc-800'
            }`}
          >
            All
          </button>
          {PROMPT_CATEGORIES.map((cat) => (
            <button
              key={cat.name}
              onClick={() => setSelectedCategory(cat.name)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                selectedCategory === cat.name
                  ? 'bg-purple-600 text-white'
                  : 'bg-zinc-900 text-zinc-400 border border-zinc-800'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Sort Dropdown */}
        <div className="flex items-center gap-2 shrink-0">
          <ArrowUpDown className="w-3.5 h-3.5 text-zinc-400" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="bg-[#141524] border border-zinc-800 text-xs text-zinc-300 rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-purple-500"
          >
            <option value="trending">🔥 Trending</option>
            <option value="newest">✨ Newest</option>
            <option value="most_used">⚡ Most Used</option>
            <option value="top_rated">★ Top Rated</option>
            <option value="most_liked">❤️ Most Liked</option>
          </select>
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs text-zinc-400 font-medium">
        <span>
          Showing {filteredPrompts.length} prompt
          {filteredPrompts.length === 1 ? '' : 's'}
        </span>
        {(searchQuery || selectedCategory !== 'All') && (
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('All');
            }}
            className="text-purple-400 hover:text-purple-300 font-bold"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Results Grid */}
      {filteredPrompts.length === 0 ? (
        <div className="py-16 text-center bg-zinc-900/30 rounded-3xl border border-zinc-800/80 px-6 space-y-3">
          <div className="w-12 h-12 rounded-full bg-zinc-800/80 flex items-center justify-center mx-auto text-zinc-400">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white font-['Outfit']">
            No matching prompts found
          </h3>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto">
            We couldn't find any prompts matching "{searchQuery}". Try searching for
            Tamil actors like <strong className="text-zinc-200">Suriya</strong>,{' '}
            <strong className="text-zinc-200">Sai Pallavi</strong>, or keywords like{' '}
            <strong className="text-zinc-200">Cinematic</strong>.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3.5 sm:gap-4">
          {filteredPrompts.map((item) => (
            <PromptCard
              key={item.id}
              prompt={item}
              onSelect={onSelectPrompt}
              onOpenGpt={onOpenGpt}
              onOpenShare={onOpenShare}
            />
          ))}
        </div>
      )}
    </div>
  );
};
