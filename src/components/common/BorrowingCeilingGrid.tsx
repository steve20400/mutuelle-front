import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/src/constants';
import { useBorrowingCeilings } from '@/src/store/contextStore';
import { formatCurrency } from '@/src/utils/format';
import type { BorrowingCeilingInterval } from '@/src/types';

// Certains champs (maxEpargne, maxPlafond) sont "bornes ouvertes" côté backend :
// on traite null ET undefined comme "pas de borne" pour rester robuste au payload réel.
function hasBound(n: number | null | undefined): n is number {
  return typeof n === 'number' && Number.isFinite(n);
}

function formatNumber(n: number): string {
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(n);
}

function getActiveTierIndex(tiers: BorrowingCeilingInterval[], saving: number): number {
  return tiers.findIndex(
    (t) => saving >= t.minEpargne && (!hasBound(t.maxEpargne) || saving <= t.maxEpargne)
  );
}

interface BorrowingCeilingGridProps {
  highlightSaving?: number;
}

export function BorrowingCeilingGrid({ highlightSaving }: BorrowingCeilingGridProps) {
  const tiers = useBorrowingCeilings();

  const activeIdx =
    highlightSaving !== undefined && highlightSaving > 0 && tiers.length > 0
      ? getActiveTierIndex(tiers, highlightSaving)
      : -1;

  if (tiers.length === 0) {
    return (
      <View style={s.empty}>
        <ActivityIndicator size="small" color={COLORS.primary} />
        <Text style={s.emptyText}>Chargement des paliers…</Text>
      </View>
    );
  }

  return (
    <View style={s.wrap}>
      <View style={s.disclaimer}>
        <Ionicons name="information-circle-outline" size={13} color={COLORS.gray[500]} />
        <Text style={s.disclaimerText}>
          Ce tableau indique le montant que vous pouvez emprunter selon votre épargne.
        </Text>
      </View>

      {/* En-tête */}
      <View style={[s.row, s.headerRow]}>
        <Text style={[s.headerCell, s.colRange]}>Épargne</Text>
        <Text style={[s.headerCell, s.colMult]}>Mult.</Text>
        <Text style={[s.headerCell, s.colPlafond]}>Plafond max</Text>
      </View>

      {tiers.map((tier, i) => {
        const isActive = i === activeIdx;
        const rangeLabel = hasBound(tier.maxEpargne)
          ? `${formatNumber(tier.minEpargne)} – ${formatNumber(tier.maxEpargne)} FCFA`
          : `Plus de ${formatNumber(tier.minEpargne)} FCFA`;
        const plafondLabel = hasBound(tier.maxPlafond) ? formatCurrency(tier.maxPlafond) : '—';

        return (
          <View key={tier.id} style={[s.row, i % 2 === 0 && s.rowAlt, isActive && s.activeRow]}>
            <View style={[s.colRange, s.rangeInner]}>
              {isActive && <View style={s.youDot} />}
              <Text style={[s.cell, isActive && s.activeCell]}>{rangeLabel}</Text>
            </View>
            <Text style={[s.cell, s.colMult, isActive && s.activeCell]}>
              ×{tier.multiplier}
            </Text>
            <Text style={[s.cell, s.colPlafond, isActive && s.activeCell]}>
              {plafondLabel}
            </Text>
          </View>
        );
      })}

      {activeIdx !== -1 && (
        <View style={s.activeNote}>
          <Ionicons name="checkmark-circle" size={13} color={COLORS.primary} />
          <Text style={s.activeNoteText}>
            Votre épargne ({formatCurrency(highlightSaving!)}) → palier ×{tiers[activeIdx].multiplier}
          </Text>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { gap: 0 },

  empty: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 20,
  },
  emptyText: { fontSize: 13, color: COLORS.gray[400] },

  disclaimer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: COLORS.gray[50],
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  disclaimerText: { flex: 1, fontSize: 11, color: COLORS.gray[500], lineHeight: 15 },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  rowAlt: { backgroundColor: COLORS.gray[50] },
  headerRow: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    marginBottom: 2,
  },
  activeRow: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderRadius: 8,
  },

  headerCell: { fontSize: 9.5, fontWeight: '700', color: COLORS.white, letterSpacing: 0.3 },
  cell: { fontSize: 10.5, color: COLORS.gray[700], fontWeight: '500', flexShrink: 1 },
  activeCell: { color: COLORS.primary, fontWeight: '700' },

  colRange:   { flex: 3.6 },
  rangeInner: { flexDirection: 'row', alignItems: 'center', gap: 5, flexShrink: 1 },
  colMult:    { flex: 0.9, textAlign: 'center' },
  colPlafond: { flex: 2, textAlign: 'right' },

  youDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
    flexShrink: 0,
  },

  activeNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 8,
    paddingHorizontal: 4,
  },
  activeNoteText: { fontSize: 11, color: COLORS.primary, fontWeight: '600' },
});
