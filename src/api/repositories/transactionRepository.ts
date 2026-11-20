import { api } from '@/src/lib/apiClient';
import { ENDPOINTS } from '@/src/api/endpoints';
import type { ApiResponse, TransactionResponseDTO, TransactionType, TransactionDirection } from '@/src/types';

export interface TransactionListParams {
  type?: TransactionType;
  types?: TransactionType[];
  direction?: TransactionDirection;
  sessionId?: number;
  exerciceId?: number;
  accountMemberId?: number;
  fromDate?: string;
  toDate?: string;
  page?: number;
  size?: number;
  sort?: string;
}

function buildQuery(params: TransactionListParams): string {
  const q = new URLSearchParams();
  if (params.types && params.types.length > 0) {
    params.types.forEach((t) => q.append('types', t));
  } else if (params.type) {
    q.set('type', params.type);
  }
  if (params.direction) q.set('direction', params.direction);
  if (params.sessionId !== undefined) q.set('sessionId', String(params.sessionId));
  if (params.exerciceId !== undefined) q.set('exerciceId', String(params.exerciceId));
  if (params.accountMemberId !== undefined) q.set('accountMemberId', String(params.accountMemberId));
  if (params.fromDate) q.set('fromDate', params.fromDate);
  if (params.toDate) q.set('toDate', params.toDate);
  if (params.page !== undefined) q.set('page', String(params.page));
  if (params.size !== undefined) q.set('size', String(params.size));
  if (params.sort) q.set('sort', params.sort);
  const str = q.toString();
  return str ? `?${str}` : '';
}

export const transactionRepository = {
  getAll: (params: TransactionListParams = {}) =>
    api.get<ApiResponse<TransactionResponseDTO[]>>(
      `${ENDPOINTS.TRANSACTIONS.BASE}${buildQuery(params)}`
    ),

  getById: (id: number) =>
    api.get<ApiResponse<TransactionResponseDTO>>(ENDPOINTS.TRANSACTIONS.BY_ID(id)),
};
