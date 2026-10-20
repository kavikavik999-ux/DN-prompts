import React from 'react';
import { X, Bell, Check, Sparkles, Swords, Calendar } from 'lucide-react';
import { usePrompts } from '../contexts/PromptContext';
import { TabKey } from './BottomNav';

interface NotificationModalProps {
  onClose: () => void;
  onNavigateTab: (tab: TabKey) => void;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({
  onClose,
  onNavigateTab,
}) => {
  const { notifications, markNotificationRead, clearNotifications } = usePrompts();

  const handleNotificationClick = (item: any) => {
    markNotificationRead(item.id);
    if (item.linkTab) {
      onNavigateTab(item.linkTab);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div
        className="relative w-full max-w-md bg-[#121320] rounded-2xl border border-zinc-800 p-5 shadow-2xl flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-purple-400" />
            <h3 className="font-bold text-sm text-white font-['Outfit']">
              Notifications &amp; Drops
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={clearNotifications}
              className="text-[11px] font-semibold text-purple-400 hover:text-purple-300"
            >
              Mark all read
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-full text-zinc-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="space-y-2.5 max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <p className="text-xs text-zinc-500 text-center py-6">
              No notifications at the moment
            </p>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => handleNotificationClick(n)}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                  n.read
                    ? 'bg-zinc-900/60 border-zinc-800/80 text-zinc-400'
                    : 'bg-purple-950/20 border-purple-500/40 text-zinc-200 shadow-sm'
                }`}
              >
                <div className="p-2 rounded-lg bg-zinc-800 shrink-0 text-purple-400">
                  {n.type === 'event' ? (
                    <Swords className="w-4 h-4" />
                  ) : n.type === 'daily' ? (
                    <Sparkles className="w-4 h-4 text-amber-400" />
                  ) : (
                    <Bell className="w-4 h-4" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <h4 className="text-xs font-bold text-white truncate">
                      {n.title}
                    </h4>
                    {!n.read && (
                      <span className="w-1.5 h-1.5 rounded-full bg-pink-500 shrink-0" />
                    )}
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">
                    {n.message}
                  </p>
                  <span className="text-[10px] text-zinc-500 block mt-1">
                    {new Date(n.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
