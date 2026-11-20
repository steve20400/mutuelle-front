import React, { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { useContextStore } from '@/src/store/contextStore';
import { useToast } from '@/src/store/toastStore';
import { isMember } from '@/src/navigation/roles';
import type { BackendRole } from '@/src/types';

export default function MembersLayout() {
  const router = useRouter();
  const role = useContextStore((s) => s.context?.role ?? null) as BackendRole | null;
  const { error } = useToast();

  useEffect(() => {
    if (role !== null && isMember(role)) {
      error('Accès non autorisé');
      router.replace('/(app)/dashboard' as never);
    }
  }, [role]);

  if (!role || isMember(role)) return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="[id]" />
    </Stack>
  );
}
