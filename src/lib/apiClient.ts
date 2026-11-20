import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL, SECURE_STORE_KEYS } from '@/src/constants';
import { useNetworkStore } from '@/src/store/networkStore';
import type { ApiError } from '@/src/types';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface RequestConfig {
  method?: HttpMethod;
  body?: unknown;
  headers?: Record<string, string>;
  skipRefresh?: boolean;
}

let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const refreshToken = await SecureStore.getItemAsync(SECURE_STORE_KEYS.REFRESH_TOKEN);
    if (!refreshToken) throw new Error('NO_REFRESH_TOKEN');

    const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) {
      await SecureStore.deleteItemAsync(SECURE_STORE_KEYS.ACCESS_TOKEN);
      await SecureStore.deleteItemAsync(SECURE_STORE_KEYS.REFRESH_TOKEN);
      throw new Error('REFRESH_FAILED');
    }

    const data = await res.json();
    // Mutuelle API wraps response: { success, data: { accessToken } }
    const newToken: string = data?.data?.accessToken ?? data?.accessToken;
    if (!newToken) throw new Error('NO_NEW_TOKEN');

    await SecureStore.setItemAsync(SECURE_STORE_KEYS.ACCESS_TOKEN, newToken);

    return newToken;
  })().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
}

export async function apiFetch<T>(
  endpoint: string,
  config: RequestConfig = {}
): Promise<T> {
  const { method = 'GET', body, headers: extraHeaders = {}, skipRefresh = false } = config;
  const token = await SecureStore.getItemAsync(SECURE_STORE_KEYS.ACCESS_TOKEN);

  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...extraHeaders,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30_000);

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    // Rétablit l'état "en ligne" dès qu'une requête aboutit
    if (useNetworkStore.getState().isOffline) {
      useNetworkStore.getState().setOffline(false);
    }
  } catch (networkErr) {
    clearTimeout(timeoutId);
    useNetworkStore.getState().setOffline(true);
    const isTimeout =
      networkErr instanceof Error && networkErr.name === 'AbortError';
    throw {
      status: 0,
      code: isTimeout ? 'TIMEOUT' : 'NETWORK_ERROR',
      message: isTimeout
        ? 'Le serveur met du temps à répondre, veuillez réessayer.'
        : 'Impossible de joindre le serveur. Vérifiez votre connexion.',
      details: networkErr,
    };
  }


  if (response.status === 401 && !skipRefresh) {
    try {
      const newToken = await refreshAccessToken();
      return apiFetch<T>(endpoint, {
        ...config,
        skipRefresh: true,
        headers: {
          ...extraHeaders,
          Authorization: `Bearer ${newToken}`,
        },
      });
    } catch {
      // Refresh impossible — laisse le 401 se propager
    }
  }

  if (response.status === 204 || response.status === 205) {
    return undefined as unknown as T;
  }

  let data: unknown;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const err = data as Record<string, unknown> | null;
    const error: ApiError = {
      status: response.status,
      code: String(err?.code ?? err?.error ?? 'API_ERROR'),
      message: String(err?.message ?? 'Une erreur est survenue'),
      details: err?.details,
    };
    throw error;
  }

  // Le backend Mutuelle retourne toujours HTTP 200, même en cas d'erreur.
  // Il faut vérifier success:false dans le corps pour lever une vraie erreur.
  const wrapper = data as Record<string, unknown> | null;
  if (wrapper && wrapper.success === false) {
    const error: ApiError = {
      status: Number(wrapper.code ?? response.status),
      code: 'API_ERROR',
      message: String(wrapper.message ?? 'Une erreur est survenue'),
      details: wrapper.errors,
    };
    throw error;
  }

  return data as T;
}

export const api = {
  get: <T>(endpoint: string, headers?: Record<string, string>) =>
    apiFetch<T>(endpoint, { method: 'GET', headers }),

  post: <T>(endpoint: string, body?: unknown, headers?: Record<string, string>) =>
    apiFetch<T>(endpoint, { method: 'POST', body, headers }),

  put: <T>(endpoint: string, body?: unknown, headers?: Record<string, string>) =>
    apiFetch<T>(endpoint, { method: 'PUT', body, headers }),

  patch: <T>(endpoint: string, body?: unknown, headers?: Record<string, string>) =>
    apiFetch<T>(endpoint, { method: 'PATCH', body, headers }),

  delete: <T>(endpoint: string, headers?: Record<string, string>) =>
    apiFetch<T>(endpoint, { method: 'DELETE', headers }),
};
