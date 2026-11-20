import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { assistanceRepository, AssistanceListParams } from '@/src/api/repositories/assistanceRepository';
import { useToast } from '@/src/store/toastStore';
import type { CreateAssistanceDto } from '@/src/types';

const KEYS = {
  all: ['assistances'] as const,
  list: (params: AssistanceListParams) => ['assistances', 'list', params] as const,
  types: ['assistances', 'types'] as const,
};

export function useAssistances(params: AssistanceListParams = {}) {
  return useQuery({
    queryKey: KEYS.list(params),
    queryFn: async () => {
      const res = await assistanceRepository.getAll(params);
      return res.data;
    },
  });
}

export function useTypeAssistances() {
  return useQuery({
    queryKey: KEYS.types,
    queryFn: async () => {
      const res = await assistanceRepository.getTypes();
      return res.data;
    },
  });
}

export function useCreateAssistance() {
  const qc = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (payload: CreateAssistanceDto) => assistanceRepository.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      success('Assistance creee avec succes');
    },
    onError: (err: unknown) => {
      error((err as { message?: string })?.message ?? 'Erreur');
    },
  });
}

export function useCreateTypeAssistance() {
  const qc = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (payload: { name: string; description?: string; amount: number }) =>
      assistanceRepository.createType(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.types });
      success('Type d\'assistance cree');
    },
    onError: (err: unknown) => {
      error((err as { message?: string })?.message ?? 'Erreur');
    },
  });
}

export function useUpdateTypeAssistance() {
  const qc = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: { name: string; description?: string; amount: number };
    }) => assistanceRepository.updateType(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.types });
      success('Type d\'assistance mis a jour');
    },
    onError: (err: unknown) => {
      error((err as { message?: string })?.message ?? 'Erreur');
    },
  });
}

export function useDeleteTypeAssistance() {
  const qc = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (id: number) => assistanceRepository.deleteType(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.types });
      success('Type d\'assistance supprime');
    },
    onError: (err: unknown) => {
      error((err as { message?: string })?.message ?? 'Erreur');
    },
  });
}
