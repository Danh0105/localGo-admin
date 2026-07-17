import { apiClient, unwrap } from './client';
import type { CurrentUser } from '../types/user';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
}

export function login(email: string, password: string): Promise<AuthTokens> {
  return unwrap(apiClient.post('/auth/login', { email, password }));
}

export function fetchCurrentUser(): Promise<CurrentUser> {
  return unwrap(apiClient.get('/auth/me'));
}

export function logoutAll(): Promise<void> {
  return unwrap(apiClient.post('/auth/logout-all'));
}
