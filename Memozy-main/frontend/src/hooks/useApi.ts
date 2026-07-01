import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000',
  timeout: 30000,
});

const _cache = new Map<string, { data: any; ts: number }>();
const TTL = 60_000;

function withCache<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  const hit = _cache.get(key);
  if (hit && Date.now() - hit.ts < TTL) return Promise.resolve(hit.data as T);
  return fetcher().then(data => { _cache.set(key, { data, ts: Date.now() }); return data; });
}

function invalidate(...prefixes: string[]) {
  Array.from(_cache.keys()).forEach(k => {
    if (prefixes.some(p => k.startsWith(p))) _cache.delete(k);
  });
}

export interface Card {
  id: string;
  deck_id: string;
  front: string;
  back: string;
  hint?: string;
  example?: string;
  tags?: string[];
  difficulty: number;
  next_review: string | null;
  interval_days: number;
  ease_factor: number;
  created_at: string;
}

export interface Deck {
  id: string;
  user_id: string;
  title: string;
  description: string;
  is_public: boolean;
  card_count: number;
  created_at: string;
  cards?: Card[];
}

export interface Profile {
  id: string;
  username: string;
  avatar_url: string | null;
  xp: number;
  level: number;
  streak_count: number;
  streak_last_date: string | null;
  max_streak: number;
  theme: string;
  created_at: string;
}

export interface Badge {
  id: string;
  user_id: string;
  badge_type: string;
  earned_at: string;
}

export interface StudyCompleteResponse {
  xp_earned: number;
  new_total_xp: number;
  leveled_up: boolean;
  new_level: number;
  streak: number;
  badges_earned: string[];
}

export const decksApi = {
  list: (userId: string) =>
    withCache(`decks:${userId}`, () => api.get<{ decks: Deck[] }>('/decks/', { params: { user_id: userId } })),
  create: (data: { user_id: string; title: string; description?: string; is_public?: boolean }) =>
    api.post<{ deck: Deck }>('/decks/', data).then(r => { invalidate('decks:'); return r; }),
  get: (id: string) =>
    withCache(`deck:${id}`, () => api.get<{ deck: Deck }>(`/decks/${id}`)),
  update: (id: string, data: Partial<Deck>) =>
    api.put<{ deck: Deck }>(`/decks/${id}`, data).then(r => { invalidate('decks:', `deck:${id}`); return r; }),
  delete: (id: string) =>
    api.delete(`/decks/${id}`).then(r => { invalidate('decks:', `deck:${id}`, `cards:${id}`); return r; }),
  setVisibility: (id: string, isPublic: boolean) =>
    api.put<{ deck: Deck }>(`/decks/${id}`, { is_public: isPublic }).then(r => { invalidate('decks:', `deck:${id}`); return r; }),
  getPublic: (id: string) => api.get<{ deck: Deck }>(`/decks/public/${id}`),
};

export const cardsApi = {
  getByDeck: (deckId: string) =>
    withCache(`cards:${deckId}`, () => api.get<{ cards: Card[] }>(`/cards/${deckId}`)),
  generateFromText: (data: { text: string; deck_id: string; num_cards: number; language?: string; difficulty_mode?: string }) =>
    api.post<{ cards: Card[]; count: number }>('/cards/generate/text', data)
      .then(r => { invalidate(`cards:${data.deck_id}`, 'decks:'); return r; }),
  generateFromPdf: (formData: FormData) =>
    api.post<{ cards: Card[]; count: number }>('/cards/generate/pdf', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => { invalidate('cards:', 'decks:'); return r; }),
  generateFromImage: (formData: FormData) =>
    api.post<{ cards: Card[]; count: number }>('/cards/generate/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => { invalidate('cards:', 'decks:'); return r; }),
  update: (id: string, data: Partial<Card>) =>
    api.put<{ card: Card }>(`/cards/${id}`, data).then(r => { invalidate('cards:'); return r; }),
  createCard: (data: { deck_id: string; front: string; back: string; hint?: string; tags?: string[] }) =>
    api.post<{ card: Card }>('/cards/', data).then(r => { invalidate(`cards:${data.deck_id}`, 'decks:'); return r; }),
  deleteCard: (cardId: string) =>
    api.delete(`/cards/${cardId}`).then(r => { invalidate('cards:'); return r; }),
};

export const studyApi = {
  getDueCards: (deckId: string) => api.get<{ cards: Card[]; count: number }>(`/study/due/${deckId}`),
  getAllCards: (deckId: string) => api.get<{ cards: Card[]; count: number }>(`/study/all/${deckId}`),
  rateCard: (cardId: string, quality: number) =>
    api.post<{ card: Card; next_review: string }>('/study/rate', { card_id: cardId, quality }),
};

export const gamifyApi = {
  studyComplete: (data: {
    user_id: string;
    deck_id: string;
    cards_reviewed: number;
    correct_count: number;
  }) => api.post<StudyCompleteResponse>('/gamify/study-complete', data)
    .then(r => { invalidate(`profile:${data.user_id}`); return r; }),
  getProfile: (userId: string) =>
    withCache(`profile:${userId}`, () =>
      api.get<{ profile: Profile; badges: Badge[]; recent_sessions: any[] }>(`/gamify/profile/${userId}`)),
};

export const socialApi = {
  leaderboard: (userId: string) => api.get('/social/leaderboard', { params: { user_id: userId } }),
  follow: (userId: string, targetId: string) =>
    api.post(`/social/follow/${targetId}`, null, { params: { user_id: userId } }),
  unfollow: (userId: string, targetId: string) =>
    api.delete(`/social/follow/${targetId}`, { params: { user_id: userId } }),
  feed: (userId: string) => api.get('/social/feed', { params: { user_id: userId } }),
  search: (q: string) => api.get('/social/search', { params: { q } }),
};

export default api;
