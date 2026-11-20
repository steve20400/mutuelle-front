import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useGlobalSearchParams, useLocalSearchParams } from 'expo-router';
import { COLORS } from '@/src/constants';
import { MemberBilanView } from '@/src/components/bilan/MemberBilanView';

export default function MemberBilanTab() {
  const { id } = useGlobalSearchParams<{ id: string }>();
  const memberId = Number(id);

  if (!memberId || isNaN(memberId)) {
    return (
      <View style={styles.error}>
        <Text style={styles.errorText}>Identifiant membre invalide</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <MemberBilanView memberId={memberId} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: COLORS.gray[50] },
  content: { padding: 14, gap: 12, paddingBottom: 40 },
  error: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { fontSize: 14, color: COLORS.error },
});
