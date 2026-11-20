import React, { useMemo, useState } from 'react';
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
import { useGlobalSearchParams } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useMember } from '@/src/hooks/useMembers';
import { useMemberAccount } from '@/src/hooks/useContribution';
import { useContextStore } from '@/src/store/contextStore';
import { useToast } from '@/src/store/toastStore';
import { epargneRepository } from '@/src/api/repositories/epargneRepository';
import { empruntRepository } from '@/src/api/repositories/empruntRepository';
import { COLORS } from '@/src/constants';
import { formatCurrency } from '@/src/utils/format';
import { TransactionList } from '@/src/components/transactions';
import { canMakePayment } from '@/src/navigation/roles';
import type { AccountMemberDTO, MemberResponseDTO, BackendRole } from '@/src/types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseAmount(raw: string): number {
  return parseFloat(raw.replace(',', '.').trim());
}

function DataRow({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <View style={s.dataRow}>
      <Text style={s.dataLabel}>{label}</Text>
      <Text style={[s.dataValue, accent ? { color: accent } : {}]}>{value}</Text>
    </View>
  );
}

type ModalType = 'deposer' | 'retirer' | 'emprunter' | 'rembourser' | null;

// ─── Header du FlatList ───────────────────────────────────────────────────────

interface EpargneHeaderProps {
  member: MemberResponseDTO | undefined;
  account: AccountMemberDTO | undefined;
  accountLoading: boolean;
  onAction: (type: ModalType, prefill?: string) => void;
  canPay: boolean;
}

function EpargneHeader({ account, accountLoading, onAction, canPay }: EpargneHeaderProps) {
  const savingAmount = account?.savingAmount ?? 0;
  const borrowAmount = account?.borrowAmount ?? 0;
  const maxBorrow    = account?.maxBorrow ?? 0;
  const hasLoan      = borrowAmount > 0;
  const canEmprunter = !hasLoan && savingAmount > 0;

  return (
    <View style={s.headerRoot}>
      <View style={s.pageTitle}>
        <Ionicons name="wallet" size={18} color={COLORS.success} />
        <Text style={s.pageTitleText}>Épargne</Text>
      </View>

      {accountLoading && !account ? (
        <View style={s.loader}><ActivityIndicator size="large" color={COLORS.primary} /></View>
      ) : (
        <View style={s.card}>
          <Text style={s.cardTitle}>ÉPARGNE & EMPRUNT</Text>

          <View style={s.bigWrap}>
            <Text style={s.bigAmount}>{formatCurrency(savingAmount)}</Text>
            <Text style={s.bigSub}>FCFA disponibles</Text>
          </View>

          <DataRow
            label="Emprunt actif"
            value={hasLoan ? formatCurrency(borrowAmount) : '—'}
            accent={hasLoan ? COLORS.error : COLORS.gray[400]}
          />
          <DataRow
            label="Plafond emprunt"
            value={formatCurrency(maxBorrow)}
            accent={COLORS.info}
          />

          {hasLoan && (
            <View style={s.infoBox}>
              <Ionicons name="information-circle-outline" size={13} color={COLORS.info} />
              <Text style={s.infoBoxText}>
                Net perçu : <Text style={s.infoBoxBold}>97%</Text>
                {'  ·  '}
                Intérêt redistributé : <Text style={s.infoBoxBold}>3%</Text>
              </Text>
            </View>
          )}

          {!hasLoan && savingAmount === 0 && (
            <View style={s.infoBox}>
              <Ionicons name="information-circle-outline" size={14} color={COLORS.info} />
              <Text style={s.infoBoxText}>Épargne insuffisante pour emprunter.</Text>
            </View>
          )}

          {canPay && (
            <View style={s.btnRow}>
              <TouchableOpacity
                style={[s.btnHalf, s.btnPrimary]}
                onPress={() => onAction('deposer')}
                activeOpacity={0.8}
              >
                <Ionicons name="add-outline" size={15} color={COLORS.white} />
                <Text style={s.btnText}>Déposer</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[s.btnHalf, s.btnOutline]}
                onPress={() => onAction('retirer')}
                activeOpacity={0.8}
              >
                <Ionicons name="remove-outline" size={15} color={COLORS.primary} />
                <Text style={s.btnTextOutline}>Retirer</Text>
              </TouchableOpacity>

              {hasLoan ? (
                <TouchableOpacity
                  style={[s.btnHalf, s.btnWarning]}
                  onPress={() => onAction('rembourser', String(borrowAmount))}
                  activeOpacity={0.8}
                >
                  <Ionicons name="return-down-back-outline" size={15} color={COLORS.white} />
                  <Text style={s.btnText}>Rembourser</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[s.btnHalf, canEmprunter ? s.btnSuccess : s.btnGhost, !canEmprunter && s.btnDisabled]}
                  onPress={() => onAction('emprunter')}
                  disabled={!canEmprunter}
                  activeOpacity={0.8}
                >
                  <Ionicons name="cash-outline" size={15} color={canEmprunter ? COLORS.white : COLORS.gray[400]} />
                  <Text style={[s.btnText, !canEmprunter && s.btnTextGhost]}>Emprunter</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      )}

      <View style={s.txSeparator}>
        <Ionicons name="swap-horizontal-outline" size={13} color={COLORS.gray[400]} />
        <Text style={s.txSeparatorText}>TRANSACTIONS ÉPARGNE</Text>
      </View>
    </View>
  );
}

// ─── Écran ────────────────────────────────────────────────────────────────────

export default function MemberEpargneScreen() {
  const { id } = useGlobalSearchParams<{ id: string }>();
  const memberId = Number(id);
  const qc = useQueryClient();

  const { data: member } = useMember(memberId);
  const { data: account, isLoading: accountLoading, refetch: refetchAccount } = useMemberAccount(memberId);
  const role = useContextStore((s) => s.context?.role ?? null) as BackendRole | null;
  const canPay = canMakePayment(role);
  const { success, error } = useToast();

  const [modal, setModal]   = useState<ModalType>(null);
  const [amount, setAmount] = useState('');
  const [empruntError, setEmpruntError] = useState<string | null>(null);

  const savingAmount = account?.savingAmount ?? 0;
  const borrowAmount = account?.borrowAmount ?? 0;
  const maxBorrow    = account?.maxBorrow ?? 0;

  const refetchAll = () => {
    refetchAccount();
    qc.invalidateQueries({ queryKey: ['members'] });
    qc.invalidateQueries({ queryKey: ['accounts'] });
    qc.invalidateQueries({ queryKey: ['transactions'] });
  };

  const epargnerMutation = useMutation({
    mutationFn: epargneRepository.epargner,
    onSuccess: () => {
      success(modal === 'deposer' ? 'Dépôt enregistré' : 'Retrait enregistré');
      setModal(null); setAmount(''); refetchAll();
    },
    onError: (err: unknown) => {
      error((err as { message?: string })?.message ?? "Erreur lors de l'opération");
    },
  });

  const emprunterMutation = useMutation({
    mutationFn: empruntRepository.emprunter,
    onSuccess: () => {
      success('Emprunt enregistré');
      setEmpruntError(null); setModal(null); setAmount(''); refetchAll();
    },
    onError: (err: unknown) => {
      setEmpruntError((err as { message?: string })?.message ?? 'Emprunt refusé');
    },
  });

  const rembourserMutation = useMutation({
    mutationFn: empruntRepository.rembourser,
    onSuccess: () => {
      success('Remboursement enregistré');
      setModal(null); setAmount(''); refetchAll();
    },
    onError: (err: unknown) => {
      error((err as { message?: string })?.message ?? 'Erreur');
    },
  });

  const isPending = epargnerMutation.isPending || emprunterMutation.isPending || rembourserMutation.isPending;

  const openModal = (type: ModalType, prefill?: string) => {
    setAmount(prefill ?? '');
    setEmpruntError(null);
    setModal(type);
  };

  const handleConfirm = () => {
    if (!member) return;
    const montant = parseAmount(amount);
    if (isNaN(montant) || montant <= 0) { error('Montant invalide'); return; }

    const LABELS: Record<NonNullable<ModalType>, string> = {
      deposer:    'déposer',
      retirer:    'retirer',
      emprunter:  'emprunter',
      rembourser: 'rembourser',
    };

    Alert.alert(
      'Confirmer l\'opération',
      `Vous êtes sur le point de ${LABELS[modal!]} ${formatCurrency(montant)}.\nCette opération est irréversible.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: () => {
            if (modal === 'deposer')    epargnerMutation.mutate({ memberId: member.id, amount: montant, transactionDirection: 'CREDIT' });
            if (modal === 'retirer')    epargnerMutation.mutate({ memberId: member.id, amount: montant, transactionDirection: 'DEBIT' });
            if (modal === 'emprunter')  emprunterMutation.mutate({ memberId: member.id, amount: montant });
            if (modal === 'rembourser') rembourserMutation.mutate({ memberId: member.id, amount: montant });
          },
        },
      ]
    );
  };

  const modalTitles: Record<NonNullable<ModalType>, string> = {
    deposer:    "Déposer de l'épargne",
    retirer:    "Retirer de l'épargne",
    emprunter:  'Faire un emprunt',
    rembourser: "Rembourser l'emprunt",
  };

  const listHeader = useMemo(
    () => (
      <EpargneHeader
        member={member}
        account={account}
        accountLoading={accountLoading}
        onAction={openModal}
        canPay={canPay}
      />
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [member, account, accountLoading, canPay]
  );

  return (
    <>
      <TransactionList
        filters={{ types: ['EPARGNE', 'EMPRUNT', 'REMBOURSSEMENT', 'INTERET', 'PENALITE'], accountMemberId: account?.id }}
        allowedTypes={['EPARGNE', 'EMPRUNT', 'REMBOURSSEMENT', 'INTERET', 'PENALITE']}
        showFilters
        pageSize={5}
        emptyLabel="Aucune transaction d'épargne"
        ListHeaderComponent={listHeader}
        onRefresh={refetchAccount}
      />

      <Modal visible={modal !== null} transparent animationType="slide" onRequestClose={() => setModal(null)}>
        <View style={s.overlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.sheet}>
            <View style={s.handle} />
            <Text style={s.modalTitle}>{modal ? modalTitles[modal] : ''}</Text>

            {modal === 'emprunter' && (
              <View style={s.infoRow}>
                <Text style={s.infoLabel}>Plafond disponible</Text>
                <Text style={[s.infoValue, { color: COLORS.info }]}>{formatCurrency(maxBorrow)}</Text>
              </View>
            )}
            {modal === 'rembourser' && (
              <View style={s.infoRow}>
                <Text style={s.infoLabel}>Montant dû</Text>
                <Text style={[s.infoValue, { color: COLORS.error }]}>{formatCurrency(borrowAmount)}</Text>
              </View>
            )}

            <Text style={s.inputLabel}>Montant (FCFA)</Text>
            <TextInput
              style={s.input}
              value={amount}
              onChangeText={(v) => { setAmount(v); setEmpruntError(null); }}
              keyboardType="numeric"
              placeholder="Ex : 10000"
              placeholderTextColor={COLORS.gray[400]}
              returnKeyType="done"
            />

            {modal === 'emprunter' && empruntError && (
              <View style={s.errorBox}>
                <Ionicons name="alert-circle-outline" size={15} color={COLORS.error} />
                <Text style={s.errorText}>{empruntError}</Text>
              </View>
            )}

            <View style={s.modalBtns}>
              <TouchableOpacity
                style={[s.btnConfirm, isPending && s.btnDisabled]}
                onPress={handleConfirm}
                disabled={isPending}
                activeOpacity={0.8}
              >
                {isPending
                  ? <ActivityIndicator size="small" color={COLORS.white} />
                  : <Text style={s.btnConfirmText}>Confirmer</Text>}
              </TouchableOpacity>
              <TouchableOpacity
                style={s.btnCancel}
                onPress={() => { setModal(null); setEmpruntError(null); }}
                activeOpacity={0.8}
              >
                <Text style={s.btnCancelText}>Annuler</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  headerRoot: { gap: 12, paddingTop: 4 },
  loader: { padding: 40, alignItems: 'center' },

  pageTitle: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 4 },
  pageTitleText: { fontSize: 18, fontWeight: '800', color: COLORS.gray[900] },

  card: {
    backgroundColor: COLORS.white, borderRadius: 14, padding: 16, gap: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  cardTitle: { fontSize: 11, fontWeight: '700', color: COLORS.gray[500], letterSpacing: 0.8, marginBottom: 2 },

  bigWrap: { alignItems: 'center', paddingVertical: 8 },
  bigAmount: { fontSize: 30, fontWeight: '800', color: COLORS.success },
  bigSub: { fontSize: 12, color: COLORS.gray[400], marginTop: 2 },

  dataRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: COLORS.gray[100],
  },
  dataLabel: { fontSize: 13, color: COLORS.gray[500], flex: 1 },
  dataValue: { fontSize: 13, fontWeight: '700', color: COLORS.gray[800], textAlign: 'right' },

  btnRow: { flexDirection: 'row', gap: 8 },
  btnHalf: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 5, paddingVertical: 12, borderRadius: 10,
  },
  btnPrimary: { backgroundColor: COLORS.primary },
  btnSuccess: { backgroundColor: COLORS.success },
  btnWarning: { backgroundColor: COLORS.warning },
  btnOutline: { backgroundColor: COLORS.white, borderWidth: 1.5, borderColor: COLORS.primary },
  btnGhost: { backgroundColor: COLORS.gray[100] },
  btnDisabled: { opacity: 0.45 },
  btnText: { color: COLORS.white, fontSize: 12, fontWeight: '700' },
  btnTextOutline: { color: COLORS.primary, fontSize: 12, fontWeight: '700' },
  btnTextGhost: { color: COLORS.gray[400], fontSize: 12, fontWeight: '600' },

  infoBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, backgroundColor: '#EFF6FF', borderRadius: 8, padding: 10 },
  infoBoxText: { flex: 1, fontSize: 12, color: COLORS.info, fontWeight: '600' },
  infoBoxBold: { fontWeight: '700' },

  txSeparator: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 4, marginTop: 4 },
  txSeparatorText: { fontSize: 11, fontWeight: '700', color: COLORS.gray[500], letterSpacing: 0.8 },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: COLORS.white, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    paddingHorizontal: 20, paddingBottom: 36, paddingTop: 12, gap: 12,
  },
  handle: { width: 40, height: 4, backgroundColor: COLORS.gray[300], borderRadius: 2, alignSelf: 'center', marginBottom: 4 },
  modalTitle: { fontSize: 17, fontWeight: '800', color: COLORS.gray[800], textAlign: 'center' },
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: COLORS.gray[50], borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10,
  },
  infoLabel: { fontSize: 13, color: COLORS.gray[500] },
  infoValue: { fontSize: 14, fontWeight: '700', color: COLORS.gray[800] },
  inputLabel: { fontSize: 12, color: COLORS.gray[500] },
  input: {
    backgroundColor: COLORS.gray[50], borderWidth: 1.5, borderColor: COLORS.gray[200],
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, color: COLORS.gray[800],
  },
  errorBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: '#FEE2E2', borderRadius: 8, padding: 10 },
  errorText: { flex: 1, fontSize: 13, color: COLORS.error, fontWeight: '600' },
  modalBtns: { gap: 10, marginTop: 4 },
  btnConfirm: { backgroundColor: COLORS.primary, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  btnConfirmText: { color: COLORS.white, fontSize: 14, fontWeight: '700' },
  btnCancel: { backgroundColor: COLORS.gray[100], borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  btnCancelText: { color: COLORS.gray[600], fontSize: 14, fontWeight: '600' },
});
