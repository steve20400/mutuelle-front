import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { contributionRepository } from '@/src/api/repositories/contributionRepository';
import { solidariteRepository } from '@/src/api/repositories/solidariteRepository';
import { transactionRepository } from '@/src/api/repositories/transactionRepository';
import { accountRepository } from '@/src/api/repositories/accountRepository';
import { useToast } from '@/src/store/toastStore';
import type { ContributionPaymentRequestDto, PaiementRequest } from '@/src/types';

// ─── Paiement cotisation (inscription, renfoulement) ─────────────────────────

export function usePayContribution() {
  const qc = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (payload: ContributionPaymentRequestDto) =>
      contributionRepository.pay(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['members'] });
      qc.invalidateQueries({ queryKey: ['transactions'] });
      qc.invalidateQueries({ queryKey: ['accounts'] });
      success('Paiement enregistre avec succes');
    },
    onError: (err: unknown) => {
      error((err as { message?: string })?.message ?? 'Erreur lors du paiement');
    },
  });
}

// ─── Paiement solidarité ──────────────────────────────────────────────────────

export function usePaySolidarite() {
  const qc = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (payload: PaiementRequest) => solidariteRepository.payer(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['members'] });
      qc.invalidateQueries({ queryKey: ['transactions'] });
      qc.invalidateQueries({ queryKey: ['accounts'] });
      success('Solidarite payee avec succes');
    },
    onError: (err: unknown) => {
      error((err as { message?: string })?.message ?? 'Erreur lors du paiement');
    },
  });
}

// ─── Transactions d'un membre (par account ID) ───────────────────────────────

export function useMemberTransactions(accountMemberId?: number) {
  return useQuery({
    queryKey: ['transactions', 'member', accountMemberId],
    queryFn: async () => {
      const res = await transactionRepository.getAll({
        accountMemberId,
        size: 100,
        sort: 'createdAt,desc',
      });
      return res.data;
    },
    enabled: !!accountMemberId,
  });
}

// ─── Compte bancaire d'un membre (pour unpaidSolidarityAmount) ───────────────

export function useMemberAccount(memberId?: number) {
  return useQuery({
    queryKey: ['accounts', 'member', memberId],
    queryFn: async () => {
      const res = await accountRepository.getMemberByMemberId(memberId!);
      return res.data;
    },
    enabled: !!memberId,
  });
}
