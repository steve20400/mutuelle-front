import { api } from '@/src/lib/apiClient';
import { ENDPOINTS } from '@/src/api/endpoints';
import type { ApiResponse, RenfoulementHistoryResponseDto } from '@/src/types';

export const renfoulementRepository = {
  getHistory: () =>
    api.get<ApiResponse<RenfoulementHistoryResponseDto>>(ENDPOINTS.RENFOULEMENT),
};
