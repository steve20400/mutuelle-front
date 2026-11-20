import { api } from '@/src/lib/apiClient';
import { ENDPOINTS } from '@/src/api/endpoints';
import type { ApiResponse, PaiementRequest, TransactionResponseDTO } from '@/src/types';

export const solidariteRepository = {
  payer: (payload: PaiementRequest) =>
    api.post<ApiResponse<void>>(ENDPOINTS.SOLIDARITE.PAYER, payload),

  getTotal: (memberId: number) =>
    api.get<ApiResponse<number>>(ENDPOINTS.SOLIDARITE.MEMBRE_TOTAL(memberId)),

  getHistorique: (memberId: number) =>
    api.get<ApiResponse<TransactionResponseDTO[]>>(ENDPOINTS.SOLIDARITE.MEMBRE_HISTORIQUE(memberId)),
};
