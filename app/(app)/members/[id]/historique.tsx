import React from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { useGlobalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useMember } from '@/src/hooks/useMembers';
import { useMemberTransactions } from '@/src/hooks/useContribution';
import { COLORS } from '@/src/constants';
import { formatCurrency, formatDate } from '@/src/utils/format';
import { InlineLoader } from '@/src/components/common/Loader';
import type { TransactionResponseDTO, TransactionType } from '@/src/types';

const TYPE_LABELS: Record<TransactionType, string> = {
  INSCRIPTION:            'Inscription',
  EPARGNE:               'Epargne',
  SOLIDARITE:            'Solidarite',
  EMPRUNT:               'Emprunt',
  REMBOURSSEMENT:        'Remboursement',
  RENFOULEMENT:          'Renflouement',
  RENFOULEMENT_INSCRIPTION: 'Renf. inscription',
  RENFOULEMENT_SOLIDARITE:  'Renf. solidarite',
  INTERET:               'Interet',
  ASSISTANCE:            'Assistance',
  AGAPE:                 'Agape',
  PENALITE:              'Penalite',
};

function TransactionRow({ item }: { item: TransactionResponseDTO }) {
  const isCredit = item.transactionDirection === 'CREDIT';
  return (
    <View style={styles.row}>
      <View style={[styles.rowIcon, { borderColor: isCredit ? COLORS.success : COLORS.error }]}>
        <Ionicons
          name={isCredit ? 'arrow-down-outline' : 'arrow-up-outline'}
          size={16}
          color={isCredit ? COLORS.success : COLORS.error}
        />
      </View>
      <View style={styles.rowContent}>
        <Text style={styles.rowType}>
          {TYPE_LABELS[item.transactionType] ?? item.transactionType}
        </Text>
        <Text style={styles.rowDate}>{formatDate(item.createdAt)}</Text>
      </View>
      <Text style={[styles.rowAmount, { color: isCredit ? COLORS.success : COLORS.error }]}>
        {isCredit ? '+' : '-'}{formatCurrency(item.amount)}
      </Text>
    </View>
  );
}

export default function MemberHistoriqueScreen() {
  const { id } = useGlobalSearchParams<{ id: string }>();
  const { data: member, isLoading: memberLoading } = useMember(Number(id));
  const {
    data: transactions,
    isLoading: txLoading,
    refetch,
  } = useMemberTransactions(member?.idAccount);

  const isLoading = memberLoading || txLoading;

  if (isLoading && !transactions) {
    return <InlineLoader message="Chargement de l'historique..." />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={transactions ?? []}
        keyExtractor={(t) => String(t.id)}
        renderItem={({ item }) => <TransactionRow item={item} />}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refetch}
            tintColor={COLORS.primary}
          />
        }
        ListHeaderComponent={
          transactions && transactions.length > 0 ? (
            <Text style={styles.count}>{transactions.length} transaction(s)</Text>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="time-outline" size={48} color={COLORS.gray[300]} />
            <Text style={styles.emptyText}>Aucune transaction</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.gray[50] },
  list: { padding: 12, gap: 8, paddingBottom: 24 },
  count: { fontSize: 12, color: COLORS.gray[500], marginBottom: 4 },
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
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    backgroundColor: COLORS.gray[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowContent: { flex: 1 },
  rowType: { fontSize: 14, fontWeight: '700', color: COLORS.gray[900] },
  rowDate: { fontSize: 12, color: COLORS.gray[400], marginTop: 2 },
  rowAmount: { fontSize: 14, fontWeight: '800' },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    gap: 12,
  },
  emptyText: { fontSize: 15, color: COLORS.gray[500] },
});
