import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { renfoulementRepository } from '@/src/api/repositories/renfoulementRepository';
import { contributionRepository } from '@/src/api/repositories/contributionRepository';
import { useToast } from '@/src/store/toastStore';

const KEYS = {
  history: ['renfoulement', 'history'] as const,
};

export function useRenfoulement() {
  return useQuery({
    queryKey: KEYS.history,
    queryFn: async () => {
      const res = await renfoulementRepository.getHistory();
      return res.data;
    },
  });
}

export function usePayerRenfoulement() {
  const qc = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: ({ memberId, amount }: { memberId: number; amount: number }) =>
      contributionRepository.pay({
        memberId,
        amount,
        contributionType: 'RENFOULEMENT',
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.history });
      qc.invalidateQueries({ queryKey: ['members'] });
      success('Paiement de renfoulement enregistre');
    },
    onError: (err: unknown) => {
      error((err as { message?: string })?.message ?? 'Erreur lors du paiement');
    },
  });
}
