import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRenfoulement } from '@/src/hooks/useRenfoulement';
import { COLORS } from '@/src/constants';
import { formatCurrency, formatDate } from '@/src/utils/format';
import { TransactionList } from '@/src/components/transactions';
import type { RenfoulementHistoryItemDto, RenfoulementSimulationDto } from '@/src/types';

// ─── Ligne info ───────────────────────────────────────────────────────────────

function InfoRow({ label, value, light }: { label: string; value: string; light?: boolean }) {
  return (
    <View style={infoStyles.row}>
      <Text style={[infoStyles.label, light && infoStyles.labelLight]}>{label}</Text>
      <Text style={[infoStyles.value, light && infoStyles.valueLight]}>{value}</Text>
    </View>
  );
}

const infoStyles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { fontSize: 13, color: COLORS.gray[600] },
  value: { fontSize: 13, fontWeight: '700', color: COLORS.gray[800] },
  labelLight: { color: 'rgba(255,255,255,0.6)' },
  valueLight: { color: COLORS.white },
});

// ─── Carte renfoulement passé ─────────────────────────────────────────────────

function RenfoulementCard({ item }: { item: RenfoulementHistoryItemDto }) {
  return (
    <View style={cardStyles.card}>
      <View style={cardStyles.header}>
        <Text style={cardStyles.name}>{item.exerciceName}</Text>
        <Text style={cardStyles.date}>{formatDate(item.calculatedAt)}</Text>
      </View>
      <View style={cardStyles.divider} />
      <InfoRow label="Montant unitaire"       value={formatCurrency(item.unitAmount)} />
      <InfoRow label="Membres de base"        value={String(item.baseMembersCount)} />
      <InfoRow label="Membres distribues"     value={String(item.distributedMembersCount)} />
      <InfoRow label="Total distribue"        value={formatCurrency(item.totalToDistributeAmount)} />
      <InfoRow label="Total attendu"          value={formatCurrency(item.expectedTotalAmount)} />
    </View>
  );
}

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.gray[50],
    borderRadius: 12,
    padding: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: 14, fontWeight: '800', color: COLORS.primary, flex: 1 },
  date: { fontSize: 12, color: COLORS.gray[400] },
  divider: { height: 1, backgroundColor: COLORS.gray[200] },
});

// ─── Header du FlatList (simulation + historique) ─────────────────────────────

function RenfoulementHeader({
  isLoading,
  simulation,
  past,
}: {
  isLoading: boolean;
  simulation: RenfoulementSimulationDto | null;
  past: RenfoulementHistoryItemDto[];
}) {
  return (
    <View style={headerStyles.root}>
      {/* Simulation exercice en cours */}
      {simulation && (
        <View style={headerStyles.simulCard}>
          <Text style={headerStyles.simulTag}>EXERCICE EN COURS</Text>
          <Text style={headerStyles.simulName}>{simulation.exerciceName}</Text>
          <View style={headerStyles.divider} />
          <InfoRow light label="Membres à jour"    value={String(simulation.estimatedBaseMembersCount)} />
          <InfoRow light label="Membres eligibles"  value={String(simulation.estimatedDistributedMembersCount)} />
          <InfoRow light label="Total attendu"      value={formatCurrency(simulation.estimatedExpectedTotalAmount)} />
          <View style={[headerStyles.statusBanner, { backgroundColor: simulation.isPossible ? '#D1FAE5' : '#FEE2E2' }]}>
            <Ionicons
              name={simulation.isPossible ? 'checkmark-circle-outline' : 'close-circle-outline'}
              size={16}
              color={simulation.isPossible ? '#065F46' : '#991B1B'}
            />
            <Text style={[headerStyles.statusText, { color: simulation.isPossible ? '#065F46' : '#991B1B' }]}>
              {simulation.message}
            </Text>
          </View>
          <InfoRow light label="Montant unitaire"   value={formatCurrency(simulation.estimatedUnitAmount)} />
        </View>
      )}

      {/* Historique des renfoulements */}
      <View style={headerStyles.section}>
        <Text style={headerStyles.sectionTitle}>
          Historique ({past.length})
        </Text>
        {isLoading ? (
          <ActivityIndicator color={COLORS.primary} style={{ marginVertical: 12 }} />
        ) : past.length === 0 ? (
          <View style={headerStyles.empty}>
            <Ionicons name="time-outline" size={36} color={COLORS.gray[300]} />
            <Text style={headerStyles.emptyText}>Aucun renfoulement enregistre</Text>
          </View>
        ) : (
          <View style={{ gap: 10 }}>
            {past.map((item) => (
              <RenfoulementCard key={item.id} item={item} />
            ))}
          </View>
        )}
      </View>

      {/* Titre de la section transactions */}
      <Text style={headerStyles.txTitle}>TRANSACTIONS</Text>
    </View>
  );
}

const headerStyles = StyleSheet.create({
  root: { gap: 16, paddingTop: 4 },

  simulCard: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    padding: 16,
    gap: 10,
  },
  simulTag: { fontSize: 10, color: 'rgba(255,255,255,0.5)', fontWeight: '700', letterSpacing: 1.5 },
  simulName: { fontSize: 18, fontWeight: '800', color: COLORS.white },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.15)' },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 10,
    borderRadius: 8,
    marginTop: 4,
  },
  statusText: { fontSize: 13, fontWeight: '600', flex: 1 },

  section: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: COLORS.gray[500], letterSpacing: 0.5 },

  empty: { alignItems: 'center', gap: 8, paddingVertical: 12 },
  emptyText: { fontSize: 13, color: COLORS.gray[400] },

  txTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.gray[500],
    letterSpacing: 1,
    paddingHorizontal: 4,
    marginTop: 4,
  },
});

// ─── Écran principal ──────────────────────────────────────────────────────────

export default function RenfoulementScreen() {
  const { data, isLoading, refetch } = useRenfoulement();

  const simulation = data?.currentSimulation ?? null;
  const past = data?.pastRenfoulements ?? [];

  const listHeader = useMemo(
    () => (
      <RenfoulementHeader isLoading={isLoading} simulation={simulation} past={past} />
    ),
    [isLoading, simulation, past]
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Renfoulement</Text>
      </View>

      <TransactionList
        filters={{ type: 'RENFOULEMENT' }}
        showFilters
        showMemberName
        pageSize={5}
        emptyLabel="Aucune transaction de renfoulement"
        ListHeaderComponent={listHeader}
        onRefresh={refetch}
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
