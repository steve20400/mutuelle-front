import { api } from '@/src/lib/apiClient';
import { ENDPOINTS } from '@/src/api/endpoints';
import type {
  ApiResponse,
  AssistanceResponseDto,
  TypeAssistanceResponseDto,
  CreateAssistanceDto,
} from '@/src/types';

export interface AssistanceListParams {
  typeAssistanceId?: number;
  memberId?: number;
  sessionId?: number;
  fromDate?: string;
  toDate?: string;
  page?: number;
  size?: number;
  sort?: string;
}

function buildQuery(params: AssistanceListParams): string {
  const q = new URLSearchParams();
  if (params.typeAssistanceId !== undefined) q.set('typeAssistanceId', String(params.typeAssistanceId));
  if (params.memberId !== undefined) q.set('memberId', String(params.memberId));
  if (params.sessionId !== undefined) q.set('sessionId', String(params.sessionId));
  if (params.fromDate) q.set('fromDate', params.fromDate);
  if (params.toDate) q.set('toDate', params.toDate);
  if (params.page !== undefined) q.set('page', String(params.page));
  if (params.size !== undefined) q.set('size', String(params.size));
  if (params.sort) q.set('sort', params.sort);
  const str = q.toString();
  return str ? `?${str}` : '';
}

export const assistanceRepository = {
  getAll: (params: AssistanceListParams = {}) =>
    api.get<ApiResponse<AssistanceResponseDto[]>>(
      `${ENDPOINTS.ASSISTANCES.BASE}${buildQuery(params)}`
    ),

  create: (payload: CreateAssistanceDto) =>
    api.post<ApiResponse<AssistanceResponseDto>>(ENDPOINTS.ASSISTANCES.BASE, payload),

  getTypes: () =>
    api.get<ApiResponse<TypeAssistanceResponseDto[]>>(ENDPOINTS.ASSISTANCES.TYPES),

  createType: (payload: { name: string; description?: string; amount: number }) =>
    api.post<ApiResponse<TypeAssistanceResponseDto>>(ENDPOINTS.ASSISTANCES.TYPES, payload),

  updateType: (id: number, payload: { name: string; description?: string; amount: number; active?: boolean }) =>
    api.put<ApiResponse<TypeAssistanceResponseDto>>(ENDPOINTS.ASSISTANCES.TYPE_BY_ID(id), payload),

  deleteType: (id: number) =>
    api.delete<ApiResponse<void>>(ENDPOINTS.ASSISTANCES.TYPE_BY_ID(id)),
};
