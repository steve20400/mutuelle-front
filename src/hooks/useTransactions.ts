import { useInfiniteQuery, useQuery, keepPreviousData } from '@tanstack/react-query';
import {
  transactionRepository,
  TransactionListParams,
} from '@/src/api/repositories/transactionRepository';

// ─── Keys ─────────────────────────────────────────────────────────────────────

const KEYS = {
  all: ['transactions'] as const,
  list: (params: TransactionListParams) => ['transactions', 'list', params] as const,
  infinite: (params: TransactionListParams) => ['transactions', 'infinite', params] as const,
  detail: (id: number | null) => ['transactions', id] as const,
};

// ─── Hooks ────────────────────────────────────────────────────────────────────

/** Simple query – used when pagination is not needed (legacy usage). */
export function useTransactions(params: TransactionListParams = {}) {
  return useQuery({
    queryKey: KEYS.list(params),
    queryFn: async () => {
      const res = await transactionRepository.getAll(params);
      return res.data;
    },
  });
}

/**
 * Infinite / load-more query.
 * Accumulates pages from the backend. `placeholderData` keeps previous
 * results visible during filter changes to avoid layout jumps.
 */
export function useInfiniteTransactions(params: Omit<TransactionListParams, 'page'> = {}) {
  const pageSize = params.size ?? 20;

  return useInfiniteQuery({
    queryKey: KEYS.infinite({ ...params, size: pageSize }),
    initialPageParam: 0,
    placeholderData: keepPreviousData,
    queryFn: async ({ pageParam }) => {
      const res = await transactionRepository.getAll({
        ...params,
        page: pageParam as number,
        size: pageSize,
        sort: params.sort ?? 'createdAt,desc',
      });
      return {
        items: res.data ?? [],
        totalElements: res.totalElements ?? 0,
        totalPages: res.totalPages ?? 1,
        currentPage: res.currentPage ?? (pageParam as number),
      };
    },
    getNextPageParam: (lastPage) => {
      const next = lastPage.currentPage + 1;
      return next < lastPage.totalPages ? next : undefined;
    },
  });
}

/**
 * Lazy detail query – only fires when `id` is non-null.
 * Used to load transaction details (incl. children) on demand.
 * Results cached for 5 min to avoid redundant requests.
 */
export function useTransactionDetail(id: number | null) {
  return useQuery({
    queryKey: KEYS.detail(id),
    queryFn: async () => {
      const res = await transactionRepository.getById(id!);
      return res.data;
    },
    enabled: id !== null,
    staleTime: 5 * 60 * 1000,
  });
}

export type { TransactionListParams };
