import { api } from '@/src/lib/apiClient';
import { ENDPOINTS } from '@/src/api/endpoints';
import type { ApiResponse, ExerciceResponseDTO, ExerciceRequestDTO } from '@/src/types';

export const exerciceRepository = {
  getAll: () =>
    api.get<ApiResponse<ExerciceResponseDTO[]>>(ENDPOINTS.EXERCICES.BASE),

  getCurrent: () =>
    api.get<ApiResponse<ExerciceResponseDTO>>(ENDPOINTS.EXERCICES.CURRENT),

  getById: (id: number) =>
    api.get<ApiResponse<ExerciceResponseDTO>>(ENDPOINTS.EXERCICES.BY_ID(id)),

  create: (payload: ExerciceRequestDTO) =>
    api.post<ApiResponse<ExerciceResponseDTO>>(ENDPOINTS.EXERCICES.BASE, payload),

  update: (id: number, payload: ExerciceRequestDTO) =>
    api.put<ApiResponse<ExerciceResponseDTO>>(ENDPOINTS.EXERCICES.BY_ID(id), payload),

  delete: (id: number) =>
    api.delete<ApiResponse<void>>(ENDPOINTS.EXERCICES.BY_ID(id)),

  start: (id: number) =>
    api.post<ApiResponse<ExerciceResponseDTO>>(ENDPOINTS.EXERCICES.START(id)),

  close: (id: number) =>
    api.post<ApiResponse<ExerciceResponseDTO>>(ENDPOINTS.EXERCICES.CLOSE(id)),
};
