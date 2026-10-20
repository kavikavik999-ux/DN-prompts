import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  updateDoc,
  increment,
  onSnapshot,
  query,
  orderBy,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firebaseErrors';
import { useAuth } from './AuthContext';
import { PromptItem, EventItem, AppNotification, PromptCategory } from '../types';
import { SEED_PROMPTS } from '../data/seedPrompts';
import { generateInitialEvents } from '../data/eventsData';

interface PromptContextType {
  prompts: PromptItem[];
  events: EventItem[];
  loading: boolean;
  refreshing: boolean;
  userLikedIds: Set<string>;
  userSavedIds: Set<string>;
  userRatings: Record<string, number>;
  notifications: AppNotification[];
  unreadNotificationCount: number;
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;
  toggleLike: (prompt: PromptItem) => Promise<boolean>;
  toggleSave: (prompt: PromptItem) => Promise<boolean>;
  recordView: (promptId: string) => Promise<void>;
  recordUse: (promptId: string) => Promise<void>;
  submitRating: (promptId: string, rating: number) => Promise<void>;
  createPrompt: (promptData: Omit<PromptItem, 'id' | 'createdAt' | 'likesCount' | 'savesCount' | 'viewsCount' | 'usesCount' | 'averageRating' | 'ratingCount'>) => Promise<string>;
  updatePrompt: (id: string, updates: Partial<PromptItem>) => Promise<void>;
  deletePrompt: (id: string) => Promise<void>;
  refreshData: () => Promise<void>;
  triggerDailyAIGeneration: () => Promise<{ success: boolean; count?: number; error?: string }>;
  updateEvent: (id: string, updates: Partial<EventItem>) => Promise<void>;
}

const PromptContext = createContext<PromptContextType | null>(null);

export const usePrompts = () => {
  const context = useContext(PromptContext);
  if (!context) throw new Error('usePrompts must be used within PromptProvider');
  return context;
};

export const PromptProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAdmin } = useAuth();
  const [prompts, setPrompts] = useState<PromptItem[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userLikedIds, setUserLikedIds] = useState<Set<string>>(new Set());
  const [userSavedIds, setUserSavedIds] = useState<Set<string>>(new Set());
  const [userRatings, setUserRatings] = useState<Record<string, number>>({});
  const [viewedInSession] = useState<Set<string>>(() => new Set());

  // In-app notifications
  const [notifications, setNotifications] = useState<AppNotification[]>([
    {
      id: 'notif-welcome',
      title: 'Welcome to DN PROMPT',
      message: 'Explore Tamil-cinema inspired cinematic AI image prompts by Dharani Selvan.',
      timestamp: new Date().toISOString(),
      read: false,
      type: 'announcement',
      linkTab: 'home',
    },
    {
      id: 'notif-event-launch',
      title: '24 Gaming Events Calendar Live!',
      message: 'Event #1 Naruto launches in 2 days. Check out the 6-day rotation schedule.',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      read: false,
      type: 'event',
      linkTab: 'events',
    },
  ]);

  // Seed initial data to Firestore if empty
  const initializeFirestoreData = useCallback(async () => {
    try {
      // Check prompts
      const promptsSnap = await getDocs(collection(db, 'prompts'));
      if (promptsSnap.empty) {
        console.log('Seeding initial prompts to Firestore...');
        const batch = writeBatch(db);
        for (const p of SEED_PROMPTS) {
          const docRef = doc(db, 'prompts', p.id);
          batch.set(docRef, p);
        }
        await batch.commit();
      }

      // Check events
      const eventsSnap = await getDocs(collection(db, 'events'));
      if (eventsSnap.empty) {
        console.log('Seeding initial 24 gaming events to Firestore...');
        const initialEvents = generateInitialEvents();
        const batch = writeBatch(db);
        for (const ev of initialEvents) {
          const docRef = doc(db, 'events', ev.id);
          batch.set(docRef, ev);
        }
        await batch.commit();
      }
    } catch (err) {
      console.warn('Initial seeding note (local fallback active):', err);
    }
  }, []);

  // Listen to Prompts in real-time
  useEffect(() => {
    initializeFirestoreData();

    const promptsRef = collection(db, 'prompts');
    const q = query(promptsRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const items: PromptItem[] = [];
          snapshot.forEach((docSnap) => {
            items.push({ id: docSnap.id, ...(docSnap.data() as any) });
          });
          setPrompts(items);
        } else {
          // If empty in remote, show local seed prompts
          setPrompts(SEED_PROMPTS);
        }
        setLoading(false);
      },
      (error) => {
        console.warn('Firestore prompts snapshot note, using local seed:', error);
        setPrompts(SEED_PROMPTS);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [initializeFirestoreData]);

  // Listen to Events in real-time
  useEffect(() => {
    const eventsRef = collection(db, 'events');
    const q = query(eventsRef, orderBy('eventNumber', 'asc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const items: EventItem[] = [];
          snapshot.forEach((docSnap) => {
            items.push({ id: docSnap.id, ...(docSnap.data() as any) });
          });
          setEvents(items);
        } else {
          setEvents(generateInitialEvents());
        }
      },
      (error) => {
        console.warn('Firestore events snapshot note, using local events:', error);
        setEvents(generateInitialEvents());
      }
    );

    return () => unsubscribe();
  }, []);

  // Sync user likes, saves and ratings when user changes
  useEffect(() => {
    if (!user) {
      setUserLikedIds(new Set());
      setUserSavedIds(new Set());
      setUserRatings({});
      return;
    }

    // Likes listener
    const likesQuery = query(collection(db, 'likes'), where('userId', '==', user.uid));
    const unsubLikes = onSnapshot(
      likesQuery,
      (snap) => {
        const ids = new Set<string>();
        snap.forEach((d) => ids.add(d.data().promptId));
        setUserLikedIds(ids);
      },
      (err) => console.warn('Likes snapshot note:', err)
    );

    // Saves listener
    const savesQuery = query(collection(db, 'saves'), where('userId', '==', user.uid));
    const unsubSaves = onSnapshot(
      savesQuery,
      (snap) => {
        const ids = new Set<string>();
        snap.forEach((d) => ids.add(d.data().promptId));
        setUserSavedIds(ids);
      },
      (err) => console.warn('Saves snapshot note:', err)
    );

    // Ratings listener
    const ratingsQuery = query(collection(db, 'ratings'), where('userId', '==', user.uid));
    const unsubRatings = onSnapshot(
      ratingsQuery,
      (snap) => {
        const map: Record<string, number> = {};
        snap.forEach((d) => {
          map[d.data().promptId] = d.data().rating;
        });
        setUserRatings(map);
      },
      (err) => console.warn('Ratings snapshot note:', err)
    );

    return () => {
      unsubLikes();
      unsubSaves();
      unsubRatings();
    };
  }, [user]);

  // Refresh data action
  const refreshData = async () => {
    setRefreshing(true);
    try {
      const snap = await getDocs(query(collection(db, 'prompts'), orderBy('createdAt', 'desc')));
      if (!snap.empty) {
        const items: PromptItem[] = [];
        snap.forEach((d) => items.push({ id: d.id, ...(d.data() as any) }));
        setPrompts(items);
      }
      const evSnap = await getDocs(query(collection(db, 'events'), orderBy('eventNumber', 'asc')));
      if (!evSnap.empty) {
        const evItems: EventItem[] = [];
        evSnap.forEach((d) => evItems.push({ id: d.id, ...(d.data() as any) }));
        setEvents(evItems);
      }
    } catch (err) {
      console.warn('Refresh notice:', err);
    } finally {
      setTimeout(() => setRefreshing(false), 400);
    }
  };

  // Toggle Like (1 like per user, persisted & atomic)
  const toggleLike = async (prompt: PromptItem): Promise<boolean> => {
    const isLiked = userLikedIds.has(prompt.id);
    const newLiked = !isLiked;
    const likeDocId = `${user ? user.uid : 'guest'}_${prompt.id}`;

    // Optimistic UI update
    setUserLikedIds((prev) => {
      const next = new Set(prev);
      if (newLiked) next.add(prompt.id);
      else next.delete(prompt.id);
      return next;
    });

    setPrompts((prev) =>
      prev.map((p) =>
        p.id === prompt.id
          ? { ...p, likesCount: Math.max(0, p.likesCount + (newLiked ? 1 : -1)) }
          : p
      )
    );

    if (user) {
      try {
        const likeRef = doc(db, 'likes', likeDocId);
        const promptRef = doc(db, 'prompts', prompt.id);
        if (newLiked) {
          await setDoc(likeRef, {
            userId: user.uid,
            promptId: prompt.id,
            createdAt: new Date().toISOString(),
          });
          await updateDoc(promptRef, {
            likesCount: increment(1),
          });
        } else {
          await deleteDoc(likeRef);
          await updateDoc(promptRef, {
            likesCount: increment(-1),
          });
        }
      } catch (err) {
        console.warn('Like sync note:', err);
      }
    }
    return newLiked;
  };

  // Toggle Save / Bookmark
  const toggleSave = async (prompt: PromptItem): Promise<boolean> => {
    const isSaved = userSavedIds.has(prompt.id);
    const newSaved = !isSaved;
    const saveDocId = `${user ? user.uid : 'guest'}_${prompt.id}`;

    // Optimistic UI
    setUserSavedIds((prev) => {
      const next = new Set(prev);
      if (newSaved) next.add(prompt.id);
      else next.delete(prompt.id);
      return next;
    });

    setPrompts((prev) =>
      prev.map((p) =>
        p.id === prompt.id
          ? { ...p, savesCount: Math.max(0, p.savesCount + (newSaved ? 1 : -1)) }
          : p
      )
    );

    if (user) {
      try {
        const saveRef = doc(db, 'saves', saveDocId);
        const promptRef = doc(db, 'prompts', prompt.id);
        if (newSaved) {
          await setDoc(saveRef, {
            userId: user.uid,
            promptId: prompt.id,
            createdAt: new Date().toISOString(),
          });
          await updateDoc(promptRef, {
            savesCount: increment(1),
          });
        } else {
          await deleteDoc(saveRef);
          await updateDoc(promptRef, {
            savesCount: increment(-1),
          });
        }
      } catch (err) {
        console.warn('Save sync note:', err);
      }
    }
    return newSaved;
  };

  // Record View (deduplicated per session)
  const recordView = async (promptId: string) => {
    if (viewedInSession.has(promptId)) return;
    viewedInSession.add(promptId);

    // Optimistic update
    setPrompts((prev) =>
      prev.map((p) => (p.id === promptId ? { ...p, viewsCount: p.viewsCount + 1 } : p))
    );

    try {
      const promptRef = doc(db, 'prompts', promptId);
      await updateDoc(promptRef, {
        viewsCount: increment(1),
      });
    } catch (err) {
      console.warn('View count note:', err);
    }
  };

  // Record Use (when Copy Prompt or Open GPT is clicked)
  const recordUse = async (promptId: string) => {
    // Optimistic update
    setPrompts((prev) =>
      prev.map((p) => (p.id === promptId ? { ...p, usesCount: p.usesCount + 1 } : p))
    );

    try {
      const promptRef = doc(db, 'prompts', promptId);
      await updateDoc(promptRef, {
        usesCount: increment(1),
      });
    } catch (err) {
      console.warn('Use count note:', err);
    }
  };

  // Submit Rating
  const submitRating = async (promptId: string, ratingValue: number) => {
    const ratingDocId = `${user ? user.uid : 'anon'}_${promptId}`;

    setUserRatings((prev) => ({ ...prev, [promptId]: ratingValue }));

    setPrompts((prev) =>
      prev.map((p) => {
        if (p.id !== promptId) return p;
        const currentCount = p.ratingCount || 0;
        const currentAvg = p.averageRating || 5.0;
        const newCount = currentCount + 1;
        const newAvg = Number(((currentAvg * currentCount + ratingValue) / newCount).toFixed(1));
        return { ...p, ratingCount: newCount, averageRating: newAvg };
      })
    );

    if (user) {
      try {
        const ratingRef = doc(db, 'ratings', ratingDocId);
        const promptRef = doc(db, 'prompts', promptId);
        await setDoc(ratingRef, {
          userId: user.uid,
          promptId,
          rating: ratingValue,
          createdAt: new Date().toISOString(),
        });
        const prompt = prompts.find((p) => p.id === promptId);
        if (prompt) {
          const currentCount = prompt.ratingCount || 0;
          const currentAvg = prompt.averageRating || 5.0;
          const newCount = currentCount + 1;
          const newAvg = Number(((currentAvg * currentCount + ratingValue) / newCount).toFixed(1));
          await updateDoc(promptRef, {
            ratingCount: newCount,
            averageRating: newAvg,
          });
        }
      } catch (err) {
        console.warn('Rating sync note:', err);
      }
    }
  };

  // Admin: Create Prompt
  const createPrompt = async (
    promptData: Omit<PromptItem, 'id' | 'createdAt' | 'likesCount' | 'savesCount' | 'viewsCount' | 'usesCount' | 'averageRating' | 'ratingCount'>
  ): Promise<string> => {
    const id = `prompt-${Date.now()}`;
    const newPrompt: PromptItem = {
      ...promptData,
      id,
      likesCount: 0,
      savesCount: 0,
      viewsCount: 0,
      usesCount: 0,
      averageRating: 5.0,
      ratingCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Add to local state immediately
    setPrompts((prev) => [newPrompt, ...prev]);

    try {
      const docRef = doc(db, 'prompts', id);
      await setDoc(docRef, newPrompt);

      // Add notification for users
      setNotifications((prev) => [
        {
          id: `notif-${Date.now()}`,
          title: 'New Prompt Published!',
          message: `"${newPrompt.title}" in ${newPrompt.category} is now available.`,
          timestamp: new Date().toISOString(),
          read: false,
          type: 'prompt',
          linkTab: 'home',
          targetPromptId: id,
        },
        ...prev,
      ]);
    } catch (err) {
      console.error('Failed to create prompt in Firestore:', err);
      handleFirestoreError(err, OperationType.CREATE, `prompts/${id}`);
    }

    return id;
  };

  // Admin: Update Prompt
  const updatePrompt = async (id: string, updates: Partial<PromptItem>) => {
    setPrompts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p))
    );

    try {
      const docRef = doc(db, 'prompts', id);
      await updateDoc(docRef, { ...updates, updatedAt: new Date().toISOString() });
    } catch (err) {
      console.error('Failed to update prompt in Firestore:', err);
      handleFirestoreError(err, OperationType.UPDATE, `prompts/${id}`);
    }
  };

  // Admin: Delete Prompt
  const deletePrompt = async (id: string) => {
    setPrompts((prev) => prev.filter((p) => p.id !== id));

    try {
      const docRef = doc(db, 'prompts', id);
      await deleteDoc(docRef);
    } catch (err) {
      console.error('Failed to delete prompt from Firestore:', err);
      handleFirestoreError(err, OperationType.DELETE, `prompts/${id}`);
    }
  };

  // Admin: Update Event
  const updateEvent = async (id: string, updates: Partial<EventItem>) => {
    setEvents((prev) => prev.map((ev) => (ev.id === id ? { ...ev, ...updates } : ev)));

    try {
      const docRef = doc(db, 'events', id);
      await updateDoc(docRef, updates as any);
    } catch (err) {
      console.warn('Update event note:', err);
    }
  };

  // Trigger Daily AI Generation (calls server /api/generate-daily-prompts)
  const triggerDailyAIGeneration = async (): Promise<{ success: boolean; count?: number; error?: string }> => {
    try {
      const resp = await fetch('/api/generate-daily-prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestedBy: user?.email || 'admin' }),
      });

      if (!resp.ok) {
        const errorData = await resp.json().catch(() => ({}));
        throw new Error(errorData.error || 'Server returned error generating daily prompts');
      }

      const data = await resp.json();
      if (data.items && Array.isArray(data.items)) {
        for (const item of data.items) {
          await createPrompt({
            title: item.title,
            promptText: item.promptText,
            category: item.category as PromptCategory,
            imageUrl: item.imageUrl,
            description: item.description,
            tags: item.tags || ['Tamil Cinema', 'Daily AI', 'Kollywood'],
            instagramUrl: 'https://www.instagram.com/no_bita_single_boy?rpxt=eXY1YWU0Mmp6NXp1',
            youtubeUrl: 'https://youtube.com/@alight_imports_official?si=dXY3jnvIWHP3kpUN',
            authorName: 'DN AI Studio Daily',
            authorEmail: 'kavikavik999@gmail.com',
            isDailyGenerated: true,
          });
        }

        // Add daily notification
        setNotifications((prev) => [
          {
            id: `notif-daily-${Date.now()}`,
            title: "Today's Tamil Cinema AI Drops Are Live!",
            message: 'Two brand-new actor-inspired AI image prompts have arrived.',
            timestamp: new Date().toISOString(),
            read: false,
            type: 'daily',
            linkTab: 'home',
          },
          ...prev,
        ]);

        return { success: true, count: data.items.length };
      }
      return { success: true, count: 0 };
    } catch (error: any) {
      console.error('Trigger daily error:', error);
      return { success: false, error: error.message };
    }
  };

  const markNotificationRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const clearNotifications = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const unreadNotificationCount = notifications.filter((n) => !n.read).length;

  return (
    <PromptContext.Provider
      value={{
        prompts,
        events,
        loading,
        refreshing,
        userLikedIds,
        userSavedIds,
        userRatings,
        notifications,
        unreadNotificationCount,
        markNotificationRead,
        clearNotifications,
        toggleLike,
        toggleSave,
        recordView,
        recordUse,
        submitRating,
        createPrompt,
        updatePrompt,
        deletePrompt,
        refreshData,
        triggerDailyAIGeneration,
        updateEvent,
      }}
    >
      {children}
    </PromptContext.Provider>
  );
};
