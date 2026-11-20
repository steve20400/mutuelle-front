import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/src/constants';

interface Props {
  title: string;
  icon?: keyof typeof Ionicons.glyphMap;
  description?: string;
}

export function PlaceholderScreen({
  title,
  icon = 'construct-outline',
  description = 'Cette fonctionnalite est en cours de developpement.',
}: Props) {
  return (
    <View style={styles.container}>
      <Ionicons name={icon} size={56} color={COLORS.gray[300]} />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.gray[50],
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 12,
  },
  title: { fontSize: 18, fontWeight: '700', color: COLORS.gray[700], textAlign: 'center' },
  description: { fontSize: 14, color: COLORS.gray[400], textAlign: 'center', lineHeight: 20 },
});
