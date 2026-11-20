import { api } from '@/src/lib/apiClient';
import { ENDPOINTS } from '@/src/api/endpoints';
import type {
  ApiResponse,
  MemberResponseDTO,
  MemberRegisterDTO,
  MemberUpdateDTO,
  MemberStatusUpdateDTO,
  MemberMutuelleStatusUpdateDTO,
} from '@/src/types';

export interface MemberListParams {
  search?: string;
  active?: boolean;
  page?: number;
  size?: number;
  sort?: string;
}

function buildQuery(params: MemberListParams): string {
  const q = new URLSearchParams();
  if (params.search) q.set('search', params.search);
  if (params.active !== undefined) q.set('active', String(params.active));
  if (params.page !== undefined) q.set('page', String(params.page));
  if (params.size !== undefined) q.set('size', String(params.size));
  if (params.sort) q.set('sort', params.sort);
  const str = q.toString();
  return str ? `?${str}` : '';
}

export const memberRepository = {
  getAll: (params: MemberListParams = {}) =>
    api.get<ApiResponse<MemberResponseDTO[]>>(
      `${ENDPOINTS.MEMBERS.BASE}${buildQuery(params)}`
    ),

  getById: (id: number) =>
    api.get<ApiResponse<MemberResponseDTO>>(ENDPOINTS.MEMBERS.BY_ID(id)),

  getMe: () =>
    api.get<ApiResponse<MemberResponseDTO>>(ENDPOINTS.MEMBERS.ME),

  register: (payload: MemberRegisterDTO) =>
    api.post<ApiResponse<MemberResponseDTO>>(ENDPOINTS.MEMBERS.REGISTER, payload),

  updateMe: (payload: MemberUpdateDTO) =>
    api.patch<ApiResponse<MemberResponseDTO>>(ENDPOINTS.MEMBERS.ME, payload),

  updateById: (id: number, payload: { firstname?: string; lastname?: string; phone?: string }) =>
    api.patch<ApiResponse<MemberResponseDTO>>(ENDPOINTS.MEMBERS.BY_ID(id), payload),

  updatePassword: (payload: { currentPassword: string; newPassword: string; confirmNewPassword: string }) =>
    api.patch<ApiResponse<void>>(ENDPOINTS.MEMBERS.ME_PASSWORD, payload),

  updateEmail: (payload: { newEmail: string; password: string }) =>
    api.patch<ApiResponse<MemberResponseDTO>>(ENDPOINTS.MEMBERS.ME_EMAIL, payload),

  toggleStatus: (id: number, payload: MemberStatusUpdateDTO) =>
    api.patch<ApiResponse<MemberResponseDTO>>(ENDPOINTS.MEMBERS.STATUS(id), payload),

  changeMutuelleStatus: (id: number, payload: MemberMutuelleStatusUpdateDTO) =>
    api.patch<ApiResponse<MemberResponseDTO>>(ENDPOINTS.MEMBERS.MUTUELLE_STATUS(id), payload),
};
