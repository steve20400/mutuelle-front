import { useQuery } from '@tanstack/react-query';
import { accountRepository } from '@/src/api/repositories/accountRepository';

export const MUTUELLE_KEYS = {
  account: ['mutuelle-account'] as const,
};

export function useMutuelleAccount() {
  return useQuery({
    queryKey: MUTUELLE_KEYS.account,
    queryFn: async () => {
      const res = await accountRepository.getMutuelle();
      return res.data;
    },
  });
}
