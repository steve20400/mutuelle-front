import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useContextStore } from '@/src/store/contextStore';
import { COLORS } from '@/src/constants';
import { TransactionList } from '@/src/components/transactions';

export default function HistoriqueScreen() {
  const { context } = useContextStore();
  const accountId = context?.memberProfile?.idAccount;

  const filters = useMemo(
    () => (accountId !== undefined ? { accountMemberId: accountId } : {}),
    [accountId]
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Historique</Text>
      </View>

      <TransactionList
        filters={filters}
        showFilters
        pageSize={20}
        emptyLabel="Aucune transaction dans votre historique"
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
});
