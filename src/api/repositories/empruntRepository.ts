import { api } from '@/src/lib/apiClient';
import { ENDPOINTS } from '@/src/api/endpoints';
import type { ApiResponse, EmpruntRequestDTO, RemboursementRequestDTO } from '@/src/types';

export const empruntRepository = {
  emprunter: (payload: EmpruntRequestDTO) =>
    api.post<ApiResponse<void>>(ENDPOINTS.EMPRUNTS.EMPRUNT, payload),

  rembourser: (payload: RemboursementRequestDTO) =>
    api.post<ApiResponse<void>>(ENDPOINTS.EMPRUNTS.REMBOURSEMENT, payload),
};
