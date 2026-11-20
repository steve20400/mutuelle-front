import { api } from '@/src/lib/apiClient';
import { ENDPOINTS } from '@/src/api/endpoints';
import type { ApiResponse, AccountMutuelle, AccountMemberDTO } from '@/src/types';

export const accountRepository = {
  getMutuelle: () =>
    api.get<ApiResponse<AccountMutuelle>>(ENDPOINTS.ACCOUNTS.MUTUELLE),

  getAllMembers: () =>
    api.get<ApiResponse<AccountMemberDTO[]>>(ENDPOINTS.ACCOUNTS.MEMBERS),

  getMemberById: (id: number) =>
    api.get<ApiResponse<AccountMemberDTO>>(ENDPOINTS.ACCOUNTS.MEMBER_BY_ID(id)),

  getMemberByMemberId: (memberId: number) =>
    api.get<ApiResponse<AccountMemberDTO>>(ENDPOINTS.ACCOUNTS.MEMBER_BY_MEMBER_ID(memberId)),
};
