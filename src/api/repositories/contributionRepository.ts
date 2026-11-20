import { api } from '@/src/lib/apiClient';
import { ENDPOINTS } from '@/src/api/endpoints';
import type { ApiResponse, ContributionPaymentRequestDto, ContributionPaymentResponseDto } from '@/src/types';

export const contributionRepository = {
  pay: (payload: ContributionPaymentRequestDto) =>
    api.post<ApiResponse<ContributionPaymentResponseDto>>(ENDPOINTS.CONTRIBUTIONS.PAY, payload),
};
