export const APP_NAME = 'Mutuelle';

// iOS/Android device physique (même WiFi que la machine hôte) : utiliser l'IP de la machine
// Émulateur Android : http://10.0.2.2:8080
// Simulateur iOS    : http://localhost:8080
// Production        : https://mutuelle-mobile-api-2025.onrender.com
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? 'https://mutuelle-mobile-api-2025.onrender.com';

export const SECURE_STORE_KEYS = {
  ACCESS_TOKEN: 'mutuelle_access_token',
  REFRESH_TOKEN: 'mutuelle_refresh_token',
  PIN: 'mutuelle_pin',
} as const;

export const PIN_LENGTH = 4;

export const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY ?? '';

export const COLORS = {
  primary: '#0D1F3C',
  primaryLight: '#1A3357',
  accent: '#2DD4BF',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  white: '#FFFFFF',
  black: '#000000',
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },
} as const;
