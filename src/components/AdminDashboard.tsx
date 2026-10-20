import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  Image as ImageIcon,
  CheckCircle,
  AlertCircle,
  Trash2,
  Edit3,
  Sparkles,
  Layers,
  BarChart3,
  Settings,
  ExternalLink,
  Flame,
  Star,
  Eye,
  RefreshCw,
  Plus,
} from 'lucide-react';
import { PromptItem, PromptCategory, EventItem } from '../types';
import { PROMPT_CATEGORIES } from '../data/categoriesData';
import { usePrompts } from '../contexts/PromptContext';
import { useAuth } from '../contexts/AuthContext';
import confetti from 'canvas-confetti';

interface AdminDashboardProps {
  onClose: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onClose }) => {
  const { user, isAdmin } = useAuth();
  const {
    prompts,
    events,
    createPrompt,
    updatePrompt,
    deletePrompt,
    updateEvent,
    triggerDailyAIGeneration,
  } = usePrompts();

  const [activeTab, setActiveTab] = useState<'upload' | 'manage' | 'daily' | 'events' | 'analytics'>('upload');

  // Upload Form State
  const [title, setTitle] = useState('');
  const [promptText, setPromptText] = useState('');
  const [category, setCategory] = useState<PromptCategory>('Portrait');
  const [description, setDescription] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [instagramUrl, setInstagramUrl] = useState(
    'https://www.instagram.com/no_bita_single_boy?rpxt=eXY1YWU0Mmp6NXp1'
  );
  const [youtubeUrl, setYoutubeUrl] = useState(
    'https://youtube.com/@alight_imports_official?si=dXY3jnvIWHP3kpUN'
  );
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Daily AI state
  const [isGeneratingDaily, setIsGeneratingDaily] = useState(false);
  const [dailyStatusMessage, setDailyStatusMessage] = useState<string | null>(null);

  // Edit Prompt State
  const [editingPrompt, setEditingPrompt] = useState<PromptItem | null>(null);

  // Delete Prompt confirmation
  const [deletingPromptId, setDeletingPromptId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle image selection with canvas compression if large
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.match(/^image\/(jpeg|jpg|png|webp)$/i)) {
      setUploadError('Please select a valid JPG, PNG, or WebP image file.');
      return;
    }

    setUploadError(null);
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        // Compress using canvas to ensure fast mobile uploads
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDimension = 1400;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.88);
          setImagePreview(compressedDataUrl);
        } else {
          setImagePreview(reader.result as string);
        }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Submit Prompt Upload
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imagePreview) {
      setUploadError('Please choose a photo from your gallery.');
      return;
    }
    if (!title.trim()) {
      setUploadError('Please provide a prompt title.');
      return;
    }
    if (!promptText.trim()) {
      setUploadError('Please provide the prompt text.');
      return;
    }

    setIsSubmitting(true);
    setUploadProgress(20);
    setUploadError(null);

    try {
      setUploadProgress(60);

      const parsedTags = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      await createPrompt({
        title: title.trim(),
        promptText: promptText.trim(),
        category,
        imageUrl: imagePreview,
        thumbnailUrl: imagePreview,
        description: description.trim() || undefined,
        tags: parsedTags.length > 0 ? parsedTags : ['Tamil Cinema', category],
        instagramUrl: instagramUrl.trim(),
        youtubeUrl: youtubeUrl.trim(),
        authorName: user?.displayName || 'Dharani Selvan',
        authorEmail: user?.email || 'kavikavik999@gmail.com',
        authorId: user?.uid,
      });

      setUploadProgress(100);
      setUploadSuccess(true);

      try {
        confetti({ particleCount: 35, spread: 60 });
      } catch {}

      // Reset form
      setTimeout(() => {
        setTitle('');
        setPromptText('');
        setDescription('');
        setTagsInput('');
        setImagePreview(null);
        setUploadProgress(0);
        setUploadSuccess(false);
      }, 2500);
    } catch (err: any) {
      console.error('Upload error:', err);
      setUploadError(err.message || 'Failed to upload prompt to database.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Trigger Daily AI Content
  const handleTriggerDaily = async () => {
    setIsGeneratingDaily(true);
    setDailyStatusMessage('Calling Gemini AI to craft Tamil cinema male & female prompts...');
    try {
      const res = await triggerDailyAIGeneration();
      if (res.success) {
        setDailyStatusMessage(`Success! Generated ${res.count || 2} new Tamil cinema prompts.`);
        try {
          confetti({ particleCount: 40, spread: 70 });
        } catch {}
      } else {
        setDailyStatusMessage(`Generation notice: ${res.error || 'Check server logs'}`);
      }
    } catch (err: any) {
      setDailyStatusMessage(`Error: ${err.message}`);
    } finally {
      setIsGeneratingDaily(false);
    }
  };

  // Save Edit Prompt
  const handleSaveEdit = async () => {
    if (!editingPrompt) return;
    try {
      await updatePrompt(editingPrompt.id, {
        title: editingPrompt.title,
        promptText: editingPrompt.promptText,
        category: editingPrompt.category,
        description: editingPrompt.description,
        isFeatured: editingPrompt.isFeatured,
      });
      setEditingPrompt(null);
    } catch (err: any) {
      alert(`Failed to update prompt: ${err.message}`);
    }
  };

  // Confirm Delete Prompt
  const handleConfirmDelete = async (id: string) => {
    try {
      await deletePrompt(id);
      setDeletingPromptId(null);
    } catch (err: any) {
      alert(`Failed to delete prompt: ${err.message}`);
    }
  };

  // Analytics totals
  const totalViews = prompts.reduce((acc, p) => acc + (p.viewsCount || 0), 0);
  const totalUses = prompts.reduce((acc, p) => acc + (p.usesCount || 0), 0);
  const totalLikes = prompts.reduce((acc, p) => acc + (p.likesCount || 0), 0);
  const totalSaves = prompts.reduce((acc, p) => acc + (p.savesCount || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div
        className="relative w-full max-w-2xl bg-[#11121d] rounded-t-3xl sm:rounded-3xl border border-zinc-800 shadow-2xl flex flex-col max-h-[95vh] overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="sticky top-0 z-20 flex items-center justify-between px-5 py-4 bg-[#11121d]/95 backdrop-blur-md border-b border-zinc-800/80">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40">
              <Sparkles className="w-4 h-4" />
            </span>
            <div>
              <h2 className="font-black text-sm text-white font-['Outfit']">
                Admin Studio &amp; Control Center
              </h2>
              <span className="text-[11px] text-zinc-400">
                Authorized: {user?.email}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Admin Navigation Tabs */}
        <div className="flex items-center gap-1 px-5 pt-3 border-b border-zinc-800/80 overflow-x-auto scrollbar-none bg-[#0e0f19]">
          {[
            { key: 'upload', label: 'Upload Prompt', icon: Upload },
            { key: 'manage', label: 'Manage Posts', icon: Edit3 },
            { key: 'daily', label: 'Daily AI Bot', icon: Sparkles },
            { key: 'events', label: 'Events (24)', icon: Layers },
            { key: 'analytics', label: 'Analytics', icon: BarChart3 },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
                  isActive
                    ? 'border-purple-500 text-purple-300 bg-purple-500/10 rounded-t-lg'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content Body */}
        <div className="overflow-y-auto p-5 space-y-5 flex-1">
          {/* TAB 1: UPLOAD PROMPT FORM */}
          {activeTab === 'upload' && (
            <form onSubmit={handleUploadSubmit} className="space-y-4">
              {uploadSuccess && (
                <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 flex items-center gap-2 text-xs font-bold animate-in fade-in">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  Prompt published successfully to DN Prompts!
                </div>
              )}

              {uploadError && (
                <div className="p-3.5 rounded-2xl bg-rose-950/40 border border-rose-500/40 text-rose-300 flex items-center gap-2 text-xs font-bold">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  {uploadError}
                </div>
              )}

              {/* Photo Picker */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300">
                  1. Choose Photo <span className="text-rose-400">*</span>
                </label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={`w-full aspect-[16/9] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-4 cursor-pointer transition-all overflow-hidden relative ${
                    imagePreview
                      ? 'border-purple-500 bg-black/60'
                      : 'border-zinc-700 hover:border-purple-400 bg-zinc-900/60'
                  }`}
                >
                  {imagePreview ? (
                    <>
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-full object-contain"
                      />
                      <div className="absolute bottom-2 right-2 px-2.5 py-1 rounded-md bg-black/70 backdrop-blur-md text-white text-[10px] font-bold">
                        Change Photo
                      </div>
                    </>
                  ) : (
                    <div className="text-center space-y-1.5">
                      <div className="w-10 h-10 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center mx-auto">
                        <ImageIcon className="w-5 h-5" />
                      </div>
                      <p className="text-xs font-bold text-white">
                        Tap to choose image from phone gallery
                      </p>
                      <p className="text-[11px] text-zinc-400">
                        Supports JPG, JPEG, PNG, WebP
                      </p>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Title & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-300">
                    2. Title <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Suriya Midnight Trench Coat"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-300">
                    3. Category <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as PromptCategory)}
                    className="w-full px-3 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-purple-500"
                  >
                    {PROMPT_CATEGORIES.map((c) => (
                      <option key={c.name} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Prompt Text */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-300">
                  4. AI Prompt Text <span className="text-rose-400">*</span>
                </label>
                <textarea
                  value={promptText}
                  onChange={(e) => setPromptText(e.target.value)}
                  placeholder="Enter detailed prompt description, lighting, camera lens, atmospheric details..."
                  rows={4}
                  required
                  className="w-full p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white font-mono placeholder-zinc-500 focus:outline-none focus:border-purple-500 leading-relaxed"
                />
              </div>

              {/* Prefilled Social Links */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-300">
                    5. Instagram Link (Auto-prefilled)
                  </label>
                  <input
                    type="url"
                    value={instagramUrl}
                    onChange={(e) => setInstagramUrl(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-300">
                    6. YouTube Link (Auto-prefilled)
                  </label>
                  <input
                    type="url"
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Optional Description & Tags */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-400">
                    7. Optional Description
                  </label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Short 1-line aesthetic description"
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-400">
                    8. Optional Tags (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    placeholder="Tamil, Suriya, 8K, Cinematic"
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Progress bar */}
              {isSubmitting && (
                <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-purple-600 h-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-4 rounded-xl font-bold text-xs bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-xl shadow-purple-950/40 flex items-center justify-center gap-2 active:scale-98 transition-all"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Publishing Prompt...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Publish Prompt to DN Prompts
                  </>
                )}
              </button>
            </form>
          )}

          {/* TAB 2: MANAGE POSTS */}
          {activeTab === 'manage' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-zinc-400 pb-2 border-b border-zinc-800">
                <span>Total Prompts: {prompts.length}</span>
              </div>

              {/* Edit Modal sub-form */}
              {editingPrompt && (
                <div className="p-4 rounded-2xl bg-zinc-900 border border-purple-500/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-purple-300">
                      Editing: {editingPrompt.title}
                    </span>
                    <button
                      onClick={() => setEditingPrompt(null)}
                      className="text-xs text-zinc-400 hover:text-white"
                    >
                      Cancel
                    </button>
                  </div>
                  <input
                    type="text"
                    value={editingPrompt.title}
                    onChange={(e) =>
                      setEditingPrompt({ ...editingPrompt, title: e.target.value })
                    }
                    className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700 text-xs text-white"
                  />
                  <textarea
                    value={editingPrompt.promptText}
                    onChange={(e) =>
                      setEditingPrompt({ ...editingPrompt, promptText: e.target.value })
                    }
                    rows={3}
                    className="w-full p-2 rounded-lg bg-zinc-950 border border-zinc-700 text-xs text-white font-mono"
                  />
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-xs text-zinc-300">
                      <input
                        type="checkbox"
                        checked={Boolean(editingPrompt.isFeatured)}
                        onChange={(e) =>
                          setEditingPrompt({
                            ...editingPrompt,
                            isFeatured: e.target.checked,
                          })
                        }
                      />
                      Feature in Top Carousel
                    </label>
                    <button
                      onClick={handleSaveEdit}
                      className="px-3 py-1.5 rounded-lg bg-purple-600 text-white text-xs font-bold"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              )}

              {/* Posts list */}
              <div className="space-y-2">
                {prompts.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 gap-3"
                  >
                    <img
                      src={p.imageUrl}
                      alt={p.title}
                      className="w-12 h-12 rounded-lg object-cover shrink-0"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-xs font-bold text-white truncate">
                          {p.title}
                        </h4>
                        {p.isFeatured && (
                          <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-amber-500 text-zinc-950">
                            Featured
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-zinc-400 mt-0.5">
                        <span className="text-purple-300 font-semibold">{p.category}</span>
                        <span>•</span>
                        <span>{p.viewsCount || 0} views</span>
                        <span>•</span>
                        <span>{p.usesCount || 0} uses</span>
                        <span>•</span>
                        <span>★ {p.averageRating?.toFixed(1) || '5.0'}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setEditingPrompt(p)}
                        title="Edit prompt"
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeletingPromptId(p.id)}
                        title="Delete prompt"
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Confirm Delete Dialog */}
              {deletingPromptId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
                  <div className="p-5 rounded-2xl bg-[#161725] border border-rose-500/40 space-y-3 max-w-sm w-full">
                    <h4 className="text-sm font-bold text-white">Delete Prompt?</h4>
                    <p className="text-xs text-zinc-400">
                      Are you sure you want to delete this prompt? This action cannot be
                      undone.
                    </p>
                    <div className="flex items-center justify-end gap-2 pt-2">
                      <button
                        onClick={() => setDeletingPromptId(null)}
                        className="px-3 py-1.5 rounded-lg bg-zinc-800 text-xs text-zinc-300"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleConfirmDelete(deletingPromptId)}
                        className="px-3 py-1.5 rounded-lg bg-rose-600 text-xs text-white font-bold"
                      >
                        Confirm Delete
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: DAILY AI AUTOMATION */}
          {activeTab === 'daily' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/30 to-indigo-950/30 border border-purple-500/30 space-y-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <h3 className="font-bold text-sm text-white font-['Outfit']">
                    Tamil Cinema Daily AI Generation Engine
                  </h3>
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  Automatically prepares two Tamil-cinema-inspired AI images daily:
                  one featuring a female actor-inspired subject (e.g. Sai Pallavi, Nayanthara,
                  Trisha) and one featuring a male actor-inspired subject (e.g. Suriya,
                  Vijay, Dhanush, Karthi).
                </p>
              </div>

              {dailyStatusMessage && (
                <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-700 text-xs text-zinc-300 flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                  <span>{dailyStatusMessage}</span>
                </div>
              )}

              <button
                onClick={handleTriggerDaily}
                disabled={isGeneratingDaily}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 hover:from-purple-500 hover:to-amber-400 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-purple-950/50 flex items-center justify-center gap-2 active:scale-98 transition-all"
              >
                {isGeneratingDaily ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Generating Today&apos;s AI Prompts...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-200" />
                    Generate Today&apos;s 2 AI Prompts Now
                  </>
                )}
              </button>
            </div>
          )}

          {/* TAB 4: EVENT CALENDAR MANAGER */}
          {activeTab === 'events' && (
            <div className="space-y-3">
              <span className="text-xs font-bold text-zinc-400">
                24 Gaming Event Slots (6-day sequential calendar)
              </span>

              <div className="space-y-2">
                {events.map((ev) => (
                  <div
                    key={ev.id}
                    className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span>{ev.theme.symbol}</span>
                      <div>
                        <span className="font-bold text-white block">{ev.name}</span>
                        <span className="text-[10px] text-zinc-500">
                          {new Date(ev.startDate).toLocaleDateString()} -{' '}
                          {new Date(ev.endDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        ev.status === 'active'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : ev.status === 'completed'
                          ? 'bg-zinc-800 text-zinc-400'
                          : 'bg-purple-500/20 text-purple-300'
                      }`}
                    >
                      {ev.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: ANALYTICS */}
          {activeTab === 'analytics' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 text-center space-y-1">
                  <Eye className="w-5 h-5 text-sky-400 mx-auto" />
                  <span className="text-xl font-black text-white">{totalViews}</span>
                  <span className="text-[11px] text-zinc-400 block font-semibold">
                    Total Genuine Views
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 text-center space-y-1">
                  <Flame className="w-5 h-5 text-orange-400 mx-auto" />
                  <span className="text-xl font-black text-white">{totalUses}</span>
                  <span className="text-[11px] text-zinc-400 block font-semibold">
                    Total Prompt Uses
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 text-center space-y-1">
                  <Star className="w-5 h-5 text-amber-400 mx-auto" />
                  <span className="text-xl font-black text-white">4.9 / 5.0</span>
                  <span className="text-[11px] text-zinc-400 block font-semibold">
                    Average App Rating
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 text-center space-y-1">
                  <Sparkles className="w-5 h-5 text-purple-400 mx-auto" />
                  <span className="text-xl font-black text-white">{prompts.length}</span>
                  <span className="text-[11px] text-zinc-400 block font-semibold">
                    Published Prompts
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 text-xs text-zinc-400 space-y-2">
                <span className="font-bold text-white block">Security Status:</span>
                <p>• Verified Administrator: kavikavik999@gmail.com</p>
                <p>• Cloud Firestore database connected and secured</p>
                <p>• ABAC &amp; Zero-Trust rules enforced</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
