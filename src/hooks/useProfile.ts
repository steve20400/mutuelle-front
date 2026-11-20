import { useMutation } from '@tanstack/react-query';
import { memberRepository } from '@/src/api/repositories/memberRepository';
import { adminRepository } from '@/src/api/repositories/adminRepository';
import { useContextStore } from '@/src/store/contextStore';
import { useToast } from '@/src/store/toastStore';
import { isAdmin } from '@/src/navigation/roles';
import type { BackendRole } from '@/src/types';

export function useUpdateProfileInfo() {
  const { success, error } = useToast();
  const { fetchContext } = useContextStore();
  const role = useContextStore((s) => s.context?.role ?? null) as BackendRole | null;

  return useMutation({
    mutationFn: (payload: { firstname?: string; lastname?: string; phone?: string }) => {
      if (isAdmin(role)) return adminRepository.updateMe(payload);
      return memberRepository.updateMe(payload);
    },
    onSuccess: async () => {
      await fetchContext();
      success('Profil mis a jour');
    },
    onError: (err: unknown) => {
      error((err as { message?: string })?.message ?? 'Erreur lors de la mise a jour');
    },
  });
}

export function useUpdatePassword() {
  const { success, error } = useToast();
  const role = useContextStore((s) => s.context?.role ?? null) as BackendRole | null;

  return useMutation({
    mutationFn: (payload: {
      currentPassword: string;
      newPassword: string;
      confirmNewPassword: string;
    }) => {
      if (isAdmin(role)) return adminRepository.updatePassword(payload);
      return memberRepository.updatePassword(payload);
    },
    onSuccess: () => {
      success('Mot de passe modifie');
    },
    onError: (err: unknown) => {
      error((err as { message?: string })?.message ?? 'Erreur lors du changement de mot de passe');
    },
  });
}

export function useUpdateEmail() {
  const { success, error } = useToast();
  const { fetchContext } = useContextStore();
  const role = useContextStore((s) => s.context?.role ?? null) as BackendRole | null;

  return useMutation({
    mutationFn: (payload: { newEmail: string; password: string }) => {
      if (isAdmin(role)) return adminRepository.updateEmail(payload);
      return memberRepository.updateEmail(payload);
    },
    onSuccess: async () => {
      await fetchContext();
      success('Email modifie');
    },
    onError: (err: unknown) => {
      error((err as { message?: string })?.message ?? "Erreur lors du changement d'email");
    },
  });
}
