import { api } from '@/src/lib/apiClient';
import { ENDPOINTS } from '@/src/api/endpoints';
import type {
  ApiResponse,
  MemberSessionBilanDTO,
  MemberExerciceBilanDTO,
  SessionHistoryResponseDTO,
  MutuelleExerciceBilanDTO,
} from '@/src/types';

export const bilanRepository = {
  getSessionMembers: (sessionId: number) =>
    api.get<ApiResponse<MemberSessionBilanDTO[]>>(ENDPOINTS.BILAN.SESSION_MEMBERS(sessionId)),

  getMutuelleSession: (sessionId: number) =>
    api.get<ApiResponse<SessionHistoryResponseDTO>>(ENDPOINTS.BILAN.MUTUELLE_SESSION(sessionId)),

  getMutuelleExercice: (exerciceId: number) =>
    api.get<ApiResponse<MutuelleExerciceBilanDTO>>(ENDPOINTS.BILAN.MUTUELLE_EXERCICE(exerciceId)),

  getMemberSessions: (memberId: number) =>
    api.get<ApiResponse<MemberSessionBilanDTO[]>>(ENDPOINTS.BILAN.MEMBER_SESSIONS(memberId)),

  getMemberSession: (memberId: number, sessionId: number) =>
    api.get<ApiResponse<MemberSessionBilanDTO>>(ENDPOINTS.BILAN.MEMBER_SESSION(memberId, sessionId)),

  getMemberExercices: (memberId: number) =>
    api.get<ApiResponse<MemberExerciceBilanDTO[]>>(ENDPOINTS.BILAN.MEMBER_EXERCICES(memberId)),

  getMemberExercice: (memberId: number, exerciceId: number) =>
    api.get<ApiResponse<MemberExerciceBilanDTO>>(ENDPOINTS.BILAN.MEMBER_EXERCICE(memberId, exerciceId)),

  getExerciceMembers: (exerciceId: number) =>
    api.get<ApiResponse<MemberExerciceBilanDTO[]>>(ENDPOINTS.BILAN.EXERCICE_MEMBERS(exerciceId)),
};
