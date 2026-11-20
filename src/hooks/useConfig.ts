import { useMutation, useQueryClient } from '@tanstack/react-query';
import { configRepository } from '@/src/api/repositories/configRepository';
import { useContextStore } from '@/src/store/contextStore';
import { useToast } from '@/src/store/toastStore';
import type { ConfigMutuelleRequestDto } from '@/src/types';

export function useUpdateConfig() {
  const qc = useQueryClient();
  const { fetchContext } = useContextStore();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (payload: ConfigMutuelleRequestDto) => configRepository.update(payload),
    onSuccess: async () => {
      // Recharger le contexte global pour mettre à jour config partout
      await fetchContext();
      qc.invalidateQueries({ queryKey: ['context'] });
      success('Configuration mise a jour avec succes');
    },
    onError: (err: unknown) => {
      error((err as { message?: string })?.message ?? 'Erreur lors de la mise a jour');
    },
  });
}
