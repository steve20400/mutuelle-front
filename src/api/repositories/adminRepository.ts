import { api } from '@/src/lib/apiClient';
import { ENDPOINTS } from '@/src/api/endpoints';
import type { ApiResponse, AdminProfileDTO } from '@/src/types';

export const adminRepository = {
  updateMe: (payload: { firstname?: string; lastname?: string; phone?: string }) =>
    api.patch<ApiResponse<AdminProfileDTO>>(ENDPOINTS.ADMINS.ME, payload),

  updatePassword: (payload: {
    currentPassword: string;
    newPassword: string;
    confirmNewPassword: string;
  }) => api.patch<ApiResponse<void>>(ENDPOINTS.ADMINS.ME_PASSWORD, payload),

  updateEmail: (payload: { newEmail: string; password: string }) =>
    api.patch<ApiResponse<AdminProfileDTO>>(ENDPOINTS.ADMINS.ME_EMAIL, payload),
};
