import React from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { useGlobalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useMember } from '@/src/hooks/useMembers';
import { useMemberTransactions } from '@/src/hooks/useContribution';
import { COLORS } from '@/src/constants';
import { formatCurrency, formatDate } from '@/src/utils/format';
import { InlineLoader } from '@/src/components/common/Loader';
import type { TransactionResponseDTO } from '@/src/types';

function SanctionRow({ item }: { item: TransactionResponseDTO }) {
  return (
    <View style={styles.row}>
      <View style={styles.rowIconWrapper}>
        <Ionicons name="warning-outline" size={18} color={COLORS.warning} />
      </View>
      <View style={styles.rowContent}>
        <Text style={styles.rowType}>
          {item.transactionType === 'PENALITE' ? 'Penalite' : 'Interet de retard'}
        </Text>
        <Text style={styles.rowDate}>{formatDate(item.createdAt)}</Text>
      </View>
      <Text style={styles.rowAmount}>{formatCurrency(item.amount)}</Text>
    </View>
  );
}

export default function MemberSanctionsScreen() {
  const { id } = useGlobalSearchParams<{ id: string }>();
  const { data: member, isLoading: memberLoading } = useMember(Number(id));
  const {
    data: allTx,
    isLoading: txLoading,
    refetch,
  } = useMemberTransactions(member?.idAccount);

  const isLoading = memberLoading || txLoading;

  // Filtrer uniquement les pénalités et intérêts
  const sanctions = (allTx ?? []).filter(
    (t) => t.transactionType === 'PENALITE' || t.transactionType === 'INTERET'
  );

  const totalSanctions = sanctions.reduce((sum, t) => sum + t.amount, 0);

  if (isLoading && !allTx) {
    return <InlineLoader message="Chargement des sanctions..." />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={sanctions}
        keyExtractor={(t) => String(t.id)}
        renderItem={({ item }) => <SanctionRow item={item} />}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refetch}
            tintColor={COLORS.primary}
          />
        }
        ListHeaderComponent={
          sanctions.length > 0 ? (
            <View style={styles.summary}>
              <Ionicons name="warning" size={16} color={COLORS.warning} />
              <Text style={styles.summaryText}>
                {sanctions.length} sanction(s) — Total : {formatCurrency(totalSanctions)}
              </Text>
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyBadge}>
              <Ionicons name="shield-checkmark-outline" size={52} color={COLORS.success} />
            </View>
            <Text style={styles.emptyTitle}>Aucune sanction</Text>
            <Text style={styles.emptyDesc}>
              Ce membre n'a aucune penalite ni interet de retard enregistre.
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.gray[50] },
  list: { padding: 12, gap: 8, paddingBottom: 32 },

  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.white,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 4,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.warning,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  summaryText: { fontSize: 13, fontWeight: '600', color: COLORS.gray[800] },

  row: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  rowIconWrapper: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowContent: { flex: 1 },
  rowType: { fontSize: 14, fontWeight: '700', color: COLORS.gray[900] },
  rowDate: { fontSize: 12, color: COLORS.gray[400], marginTop: 2 },
  rowAmount: { fontSize: 14, fontWeight: '800', color: COLORS.warning },

  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 64,
    gap: 12,
    paddingHorizontal: 24,
  },
  emptyBadge: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: COLORS.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: COLORS.gray[800] },
  emptyDesc: {
    fontSize: 13,
    color: COLORS.gray[400],
    textAlign: 'center',
    lineHeight: 20,
  },
});
