import React, { useState, useRef } from 'react';
import {
  User,
  LogOut,
  Camera,
  Heart,
  Bookmark,
  ShieldCheck,
  Sparkles,
  Settings,
  Edit2,
  Check,
  LogIn,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { usePrompts } from '../contexts/PromptContext';
import { PromptItem } from '../types';
import { PromptCard } from './PromptCard';

interface ProfileViewProps {
  onOpenAdmin: () => void;
  onSelectPrompt: (prompt: PromptItem) => void;
  onOpenGpt: (prompt: PromptItem) => void;
  onOpenShare: (prompt: PromptItem) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  onOpenAdmin,
  onSelectPrompt,
  onOpenGpt,
  onOpenShare,
}) => {
  const {
    user,
    loading,
    isAdmin,
    signInWithGoogle,
    signOut,
    updateUserPhoto,
    updateUserName,
    authError,
    clearAuthError,
  } = useAuth();
  const { prompts, userLikedIds, userSavedIds } = usePrompts();

  const [activeTab, setActiveTab] = useState<'liked' | 'saved'>('liked');
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState('');
  const [signingIn, setSigningIn] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Preset avatars
  const avatarPresets = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80',
    'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=300&q=80',
  ];

  // Liked & saved prompts
  const likedPrompts = prompts.filter((p) => userLikedIds.has(p.id));
  const savedPrompts = prompts.filter((p) => userSavedIds.has(p.id));

  const handleSignIn = async () => {
    setSigningIn(true);
    try {
      await signInWithGoogle();
    } catch {
      // Handled in context
    } finally {
      setSigningIn(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      if (typeof reader.result === 'string') {
        try {
          await updateUserPhoto(reader.result);
        } catch (err) {
          console.error('Update photo failed:', err);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveName = async () => {
    if (!newName.trim()) return;
    try {
      await updateUserName(newName.trim());
      setIsEditingName(false);
    } catch (err) {
      console.error('Update name failed:', err);
    }
  };

  // If user is not signed in, show Sign In screen
  if (!user && !loading) {
    return (
      <div className="pb-28 max-w-md mx-auto px-4 pt-10 text-center space-y-6">
        <div className="relative w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-amber-400 p-[2px] shadow-2xl shadow-purple-950/50">
          <div className="w-full h-full rounded-3xl bg-zinc-950 flex items-center justify-center">
            <User className="w-8 h-8 text-purple-400" />
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-black text-white font-['Outfit'] tracking-tight">
            Sign In to DN Prompts
          </h2>
          <p className="text-xs text-zinc-400 leading-relaxed max-w-xs mx-auto">
            Save your favorite Tamil cinema prompts, like inspirations, submit reviews,
            and sync across all your devices.
          </p>
        </div>

        {authError && (
          <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 flex items-center gap-2 text-xs text-rose-300 text-left">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <div className="flex-1">{authError}</div>
            <button onClick={clearAuthError} className="text-xs font-bold text-rose-400">
              ✕
            </button>
          </div>
        )}

        {/* Google Sign In Button */}
        <button
          onClick={handleSignIn}
          disabled={signingIn}
          className="w-full py-3.5 px-4 rounded-2xl bg-white hover:bg-zinc-100 text-zinc-950 font-bold text-sm flex items-center justify-center gap-3 shadow-xl shadow-black/40 active:scale-98 transition-all"
        >
          {signingIn ? (
            <div className="w-5 h-5 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
          )}
          Continue with Google
        </button>

        <p className="text-[11px] text-zinc-500">
          Powered by Firebase Authentication • Zero Spam
        </p>
      </div>
    );
  }

  return (
    <div className="pb-28 max-w-2xl mx-auto space-y-6 px-4 pt-4">
      {/* Profile Card */}
      <div className="relative rounded-3xl p-5 bg-[#121320] border border-zinc-800 shadow-xl overflow-hidden space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3.5">
            {/* Avatar with change button */}
            <div className="relative group">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-amber-400 p-[2px] shadow-lg">
                <div className="w-full h-full rounded-2xl bg-zinc-950 overflow-hidden flex items-center justify-center">
                  {user?.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'Profile'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-7 h-7 text-purple-400" />
                  )}
                </div>
              </div>

              {/* Upload icon trigger */}
              <button
                onClick={() => fileInputRef.current?.click()}
                title="Change profile picture"
                className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-purple-600 hover:bg-purple-500 text-white shadow-md active:scale-95 transition-all"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            {/* User Info */}
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                {isEditingName ? (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder={user?.displayName || 'Your Name'}
                      className="bg-zinc-900 border border-purple-500 rounded-lg px-2 py-0.5 text-sm text-white focus:outline-none"
                    />
                    <button
                      onClick={handleSaveName}
                      className="p-1 rounded bg-purple-600 text-white"
                    >
                      <Check className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <>
                    <h2 className="text-base font-extrabold text-white font-['Outfit']">
                      {user?.displayName || 'Creator'}
                    </h2>
                    <button
                      onClick={() => {
                        setNewName(user?.displayName || '');
                        setIsEditingName(true);
                      }}
                      className="text-zinc-500 hover:text-zinc-300 p-0.5"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                  </>
                )}
              </div>

              <p className="text-xs text-zinc-400">{user?.email}</p>

              {isAdmin ? (
                <div className="inline-flex items-center gap-1 mt-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  <ShieldCheck className="w-3 h-3 text-amber-400" />
                  Authorized Administrator
                </div>
              ) : (
                <span className="inline-block text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">
                  Member
                </span>
              )}
            </div>
          </div>

          {/* Sign out */}
          <button
            onClick={signOut}
            title="Sign out"
            className="p-2 rounded-xl text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 border border-zinc-800 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        {/* Preset avatar selector */}
        <div className="pt-2 border-t border-zinc-800/80">
          <span className="text-[11px] font-semibold text-zinc-400 block mb-2">
            Quick Avatar Presets:
          </span>
          <div className="flex items-center gap-2">
            {avatarPresets.map((preset, i) => (
              <img
                key={i}
                src={preset}
                alt={`Preset ${i}`}
                onClick={() => updateUserPhoto(preset)}
                className="w-8 h-8 rounded-full object-cover cursor-pointer hover:ring-2 hover:ring-purple-500 transition-all active:scale-90"
              />
            ))}
          </div>
        </div>

        {/* Admin Dashboard Entry Button (VISIBLE ONLY TO AUTHORIZED ADMIN) */}
        {isAdmin && (
          <div className="pt-2 border-t border-zinc-800/80">
            <button
              onClick={onOpenAdmin}
              className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-purple-600 hover:from-amber-400 hover:to-purple-500 text-zinc-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-950/40 flex items-center justify-center gap-2 active:scale-98 transition-all"
            >
              <Sparkles className="w-4 h-4 text-zinc-950 fill-current" />
              Open Admin Dashboard
              <Settings className="w-4 h-4 text-zinc-950 ml-auto" />
            </button>
          </div>
        )}
      </div>

      {/* Profile Prompts Tabs: Liked vs Saved */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-zinc-800 pb-2">
          <button
            onClick={() => setActiveTab('liked')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'liked'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Heart className="w-3.5 h-3.5 fill-current" />
            Liked Prompts ({likedPrompts.length})
          </button>

          <button
            onClick={() => setActiveTab('saved')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'saved'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5 fill-current" />
            Saved Prompts ({savedPrompts.length})
          </button>
        </div>

        {/* Tab content */}
        {activeTab === 'liked' ? (
          likedPrompts.length === 0 ? (
            <div className="p-8 text-center bg-zinc-900/40 rounded-2xl border border-zinc-800 space-y-2">
              <Heart className="w-8 h-8 text-zinc-600 mx-auto" />
              <p className="text-xs font-bold text-zinc-300">No liked prompts yet</p>
              <p className="text-[11px] text-zinc-500">
                Tap the heart on any prompt in the Home feed to like it.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3.5">
              {likedPrompts.map((p) => (
                <PromptCard
                  key={p.id}
                  prompt={p}
                  onSelect={onSelectPrompt}
                  onOpenGpt={onOpenGpt}
                  onOpenShare={onOpenShare}
                />
              ))}
            </div>
          )
        ) : savedPrompts.length === 0 ? (
          <div className="p-8 text-center bg-zinc-900/40 rounded-2xl border border-zinc-800 space-y-2">
            <Bookmark className="w-8 h-8 text-zinc-600 mx-auto" />
            <p className="text-xs font-bold text-zinc-300">No saved bookmarks yet</p>
            <p className="text-[11px] text-zinc-500">
              Bookmark prompts to easily find and copy them anytime.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3.5">
            {savedPrompts.map((p) => (
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
      </div>
    </div>
  );
};
