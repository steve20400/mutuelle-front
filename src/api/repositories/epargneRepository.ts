import { api } from '@/src/lib/apiClient';
import { ENDPOINTS } from '@/src/api/endpoints';
import type { ApiResponse, EpargneRequestDto, TransactionResponseDTO } from '@/src/types';

export const epargneRepository = {
  epargner: (payload: EpargneRequestDto) =>
    api.post<ApiResponse<TransactionResponseDTO>>(ENDPOINTS.EPARGNE, payload),
};
