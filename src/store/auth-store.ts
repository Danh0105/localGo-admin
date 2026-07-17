import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CurrentUser } from '../types/user';

interface AuthState {
  /** In-memory only — never persisted, re-obtained via refresh on app load. */
  accessToken: string | null;
  /** Persisted to localStorage (partialize below) — survives page reloads. */
  refreshToken: string | null;
  user: CurrentUser | null;
  /** True while the app is still trying to restore a session on first load. */
  isBootstrapping: boolean;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setUser: (user: CurrentUser | null) => void;
  setBootstrapping: (value: boolean) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      isBootstrapping: true,
      setTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken }),
      setUser: (user) => set({ user }),
      setBootstrapping: (value) => set({ isBootstrapping: value }),
      clear: () => set({ accessToken: null, refreshToken: null, user: null }),
    }),
    {
      name: 'localgo-admin-auth',
      partialize: (state) => ({ refreshToken: state.refreshToken }),
    },
  ),
);
