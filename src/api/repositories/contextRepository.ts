import { api } from '@/src/lib/apiClient';
import { ENDPOINTS } from '@/src/api/endpoints';
import type { ApiResponse, CurrentContextResponseDTO } from '@/src/types';

export const contextRepository = {
  getContext: () =>
    api.get<ApiResponse<CurrentContextResponseDTO>>(ENDPOINTS.CONTEXT),
};
