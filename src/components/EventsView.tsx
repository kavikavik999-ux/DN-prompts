import React, { useState, useEffect } from 'react';
import {
  Swords,
  Clock,
  Sparkles,
  Calendar,
  Flame,
  CheckCircle2,
  ChevronRight,
  Shield,
  Layers,
} from 'lucide-react';
import { EventItem, PromptItem } from '../types';
import { usePrompts } from '../contexts/PromptContext';
import { PromptCard } from './PromptCard';

interface EventsViewProps {
  onSelectPrompt: (prompt: PromptItem) => void;
  onOpenGpt: (prompt: PromptItem) => void;
  onOpenShare: (prompt: PromptItem) => void;
}

export const EventsView: React.FC<EventsViewProps> = ({
  onSelectPrompt,
  onOpenGpt,
  onOpenShare,
}) => {
  const { events, prompts } = usePrompts();
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'upcoming' | 'completed'>('all');
  const [currentTime, setCurrentTime] = useState<number>(Date.now());

  // Update clock every second for live countdown timers
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Compute countdown string
  const formatCountdown = (targetDateStr: string, isEnd = false) => {
    const targetMs = new Date(targetDateStr).getTime();
    const diff = targetMs - currentTime;

    if (diff <= 0) {
      return isEnd ? 'Event Concluded' : 'Event Active!';
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((diff % (1000 * 60)) / 1000);

    if (days > 0) {
      return `${days}d ${hours}h ${mins}m ${secs}s`;
    }
    return `${hours}h ${mins}m ${secs}s`;
  };

  // Filter events
  const filteredEvents = events.filter((ev) => {
    const startMs = new Date(ev.startDate).getTime();
    const endMs = new Date(ev.endDate).getTime();
    let currentStatus = ev.status;
    if (currentTime >= startMs && currentTime < endMs) {
      currentStatus = 'active';
    } else if (currentTime >= endMs) {
      currentStatus = 'completed';
    } else {
      currentStatus = 'upcoming';
    }

    if (filterStatus === 'all') return true;
    return currentStatus === filterStatus;
  });

  const selectedEvent = events.find((ev) => ev.id === selectedEventId) || events[0];

  // Prompts for selected event
  const eventPrompts = prompts.filter((p) => {
    if (!selectedEvent) return false;
    if (p.eventId === selectedEvent.id) return true;
    // Or if prompt tags or title match event name
    const evName = selectedEvent.name.toLowerCase();
    return (
      p.tags?.some((t) => t.toLowerCase().includes(evName)) ||
      p.title.toLowerCase().includes(evName)
    );
  });

  return (
    <div className="pb-28 max-w-2xl mx-auto space-y-6 px-4 pt-4">
      {/* Gaming Event Header Banner */}
      <div className="relative rounded-3xl overflow-hidden p-6 bg-gradient-to-r from-purple-950 via-zinc-900 to-indigo-950 border border-purple-500/30 shadow-2xl shadow-purple-950/40">
        <div className="relative z-10 space-y-2">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/40">
              <Swords className="w-4 h-4" />
            </span>
            <span className="text-xs font-black uppercase tracking-widest text-purple-300">
              DN Battlepass &amp; Events
            </span>
          </div>

          <h2 className="text-2xl font-black text-white font-['Outfit'] tracking-tight">
            24 Legendary Event Slots
          </h2>

          <p className="text-xs text-zinc-300 max-w-md leading-relaxed">
            Sequential 6-day events lasting 144 days. Unlock exclusive theme visual effects,
            prompts, and cinematic styles.
          </p>

          <div className="flex items-center gap-3 pt-2 text-xs text-zinc-400 font-semibold">
            <span className="flex items-center gap-1 text-amber-300">
              <Clock className="w-3.5 h-3.5" />
              6 Days / Event
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 text-emerald-300">
              <Layers className="w-3.5 h-3.5" />
              144 Days Total Cycle
            </span>
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-52 h-52 rounded-full bg-purple-600/20 blur-3xl pointer-events-none" />
      </div>

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {(['all', 'active', 'upcoming', 'completed'] as const).map((st) => (
          <button
            key={st}
            onClick={() => setFilterStatus(st)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold capitalize transition-all ${
              filterStatus === st
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-zinc-900 text-zinc-400 border border-zinc-800'
            }`}
          >
            {st === 'all' ? 'All 24 Events' : st}
          </button>
        ))}
      </div>

      {/* Events List Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {filteredEvents.map((ev) => {
          const startMs = new Date(ev.startDate).getTime();
          const endMs = new Date(ev.endDate).getTime();
          let currentStatus: 'active' | 'upcoming' | 'completed' = 'upcoming';
          let countdownLabel = '';

          if (currentTime >= startMs && currentTime < endMs) {
            currentStatus = 'active';
            countdownLabel = `Ends in: ${formatCountdown(ev.endDate, true)}`;
          } else if (currentTime >= endMs) {
            currentStatus = 'completed';
            countdownLabel = 'Event Completed';
          } else {
            currentStatus = 'upcoming';
            countdownLabel = `Starts in: ${formatCountdown(ev.startDate, false)}`;
          }

          const isSelected = selectedEventId === ev.id;
          const theme = ev.theme;

          return (
            <div
              key={ev.id}
              onClick={() => setSelectedEventId(ev.id)}
              style={{
                boxShadow: isSelected ? `0 0 25px ${theme.glow}` : undefined,
              }}
              className={`relative rounded-2xl p-4 transition-all duration-300 cursor-pointer overflow-hidden border ${
                isSelected
                  ? `${theme.border} bg-[#161726]`
                  : 'border-zinc-800/80 hover:border-zinc-700 bg-[#121320]'
              }`}
            >
              {/* Event aura background glow */}
              <div
                className={`absolute top-0 right-0 w-32 h-32 rounded-full opacity-20 blur-2xl pointer-events-none`}
                style={{ backgroundColor: theme.primary }}
              />

              <div className="relative z-10 flex flex-col justify-between h-full space-y-3">
                {/* Slot number & status badge */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black px-2 py-0.5 rounded-md bg-zinc-900 text-zinc-300 border border-zinc-800">
                      #{ev.eventNumber}
                    </span>
                    <span className="text-base">{theme.symbol}</span>
                  </div>

                  <span
                    className={`text-[10px] uppercase font-black tracking-wider px-2 py-0.5 rounded-full border ${
                      currentStatus === 'active'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 animate-pulse'
                        : currentStatus === 'completed'
                        ? 'bg-zinc-800 text-zinc-400 border-zinc-700'
                        : theme.badgeBg
                    }`}
                  >
                    {currentStatus}
                  </span>
                </div>

                {/* Event Name & Description */}
                <div>
                  <h3
                    className="text-base font-black tracking-tight font-['Outfit']"
                    style={{ color: isSelected ? theme.accent : '#ffffff' }}
                  >
                    {ev.name}
                  </h3>
                  <p className="text-xs text-zinc-400 line-clamp-2 mt-1 leading-relaxed">
                    {ev.description}
                  </p>
                </div>

                {/* Dates & Live Countdown */}
                <div className="pt-2 border-t border-zinc-800/80 space-y-1 text-[11px]">
                  <div className="flex items-center justify-between text-zinc-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-zinc-500" />
                      {new Date(ev.startDate).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                    <span className="font-mono font-bold" style={{ color: theme.accent }}>
                      {countdownLabel}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Event Prompts Collection */}
      {selectedEvent && (
        <section aria-label="Event Prompts" className="pt-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">{selectedEvent.theme.symbol}</span>
              <div>
                <h3 className="text-base font-black text-white font-['Outfit']">
                  {selectedEvent.name} Collection
                </h3>
                <span className="text-xs text-zinc-400">
                  Featured prompts for Event #{selectedEvent.eventNumber}
                </span>
              </div>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-zinc-800 text-zinc-300">
              {eventPrompts.length > 0 ? `${eventPrompts.length} items` : 'Coming soon'}
            </span>
          </div>

          {eventPrompts.length === 0 ? (
            <div className="p-8 text-center bg-zinc-900/40 rounded-2xl border border-zinc-800/80 space-y-2">
              <p className="text-sm font-semibold text-zinc-300">
                Exclusive {selectedEvent.name} prompts will drop when the event launches!
              </p>
              <p className="text-xs text-zinc-500">
                Stay tuned or browse other categories on the Home feed.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3.5">
              {eventPrompts.map((p) => (
                <PromptCard
                  key={p.id}
                  prompt={p}
                  onSelect={onSelectPrompt}
                  onOpenGpt={onOpenGpt}
                  onOpenShare={onOpenShare}
                />
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
};
