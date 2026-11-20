import { api } from '@/src/lib/apiClient';
import { ENDPOINTS } from '@/src/api/endpoints';
import type { ApiResponse, LoginRequest, LoginResponseDto, RefreshResponseDto } from '@/src/types';

export const authRepository = {
  login: (payload: LoginRequest) =>
    api.post<ApiResponse<LoginResponseDto>>(ENDPOINTS.AUTH.LOGIN, payload, { skipRefresh: true } as never),

  logout: () =>
    api.post<ApiResponse<void>>(ENDPOINTS.AUTH.LOGOUT),

  refresh: (refreshToken: string) =>
    api.post<ApiResponse<RefreshResponseDto>>(ENDPOINTS.AUTH.REFRESH, { refreshToken }, { skipRefresh: true } as never),
};
