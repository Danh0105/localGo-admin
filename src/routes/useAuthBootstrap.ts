import { useEffect } from 'react';
import { refreshAccessToken } from '../api/client';
import { fetchCurrentUser } from '../api/auth';
import { useAuthStore } from '../store/auth-store';
import { ADMIN_ROLES } from '../types/user';

/**
 * Runs once on app load: if a refreshToken survived a page reload
 * (persisted in localStorage), exchange it for a fresh accessToken and
 * re-fetch the current user. Clears the session if the role isn't
 * MODERATOR/ADMIN — this is a UX guard only, the backend independently
 * enforces RBAC on every admin endpoint regardless of what the frontend does.
 */
export function useAuthBootstrap(): void {
  const refreshToken = useAuthStore((s) => s.refreshToken);
  const setUser = useAuthStore((s) => s.setUser);
  const setBootstrapping = useAuthStore((s) => s.setBootstrapping);
  const clear = useAuthStore((s) => s.clear);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap(): Promise<void> {
      if (!refreshToken) {
        setBootstrapping(false);
        return;
      }

      const accessToken = await refreshAccessToken();
      if (!accessToken) {
        if (!cancelled) setBootstrapping(false);
        return;
      }

      try {
        const user = await fetchCurrentUser();
        if (cancelled) return;
        if (!ADMIN_ROLES.includes(user.role)) {
          clear();
        } else {
          setUser(user);
        }
      } catch {
        if (!cancelled) clear();
      } finally {
        if (!cancelled) setBootstrapping(false);
      }
    }

    void bootstrap();
    return () => {
      cancelled = true;
    };
    // Only ever run once on mount — deliberately not re-running on token change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
