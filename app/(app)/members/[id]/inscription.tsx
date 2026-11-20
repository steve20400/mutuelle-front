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
import { useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useMember } from '@/src/hooks/useMembers';
import {
  useMemberAccount,
  usePayContribution,
} from '@/src/hooks/useContribution';
import { useToast } from '@/src/store/toastStore';
import { useContextStore } from '@/src/store/contextStore';
import { COLORS } from '@/src/constants';
import { formatCurrency, formatDate } from '@/src/utils/format';
import { TransactionList } from '@/src/components/transactions';
import { canMakePayment } from '@/src/navigation/roles';
import type { AccountMemberDTO, MemberResponseDTO, BackendRole } from '@/src/types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function DataRow({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <View style={s.dataRow}>
      <Text style={s.dataLabel}>{label}</Text>
      <Text style={[s.dataValue, accent ? { color: accent } : {}]}>{value}</Text>
    </View>
  );
}

// ─── Header du FlatList ───────────────────────────────────────────────────────

interface HeaderProps {
  member: MemberResponseDTO | undefined;
  account: AccountMemberDTO | undefined;
  accountLoading: boolean;
  onPayInscription: () => void;
  canPay: boolean;
}

function InscriptionHeader({ member, account, accountLoading, onPayInscription, canPay }: HeaderProps) {
  const unpaidInscription = account?.unpaidRegistrationAmount ?? 0;
  const baseInscription = account?.baseRegistrationAmount ?? 0;
  const inscriptionSolde = unpaidInscription === 0;

  return (
    <View style={s.headerRoot}>
      <View style={s.pageTitle}>
        <Ionicons name="card" size={18} color={COLORS.primary} />
        <Text style={s.pageTitleText}>Inscription</Text>
      </View>

      {accountLoading && !account ? (
        <View style={s.loader}><ActivityIndicator size="large" color={COLORS.primary} /></View>
      ) : (
        <View style={s.card}>
          <Text style={s.cardTitle}>INSCRIPTION</Text>
          <DataRow label="Montant total" value={formatCurrency(baseInscription)} />
          <DataRow
            label="Reste à payer"
            value={formatCurrency(unpaidInscription)}
            accent={inscriptionSolde ? COLORS.success : COLORS.error}
          />
          <DataRow
            label="Statut"
            value={inscriptionSolde ? 'Soldé' : 'Non soldé'}
            accent={inscriptionSolde ? COLORS.success : COLORS.error}
          />
          {member && <DataRow label="Membre depuis" value={formatDate(member.createdAt)} />}
          {canPay && (
            <TouchableOpacity
              style={[s.btn, inscriptionSolde ? s.btnGhost : s.btnPrimary, inscriptionSolde && s.btnDisabled]}
              onPress={onPayInscription}
              disabled={inscriptionSolde}
              activeOpacity={0.8}
            >
              <Text style={[s.btnText, inscriptionSolde && s.btnTextGhost]}>
                {inscriptionSolde ? 'Déjà soldé' : "Payer l'inscription"}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <View style={s.txSeparator}>
        <Ionicons name="swap-horizontal-outline" size={13} color={COLORS.gray[400]} />
        <Text style={s.txSeparatorText}>TRANSACTIONS INSCRIPTION</Text>
      </View>
    </View>
  );
}

// ─── Écran ────────────────────────────────────────────────────────────────────

export default function MemberInscriptionScreen() {
  const { id } = useGlobalSearchParams<{ id: string }>();
  const memberId = Number(id);
  const qc = useQueryClient();

  const { data: member } = useMember(memberId);
  const { data: account, isLoading: accountLoading, refetch: refetchAccount } = useMemberAccount(memberId);
  const { success, error } = useToast();
  const payContribution = usePayContribution();
  const role = useContextStore((s) => s.context?.role ?? null) as BackendRole | null;
  const canPay = canMakePayment(role);

  const [inscriptionModal, setInscriptionModal] = useState(false);
  const [inscriptionAmount, setInscriptionAmount] = useState('');

  const unpaidInscription = account?.unpaidRegistrationAmount ?? 0;

  const refetchAll = () => {
    refetchAccount();
    qc.invalidateQueries({ queryKey: ['members'] });
  };

  const handleConfirmInscription = () => {
    if (!member) return;
    const montant = parseFloat(inscriptionAmount.replace(',', '.'));
    if (isNaN(montant) || montant <= 0) { error('Montant invalide'); return; }

    Alert.alert(
      'Confirmer le paiement',
      `Payer ${formatCurrency(montant)} pour l'inscription de ${member.firstname} ${member.lastname} ?\nCette opération est irréversible.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: () =>
            payContribution.mutate(
              { memberId: member.id, amount: montant, contributionType: 'INSCRIPTION' },
              {
                onSuccess: () => { success('Inscription payée avec succès'); setInscriptionModal(false); refetchAll(); },
                onError: (err: unknown) => { error((err as { message?: string })?.message ?? 'Erreur lors du paiement'); },
              }
            ),
        },
      ]
    );
  };

  const openInscription = () => {
    setInscriptionAmount(String(unpaidInscription));
    setInscriptionModal(true);
  };

  const listHeader = useMemo(
    () => (
      <InscriptionHeader
        member={member}
        account={account}
        accountLoading={accountLoading}
        onPayInscription={openInscription}
        canPay={canPay}
      />
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [member, account, accountLoading, canPay]
  );

  return (
    <>
      <TransactionList
        filters={{ types: ['INSCRIPTION', 'AGAPE'], accountMemberId: account?.id }}
        showFilters={false}
        pageSize={5}
        emptyLabel="Aucune transaction d'inscription"
        ListHeaderComponent={listHeader}
        onRefresh={refetchAccount}
      />

      <Modal
        visible={inscriptionModal}
        transparent
        animationType="slide"
        onRequestClose={() => setInscriptionModal(false)}
      >
        <View style={s.overlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.sheet}>
            <View style={s.handle} />
            <Text style={s.modalTitle}>Payer l'inscription</Text>
            <View style={s.infoRow}>
              <Text style={s.infoLabel}>Montant restant</Text>
              <Text style={[s.infoValue, { color: COLORS.error }]}>{formatCurrency(unpaidInscription)}</Text>
            </View>
            <Text style={s.inputLabel}>Montant à payer (FCFA)</Text>
            <TextInput
              style={s.input}
              value={inscriptionAmount}
              onChangeText={setInscriptionAmount}
              keyboardType="numeric"
              placeholder="Montant"
              placeholderTextColor={COLORS.gray[400]}
              returnKeyType="done"
            />
            <View style={s.modalBtns}>
              <TouchableOpacity
                style={[s.btnConfirm, payContribution.isPending && s.btnDisabled]}
                onPress={handleConfirmInscription}
                disabled={payContribution.isPending}
                activeOpacity={0.8}
              >
                {payContribution.isPending
                  ? <ActivityIndicator size="small" color={COLORS.white} />
                  : <Text style={s.btnConfirmText}>Confirmer le paiement</Text>}
              </TouchableOpacity>
              <TouchableOpacity style={s.btnCancel} onPress={() => setInscriptionModal(false)} activeOpacity={0.8}>
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
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 16,
    gap: 10,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  cardTitle: { fontSize: 11, fontWeight: '700', color: COLORS.gray[500], letterSpacing: 0.8, marginBottom: 2 },

  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  dataLabel: { fontSize: 13, color: COLORS.gray[500], flex: 1 },
  dataValue: { fontSize: 13, fontWeight: '700', color: COLORS.gray[800], textAlign: 'right' },

  btn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 12, borderRadius: 10, marginTop: 4,
  },
  btnPrimary: { backgroundColor: COLORS.primary },
  btnGhost: { backgroundColor: COLORS.gray[100] },
  btnDisabled: { opacity: 0.45 },
  btnText: { color: COLORS.white, fontSize: 13, fontWeight: '700' },
  btnTextGhost: { color: COLORS.gray[500], fontSize: 13, fontWeight: '600' },

  txSeparator: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 4, marginTop: 4 },
  txSeparatorText: { fontSize: 11, fontWeight: '700', color: COLORS.gray[500], letterSpacing: 0.8 },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingBottom: 36,
    paddingTop: 12,
    gap: 12,
  },
  handle: { width: 40, height: 4, backgroundColor: COLORS.gray[300], borderRadius: 2, alignSelf: 'center', marginBottom: 4 },
  modalTitle: { fontSize: 17, fontWeight: '800', color: COLORS.gray[800], textAlign: 'center' },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.gray[50],
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  infoLabel: { fontSize: 13, color: COLORS.gray[500] },
  infoValue: { fontSize: 14, fontWeight: '700', color: COLORS.gray[800] },
  inputLabel: { fontSize: 12, color: COLORS.gray[500] },
  input: {
    backgroundColor: COLORS.gray[50],
    borderWidth: 1.5,
    borderColor: COLORS.gray[200],
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: COLORS.gray[800],
  },
  modalBtns: { gap: 10, marginTop: 4 },
  btnConfirm: { backgroundColor: COLORS.primary, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  btnConfirmText: { color: COLORS.white, fontSize: 14, fontWeight: '700' },
  btnCancel: { backgroundColor: COLORS.gray[100], borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  btnCancelText: { color: COLORS.gray[600], fontSize: 14, fontWeight: '600' },
});
