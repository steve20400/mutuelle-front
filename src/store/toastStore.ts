import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastState {
  toasts: Toast[];
  show: (opts: Omit<Toast, 'id'>) => void;
  dismiss: (id: string) => void;
  dismissAll: () => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],

  show: ({ type, message, duration = 4000 }) => {
    const id = Math.random().toString(36).slice(2);
    set((state) => ({ toasts: [...state.toasts, { id, type, message, duration }] }));

    // Auto-dismiss
    if (duration > 0) {
      setTimeout(() => {
        set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
      }, duration);
    }
  },

  dismiss: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),

  dismissAll: () => set({ toasts: [] }),
}));

// ─── Hook utilitaire pour déclencher des toasts depuis n'importe quel composant
export function useToast() {
  const { show } = useToastStore();
  return {
    success: (message: string) => show({ type: 'success', message }),
    error: (message: string) => show({ type: 'error', message }),
    warning: (message: string) => show({ type: 'warning', message }),
    info: (message: string) => show({ type: 'info', message }),
  };
}
