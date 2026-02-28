import { api } from './client';

export const telegramApi = {
  login: (data: any) =>
    api.post<{ token: string; user: any }>('/auth/telegram', data),
};
