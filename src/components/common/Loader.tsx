import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet, Modal } from 'react-native';
import { create } from 'zustand';
import { COLORS } from '@/src/constants';

// ─── Store du loader global ───────────────────────────────────────────────────
interface LoaderState {
  isVisible: boolean;
  message?: string;
  show: (message?: string) => void;
  hide: () => void;
}

export const useLoaderStore = create<LoaderState>((set) => ({
  isVisible: false,
  message: undefined,
  show: (message) => set({ isVisible: true, message }),
  hide: () => set({ isVisible: false, message: undefined }),
}));

/**
 * Hook pour envelopper une opération async avec un loader global
 *
 * @example
 * const { withLoader } = useLoader();
 * await withLoader(() => submitForm(data), 'Envoi en cours...');
 */
export function useLoader() {
  const { show, hide } = useLoaderStore();

  async function withLoader<T>(fn: () => Promise<T>, message?: string): Promise<T> {
    show(message);
    try {
      return await fn();
    } finally {
      hide();
    }
  }

  return { withLoader };
}

/**
 * Overlay loader plein écran — à placer dans le layout racine.
 */
export function GlobalLoader() {
  const { isVisible, message } = useLoaderStore();

  return (
    <Modal visible={isVisible} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <ActivityIndicator size="large" color={COLORS.accent} />
          {message && <Text style={styles.message}>{message}</Text>}
        </View>
      </View>
    </Modal>
  );
}

/**
 * Loader inline pour les listes / pages en chargement.
 */
export function InlineLoader({ message }: { message?: string }) {
  return (
    <View style={styles.inline}>
      <ActivityIndicator size="small" color={COLORS.primary} />
      {message && <Text style={styles.inlineMessage}>{message}</Text>}
    </View>
  );
}

/**
 * Skeleton line générique pour les placeholders de chargement.
 */
export function SkeletonLine({ width = '100%', height = 16 }: { width?: number | string; height?: number }) {
  return (
    <View
      style={[
        styles.skeleton,
        { width: width as number, height },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(13, 31, 60, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 28,
    alignItems: 'center',
    gap: 14,
    minWidth: 140,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 10,
  },
  message: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  inline: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 8,
  },
  inlineMessage: {
    color: COLORS.gray[500],
    fontSize: 13,
  },
  skeleton: {
    backgroundColor: COLORS.gray[200],
    borderRadius: 6,
  },
});
