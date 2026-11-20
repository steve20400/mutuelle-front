import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  ScrollView,
} from 'react-native';
import { useGlobalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useMember } from '@/src/hooks/useMembers';
import { useCreateAssistance, useTypeAssistances } from '@/src/hooks/useAssistances';
import { useMemberAccount } from '@/src/hooks/useContribution';
import { useContextStore, useCurrentSession } from '@/src/store/contextStore';
import { useToast } from '@/src/store/toastStore';
import { COLORS } from '@/src/constants';
import { formatCurrency } from '@/src/utils/format';
import { TransactionList } from '@/src/components/transactions';
import { canMakePayment } from '@/src/navigation/roles';
import type { TypeAssistanceResponseDto, BackendRole } from '@/src/types';

// ─── Card type d'assistance (dans le picker) ──────────────────────────────────

function TypeAssistanceCard({
  item,
  onPress,
}: {
  item: TypeAssistanceResponseDto;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={s.typeCard} onPress={onPress} activeOpacity={0.8}>
      <View style={s.typeCardLeft}>
        <View style={s.typeIcon}>
          <Ionicons name="heart" size={18} color={COLORS.success} />
        </View>
        <View style={s.typeInfo}>
          <Text style={s.typeName}>{item.name}</Text>
          {!!item.description && (
            <Text style={s.typeDesc} numberOfLines={2}>{item.description}</Text>
          )}
        </View>
      </View>
      <View style={s.typeRight}>
        <Text style={s.typeAmount}>{formatCurrency(item.amount)}</Text>
        <Ionicons name="chevron-forward" size={14} color={COLORS.gray[400]} />
      </View>
    </TouchableOpacity>
  );
}

// ─── Header du TransactionList ────────────────────────────────────────────────

function AssistanceHeader({ onCreatePress, canPay }: { onCreatePress: () => void; canPay: boolean }) {
  return (
    <View style={s.headerRoot}>
      <View style={s.pageTitleRow}>
        <View style={s.pageTitle}>
          <Ionicons name="heart" size={18} color={COLORS.success} />
          <Text style={s.pageTitleText}>Assistance</Text>
        </View>
        {canPay && (
          <TouchableOpacity style={s.createBtn} onPress={onCreatePress} activeOpacity={0.8}>
            <Ionicons name="add" size={18} color={COLORS.white} />
            <Text style={s.createBtnText}>Créer une assistance</Text>
          </TouchableOpacity>
        )}
      </View>
      <Text style={s.txTitle}>HISTORIQUE DES ASSISTANCES</Text>
    </View>
  );
}

// ─── Écran ────────────────────────────────────────────────────────────────────

export default function MemberAssistanceScreen() {
  const { id } = useGlobalSearchParams<{ id: string }>();
  const memberId = Number(id);

  const { data: member } = useMember(memberId);
  const { data: account } = useMemberAccount(memberId);
  const { data: types = [] } = useTypeAssistances();
  const session = useCurrentSession();
  const { error } = useToast();
  const role = useContextStore((s) => s.context?.role ?? null) as BackendRole | null;
  const canPay = canMakePayment(role);

  const createAssistance = useCreateAssistance();

  const [pickerModal, setPickerModal] = useState(false);
  const [selected, setSelected] = useState<TypeAssistanceResponseDto | null>(null);
  const [confirmModal, setConfirmModal] = useState(false);

  const handleSelectType = (t: TypeAssistanceResponseDto) => {
    setPickerModal(false);
    setSelected(t);
    setConfirmModal(true);
  };

  const handleConfirm = () => {
    if (!selected || !member) return;
    if (!session) {
      error('Aucune session active');
      return;
    }
    createAssistance.mutate(
      {
        typeAssistanceId: selected.id,
        sessionId: session.id,
        memberId: member.id,
      },
      {
        onSuccess: () => {
          setConfirmModal(false);
          setSelected(null);
        },
        onError: (err: unknown) => {
          error((err as { message?: string })?.message ?? 'Erreur');
        },
      }
    );
  };

  const listHeader = useMemo(
    () => <AssistanceHeader onCreatePress={() => setPickerModal(true)} canPay={canPay} />,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [canPay]
  );

  return (
    <>
      <View style={{ flex: 1, backgroundColor: COLORS.gray[50] }}>
        <TransactionList
          filters={{ type: 'ASSISTANCE', accountMemberId: account?.id }}
          allowedTypes={['ASSISTANCE']}
          showFilters={false}
          pageSize={5}
          emptyLabel="Aucune assistance enregistrée"
          ListHeaderComponent={listHeader}
        />
      </View>

      {/* ── Modal picker — liste des types d'assistance ───────────────────── */}
      <Modal
        visible={pickerModal}
        transparent
        animationType="slide"
        onRequestClose={() => setPickerModal(false)}
      >
        <View style={s.overlay}>
          <View style={s.sheet}>
            <View style={s.handle} />
            <View style={s.pickerHeader}>
              <Text style={s.modalTitle}>Choisir un type d'assistance</Text>
              <TouchableOpacity onPress={() => setPickerModal(false)} hitSlop={8}>
                <Ionicons name="close" size={22} color={COLORS.gray[500]} />
              </TouchableOpacity>
            </View>

            {types.length === 0 ? (
              <View style={s.empty}>
                <Ionicons name="information-circle-outline" size={32} color={COLORS.gray[300]} />
                <Text style={s.emptyText}>Aucun type d'assistance configuré</Text>
              </View>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false} style={s.pickerList}>
                {types.map((t) => (
                  <TypeAssistanceCard key={t.id} item={t} onPress={() => handleSelectType(t)} />
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* ── Modal confirmation ────────────────────────────────────────────── */}
      <Modal
        visible={confirmModal}
        transparent
        animationType="slide"
        onRequestClose={() => setConfirmModal(false)}
      >
        <View style={s.overlay}>
          <View style={s.sheet}>
            <View style={s.handle} />
            <Text style={s.modalTitle}>Confirmer l'assistance</Text>

            {selected && (
              <>
                <View style={s.confirmRow}>
                  <Text style={s.confirmLabel}>Type</Text>
                  <Text style={s.confirmValue}>{selected.name}</Text>
                </View>
                <View style={s.confirmRow}>
                  <Text style={s.confirmLabel}>Montant</Text>
                  <Text style={[s.confirmValue, { color: COLORS.success }]}>
                    {formatCurrency(selected.amount)}
                  </Text>
                </View>
                <View style={s.confirmRow}>
                  <Text style={s.confirmLabel}>Bénéficiaire</Text>
                  <Text style={s.confirmValue}>
                    {member
                      ? `${member.firstname} ${member.lastname}`
                      : `Membre #${memberId}`}
                  </Text>
                </View>
                <View style={s.confirmRow}>
                  <Text style={s.confirmLabel}>Session</Text>
                  <Text style={s.confirmValue}>{session?.name ?? '—'}</Text>
                </View>
              </>
            )}

            <View style={s.modalBtns}>
              <TouchableOpacity
                style={[s.btn, s.btnSuccess, createAssistance.isPending && s.btnDisabled]}
                onPress={handleConfirm}
                disabled={createAssistance.isPending}
                activeOpacity={0.8}
              >
                {createAssistance.isPending ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <Text style={s.btnText}>Confirmer l'assistance</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.btn, s.btnCancel]}
                onPress={() => setConfirmModal(false)}
                activeOpacity={0.8}
              >
                <Text style={s.btnCancelText}>Annuler</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  headerRoot: { gap: 12, paddingTop: 4 },
  pageTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  pageTitle: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pageTitleText: { fontSize: 18, fontWeight: '800', color: COLORS.gray[900] },

  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.success,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  createBtnText: { color: COLORS.white, fontSize: 13, fontWeight: '700' },

  typeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  typeCardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  typeIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#b5f5a8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeInfo: { flex: 1 },
  typeName: { fontSize: 14, fontWeight: '700', color: COLORS.gray[800] },
  typeDesc: { fontSize: 12, color: COLORS.gray[500], marginTop: 2 },
  typeRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  typeAmount: { fontSize: 14, fontWeight: '800', color: COLORS.success },

  txTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.gray[500],
    letterSpacing: 1,
    paddingHorizontal: 4,
    marginTop: 4,
  },

  empty: { alignItems: 'center', paddingVertical: 24, gap: 8 },
  emptyText: { fontSize: 14, color: COLORS.gray[400] },

  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: 10,
  },
  btnSuccess: { backgroundColor: COLORS.success },
  btnCancel: { backgroundColor: COLORS.gray[100] },
  btnDisabled: { opacity: 0.45 },
  btnText: { color: COLORS.white, fontSize: 13, fontWeight: '700' },
  btnCancelText: { color: COLORS.gray[600], fontSize: 13, fontWeight: '600' },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingBottom: 36,
    paddingTop: 12,
    gap: 12,
    maxHeight: '80%',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.gray[300],
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 4,
  },
  pickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pickerList: { flexGrow: 0 },
  modalTitle: { fontSize: 17, fontWeight: '800', color: COLORS.gray[800], textAlign: 'center', marginBottom: 4 },
  confirmRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  confirmLabel: { fontSize: 13, color: COLORS.gray[500] },
  confirmValue: { fontSize: 13, fontWeight: '700', color: COLORS.gray[800] },
  modalBtns: { gap: 10, marginTop: 4 },
});
