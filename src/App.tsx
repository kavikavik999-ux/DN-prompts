import React, { useState } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { PromptProvider } from './contexts/PromptContext';
import { Header } from './components/Header';
import { BottomNav, TabKey } from './components/BottomNav';
import { HomeFeed } from './components/HomeFeed';
import { SearchView } from './components/SearchView';
import { EventsView } from './components/EventsView';
import { ProfileView } from './components/ProfileView';
import { PromptDetailModal } from './components/PromptDetailModal';
import { OpenGptModal } from './components/OpenGptModal';
import { ShareModal } from './components/ShareModal';
import { AdminDashboard } from './components/AdminDashboard';
import { NotificationModal } from './components/NotificationModal';
import { PromptItem, PromptCategory } from './types';

function MainApp() {
  const [activeTab, setActiveTab] = useState<TabKey>('home');
  const [selectedPrompt, setSelectedPrompt] = useState<PromptItem | null>(null);
  const [gptPrompt, setGptPrompt] = useState<PromptItem | null>(null);
  const [sharePrompt, setSharePrompt] = useState<PromptItem | null>(null);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchCategory, setSearchCategory] = useState<PromptCategory | null>(null);

  const handleNavigateToSearchWithCategory = (category: PromptCategory) => {
    setSearchCategory(category);
    setActiveTab('search');
  };

  return (
    <div className="min-h-screen bg-[#0b0c14] text-zinc-100 flex flex-col font-['Plus_Jakarta_Sans'] selection:bg-purple-600 selection:text-white">
      {/* Top Mobile Status Header */}
      <Header
        onOpenNotifications={() => setShowNotifications(true)}
        onOpenProfile={() => setActiveTab('profile')}
      />

      {/* Main Content Pages */}
      <main className="flex-1 w-full max-w-2xl mx-auto overflow-x-hidden">
        {activeTab === 'home' && (
          <HomeFeed
            onSelectPrompt={setSelectedPrompt}
            onOpenGpt={setGptPrompt}
            onOpenShare={setSharePrompt}
            onNavigateToSearchWithCategory={handleNavigateToSearchWithCategory}
          />
        )}

        {activeTab === 'search' && (
          <SearchView
            initialCategory={searchCategory}
            onSelectPrompt={setSelectedPrompt}
            onOpenGpt={setGptPrompt}
            onOpenShare={setSharePrompt}
          />
        )}

        {activeTab === 'events' && (
          <EventsView
            onSelectPrompt={setSelectedPrompt}
            onOpenGpt={setGptPrompt}
            onOpenShare={setSharePrompt}
          />
        )}

        {activeTab === 'profile' && (
          <ProfileView
            onOpenAdmin={() => setShowAdmin(true)}
            onSelectPrompt={setSelectedPrompt}
            onOpenGpt={setGptPrompt}
            onOpenShare={setSharePrompt}
          />
        )}
      </main>

      {/* Floating Bottom Navigation */}
      <BottomNav activeTab={activeTab} onChangeTab={setActiveTab} />

      {/* Prompt Details Sheet / Modal */}
      {selectedPrompt && (
        <PromptDetailModal
          prompt={selectedPrompt}
          onClose={() => setSelectedPrompt(null)}
          onSelectRelated={(p) => setSelectedPrompt(p)}
          onOpenGpt={(p) => setGptPrompt(p)}
        />
      )}

      {/* Open GPT Guidance Modal */}
      {gptPrompt && (
        <OpenGptModal
          prompt={gptPrompt}
          onClose={() => setGptPrompt(null)}
        />
      )}

      {/* Share Modal */}
      {sharePrompt && (
        <ShareModal
          prompt={sharePrompt}
          onClose={() => setSharePrompt(null)}
        />
      )}

      {/* Admin Dashboard */}
      {showAdmin && (
        <AdminDashboard onClose={() => setShowAdmin(false)} />
      )}

      {/* Notifications Drawer */}
      {showNotifications && (
        <NotificationModal
          onClose={() => setShowNotifications(false)}
          onNavigateTab={(tab) => setActiveTab(tab)}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <PromptProvider>
        <MainApp />
      </PromptProvider>
    </AuthProvider>
  );
}
