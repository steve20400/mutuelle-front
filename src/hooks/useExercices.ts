import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { exerciceRepository } from '@/src/api/repositories/exerciceRepository';
import { useToast } from '@/src/store/toastStore';
import type { ExerciceRequestDTO } from '@/src/types';

const KEYS = {
  all: ['exercices'] as const,
  current: ['exercices', 'current'] as const,
};

export function useExercices() {
  return useQuery({
    queryKey: KEYS.all,
    queryFn: async () => {
      const data = (await exerciceRepository.getAll()).data ?? [];
      return data.sort(
        (a, b) =>
          new Date(b.startDate ?? b.createdAt).getTime() -
          new Date(a.startDate ?? a.createdAt).getTime()
      );
    },
  });
}

export function useCreateExercice() {
  const qc = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (payload: ExerciceRequestDTO) => exerciceRepository.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      success('Exercice cree avec succes');
    },
    onError: (err: unknown) => {
      error((err as { message?: string })?.message ?? 'Erreur');
    },
  });
}

export function useUpdateExercice() {
  const qc = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: ExerciceRequestDTO }) =>
      exerciceRepository.update(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      success('Exercice mis a jour');
    },
    onError: (err: unknown) => {
      error((err as { message?: string })?.message ?? 'Erreur');
    },
  });
}

export function useStartExercice() {
  const qc = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (id: number) => exerciceRepository.start(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      success('Exercice demarre');
    },
    onError: (err: unknown) => {
      error((err as { message?: string })?.message ?? 'Erreur');
    },
  });
}

export function useCloseExercice() {
  const qc = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (id: number) => exerciceRepository.close(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      success('Exercice cloture');
    },
    onError: (err: unknown) => {
      error((err as { message?: string })?.message ?? 'Erreur');
    },
  });
}
