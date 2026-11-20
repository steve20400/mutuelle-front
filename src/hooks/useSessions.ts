import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sessionRepository } from '@/src/api/repositories/sessionRepository';
import { useToast } from '@/src/store/toastStore';
import type { SessionRequestDTO, UpdateSessionRequestDTO } from '@/src/types';

const KEYS = {
  all: ['sessions'] as const,
  current: ['sessions', 'current'] as const,
  detail: (id: number) => ['sessions', id] as const,
  history: ['sessions', 'history'] as const,
};

export function useSessions() {
  return useQuery({
    queryKey: KEYS.all,
    queryFn: async () => {
      const res = await sessionRepository.getAll();
      return res.data;
    },
  });
}

export function useCurrentSession() {
  return useQuery({
    queryKey: KEYS.current,
    queryFn: async () => {
      const res = await sessionRepository.getCurrent();
      return res.data;
    },
  });
}

export function useSession(id: number) {
  return useQuery({
    queryKey: KEYS.detail(id),
    queryFn: async () => {
      const res = await sessionRepository.getById(id);
      return res.data;
    },
    enabled: !!id,
  });
}

export function useCreateSession() {
  const qc = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (payload: SessionRequestDTO) => sessionRepository.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      success('Session creee avec succes');
    },
    onError: (err: unknown) => {
      error((err as { message?: string })?.message ?? 'Erreur');
    },
  });
}

export function useStartSession() {
  const qc = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (id: number) => sessionRepository.start(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      qc.invalidateQueries({ queryKey: KEYS.current });
      success('Session demarree');
    },
    onError: (err: unknown) => {
      error((err as { message?: string })?.message ?? 'Erreur');
    },
  });
}

export function useCloseSession() {
  const qc = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (id: number) => sessionRepository.close(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      qc.invalidateQueries({ queryKey: KEYS.current });
      success('Session cloturee');
    },
    onError: (err: unknown) => {
      error((err as { message?: string })?.message ?? 'Erreur');
    },
  });
}

export function useSessionHistory() {
  return useQuery({
    queryKey: KEYS.history,
    queryFn: async () => {
      const res = await sessionRepository.getHistory();
      return res.data;
    },
  });
}

export function useSessionsByExercice(exerciceId: number | null) {
  return useQuery({
    queryKey: ['sessions', 'by-exercice', exerciceId] as const,
    queryFn: async () => {
      const filtered = (await sessionRepository.getAll()).data?.filter(
        (s) => s.exerciceId === exerciceId
      ) ?? [];
      return filtered.sort(
        (a, b) =>
          new Date(b.startDate ?? b.createdAt).getTime() -
          new Date(a.startDate ?? a.createdAt).getTime()
      );
    },
    enabled: exerciceId !== null,
  });
}

export function useUpdateSession() {
  const qc = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateSessionRequestDTO }) =>
      sessionRepository.update(id, payload),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      qc.invalidateQueries({ queryKey: KEYS.detail(id) });
      success('Session mise a jour');
    },
    onError: (err: unknown) => {
      error((err as { message?: string })?.message ?? 'Erreur');
    },
  });
}
