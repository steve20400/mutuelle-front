import { api } from '@/src/lib/apiClient';
import { ENDPOINTS } from '@/src/api/endpoints';
import type { ApiResponse, PushTokenDto } from '@/src/types';

export const notificationRepository = {
  registerToken: (payload: PushTokenDto) =>
    api.post<ApiResponse<void>>(ENDPOINTS.NOTIFICATIONS.PUSH_TOKEN, payload),
};
