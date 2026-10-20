export type PromptCategory =
  | 'Portrait'
  | 'Cinematic'
  | 'Couple'
  | 'Friendship'
  | 'Banners'
  | 'Love'
  | 'Stillout';

export interface PromptItem {
  id: string;
  title: string;
  promptText: string;
  category: PromptCategory;
  imageUrl: string;
  thumbnailUrl?: string;
  description?: string;
  tags?: string[];
  instagramUrl?: string;
  youtubeUrl?: string;
  authorId?: string;
  authorEmail?: string;
  authorName?: string;
  likesCount: number;
  savesCount: number;
  viewsCount: number;
  usesCount: number;
  averageRating: number;
  ratingCount: number;
  isDailyGenerated?: boolean;
  isFeatured?: boolean;
  rank?: number;
  eventId?: string;
  createdAt: string;
  updatedAt?: string;
}

export type EventStatus = 'active' | 'upcoming' | 'completed';

export interface EventTheme {
  primary: string;
  secondary: string;
  accent: string;
  gradient: string;
  glow: string;
  border: string;
  badgeBg: string;
  iconBg: string;
  symbol: string;
}

export interface EventItem {
  id: string;
  eventNumber: number; // 1 to 24
  name: string;
  themeKey: string;
  description: string;
  startDate: string; // ISO string
  endDate: string; // ISO string
  status: EventStatus;
  theme: EventTheme;
  bannerUrl?: string;
  promptIds?: string[];
}

export interface CategoryInfo {
  name: PromptCategory;
  icon: string;
  tagline: string;
  color: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: 'event' | 'daily' | 'announcement' | 'prompt';
  linkTab?: 'home' | 'search' | 'events' | 'profile';
  targetPromptId?: string;
}
