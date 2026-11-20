import { QueryClient, QueryCache, MutationCache } from '@tanstack/react-query';
import { useToastStore } from '@/src/store/toastStore';
import type { ApiError } from '@/src/types';

function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    'message' in error
  );
}

// ─── De-duplication ───────────────────────────────────────────────────────────
// Évite d'afficher 10 toasts identiques quand 10 requêtes parallèles échouent.
let _lastMsg = '';
let _lastTime = 0;
const DEDUP_MS = 3_000;

function showError(message: string) {
  const now = Date.now();
  if (message === _lastMsg && now - _lastTime < DEDUP_MS) return;
  _lastMsg = message;
  _lastTime = now;
  useToastStore.getState().show({ type: 'error', message, duration: 5000 });
}

function handleError(error: unknown) {
  if (!isApiError(error)) {
    showError('Une erreur inattendue est survenue');
    return;
  }
  // status 0 → erreur réseau, gérée par le NetworkBanner (apiClient.ts)
  if (error.status === 0) return;
  // 401 → géré par le refresh token silencieusement
  if (error.status === 401) return;
  showError(error.message);
}

// ─── QueryClient ──────────────────────────────────────────────────────────────

export function createQueryClient(): QueryClient {
  return new QueryClient({
    queryCache: new QueryCache({
      onError: handleError,
    }),
    mutationCache: new MutationCache({
      onError: handleError,
    }),
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 2,  // 2 min
        gcTime: 1000 * 60 * 10,    // 10 min
        retry: (failureCount, error) => {
          // Pas de retry sur les erreurs client (4xx) ni réseau
          if (isApiError(error) && error.status >= 400 && error.status < 500) return false;
          if (isApiError(error) && error.status === 0) return failureCount < 1;
          return failureCount < 2;
        },
        throwOnError: false,
      },
      mutations: {
        // onError retiré ici — géré globalement par MutationCache.onError
      },
    },
  });
}

export const queryClient = createQueryClient();
