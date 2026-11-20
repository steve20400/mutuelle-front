import React from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/src/constants';
import { formatCurrency, formatFullName, formatInitials } from '@/src/utils/format';
import { useBilanSessionMembers } from '@/src/hooks/useBilan';
import type { MemberSessionBilanDTO } from '@/src/types';

// ─── Net badge coloré ─────────────────────────────────────────────────────────

function NetValue({ value }: { value: number }) {
  const color = value > 0 ? COLORS.success : value < 0 ? COLORS.error : COLORS.gray[400];
  const sign = value > 0 ? '+' : '';
  return <Text style={[netStyles.text, { color }]}>{sign}{formatCurrency(value)}</Text>;
}

const netStyles = StyleSheet.create({
  text: { fontSize: 12, fontWeight: '700' },
});

// ─── Ligne membre ─────────────────────────────────────────────────────────────

function MemberRow({
  item,
  onPress,
}: {
  item: MemberSessionBilanDTO;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={rowStyles.container} onPress={onPress} activeOpacity={0.8}>
      <View style={rowStyles.avatar}>
        <Text style={rowStyles.avatarText}>
          {formatInitials(item.memberFirstname, item.memberLastname)}
        </Text>
      </View>
      <View style={rowStyles.info}>
        <Text style={rowStyles.name} numberOfLines={1}>
          {formatFullName(item.memberFirstname, item.memberLastname)}
        </Text>
        <Text style={rowStyles.meta}>N°{item.memberId}</Text>
      </View>
      <View style={rowStyles.right}>
        <NetValue value={item.netSession} />
        <Text style={rowStyles.saving}>{formatCurrency(item.snapshotSavingAmount)}</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={COLORS.gray[300]} />
    </TouchableOpacity>
  );
}

const rowStyles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
    borderWidth: 1,
    borderColor: COLORS.gray[100],
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: { color: COLORS.white, fontSize: 13, fontWeight: '700' },
  info: { flex: 1, gap: 3, minWidth: 0 },
  name: { fontSize: 13, fontWeight: '700', color: COLORS.gray[900] },
  meta: { fontSize: 11, color: COLORS.gray[400] },
  right: { alignItems: 'flex-end', gap: 3 },
  saving: { fontSize: 11, color: COLORS.gray[500] },
});

// ─── Écran ────────────────────────────────────────────────────────────────────

export default function BilanMembresSessionScreen() {
  const router = useRouter();
  const { id, name } = useLocalSearchParams<{ id: string; name: string }>();
  const sessionId = Number(id);

  const { data: membres, isLoading, isError, refetch } = useBilanSessionMembers(
    sessionId || null
  );

  if (!sessionId || isNaN(sessionId)) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.center}>
          <Text style={styles.errorText}>Parametre invalide</Text>
        </View>
      </SafeAreaView>
    );
  }

  const label = name ?? `Session ${sessionId}`;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="arrow-back" size={22} color={COLORS.gray[700]} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.title}>Bilans membres</Text>
          <Text style={styles.subtitle} numberOfLines={1}>{label}</Text>
        </View>
      </View>

      {/* Corps */}
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Chargement des bilans...</Text>
        </View>
      ) : isError ? (
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={48} color={COLORS.error} />
          <Text style={styles.errorText}>Erreur de chargement</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()} activeOpacity={0.7}>
            <Text style={styles.retryText}>Reessayer</Text>
          </TouchableOpacity>
        </View>
      ) : !membres || membres.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="people-outline" size={48} color={COLORS.gray[300]} />
          <Text style={styles.emptyText}>Aucun bilan disponible</Text>
        </View>
      ) : (
        <FlatList
          data={membres}
          keyExtractor={(item) => String(item.memberId)}
          renderItem={({ item }) => (
            <MemberRow
              item={item}
              onPress={() =>
                router.push(`/(app)/members/${item.memberId}/bilan` as never)
              }
            />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <Text style={styles.count}>
              {membres.length} membre{membres.length > 1 ? 's' : ''}
            </Text>
          }
        />
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

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
  title: { fontSize: 18, fontWeight: '800', color: COLORS.gray[900] },
  subtitle: { fontSize: 12, color: COLORS.gray[400], marginTop: 1 },

  list: { padding: 12, gap: 8, paddingBottom: 32 },
  count: {
    fontSize: 12,
    color: COLORS.gray[400],
    fontWeight: '600',
    marginBottom: 4,
  },

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingTop: 60,
  },
  loadingText: { fontSize: 14, color: COLORS.gray[500] },
  emptyText: { fontSize: 15, color: COLORS.gray[500] },
  errorText: { fontSize: 14, color: COLORS.gray[600] },
  retryBtn: {
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  retryText: { fontSize: 13, fontWeight: '600', color: COLORS.primary },
});
