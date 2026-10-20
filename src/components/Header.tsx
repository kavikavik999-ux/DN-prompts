import React from 'react';
import { Bell, RefreshCw, Sparkles, ShieldCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { usePrompts } from '../contexts/PromptContext';

interface HeaderProps {
  onOpenNotifications: () => void;
  onOpenProfile: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenNotifications,
  onOpenProfile,
}) => {
  const { user, isAdmin } = useAuth();
  const { refreshing, refreshData, unreadNotificationCount } = usePrompts();

  return (
    <header className="sticky top-0 z-40 bg-[#0d0e17]/95 backdrop-blur-md border-b border-zinc-800/80 px-4 py-3 transition-all duration-200">
      <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
        {/* Brand identity: Circular logo + App Name + Subtitle */}
        <div
          onClick={onOpenProfile}
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-600 via-indigo-500 to-amber-400 p-[2px] shadow-lg shadow-purple-950/40 group-hover:scale-105 transition-transform">
              <div className="w-full h-full rounded-full bg-zinc-950 flex items-center justify-center overflow-hidden">
                {user?.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'DN'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center text-xs font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-br from-purple-300 via-pink-200 to-amber-300">
                    DN
                  </div>
                )}
              </div>
            </div>
            {isAdmin && (
              <span
                title="Authorized Administrator"
                className="absolute -bottom-1 -right-1 bg-amber-500 text-zinc-950 p-0.5 rounded-full ring-2 ring-zinc-950"
              >
                <ShieldCheck className="w-3 h-3 stroke-[2.5]" />
              </span>
            )}
          </div>

          <div className="flex flex-col text-left">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base tracking-wide bg-gradient-to-r from-white via-zinc-100 to-zinc-300 bg-clip-text text-transparent font-['Outfit']">
                DN PROMPT
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30">
                PRO
              </span>
            </div>
            <span className="text-[11px] font-medium text-zinc-400 tracking-tight">
              Dharani Selvan
            </span>
          </div>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1.5">
          {/* Refresh button */}
          <button
            onClick={refreshData}
            disabled={refreshing}
            title="Refresh latest prompts"
            className="p-2 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800/80 active:scale-95 transition-all"
            aria-label="Refresh prompts"
          >
            <RefreshCw
              className={`w-4 h-4 ${refreshing ? 'animate-spin text-purple-400' : ''}`}
            />
          </button>

          {/* Notifications bell */}
          <button
            onClick={onOpenNotifications}
            title="Notifications"
            className="relative p-2 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800/80 active:scale-95 transition-all"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadNotificationCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-pink-500 ring-2 ring-[#0d0e17] animate-pulse" />
            )}
          </button>

          {/* Admin badge / Quick trigger */}
          {isAdmin ? (
            <div className="hidden sm:flex items-center gap-1 text-[11px] font-semibold text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-full px-2.5 py-1">
              <Sparkles className="w-3 h-3 text-amber-400" />
              Admin
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
};
