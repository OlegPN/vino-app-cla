import { api } from './client';
import { Wine } from '../types';

export const winesApi = {
  search: (params: { q?: string; type?: string; country?: string; page?: number }) => {
    const query = new URLSearchParams(params as any).toString();
    return api.get<{ wines: Wine[] }>(`/wines?${query}`);
  },
  trending: () => api.get<{ wines: Wine[] }>('/wines/trending'),
  getById: (id: string) => api.get<{ wine: Wine }>(`/wines/${id}`),
};

export const scannerApi = {
  scan: (imageBase64: string) =>
    api.post<{ found: boolean; wine: Wine | null; suggestedName?: string }>('/scanner/scan', { imageBase64 }),
  scanBarcode: (barcode: string) =>
    api.post<{ found: boolean; wine: Wine | null }>('/scanner/scan', { barcode }),
};

export const reviewsApi = {
  submit: (data: { wineId: string; rating: number; text?: string }) =>
    api.post('/reviews', data),
  like: (reviewId: string) => api.post(`/reviews/${reviewId}/like`, {}),
};

export const collectionApi = {
  get: () => api.get<{ collection: { items: any[] } }>('/collection'),
  add: (data: { wineId: string; status: string; quantity?: number }) =>
    api.post('/collection', data),
  update: (itemId: string, data: { status?: string; quantity?: number }) =>
    api.patch(`/collection/${itemId}`, data),
  remove: (itemId: string) => api.delete(`/collection/${itemId}`),
};

export const authApi = {
  login: (displayName: string, password: string) =>
    api.post<{ accessToken: string; user: any }>('/auth/login', { displayName, password }),
  register: (data: { displayName: string; password: string }) =>
    api.post<{ accessToken: string; user: any }>('/auth/register', data),
};

export const usersApi = {
  getById: (id: string) => api.get<{ user: any }>(`/users/${id}`),
  follow: (id: string) => api.post(`/users/${id}/follow`, {}),
  activity: (id: string) => api.get<{ reviews: any[] }>(`/users/${id}/activity`),
};
