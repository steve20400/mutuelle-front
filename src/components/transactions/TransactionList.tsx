import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/src/constants';
import { useInfiniteTransactions, TransactionListParams } from '@/src/hooks/useTransactions';
import { TransactionRow } from './TransactionRow';
import { TransactionSkeleton } from './TransactionSkeleton';
import { TYPE_LABELS, ALL_TYPES, TRANSACTION_GROUPS, type TransactionGroupKey } from './constants';
import type { TransactionResponseDTO, TransactionType, TransactionDirection } from '@/src/types';

// ─── Types ────────────────────────────────────────────────────────────────────

/** Static/scope filters controlled by the parent (context-dependent). */
export interface TransactionBaseFilters {
  accountMemberId?: number;
  sessionId?: number;
  exerciceId?: number;
  sort?: string;
  /** When set to a single type, the type picker in the filter bar is hidden. */
  type?: TransactionType;
  /** When set, restricts to these types (multi-type). The type picker remains visible. */
  types?: TransactionType[];
}

export interface TransactionListProps {
  /** Scope filters from parent (account, session, exercice). */
  filters?: TransactionBaseFilters;
  /** Show the user-facing filter bar. Default: true. */
  showFilters?: boolean;
  /** Show member name column. Default: false. */
  showMemberName?: boolean;
  /** Items fetched per page. Default: 20. */
  pageSize?: number;
  /** Custom text for empty state. */
  emptyLabel?: string;
  /** Optional element rendered above the list (inside FlatList header). */
  ListHeaderComponent?: React.ReactElement | null;
  /** Called alongside the internal refetch on pull-to-refresh. */
  onRefresh?: () => void;
  /** When set, the type picker only shows these transaction types. */
  allowedTypes?: TransactionType[];
}

// ─── Filter bar (shows type picker only when no base type is locked) ──────────

// ─── Direction picker (dropdown) ──────────────────────────────────────────────

type DirectionFilter = TransactionDirection | 'ALL';

const DIRECTION_OPTIONS: { value: DirectionFilter; label: string; icon: string }[] = [
  { value: 'ALL',    label: 'Tous les sens',  icon: 'swap-horizontal-outline' },
  { value: 'CREDIT', label: 'Entrées',        icon: 'arrow-down-outline' },
  { value: 'DEBIT',  label: 'Sorties',        icon: 'arrow-up-outline' },
];

interface DirectionPickerProps {
  value: DirectionFilter;
  onChange: (v: DirectionFilter) => void;
}

function DirectionPicker({ value, onChange }: DirectionPickerProps) {
  const [open, setOpen] = useState(false);
  const current = DIRECTION_OPTIONS.find((o) => o.value === value) ?? DIRECTION_OPTIONS[0];

  return (
    <>
      <TouchableOpacity
        style={[pickerStyles.trigger, value !== 'ALL' && pickerStyles.triggerActive]}
        onPress={() => setOpen(true)}
        activeOpacity={0.7}
      >
        <Ionicons
          name={current.icon as never}
          size={13}
          color={value !== 'ALL' ? COLORS.white : COLORS.gray[600]}
        />
        <Text style={[pickerStyles.triggerText, value !== 'ALL' && pickerStyles.triggerTextActive]}>
          {value === 'ALL' ? 'Sens' : current.label}
        </Text>
        <Ionicons
          name="chevron-down"
          size={12}
          color={value !== 'ALL' ? COLORS.white : COLORS.gray[600]}
        />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <TouchableOpacity style={pickerStyles.overlay} activeOpacity={1} onPress={() => setOpen(false)} />
        <View style={pickerStyles.sheet}>
          <View style={pickerStyles.sheetHeader}>
            <Text style={pickerStyles.sheetTitle}>Sens de la transaction</Text>
            <TouchableOpacity onPress={() => setOpen(false)}>
              <Ionicons name="close" size={22} color={COLORS.gray[600]} />
            </TouchableOpacity>
          </View>
          {DIRECTION_OPTIONS.map((opt) => {
            const active = value === opt.value;
            return (
              <TouchableOpacity
                key={opt.value}
                style={[pickerStyles.option, active && pickerStyles.optionActive]}
                onPress={() => { onChange(opt.value); setOpen(false); }}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={opt.icon as never}
                  size={16}
                  color={active ? COLORS.primary : COLORS.gray[500]}
                />
                <Text style={[pickerStyles.optionText, active && pickerStyles.optionTextActive]}>
                  {opt.label}
                </Text>
                {active && <Ionicons name="checkmark" size={16} color={COLORS.primary} />}
              </TouchableOpacity>
            );
          })}
        </View>
      </Modal>
    </>
  );
}

const pickerStyles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: COLORS.gray[100],
  },
  triggerActive: { backgroundColor: COLORS.primary },
  triggerText: { fontSize: 13, fontWeight: '600', color: COLORS.gray[600] },
  triggerTextActive: { color: COLORS.white },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 24,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  sheetTitle: { fontSize: 16, fontWeight: '700', color: COLORS.gray[900] },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[50],
  },
  optionActive: { backgroundColor: '#EFF6FF' },
  optionText: { flex: 1, fontSize: 14, color: COLORS.gray[800] },
  optionTextActive: { fontWeight: '700', color: COLORS.primary },
});

// ─── Type picker modal ────────────────────────────────────────────────────────

/** A type filter selection: null = all, group key, or individual type */
type TypeSelection =
  | null
  | { kind: 'group'; key: TransactionGroupKey }
  | { kind: 'individual'; type: TransactionType };

function selectionLabel(sel: TypeSelection): string {
  if (!sel) return 'Type';
  if (sel.kind === 'group') return TRANSACTION_GROUPS.find((g) => g.key === sel.key)?.label ?? 'Groupe';
  return TYPE_LABELS[sel.type];
}

function selectionActive(sel: TypeSelection): boolean {
  return sel !== null;
}

interface TypePickerProps {
  value: TypeSelection;
  onChange: (v: TypeSelection) => void;
  allowedTypes?: TransactionType[];
}

function TypePicker({ value, onChange, allowedTypes }: TypePickerProps) {
  const [open, setOpen] = useState(false);
  const typesAffichés = allowedTypes ?? ALL_TYPES;
  const groupsAffichés = allowedTypes
    ? TRANSACTION_GROUPS.filter((g) => g.types.every((t) => allowedTypes.includes(t)))
    : TRANSACTION_GROUPS;
  const active = selectionActive(value);

  const isGroupActive = (key: TransactionGroupKey) =>
    value !== null && value.kind === 'group' && value.key === key;
  const isTypeActive = (type: TransactionType) =>
    value !== null && value.kind === 'individual' && value.type === type;

  return (
    <>
      <TouchableOpacity
        style={[typeStyles.trigger, active && typeStyles.triggerActive]}
        onPress={() => setOpen(true)}
        activeOpacity={0.7}
      >
        <Text style={[typeStyles.triggerText, active && typeStyles.triggerTextActive]}>
          {selectionLabel(value)}
        </Text>
        <Ionicons name="chevron-down" size={14} color={active ? COLORS.white : COLORS.gray[600]} />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <TouchableOpacity style={typeStyles.overlay} activeOpacity={1} onPress={() => setOpen(false)} />
        <View style={typeStyles.sheet}>
          <View style={typeStyles.sheetHeader}>
            <Text style={typeStyles.sheetTitle}>Filtrer par type</Text>
            <TouchableOpacity onPress={() => setOpen(false)}>
              <Ionicons name="close" size={22} color={COLORS.gray[600]} />
            </TouchableOpacity>
          </View>

          <ScrollView>
            {/* "All" option */}
            <TouchableOpacity
              style={[typeStyles.option, value === null && typeStyles.optionActive]}
              onPress={() => { onChange(null); setOpen(false); }}
              activeOpacity={0.7}
            >
              <Text style={[typeStyles.optionText, value === null && typeStyles.optionTextActive]}>
                Tous les types
              </Text>
              {value === null && <Ionicons name="checkmark" size={16} color={COLORS.primary} />}
            </TouchableOpacity>

            {/* Groups — hidden when allowedTypes excludes all group members */}
            {groupsAffichés.length > 0 && (
              <View style={typeStyles.sectionHeader}>
                <Text style={typeStyles.sectionTitle}>Par groupe</Text>
              </View>
            )}
            {groupsAffichés.map((group) => {
              const isActive = isGroupActive(group.key);
              return (
                <TouchableOpacity
                  key={group.key}
                  style={[typeStyles.option, isActive && typeStyles.optionActive]}
                  onPress={() => { onChange({ kind: 'group', key: group.key }); setOpen(false); }}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={group.icon as never}
                    size={16}
                    color={isActive ? COLORS.primary : COLORS.gray[400]}
                  />
                  <Text style={[typeStyles.optionText, isActive && typeStyles.optionTextActive]}>
                    {group.label}
                  </Text>
                  {isActive && <Ionicons name="checkmark" size={16} color={COLORS.primary} />}
                </TouchableOpacity>
              );
            })}

            {/* Individual types */}
            <View style={typeStyles.sectionHeader}>
              <Text style={typeStyles.sectionTitle}>Par type individuel</Text>
            </View>
            {typesAffichés.map((type) => {
              const isActive = isTypeActive(type);
              return (
                <TouchableOpacity
                  key={type}
                  style={[typeStyles.option, isActive && typeStyles.optionActive]}
                  onPress={() => { onChange({ kind: 'individual', type }); setOpen(false); }}
                  activeOpacity={0.7}
                >
                  <Text style={[typeStyles.optionText, isActive && typeStyles.optionTextActive]}>
                    {TYPE_LABELS[type]}
                  </Text>
                  {isActive && <Ionicons name="checkmark" size={16} color={COLORS.primary} />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}

const typeStyles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: COLORS.gray[100],
  },
  triggerActive: { backgroundColor: COLORS.primary },
  triggerText: { fontSize: 13, fontWeight: '600', color: COLORS.gray[600] },
  triggerTextActive: { color: COLORS.white },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '60%',
    paddingBottom: 24,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  sheetTitle: { fontSize: 16, fontWeight: '700', color: COLORS.gray[900] },
  sectionHeader: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 6,
    backgroundColor: COLORS.gray[50],
  },
  sectionTitle: { fontSize: 11, fontWeight: '700', color: COLORS.gray[400], textTransform: 'uppercase', letterSpacing: 0.5 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[50],
  },
  optionActive: { backgroundColor: '#EFF6FF' },
  optionText: { flex: 1, fontSize: 14, color: COLORS.gray[800] },
  optionTextActive: { fontWeight: '700', color: COLORS.primary },
});

// ─── Filter bar ───────────────────────────────────────────────────────────────

interface FilterBarProps {
  direction: DirectionFilter;
  typeSelection: TypeSelection;
  isFetching: boolean;
  showTypePicker: boolean;
  allowedTypes?: TransactionType[];
  onDirectionChange: (v: DirectionFilter) => void;
  onTypeSelectionChange: (v: TypeSelection) => void;
}

function FilterBar({
  direction, typeSelection, isFetching, showTypePicker, allowedTypes,
  onDirectionChange, onTypeSelectionChange,
}: FilterBarProps) {
  return (
    <View style={filterBarStyles.bar}>
      <DirectionPicker value={direction} onChange={onDirectionChange} />
      {showTypePicker && (
        <TypePicker value={typeSelection} onChange={onTypeSelectionChange} allowedTypes={allowedTypes} />
      )}
      {isFetching && (
        <ActivityIndicator size="small" color={COLORS.primary} />
      )}
    </View>
  );
}

const filterBarStyles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
});

// ─── Load more footer ─────────────────────────────────────────────────────────

function LoadMoreFooter({
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
}: {
  hasNextPage: boolean | undefined;
  isFetchingNextPage: boolean;
  onLoadMore: () => void;
}) {
  if (isFetchingNextPage) {
    return (
      <View style={footerStyles.loading}>
        <ActivityIndicator size="small" color={COLORS.primary} />
      </View>
    );
  }

  if (!hasNextPage) return null;

  return (
    <TouchableOpacity style={footerStyles.btn} onPress={onLoadMore} activeOpacity={0.7}>
      <Text style={footerStyles.text}>Charger plus</Text>
      <Ionicons name="chevron-down" size={14} color={COLORS.primary} />
    </TouchableOpacity>
  );
}

const footerStyles = StyleSheet.create({
  loading: { padding: 16, alignItems: 'center' },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: 16,
    marginBottom: 8,
  },
  text: { fontSize: 14, fontWeight: '600', color: COLORS.primary },
});

// ─── Main component ───────────────────────────────────────────────────────────

export function TransactionList({
  filters = {},
  showFilters = true,
  showMemberName = false,
  pageSize = 20,
  emptyLabel = 'Aucune transaction',
  ListHeaderComponent = null,
  onRefresh,
  allowedTypes,
}: TransactionListProps) {
  // ── User-controlled filter state ──
  const [direction, setDirection] = useState<DirectionFilter>('ALL');
  // When filters.types is set (multi-type scope), start with null so the parent scope
  // applies immediately. Only pre-select allowedTypes[0] when there is no parent types scope.
  const [typeSelection, setTypeSelection] = useState<TypeSelection>(
    !filters.types?.length && allowedTypes?.[0]
      ? { kind: 'individual', type: allowedTypes[0] }
      : null
  );

  // ── Combined query params ──
  // filters.type locks to a single type (picker hidden).
  // filters.types sets a group scope; user selection within the picker overrides it.
  const params = useMemo<Omit<TransactionListParams, 'page'>>(() => {
    const typeParams: Pick<TransactionListParams, 'type' | 'types'> = {};
    // When user has an active selection it overrides the parent's types scope.
    const userOverrides = filters.type === undefined && typeSelection !== null;
    if (userOverrides) {
      if (typeSelection!.kind === 'individual') {
        typeParams.type = typeSelection!.type;
      } else {
        const group = TRANSACTION_GROUPS.find((g) => g.key === typeSelection!.key);
        if (group) typeParams.types = group.types;
      }
    }
    // Strip parent types from the spread when the user has overridden them,
    // otherwise buildQuery would let filters.types win over typeParams.type.
    const { types: _parentTypes, ...filtersRest } = filters;
    return {
      ...(userOverrides ? filtersRest : filters),
      size: pageSize,
      sort: filters.sort ?? 'createdAt,desc',
      ...(direction !== 'ALL' && { direction }),
      ...typeParams,
    };
  }, [filters, pageSize, direction, typeSelection]);

  const {
    data,
    isLoading,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useInfiniteTransactions(params);

  // Flatten all pages into a single array — memoized
  const transactions = useMemo<TransactionResponseDTO[]>(
    () => data?.pages.flatMap((p) => p.items) ?? [],
    [data]
  );

  const totalElements = data?.pages[0]?.totalElements;
  const isInitialLoad = isLoading && transactions.length === 0;
  const isFilterChange = isFetching && !isFetchingNextPage && transactions.length > 0;
  const isRefreshing = isFetching && !isLoading && !isFetchingNextPage;

  // ── Render item — memoized callback to avoid FlatList re-renders ──
  const renderItem = useCallback(
    ({ item }: { item: TransactionResponseDTO }) => (
      <TransactionRow item={item} showMemberName={showMemberName} />
    ),
    [showMemberName]
  );

  const keyExtractor = useCallback((item: TransactionResponseDTO) => String(item.id), []);

  // ── List header: parent slot → filter bar → count row ──
  // Built inline (not memoized) so filter state changes re-render it correctly.
  const listHeader = (
    <View>
      {ListHeaderComponent}
      {showFilters && (
        <FilterBar
          direction={direction}
          typeSelection={typeSelection}
          isFetching={isFilterChange}
          showTypePicker={filters.type === undefined}
          allowedTypes={allowedTypes}
          onDirectionChange={setDirection}
          onTypeSelectionChange={setTypeSelection}
        />
      )}
      {totalElements !== undefined && (
        <View style={styles.countRow}>
          <Text style={styles.count}>
            {totalElements} transaction{totalElements > 1 ? 's' : ''}
          </Text>
          {isFilterChange && (
            <ActivityIndicator size="small" color={COLORS.primary} style={{ marginLeft: 8 }} />
          )}
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.root}>
      {/* Initial skeleton */}
      {isInitialLoad ? (
        <TransactionSkeleton />
      ) : (
        <FlatList<TransactionResponseDTO>
          data={transactions}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => { refetch(); onRefresh?.(); }}
              tintColor={COLORS.primary}
              colors={[COLORS.primary]}
            />
          }
          ListHeaderComponent={listHeader}
          ListFooterComponent={
            <LoadMoreFooter
              hasNextPage={hasNextPage}
              isFetchingNextPage={isFetchingNextPage}
              onLoadMore={fetchNextPage}
            />
          }
          ListEmptyComponent={
            !isFetching ? (
              <View style={styles.empty}>
                <Ionicons name="receipt-outline" size={48} color={COLORS.gray[300]} />
                <Text style={styles.emptyText}>{emptyLabel}</Text>
              </View>
            ) : null
          }
          removeClippedSubviews
          maxToRenderPerBatch={15}
          windowSize={10}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.gray[50] },
  list: { padding: 12, gap: 8, paddingBottom: 32 },
  countRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingVertical: 6,
    marginBottom: 4,
  },
  count: { fontSize: 12, color: COLORS.gray[500], fontWeight: '500' },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    gap: 12,
  },
  emptyText: { fontSize: 15, color: COLORS.gray[500] },
});
