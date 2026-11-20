import { useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useAuthStore } from '@/src/store/authStore';

/**
 * Watches AppState changes and locks the app whenever it transitions to
 * 'background' (home button, app switcher, screen lock on both iOS and Android).
 *
 * 'inactive' (iOS only — notification centre, control centre) is intentionally
 * ignored so that a quick swipe-down and back does not trigger the lock.
 *
 * Must be called inside app/(app)/_layout so it only runs while the user is
 * authenticated and inside the protected area.
 */
export function useAppLock() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const lock = useAuthStore((s) => s.lock);

  useEffect(() => {
    if (!isAuthenticated) return;

    function handleStateChange(nextState: AppStateStatus) {
      if (nextState === 'background') {
        lock();
      }
    }

    const subscription = AppState.addEventListener('change', handleStateChange);
    return () => subscription.remove();
  }, [isAuthenticated, lock]);
}
