import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTransactions } from '@/src/hooks/useTransactions';
import { COLORS } from '@/src/constants';
import { formatCurrency, formatDate, formatFullName } from '@/src/utils/format';
import type { TransactionResponseDTO } from '@/src/types';

function TransactionItem({ item }: { item: TransactionResponseDTO }) {
  const isCredit = item.transactionDirection === 'CREDIT';
  return (
    <View style={styles.item}>
      <View style={[styles.itemIcon, { backgroundColor: isCredit ? '#D1FAE5' : '#FEE2E2' }]}>
        <Ionicons
          name={isCredit ? 'arrow-down-outline' : 'arrow-up-outline'}
          size={18}
          color={isCredit ? COLORS.success : COLORS.error}
        />
      </View>
      <View style={styles.itemContent}>
        <Text style={styles.itemType}>{item.transactionType}</Text>
        <Text style={styles.itemName}>{item.memberFullName}</Text>
        <Text style={styles.itemDate}>{formatDate(item.createdAt)}</Text>
      </View>
      <Text style={[styles.itemAmount, { color: isCredit ? COLORS.success : COLORS.error }]}>
        {isCredit ? '+' : '-'}{formatCurrency(item.amount)}
      </Text>
    </View>
  );
}

export default function CotisationsScreen() {
  const { data: transactions, isLoading, refetch } = useTransactions({
    type: 'INSCRIPTION',
    size: 50,
  });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Cotisations</Text>
      </View>

      <FlatList
        data={transactions ?? []}
        keyExtractor={(t) => String(t.id)}
        renderItem={({ item }) => <TransactionItem item={item} />}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={COLORS.primary} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="card-outline" size={48} color={COLORS.gray[300]} />
            <Text style={styles.emptyText}>
              {isLoading ? 'Chargement...' : 'Aucune cotisation'}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.gray[50] },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  title: { fontSize: 20, fontWeight: '800', color: COLORS.gray[900] },
  list: { padding: 12, gap: 8, paddingBottom: 24 },
  item: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  itemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemContent: { flex: 1, gap: 2 },
  itemType: { fontSize: 12, color: COLORS.gray[500], fontWeight: '600' },
  itemName: { fontSize: 14, fontWeight: '700', color: COLORS.gray[900] },
  itemDate: { fontSize: 12, color: COLORS.gray[400] },
  itemAmount: { fontSize: 14, fontWeight: '800' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 15, color: COLORS.gray[500] },
});
