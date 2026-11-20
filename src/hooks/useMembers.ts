import { useQuery, useMutation, useQueryClient, useInfiniteQuery, keepPreviousData } from '@tanstack/react-query';
import { memberRepository, MemberListParams } from '@/src/api/repositories/memberRepository';
import { useAuthStore } from '@/src/store/authStore';
import { useToast } from '@/src/store/toastStore';
import type {
  MemberRegisterDTO,
  MemberUpdateDTO,
  MemberStatusUpdateDTO,
  MemberMutuelleStatusUpdateDTO,
} from '@/src/types';

const KEYS = {
  all: ['members'] as const,
  list: (params: MemberListParams) => ['members', 'list', params] as const,
  detail: (id: number) => ['members', id] as const,
  me: ['members', 'me'] as const,
};

export function useInfiniteMembers(params: Omit<MemberListParams, 'page'> = {}) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const pageSize = params.size ?? 10;

  return useInfiniteQuery({
    queryKey: ['members', 'infinite', { ...params, size: pageSize }],
    initialPageParam: 0,
    placeholderData: keepPreviousData,
    queryFn: async ({ pageParam }) => {
      const res = await memberRepository.getAll({
        ...params,
        page: pageParam as number,
        size: pageSize,
      });
      return {
        items: res.data ?? [],
        totalElements: res.totalElements ?? 0,
        totalPages: res.totalPages ?? 1,
        currentPage: res.currentPage ?? (pageParam as number),
      };
    },
    getNextPageParam: (lastPage) => {
      const next = lastPage.currentPage + 1;
      return next < lastPage.totalPages ? next : undefined;
    },
    enabled: isAuthenticated,
  });
}

export function useMembers(params: MemberListParams = {}) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return useQuery({
    queryKey: KEYS.list(params),
    queryFn: async () => {
      const res = await memberRepository.getAll(params);
      return res.data;
    },
    enabled: isAuthenticated,
  });
}

export function useMember(id: number) {
  return useQuery({
    queryKey: KEYS.detail(id),
    queryFn: async () => {
      const res = await memberRepository.getById(id);
      return res.data;
    },
    enabled: !!id,
  });
}

export function useMyProfile() {
  return useQuery({
    queryKey: KEYS.me,
    queryFn: async () => {
      const res = await memberRepository.getMe();
      return res.data;
    },
  });
}

export function useRegisterMember() {
  const qc = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (payload: MemberRegisterDTO) => memberRepository.register(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      success('Membre inscrit avec succes');
    },
    onError: (err: unknown) => {
      error((err as { message?: string })?.message ?? 'Erreur lors de l\'inscription');
    },
  });
}

export function useUpdateMyProfile() {
  const qc = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (payload: MemberUpdateDTO) => memberRepository.updateMe(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.me });
      success('Profil mis a jour');
    },
    onError: (err: unknown) => {
      error((err as { message?: string })?.message ?? 'Erreur lors de la mise a jour');
    },
  });
}

export function useUpdateMember() {
  const qc = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: { firstname?: string; lastname?: string; phone?: string };
    }) => memberRepository.updateById(id, payload),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: KEYS.detail(id) });
      qc.invalidateQueries({ queryKey: KEYS.all });
      success('Informations mises a jour');
    },
    onError: (err: unknown) => {
      error((err as { message?: string })?.message ?? 'Erreur lors de la mise a jour');
    },
  });
}

export function useUpdateMyEmail() {
  const qc = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (payload: { newEmail: string; password: string }) =>
      memberRepository.updateEmail(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.me });
      success('Adresse email mise a jour');
    },
    onError: (err: unknown) => {
      error((err as { message?: string })?.message ?? 'Erreur lors du changement d\'email');
    },
  });
}

export function useUpdateMyPassword() {
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (payload: {
      currentPassword: string;
      newPassword: string;
      confirmNewPassword: string;
    }) => memberRepository.updatePassword(payload),
    onSuccess: () => {
      success('Mot de passe modifie avec succes');
    },
    onError: (err: unknown) => {
      error((err as { message?: string })?.message ?? 'Erreur lors du changement de mot de passe');
    },
  });
}

export function useToggleMemberStatus() {
  const qc = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: MemberStatusUpdateDTO }) =>
      memberRepository.toggleStatus(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      success('Statut mis a jour');
    },
    onError: (err: unknown) => {
      error((err as { message?: string })?.message ?? 'Erreur');
    },
  });
}

export function useChangeMutuelleStatus() {
  const qc = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: MemberMutuelleStatusUpdateDTO }) =>
      memberRepository.changeMutuelleStatus(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      success('Statut mutuelle mis a jour');
    },
    onError: (err: unknown) => {
      error((err as { message?: string })?.message ?? 'Erreur');
    },
  });
}
