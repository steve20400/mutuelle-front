import { api } from '@/src/lib/apiClient';
import { ENDPOINTS } from '@/src/api/endpoints';
import type {
  ApiResponse,
  SessionResponseDTO,
  SessionRequestDTO,
  UpdateSessionRequestDTO,
  SessionHistoryResponseDTO,
} from '@/src/types';

export const sessionRepository = {
  getAll: () =>
    api.get<ApiResponse<SessionResponseDTO[]>>(ENDPOINTS.SESSIONS.BASE),

  getCurrent: () =>
    api.get<ApiResponse<SessionResponseDTO>>(ENDPOINTS.SESSIONS.CURRENT),

  getById: (id: number) =>
    api.get<ApiResponse<SessionResponseDTO>>(ENDPOINTS.SESSIONS.BY_ID(id)),

  create: (payload: SessionRequestDTO) =>
    api.post<ApiResponse<SessionResponseDTO>>(ENDPOINTS.SESSIONS.BASE, payload),

  update: (id: number, payload: UpdateSessionRequestDTO) =>
    api.put<ApiResponse<SessionResponseDTO>>(ENDPOINTS.SESSIONS.BY_ID(id), payload),

  delete: (id: number) =>
    api.delete<ApiResponse<void>>(ENDPOINTS.SESSIONS.BY_ID(id)),

  start: (id: number) =>
    api.post<ApiResponse<SessionResponseDTO>>(ENDPOINTS.SESSIONS.START(id)),

  close: (id: number) =>
    api.post<ApiResponse<SessionResponseDTO>>(ENDPOINTS.SESSIONS.CLOSE(id)),

  getHistory: () =>
    api.get<ApiResponse<SessionHistoryResponseDTO[]>>(ENDPOINTS.SESSIONS.HISTORY),

  getHistoryBySession: (sessionId: number) =>
    api.get<ApiResponse<SessionHistoryResponseDTO[]>>(
      ENDPOINTS.SESSIONS.HISTORY_BY_SESSION(sessionId)
    ),

  getHistoryByExercice: (exerciceId: number) =>
    api.get<ApiResponse<SessionHistoryResponseDTO[]>>(
      ENDPOINTS.SESSIONS.HISTORY_BY_EXERCICE(exerciceId)
    ),
};
