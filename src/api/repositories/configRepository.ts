import { api } from '@/src/lib/apiClient';
import { ENDPOINTS } from '@/src/api/endpoints';
import type { ApiResponse, MutuelleConfig, ConfigMutuelleRequestDto } from '@/src/types';

export const configRepository = {
  getCurrent: () =>
    api.get<ApiResponse<MutuelleConfig>>(ENDPOINTS.CONFIG.CURRENT),

  update: (payload: ConfigMutuelleRequestDto) =>
    api.patch<ApiResponse<MutuelleConfig>>(ENDPOINTS.CONFIG.UPDATE, payload),

  recalculateStatuses: () =>
    api.post<ApiResponse<string>>(ENDPOINTS.CONFIG.RECALCULATE),
};
