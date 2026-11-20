import { useQuery } from '@tanstack/react-query';
import { contextRepository } from '@/src/api/repositories/contextRepository';
import { useContextStore } from '@/src/store/contextStore';
import { useAuthStore } from '@/src/store/authStore';

export const CONTEXT_QUERY_KEY = ['context'] as const;

export function useAppContext() {
  const { isAuthenticated } = useAuthStore();
  const { context, fetchContext } = useContextStore();

  const query = useQuery({
    queryKey: CONTEXT_QUERY_KEY,
    queryFn: async () => {
      const response = await contextRepository.getContext();
      return response.data;
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  return {
    context: query.data ?? context,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
