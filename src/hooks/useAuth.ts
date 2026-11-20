import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { authRepository } from '@/src/api/repositories/authRepository';
import { useAuthStore } from '@/src/store/authStore';
import { useContextStore } from '@/src/store/contextStore';
import { useToast } from '@/src/store/toastStore';
import { queryClient } from '@/src/lib/queryClient';
import { SECURE_STORE_KEYS } from '@/src/constants'; // utilisé par useForgotPIN
import type { LoginRequest } from '@/src/types';

export function useLogin() {
  const router = useRouter();
  const { setFromLogin } = useAuthStore();
  const { fetchContext } = useContextStore();
  const { error: showError } = useToast();

  return useMutation({
    mutationFn: (payload: LoginRequest) => authRepository.login(payload),
    onSuccess: async (response) => {
      const data = response.data;
      await setFromLogin(data);
      await fetchContext();
      router.replace('/(auth)/pin' as never);
    },
    onError: (err: unknown) => {
      const msg = (err as { message?: string })?.message ?? 'Identifiants incorrects';
      showError(msg);
    },
  });
}

export function useLogout() {
  const router = useRouter();
  const { logout } = useAuthStore();
  const { clearContext } = useContextStore();
  const { error: showError } = useToast();

  return useMutation({
    mutationFn: async () => {
      try {
        await authRepository.logout();
      } catch {
        // Ignore les erreurs réseau lors du logout
      }
      await logout();
      clearContext();
      // Le PIN est conservé — seul "Code PIN oublié" le supprime
      // queryClient.clear() est déplacé dans onSuccess pour ne pas
      // annuler la mutation en cours (MutationCache.clear() interrompt tout)
    },
    onSuccess: () => {
      queryClient.clear();
      router.replace('/(auth)/login' as never);
    },
    onError: (err: unknown) => {
      const msg = (err as { message?: string })?.message ?? 'Erreur lors de la deconnexion';
      showError(msg);
    },
  });
}

export function useForgotPIN() {
  const router = useRouter();
  const { logout } = useAuthStore();
  const { clearContext } = useContextStore();

  return async () => {
    try {
      await authRepository.logout();
    } catch {
      // silent
    }
    await logout();
    clearContext();
    await SecureStore.deleteItemAsync(SECURE_STORE_KEYS.PIN);
    queryClient.clear();
    router.replace('/(auth)/login');
  };
}
