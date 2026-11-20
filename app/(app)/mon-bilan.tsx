import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useContextStore } from '@/src/store/contextStore';
import { COLORS } from '@/src/constants';
import { formatFullName } from '@/src/utils/format';
import { MemberBilanView } from '@/src/components/bilan/MemberBilanView';

export default function MonBilanScreen() {
  const router = useRouter();
  const profile = useContextStore((s) => s.context?.memberProfile ?? null);

  const memberId = profile?.id ?? null;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="arrow-back" size={22} color={COLORS.gray[700]} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.title}>Mes Bilans</Text>
          {profile && (
            <Text style={styles.subtitle}>
              {formatFullName(profile.firstname, profile.lastname)}
            </Text>
          )}
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {memberId !== null ? (
          <MemberBilanView memberId={memberId} />
        ) : (
          <View style={styles.empty}>
            <Ionicons name="person-outline" size={48} color={COLORS.gray[300]} />
            <Text style={styles.emptyText}>Profil membre non disponible</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.gray[50] },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  headerText: { flex: 1 },
  title: { fontSize: 20, fontWeight: '800', color: COLORS.gray[900] },
  subtitle: { fontSize: 12, color: COLORS.gray[400], marginTop: 1 },
  scroll: { flex: 1 },
  content: { padding: 14, gap: 12, paddingBottom: 40 },
  empty: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 15, color: COLORS.gray[400] },
});
