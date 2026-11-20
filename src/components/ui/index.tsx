import React from 'react';
import {
  TouchableOpacity,
  Text,
  View,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  type TouchableOpacityProps,
  type TextInputProps,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { COLORS } from '@/src/constants';

// ─────────────────────────────────────────────────────────────────────────────
// Button
// ─────────────────────────────────────────────────────────────────────────────
interface ButtonProps extends TouchableOpacityProps {
  label: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
}

export function Button({
  label,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  disabled,
  style,
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || isLoading;

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      disabled={isDisabled}
      style={[
        styles.btn,
        styles[`btn_${variant}`],
        styles[`btn_${size}`],
        isDisabled && styles.btn_disabled,
        style as ViewStyle,
      ]}
      {...rest}
    >
      {isLoading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? '#FFF' : COLORS.primary}
        />
      ) : (
        <>
          {leftIcon}
          <Text style={[styles.btnText, styles[`btnText_${variant}`], styles[`btnText_${size}`]]}>
            {label}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Input
// ─────────────────────────────────────────────────────────────────────────────
interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export function Input({ label, error, hint, leftIcon, rightIcon, style, ...rest }: InputProps) {
  return (
    <View style={styles.inputWrapper}>
      {label && <Text style={styles.inputLabel}>{label}</Text>}
      <View style={[styles.inputContainer, error ? styles.inputError : styles.inputNormal]}>
        {leftIcon && <View style={styles.inputIcon}>{leftIcon}</View>}
        <TextInput
          style={[styles.input, leftIcon ? styles.inputWithIcon : undefined, style as TextStyle]}
          placeholderTextColor={COLORS.gray[400]}
          autoCapitalize="none"
          {...rest}
        />
        {rightIcon && <View style={styles.inputIconRight}>{rightIcon}</View>}
      </View>
      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : hint ? (
        <Text style={styles.hintText}>{hint}</Text>
      ) : null}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Badge
// ─────────────────────────────────────────────────────────────────────────────
interface BadgeProps {
  label: string;
  color?: string;
  bgColor?: string;
  size?: 'sm' | 'md';
}

export function Badge({ label, color = COLORS.primary, bgColor = COLORS.gray[100], size = 'md' }: BadgeProps) {
  return (
    <View style={[styles.badge, { backgroundColor: bgColor }, size === 'sm' && styles.badge_sm]}>
      <Text style={[styles.badgeText, { color }, size === 'sm' && styles.badgeText_sm]}>
        {label}
      </Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Card
// ─────────────────────────────────────────────────────────────────────────────
interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
}

export function Card({ children, style, onPress }: CardProps) {
  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.8} onPress={onPress} style={[styles.card, style]}>
        {children}
      </TouchableOpacity>
    );
  }
  return <View style={[styles.card, style]}>{children}</View>;
}

// ─────────────────────────────────────────────────────────────────────────────
// EmptyState
// ─────────────────────────────────────────────────────────────────────────────
interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: { label: string; onPress: () => void };
}

export function EmptyState({ icon = '📭', title, description, action }: EmptyStateProps) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyIcon}>{icon}</Text>
      <Text style={styles.emptyTitle}>{title}</Text>
      {description && <Text style={styles.emptyDesc}>{description}</Text>}
      {action && (
        <Button label={action.label} onPress={action.onPress} variant="secondary" style={{ marginTop: 16 }} />
      )}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  // Button
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    gap: 8,
  },
  btn_primary: { backgroundColor: COLORS.primary },
  btn_secondary: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: COLORS.primary },
  btn_danger: { backgroundColor: COLORS.error },
  btn_ghost: { backgroundColor: 'transparent' },
  btn_disabled: { opacity: 0.5 },
  btn_sm: { paddingVertical: 8, paddingHorizontal: 14 },
  btn_md: { paddingVertical: 13, paddingHorizontal: 20 },
  btn_lg: { paddingVertical: 16, paddingHorizontal: 24 },
  btnText: { fontWeight: '600' },
  btnText_primary: { color: '#FFFFFF' },
  btnText_secondary: { color: COLORS.primary },
  btnText_danger: { color: '#FFFFFF' },
  btnText_ghost: { color: COLORS.primary },
  btnText_sm: { fontSize: 13 },
  btnText_md: { fontSize: 15 },
  btnText_lg: { fontSize: 16 },

  // Input
  inputWrapper: { gap: 6 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: COLORS.gray[700] },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1.5,
    backgroundColor: '#FFFFFF',
  },
  inputNormal: { borderColor: COLORS.gray[300] },
  inputError: { borderColor: COLORS.error },
  inputIcon: { paddingLeft: 14 },
  inputIconRight: { paddingRight: 14 },
  input: {
    flex: 1,
    paddingVertical: 13,
    paddingHorizontal: 14,
    fontSize: 15,
    color: COLORS.gray[900],
  },
  inputWithIcon: { paddingLeft: 8 },
  errorText: { fontSize: 12, color: COLORS.error, fontWeight: '500' },
  hintText: { fontSize: 12, color: COLORS.gray[500] },

  // Badge
  badge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start' },
  badge_sm: { paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { fontSize: 13, fontWeight: '600' },
  badgeText_sm: { fontSize: 11 },

  // Card
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },

  // EmptyState
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 8 },
  emptyIcon: { fontSize: 48, marginBottom: 8 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: COLORS.gray[800], textAlign: 'center' },
  emptyDesc: { fontSize: 14, color: COLORS.gray[500], textAlign: 'center', lineHeight: 20 },
});
