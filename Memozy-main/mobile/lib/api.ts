import axios from 'axios';

const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000',
  timeout: 30000,
});

export const studyApi = {
  getDueCards: (deckId: string) => api.get(`/study/due/${deckId}`),
  rateCard: (cardId: string, quality: number) =>
    api.post('/study/rate', { card_id: cardId, quality }),
};

export const decksApi = {
  list: (userId: string) => api.get('/decks/', { params: { user_id: userId } }),
  create: (data: any) => api.post('/decks/', data),
};

export const cardsApi = {
  generateFromText: (data: any) => api.post('/cards/generate/text', data),
  generateFromPdf: (fd: FormData) =>
    api.post('/cards/generate/pdf', fd, { headers: { 'Content-Type': 'multipart/form-data' } }),
  generateFromImage: (fd: FormData) =>
    api.post('/cards/generate/image', fd, { headers: { 'Content-Type': 'multipart/form-data' } }),
};

export const gamifyApi = {
  studyComplete: (data: any) => api.post('/gamify/study-complete', data),
  getProfile: (userId: string) => api.get(`/gamify/profile/${userId}`),
};

export default api;
