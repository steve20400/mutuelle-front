import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, APP_NAME } from '@/src/constants';
import { useContextStore } from '@/src/store/contextStore';

interface AppHeaderProps {
  title?: string;
}

export function AppHeader({ title }: AppHeaderProps) {
  const { top } = useSafeAreaInsets();
  const { context } = useContextStore();

  const profile = context?.adminProfile ?? context?.memberProfile;
  const initials = profile
    ? `${profile.firstname.charAt(0)}${profile.lastname.charAt(0)}`.toUpperCase()
    : '?';

  return (
    <View style={[styles.container, { paddingTop: top + 10 }]}>
      <Text style={styles.logo}>{title ?? APP_NAME}</Text>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{initials}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 14,
    backgroundColor: COLORS.primary,
  },
  logo: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: 0.5,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { fontSize: 13, fontWeight: '700', color: COLORS.white },
});
