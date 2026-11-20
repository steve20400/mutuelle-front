import { create } from 'zustand';
import { contextRepository } from '@/src/api/repositories/contextRepository';
import type { CurrentContextResponseDTO, BackendRole } from '@/src/types';

interface ContextState {
  context: CurrentContextResponseDTO | null;
  isLoading: boolean;
  error: string | null;

  fetchContext: () => Promise<void>;
  clearContext: () => void;
}

export const useContextStore = create<ContextState>((set) => ({
  context: null,
  isLoading: false,
  error: null,

  fetchContext: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await contextRepository.getContext();
      // LOG TEMPORAIRE — retirer après vérification des paliers d'emprunt
      console.log('[Context] borrowingCeilingIntervals:', JSON.stringify(response.data?.borrowingCeilingIntervals, null, 2));
      set({ context: response.data, isLoading: false });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur lors du chargement du contexte';
      set({ error: message, isLoading: false });
    }
  },

  clearContext: () => {
    set({ context: null, error: null });
  },
}));

// ─── Sélecteurs ──────────────────────────────────────────────────────────────

export const useCurrentContext = () => useContextStore((s) => s.context);

export const useContextRole = (): BackendRole | null =>
  useContextStore((s) => s.context?.role ?? null);

export const useCurrentSession = () =>
  useContextStore((s) => s.context?.currentSession ?? null);

export const useCurrentExercice = () =>
  useContextStore((s) => s.context?.currentExercice ?? null);

export const useAccountMutuelle = () =>
  useContextStore((s) => s.context?.accountMutuelle ?? null);

export const useMutuelleConfig = () =>
  useContextStore((s) => s.context?.config ?? null);

export const useTypeAssistance = () =>
  useContextStore((s) => s.context?.typeAssistance ?? []);

export const useAdminProfile = () =>
  useContextStore((s) => s.context?.adminProfile ?? null);

export const useMemberProfile = () =>
  useContextStore((s) => s.context?.memberProfile ?? null);

export const useBorrowingCeilings = () =>
  useContextStore((s) => s.context?.borrowingCeilingIntervals ?? []);
