import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { SECURE_STORE_KEYS } from '@/src/constants';
import type { BackendRole, LoginResponseDto } from '@/src/types';

interface AuthUser {
  authId: number;
  role: BackendRole;
  userRefId: number;
  email: string;
}

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isLocked: boolean;

  initialize: () => Promise<void>;
  setFromLogin: (data: LoginResponseDto) => Promise<void>;
  logout: () => Promise<void>;
  lock: () => void;
  unlock: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  isLocked: false,

  initialize: async () => {
    try {
      const token = await SecureStore.getItemAsync(SECURE_STORE_KEYS.ACCESS_TOKEN);
      if (token) {
        // On a un token — l'utilisateur est potentiellement connecté.
        // Le contexte complet sera chargé par useContextStore.
        set({ isAuthenticated: true });
      }
    } catch (error) {
      console.error('Auth initialization failed:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  setFromLogin: async (data: LoginResponseDto) => {
    await SecureStore.setItemAsync(SECURE_STORE_KEYS.ACCESS_TOKEN, data.accessToken);
    await SecureStore.setItemAsync(SECURE_STORE_KEYS.REFRESH_TOKEN, data.refreshToken);

    set({
      user: {
        authId: data.authId,
        role: data.role,
        userRefId: data.userRefId,
        email: data.email,
      },
      isAuthenticated: true,
    });
  },

  logout: async () => {
    await SecureStore.deleteItemAsync(SECURE_STORE_KEYS.ACCESS_TOKEN);
    await SecureStore.deleteItemAsync(SECURE_STORE_KEYS.REFRESH_TOKEN);
    set({ user: null, isAuthenticated: false, isLocked: false });
  },

  lock: () => set({ isLocked: true }),
  unlock: () => set({ isLocked: false }),
}));

// ─── Sélecteurs ──────────────────────────────────────────────────────────────

export const useCurrentRole = (): BackendRole | null =>
  useAuthStore((s) => s.user?.role ?? null);

export const useIsAdmin = () =>
  useAuthStore((s) => s.user?.role === 'ADMIN' || s.user?.role === 'SUPER_ADMIN');

export const useIsPresident = () =>
  useAuthStore((s) => s.user?.role === 'PRESIDENT');

export const useIsTresorier = () =>
  useAuthStore((s) => s.user?.role === 'TRESORIER');

export const useIsMember = () =>
  useAuthStore((s) => s.user?.role === 'MEMBER');
