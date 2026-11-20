import React from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useContextStore } from '@/src/store/contextStore';
import { COLORS } from '@/src/constants';
import { formatCurrency } from '@/src/utils/format';
import { BorrowingCeilingGrid } from '@/src/components/common/BorrowingCeilingGrid';

// ─── Titre de section ─────────────────────────────────────────────────────────

function SectionTitle({ label }: { label: string }) {
  return <Text style={styles.sectionTitle}>{label}</Text>;
}

// ─── Ligne groupée (label à gauche, valeur/badge à droite) ───────────────────

function InfoRow({
  label,
  value,
  valueColor,
  sub,
  badge,
}: {
  label: string;
  value?: string;
  valueColor?: string;
  sub?: string;
  badge?: { text: string; ok: boolean };
}) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <View style={styles.infoRight}>
        {badge ? (
          <View style={[styles.badge, { backgroundColor: badge.ok ? '#D1FAE5' : '#FEE2E2' }]}>
            <Text style={[styles.badgeText, { color: badge.ok ? COLORS.success : COLORS.error }]}>
              {badge.text}
            </Text>
          </View>
        ) : (
          <>
            {value !== undefined && (
              <Text style={[styles.infoValue, valueColor ? { color: valueColor } : {}]}>
                {value}
              </Text>
            )}
            {sub && <Text style={styles.infoSub}>{sub}</Text>}
          </>
        )}
      </View>
    </View>
  );
}

// ─── Écran ────────────────────────────────────────────────────────────────────

export default function MesFinancesScreen() {
  const router = useRouter();
  const { context, fetchContext } = useContextStore();
  const [refreshing, setRefreshing] = React.useState(false);

  const profile = context?.memberProfile;

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchContext();
    setRefreshing(false);
  };

  if (!profile) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.title}>Mes finances</Text>
        </View>
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Données financières non disponibles</Text>
        </View>
      </SafeAreaView>
    );
  }

  const inscriptionSolde = (profile.unpaidRegistrationAmount ?? 0) === 0;
  const aEmprunt = (profile.borrowAmount ?? 0) > 0;
  const aRenflouement = (profile.unpaidRenfoulement ?? 0) > 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Mes finances</Text>
        <View style={[
          styles.statusBadge,
          { backgroundColor: profile.status === 'ACTIF' ? '#D1FAE5' : '#FEE2E2' },
        ]}>
          <View style={[
            styles.statusDot,
            { backgroundColor: profile.status === 'ACTIF' ? COLORS.success : COLORS.error },
          ]} />
          <Text style={[
            styles.statusText,
            { color: profile.status === 'ACTIF' ? COLORS.success : COLORS.error },
          ]}>
            {profile.status}
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
      >
        {/* ── Mon épargne ────────────────────────────────────────────── */}
        <SectionTitle label="Mon épargne" />

        <View style={styles.savingCard}>
          <View style={styles.savingCardTop}>
            <View style={styles.savingIconWrap}>
              <Ionicons name="wallet" size={20} color={COLORS.success} />
            </View>
            <View>
              <Text style={styles.savingLabel}>Épargne totale</Text>
              <Text style={styles.savingValue}>
                {formatCurrency(profile.savingAmount ?? 0)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.gridCard}>
          <Text style={styles.gridTitle}>Paliers d'emprunt</Text>
          <BorrowingCeilingGrid highlightSaving={profile.savingAmount ?? 0} />
        </View>

        {/* ── Mes cotisations ────────────────────────────────────────── */}
        <SectionTitle label="Mes cotisations" />

        <View style={styles.groupCard}>
          <InfoRow
            label="Cotisation de base"
            value={formatCurrency(profile.baseRegistrationAmount ?? 0)}
          />
          <View style={styles.rowDivider} />
          <InfoRow
            label="Solidarité versée"
            value={formatCurrency(profile.solidarityAmount ?? 0)}
          />
          <View style={styles.rowDivider} />
          <InfoRow
            label="Inscription"
            badge={{
              text: inscriptionSolde
                ? 'Soldée'
                : `${formatCurrency(profile.unpaidRegistrationAmount ?? 0)} restants`,
              ok: inscriptionSolde,
            }}
          />
        </View>

        {/* ── Mes emprunts ───────────────────────────────────────────── */}
        <SectionTitle label="Mes emprunts" />

        <View style={styles.groupCard}>
          <InfoRow
            label="Emprunt en cours"
            value={formatCurrency(profile.borrowAmount ?? 0)}
            valueColor={aEmprunt ? COLORS.warning : COLORS.gray[400]}
            sub={aEmprunt ? 'Remboursement en attente' : 'Aucun emprunt actif'}
          />
          <View style={styles.rowDivider} />
          <InfoRow
            label="Renflouement impayé"
            value={formatCurrency(profile.unpaidRenfoulement ?? 0)}
            valueColor={aRenflouement ? COLORS.error : COLORS.gray[400]}
          />
        </View>

        {/* ── Consulter mes bilans ───────────────────────────────────── */}
        <TouchableOpacity
          style={styles.bilanLink}
          onPress={() => router.push('/(app)/mon-bilan' as never)}
          activeOpacity={0.8}
        >
          <View style={styles.bilanLinkLeft}>
            <View style={styles.bilanLinkIcon}>
              <Ionicons name="bar-chart-outline" size={18} color={COLORS.primary} />
            </View>
            <View>
              <Text style={styles.bilanLinkTitle}>Consulter mes bilans</Text>
              <Text style={styles.bilanLinkSub}>Exercices et sessions clôturés</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={16} color={COLORS.primary} />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.gray[50] },

  header: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: { fontSize: 20, fontWeight: '800', color: COLORS.gray[900] },

  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 12, fontWeight: '700' },

  content: { padding: 16, gap: 12, paddingBottom: 40 },

  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.gray[400],
    letterSpacing: 0.8,
    marginTop: 8,
    paddingHorizontal: 2,
  },

  // Grande carte épargne
  savingCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 18,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.success,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
  },
  savingCardTop: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  savingIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  savingLabel: { fontSize: 12, color: COLORS.gray[500], marginBottom: 2 },
  savingValue: { fontSize: 26, fontWeight: '800', color: COLORS.success },

  // Grille paliers
  gridCard: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 14,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  gridTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.gray[400],
    letterSpacing: 0.5,
  },

  // Carte groupée (cotisations, emprunts)
  groupCard: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },

  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
  },
  infoLabel: { fontSize: 14, color: COLORS.gray[700], fontWeight: '500', flex: 1 },
  infoRight: { alignItems: 'flex-end' },
  infoValue: { fontSize: 15, fontWeight: '700', color: COLORS.gray[900] },
  infoSub: { fontSize: 11, color: COLORS.gray[400], marginTop: 2 },

  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeText: { fontSize: 12, fontWeight: '700' },

  rowDivider: { height: 1, backgroundColor: COLORS.gray[100] },

  // Lien bilans
  bilanLink: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
    marginTop: 4,
  },
  bilanLinkLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  bilanLinkIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bilanLinkTitle: { fontSize: 14, fontWeight: '700', color: COLORS.gray[900] },
  bilanLinkSub: { fontSize: 11, color: COLORS.gray[400], marginTop: 1 },

  // Vide
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontSize: 15, color: COLORS.gray[400] },
});
