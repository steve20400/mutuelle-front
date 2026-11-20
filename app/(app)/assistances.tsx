import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useContextStore } from '@/src/store/contextStore';
import { isAdmin } from '@/src/navigation/roles';
import { COLORS } from '@/src/constants';
import { formatCurrency, formatDate } from '@/src/utils/format';
import { TransactionList } from '@/src/components/transactions';
import {
  useAssistances,
  useTypeAssistances,
  useCreateTypeAssistance,
  useUpdateTypeAssistance,
  useDeleteTypeAssistance,
} from '@/src/hooks/useAssistances';
import type { AssistanceResponseDto, BackendRole, TypeAssistanceResponseDto } from '@/src/types';

// ─── Modal type d'assistance ──────────────────────────────────────────────────

interface TypeModalProps {
  visible: boolean;
  initial?: TypeAssistanceResponseDto | null;
  onClose: () => void;
}

function TypeModal({ visible, initial, onClose }: TypeModalProps) {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  const { mutate: create, isPending: isCreating } = useCreateTypeAssistance();
  const { mutate: update, isPending: isUpdating } = useUpdateTypeAssistance();

  useEffect(() => {
    if (visible) {
      setName(initial?.name ?? '');
      setAmount(initial ? String(initial.amount) : '');
      setDescription(initial?.description ?? '');
    }
  }, [visible, initial]);

  const isPending = isCreating || isUpdating;
  const canSubmit = name.trim().length > 0 && amount.trim().length > 0 && !isPending;

  const handleSubmit = () => {
    const payload = {
      name: name.trim(),
      amount: parseFloat(amount) || 0,
      description: description.trim() || undefined,
    };
    if (initial) {
      update({ id: initial.id, payload }, { onSuccess: onClose });
    } else {
      create(payload, { onSuccess: onClose });
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={modalStyles.overlay}
      >
        <View style={modalStyles.sheet}>
          <View style={modalStyles.header}>
            <Text style={modalStyles.title}>
              {initial ? "Modifier le type" : "Nouveau type d'assistance"}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={22} color={COLORS.gray[600]} />
            </TouchableOpacity>
          </View>

          <View style={modalStyles.fields}>
            <View style={modalStyles.field}>
              <Text style={modalStyles.label}>Nom *</Text>
              <TextInput
                style={modalStyles.input}
                value={name}
                onChangeText={setName}
                placeholder="Ex: Deces, Maladie..."
                placeholderTextColor={COLORS.gray[400]}
                autoFocus
              />
            </View>
            <View style={modalStyles.field}>
              <Text style={modalStyles.label}>Montant (FCFA) *</Text>
              <TextInput
                style={modalStyles.input}
                value={amount}
                onChangeText={setAmount}
                placeholder="0"
                placeholderTextColor={COLORS.gray[400]}
                keyboardType="decimal-pad"
              />
            </View>
            <View style={modalStyles.field}>
              <Text style={modalStyles.label}>Description</Text>
              <TextInput
                style={[modalStyles.input, modalStyles.inputMulti]}
                value={description}
                onChangeText={setDescription}
                placeholder="Description optionnelle"
                placeholderTextColor={COLORS.gray[400]}
                multiline
                numberOfLines={2}
              />
            </View>
          </View>

          <TouchableOpacity
            style={[modalStyles.btn, !canSubmit && modalStyles.btnDisabled]}
            onPress={handleSubmit}
            disabled={!canSubmit}
            activeOpacity={0.8}
          >
            {isPending ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <Text style={modalStyles.btnText}>{initial ? 'Enregistrer' : 'Creer'}</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const modalStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    gap: 16,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 17, fontWeight: '700', color: COLORS.gray[900] },
  fields: { gap: 14 },
  field: { gap: 6 },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.gray[700] },
  input: {
    borderWidth: 1.5,
    borderColor: COLORS.gray[300],
    borderRadius: 10,
    paddingVertical: 11,
    paddingHorizontal: 12,
    fontSize: 15,
    color: COLORS.gray[900],
  },
  inputMulti: { minHeight: 60, textAlignVertical: 'top' },
  btn: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: COLORS.white, fontSize: 15, fontWeight: '700' },
});

// ─── Carte assistance accordée ────────────────────────────────────────────────

function AssistanceCard({ item }: { item: AssistanceResponseDto }) {
  return (
    <View style={assistStyles.card}>
      <View style={assistStyles.left}>
        <View style={assistStyles.badge}>
          <Text style={assistStyles.badgeText}>{item.typeAssistanceName}</Text>
        </View>
        <Text style={assistStyles.member}>{item.memberFullName}</Text>
        <Text style={assistStyles.meta}>
          {item.sessionName} · {formatDate(item.createdAt)}
        </Text>
        {item.description ? (
          <Text style={assistStyles.desc} numberOfLines={1}>{item.description}</Text>
        ) : null}
      </View>
      <Text style={assistStyles.amount}>{formatCurrency(item.typeAssistanceAmount)}</Text>
    </View>
  );
}

const assistStyles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  left: { flex: 1, gap: 3 },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#EFF6FF',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: { fontSize: 11, fontWeight: '700', color: COLORS.info },
  member: { fontSize: 14, fontWeight: '600', color: COLORS.gray[900] },
  meta: { fontSize: 11, color: COLORS.gray[400] },
  desc: { fontSize: 11, color: COLORS.gray[500], fontStyle: 'italic' },
  amount: { fontSize: 15, fontWeight: '800', color: COLORS.success },
});

// ─── Ligne type d'assistance ──────────────────────────────────────────────────

interface TypeRowProps {
  item: TypeAssistanceResponseDto;
  canEdit: boolean;
  onEdit: (item: TypeAssistanceResponseDto) => void;
  onDelete: (item: TypeAssistanceResponseDto) => void;
}

function TypeRow({ item, canEdit, onEdit, onDelete }: TypeRowProps) {
  return (
    <View style={typeStyles.row}>
      <View style={typeStyles.info}>
        <Text style={typeStyles.name}>{item.name}</Text>
        {item.description ? (
          <Text style={typeStyles.desc} numberOfLines={1}>{item.description}</Text>
        ) : null}
      </View>
      <Text style={typeStyles.amount}>{formatCurrency(item.amount)}</Text>
      {canEdit && (
        <View style={typeStyles.actions}>
          <TouchableOpacity onPress={() => onEdit(item)} style={typeStyles.actionBtn} hitSlop={8}>
            <Ionicons name="pencil-outline" size={16} color={COLORS.info} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onDelete(item)} style={typeStyles.actionBtn} hitSlop={8}>
            <Ionicons name="trash-outline" size={16} color={COLORS.error} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const typeStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[100],
    gap: 10,
  },
  info: { flex: 1 },
  name: { fontSize: 14, fontWeight: '600', color: COLORS.gray[900] },
  desc: { fontSize: 12, color: COLORS.gray[400], marginTop: 2 },
  amount: { fontSize: 14, fontWeight: '700', color: COLORS.success },
  actions: { flexDirection: 'row', gap: 4 },
  actionBtn: { padding: 6 },
});

// ─── Header du FlatList (blocs 1 et 2) ───────────────────────────────────────

interface AssistancesHeaderProps {
  canEdit: boolean;
}

function AssistancesHeader({ canEdit }: AssistancesHeaderProps) {
  const { data: assistances, isLoading: loadingAssist } = useAssistances({
    size: 10,
    sort: 'createdAt,desc',
  });
  const { data: types, isLoading: loadingTypes } = useTypeAssistances();
  const { mutate: deleteType } = useDeleteTypeAssistance();

  const [typeModal, setTypeModal] = useState(false);
  const [editingType, setEditingType] = useState<TypeAssistanceResponseDto | null>(null);

  const openCreate = () => { setEditingType(null); setTypeModal(true); };
  const openEdit = (t: TypeAssistanceResponseDto) => { setEditingType(t); setTypeModal(true); };

  const confirmDelete = (t: TypeAssistanceResponseDto) => {
    Alert.alert(
      'Supprimer le type',
      `Supprimer le type "${t.name}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Supprimer', style: 'destructive', onPress: () => deleteType(t.id) },
      ]
    );
  };

  return (
    <View style={hdrStyles.root}>
      {/* ── Bloc 1 : Assistances accordées ── */}
      <View style={hdrStyles.section}>
        <View style={hdrStyles.sectionHeader}>
          <Ionicons name="heart" size={15} color={COLORS.success} />
          <Text style={hdrStyles.sectionTitle}>ASSISTANCES ACCORDEES</Text>
          {loadingAssist && (
            <ActivityIndicator size="small" color={COLORS.primary} style={{ marginLeft: 4 }} />
          )}
        </View>

        {!assistances?.length && !loadingAssist ? (
          <View style={hdrStyles.empty}>
            <Text style={hdrStyles.emptyText}>Aucune assistance enregistree</Text>
          </View>
        ) : (
          <View style={hdrStyles.list}>
            {(assistances ?? []).map((a) => (
              <AssistanceCard key={a.id} item={a} />
            ))}
          </View>
        )}
      </View>

      {/* ── Bloc 2 : Types d'assistances ── */}
      <View style={hdrStyles.section}>
        <View style={hdrStyles.sectionHeader}>
          <Ionicons name="list-outline" size={15} color={COLORS.primary} />
          <Text style={hdrStyles.sectionTitle}>TYPES D'ASSISTANCES</Text>
          {loadingTypes && (
            <ActivityIndicator size="small" color={COLORS.primary} style={{ marginLeft: 4 }} />
          )}
          {canEdit && (
            <TouchableOpacity
              style={hdrStyles.addBtn}
              onPress={openCreate}
              activeOpacity={0.7}
            >
              <Ionicons name="add" size={18} color={COLORS.white} />
            </TouchableOpacity>
          )}
        </View>

        {!canEdit && (
          <View style={hdrStyles.readonlyBanner}>
            <Ionicons name="eye-outline" size={12} color={COLORS.info} />
            <Text style={hdrStyles.readonlyText}>Consultation uniquement</Text>
          </View>
        )}

        {!types?.length && !loadingTypes ? (
          <View style={hdrStyles.empty}>
            <Text style={hdrStyles.emptyText}>Aucun type configure</Text>
          </View>
        ) : (
          <View>
            {(types ?? []).map((t) => (
              <TypeRow
                key={t.id}
                item={t}
                canEdit={canEdit}
                onEdit={openEdit}
                onDelete={confirmDelete}
              />
            ))}
          </View>
        )}
      </View>

      {/* Séparateur section transactions */}
      <View style={hdrStyles.txSeparator}>
        <Ionicons name="swap-horizontal-outline" size={14} color={COLORS.gray[400]} />
        <Text style={hdrStyles.txSeparatorText}>TRANSACTIONS D'ASSISTANCES</Text>
      </View>

      {/* Modal CRUD types */}
      <TypeModal
        visible={typeModal}
        initial={editingType}
        onClose={() => setTypeModal(false)}
      />
    </View>
  );
}

const hdrStyles = StyleSheet.create({
  root: { gap: 14, paddingTop: 4 },
  section: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
    gap: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    flex: 1,
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.gray[500],
    letterSpacing: 0.8,
  },
  addBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  readonlyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  readonlyText: { fontSize: 11, fontWeight: '600', color: COLORS.info },
  list: { gap: 8 },
  empty: { paddingVertical: 8, alignItems: 'center' },
  emptyText: { fontSize: 13, color: COLORS.gray[400] },
  txSeparator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 4,
    marginTop: 4,
  },
  txSeparatorText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.gray[500],
    letterSpacing: 0.8,
  },
});

// ─── Écran principal ──────────────────────────────────────────────────────────

export default function AssistancesScreen() {
  const role = useContextStore((s) => s.context?.role ?? null) as BackendRole | null;
  const canEdit = isAdmin(role);

  const listHeader = useMemo(
    () => <AssistancesHeader canEdit={canEdit} />,
    [canEdit]
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Assistances</Text>
        {canEdit && (
          <View style={styles.adminBadge}>
            <Text style={styles.adminBadgeText}>Secretaire</Text>
          </View>
        )}
      </View>

      <TransactionList
        filters={{ type: 'ASSISTANCE' }}
        showFilters
        showMemberName
        pageSize={10}
        emptyLabel="Aucune transaction d'assistance"
        ListHeaderComponent={listHeader}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.gray[50] },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
    gap: 10,
  },
  title: { flex: 1, fontSize: 20, fontWeight: '800', color: COLORS.gray[900] },
  adminBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
  },
  adminBadgeText: { fontSize: 11, fontWeight: '700', color: COLORS.info },
});
