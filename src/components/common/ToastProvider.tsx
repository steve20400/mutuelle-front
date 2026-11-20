import React from 'react';
import { View, Text, Pressable, StyleSheet, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useToastStore, type Toast } from '@/src/store/toastStore';
import { COLORS } from '@/src/constants';

const TOAST_COLORS: Record<Toast['type'], { bg: string; text: string; border: string }> = {
  success: { bg: '#ECFDF5', text: '#065F46', border: '#10B981' },
  error:   { bg: '#FEF2F2', text: '#991B1B', border: '#EF4444' },
  warning: { bg: '#FFFBEB', text: '#92400E', border: '#F59E0B' },
  info:    { bg: '#EFF6FF', text: '#1E40AF', border: '#3B82F6' },
};

const TOAST_ICONS: Record<Toast['type'], string> = {
  success: '✓',
  error: '✕',
  warning: '⚠',
  info: 'ℹ',
};

function ToastItem({ toast }: { toast: Toast }) {
  const { dismiss } = useToastStore();
  const colors = TOAST_COLORS[toast.type];

  return (
    <Pressable
      onPress={() => dismiss(toast.id)}
      style={[styles.toast, { backgroundColor: colors.bg, borderLeftColor: colors.border }]}
    >
      <Text style={[styles.icon, { color: colors.border }]}>{TOAST_ICONS[toast.type]}</Text>
      <Text style={[styles.message, { color: colors.text }]} numberOfLines={3}>
        {toast.message}
      </Text>
    </Pressable>
  );
}

/**
 * À placer une seule fois dans le layout racine (_layout.tsx)
 * Les toasts se superposent automatiquement à tous les écrans.
 */
export function ToastProvider() {
  const toasts = useToastStore((s) => s.toasts);
  const insets = useSafeAreaInsets();

  if (toasts.length === 0) return null;

  return (
    <View style={[styles.container, { top: insets.top + 12 }]} pointerEvents="box-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 9999,
    gap: 8,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 10,
    borderLeftWidth: 4,
    paddingVertical: 12,
    paddingHorizontal: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 6,
    gap: 10,
  },
  icon: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 1,
  },
  message: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
});
