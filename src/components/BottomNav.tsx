import React from 'react';
import { Home, Compass, Swords, User } from 'lucide-react';

export type TabKey = 'home' | 'search' | 'events' | 'profile';

interface BottomNavProps {
  activeTab: TabKey;
  onChangeTab: (tab: TabKey) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onChangeTab }) => {
  const handleTabClick = (tab: TabKey) => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(12);
      } catch {
        // Ignore vibration errors if unsupported
      }
    }
    onChangeTab(tab);
  };

  const navItems = [
    {
      key: 'home' as TabKey,
      label: 'Home',
      icon: Home,
    },
    {
      key: 'search' as TabKey,
      label: 'Search',
      icon: Compass,
      badge: 'NEW',
    },
    {
      key: 'events' as TabKey,
      label: 'Events',
      icon: Swords,
      badge: '24',
    },
    {
      key: 'profile' as TabKey,
      label: 'Profile',
      icon: User,
    },
  ];

  return (
    <div className="fixed bottom-4 inset-x-0 z-40 flex justify-center pointer-events-none px-4">
      <nav
        aria-label="Bottom navigation"
        className="pointer-events-auto bg-[#151624]/95 backdrop-blur-2xl border border-zinc-800/90 rounded-full px-3 py-2 shadow-2xl shadow-black/80 flex items-center gap-1 sm:gap-3"
      >
        {navItems.map((item) => {
          const isActive = activeTab === item.key;
          const Icon = item.icon;

          return (
            <button
              key={item.key}
              onClick={() => handleTabClick(item.key)}
              className={`relative flex items-center justify-center transition-all duration-300 rounded-full ${
                isActive
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/30 px-4 py-2'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 p-2.5'
              }`}
            >
              <div className="flex items-center gap-2">
                <Icon
                  className={`w-5 h-5 transition-transform duration-200 ${
                    isActive ? 'scale-110' : 'hover:scale-105'
                  }`}
                />
                {isActive && (
                  <span className="text-xs font-bold tracking-wide font-['Outfit'] pr-0.5">
                    {item.label}
                  </span>
                )}
              </div>

              {/* Tag or badge */}
              {!isActive && item.badge && (
                <span className="absolute -top-1 -right-1 text-[9px] font-black tracking-tight px-1 py-0.2 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 text-white border border-zinc-950 scale-90">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
};
