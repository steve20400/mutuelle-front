import React, { memo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/src/constants';
import { formatCurrency, formatDate, formatDateTime } from '@/src/utils/format';
import { useTransactionDetail } from '@/src/hooks/useTransactions';
import { TYPE_LABELS, TYPE_ICONS } from './constants';
import type { TransactionResponseDTO } from '@/src/types';

function getLabel(item: TransactionResponseDTO): string {
  if (item.transactionType === 'EPARGNE' && item.transactionDirection === 'DEBIT') {
    return 'Retrait';
  }
  return TYPE_LABELS[item.transactionType] ?? item.transactionType;
}

// ─── Child row (no recursion, no expand) ─────────────────────────────────────

const ChildRow = memo(function ChildRow({ item }: { item: TransactionResponseDTO }) {
  const isAssistance = item.transactionType === 'ASSISTANCE';
  const isCredit = isAssistance || item.transactionDirection === 'CREDIT';
  return (
    <View style={childStyles.row}>
      <View style={[childStyles.icon, { backgroundColor: isCredit ? '#D1FAE5' : '#FEE2E2' }]}>
        <Ionicons
          name={isCredit ? 'arrow-down-outline' : 'arrow-up-outline'}
          size={12}
          color={isCredit ? COLORS.success : COLORS.error}
        />
      </View>
      <View style={childStyles.info}>
        <Text style={childStyles.type}>
          {getLabel(item)}
        </Text>
        <Text style={childStyles.date}>{formatDate(item.createdAt)}</Text>
      </View>
      <Text style={[childStyles.amount, { color: isCredit ? COLORS.success : COLORS.error }]}>
        {isCredit ? '+' : '-'}{formatCurrency(item.amount)}
      </Text>
    </View>
  );
});

const childStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 7,
    paddingHorizontal: 4,
  },
  icon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { flex: 1 },
  type: { fontSize: 12, fontWeight: '600', color: COLORS.gray[800] },
  date: { fontSize: 11, color: COLORS.gray[400], marginTop: 1 },
  amount: { fontSize: 12, fontWeight: '700' },
});

// ─── Detail panel (lazy loaded) ───────────────────────────────────────────────

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={detailStyles.row}>
      <Text style={detailStyles.label}>{label}</Text>
      <Text style={detailStyles.value}>{value}</Text>
    </View>
  );
}

interface DetailPanelProps {
  transactionId: number;
  showMemberName: boolean;
}

function DetailPanel({ transactionId, showMemberName }: DetailPanelProps) {
  const { data: detail, isFetching } = useTransactionDetail(transactionId);

  if (isFetching && !detail) {
    return (
      <View style={detailStyles.loading}>
        <ActivityIndicator size="small" color={COLORS.primary} />
      </View>
    );
  }

  if (!detail) return null;

  const children = detail.children ?? [];

  return (
    <View style={detailStyles.panel}>
      {/* Info rows */}
      <View style={detailStyles.infoBlock}>
        <DetailRow label="Ref." value={`#${detail.id}`} />
        <DetailRow label="Date / heure" value={formatDateTime(detail.createdAt)} />
        {showMemberName && detail.memberFullName && (
          <DetailRow label="Membre" value={detail.memberFullName} />
        )}
        <DetailRow label="Session" value={`#${detail.sessionId}`} />
        <DetailRow
          label="Sens"
          value={detail.transactionDirection === 'CREDIT' ? 'Entree' : 'Sortie'}
        />
      </View>

      {/* Children */}
      {children.length > 0 && (
        <View style={detailStyles.childrenBlock}>
          <View style={detailStyles.childrenHeader}>
            <Ionicons name="git-branch-outline" size={13} color={COLORS.gray[500]} />
            <Text style={detailStyles.childrenTitle}>
              Sous-transactions ({children.length})
            </Text>
          </View>
          {children.map((child) => (
            <ChildRow key={child.id} item={child} />
          ))}
        </View>
      )}
    </View>
  );
}

const detailStyles = StyleSheet.create({
  loading: { padding: 16, alignItems: 'center' },
  panel: {
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[100],
    gap: 0,
  },
  infoBlock: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 6,
    backgroundColor: COLORS.gray[50],
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  label: { fontSize: 12, color: COLORS.gray[500] },
  value: { fontSize: 12, fontWeight: '600', color: COLORS.gray[800], flexShrink: 1, textAlign: 'right' },
  childrenBlock: {
    paddingHorizontal: 14,
    paddingBottom: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[100],
    gap: 2,
  },
  childrenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 4,
  },
  childrenTitle: { fontSize: 12, fontWeight: '700', color: COLORS.gray[500] },
});

// ─── Main transaction row ─────────────────────────────────────────────────────

export interface TransactionRowProps {
  item: TransactionResponseDTO;
  showMemberName?: boolean;
}

export const TransactionRow = memo(function TransactionRow({
  item,
  showMemberName = false,
}: TransactionRowProps) {
  const [expanded, setExpanded] = useState(false);
  const isAssistance = item.transactionType === 'ASSISTANCE';
  const isCredit = isAssistance || item.transactionDirection === 'CREDIT';
  const iconName = TYPE_ICONS[item.transactionType] as keyof typeof Ionicons.glyphMap | undefined;

  return (
    <View style={rowStyles.card}>
      {/* Compact row — always visible */}
      <TouchableOpacity
        style={rowStyles.row}
        onPress={() => setExpanded((e) => !e)}
        activeOpacity={0.7}
      >
        {/* Direction icon */}
        <View style={[rowStyles.iconBox, { backgroundColor: isCredit ? '#D1FAE5' : '#FEE2E2' }]}>
          <Ionicons
            name={iconName ?? (isCredit ? 'arrow-down-outline' : 'arrow-up-outline')}
            size={16}
            color={isCredit ? COLORS.success : COLORS.error}
          />
        </View>

        {/* Info */}
        <View style={rowStyles.info}>
          <Text style={rowStyles.type} numberOfLines={1}>
            {getLabel(item)}
          </Text>
          <Text style={rowStyles.date}>{formatDate(item.createdAt)}</Text>
          {showMemberName && item.memberFullName ? (
            <View style={rowStyles.memberRow}>
              <View style={rowStyles.memberAvatar}>
                <Text style={rowStyles.memberAvatarText}>
                  {item.memberFullName.charAt(0).toUpperCase()}
                </Text>
              </View>
              <Text style={rowStyles.member} numberOfLines={1}>
                {item.memberFullName}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Amount + chevron */}
        <View style={rowStyles.right}>
          <Text style={[rowStyles.amount, { color: isCredit ? COLORS.success : COLORS.error }]}>
            {isCredit ? '+' : '-'}{formatCurrency(item.amount)}
          </Text>
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={13}
            color={COLORS.gray[400]}
            style={{ marginTop: 3 }}
          />
        </View>
      </TouchableOpacity>

      {/* Detail panel — only mounts when expanded, detail query fires lazily */}
      {expanded && (
        <DetailPanel transactionId={item.id} showMemberName={showMemberName} />
      )}
    </View>
  );
});

const rowStyles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { flex: 1, gap: 2 },
  type: { fontSize: 14, fontWeight: '700', color: COLORS.gray[900] },
  date: { fontSize: 12, color: COLORS.gray[400] },
  memberRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 1 },
  memberAvatar: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  memberAvatarText: { fontSize: 9, fontWeight: '800', color: COLORS.white },
  member: { fontSize: 12, color: COLORS.gray[500], flex: 1 },
  right: { alignItems: 'flex-end', gap: 2 },
  amount: { fontSize: 14, fontWeight: '800' },
});
