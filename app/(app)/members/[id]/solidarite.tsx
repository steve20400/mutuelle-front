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
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useMember } from '@/src/hooks/useMembers';
import {
  useMemberAccount,
  usePaySolidarite,
} from '@/src/hooks/useContribution';
import { useContextStore, useCurrentSession } from '@/src/store/contextStore';
import { useToast } from '@/src/store/toastStore';
import { contributionRepository } from '@/src/api/repositories/contributionRepository';
import { bilanRepository } from '@/src/api/repositories/bilanRepository';
import { COLORS } from '@/src/constants';
import { formatCurrency, formatDate } from '@/src/utils/format';
import { TransactionList } from '@/src/components/transactions';
import { canMakePayment } from '@/src/navigation/roles';
import type { AccountMemberDTO, MemberExerciceBilanDTO, BackendRole } from '@/src/types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function DataRow({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <View style={s.dataRow}>
      <Text style={s.dataLabel}>{label}</Text>
      <Text style={[s.dataValue, accent ? { color: accent } : {}]}>{value}</Text>
    </View>
  );
}

function ProgressBar({ percent, color }: { percent: number; color: string }) {
  const clamped = Math.min(100, Math.max(0, percent));
  return (
    <View style={s.progressTrack}>
      <View style={[s.progressFill, { width: `${clamped}%` as `${number}%`, backgroundColor: color }]} />
    </View>
  );
}

function ExerciceRow({ item }: { item: MemberExerciceBilanDTO }) {
  const solde = (item.snapshotUnpaidRenfoulement ?? 0) === 0;
  return (
    <View style={s.exerciceRow}>
      <View style={s.exerciceLeft}>
        <Text style={s.exerciceName}>{item.exerciceName}</Text>
        <Text style={s.exerciceDate}>{formatDate(item.exerciceStartDate)}</Text>
      </View>
      <View style={s.exerciceRight}>
        <Text style={[s.exerciceAmount, { color: COLORS.primary }]}>
          {formatCurrency(item.totalRenfoulementPaid ?? 0)}
        </Text>
        <View style={[s.exerciceBadge, { backgroundColor: solde ? COLORS.success : COLORS.error }]}>
          <Text style={s.exerciceBadgeText}>{solde ? 'Soldé' : 'Non soldé'}</Text>
        </View>
      </View>
    </View>
  );
}

// ─── Header du FlatList ───────────────────────────────────────────────────────

interface SolidariteHeaderProps {
  account: AccountMemberDTO | undefined;
  accountLoading: boolean;
  exercices: MemberExerciceBilanDTO[];
  exercicesLoading: boolean;
  onPaySolidarite: () => void;
  onPayRenflouement: () => void;
  canPay: boolean;
}

function SolidariteHeader({
  account,
  accountLoading,
  exercices,
  exercicesLoading,
  onPaySolidarite,
  onPayRenflouement,
  canPay,
}: SolidariteHeaderProps) {
  const solidaritePaid   = account?.solidarityAmount ?? 0;
  const solidariteUnpaid = account?.unpaidSolidarityAmount ?? 0;
  const solidariteTotal  = solidaritePaid + solidariteUnpaid;
  const solidaritePercent = solidariteTotal > 0 ? (solidaritePaid / solidariteTotal) * 100 : 0;
  const solidariteSolde  = solidariteUnpaid === 0;

  const unpaidRenfoulement = account?.unpaidRenfoulement ?? 0;
  const renfoulementSolde  = unpaidRenfoulement === 0;

  return (
    <View style={s.headerRoot}>
      <View style={s.pageTitle}>
        <Ionicons name="people" size={18} color={COLORS.primary} />
        <Text style={s.pageTitleText}>Solidarité</Text>
      </View>

      {accountLoading && !account ? (
        <View style={s.loader}><ActivityIndicator size="large" color={COLORS.primary} /></View>
      ) : (
        <>
          {/* ── Carte solidarité ── */}
          <View style={s.card}>
            <Text style={s.cardTitle}>SOLIDARITE</Text>
            <View style={s.progressHeader}>
              <Text style={s.progressLabel}>
                {formatCurrency(solidaritePaid)} / {formatCurrency(solidariteTotal)}
              </Text>
              <Text style={[s.progressPct, { color: solidariteSolde ? COLORS.success : COLORS.warning }]}>
                {Math.round(solidaritePercent)}%
              </Text>
            </View>
            <ProgressBar percent={solidaritePercent} color={solidariteSolde ? COLORS.success : COLORS.warning} />
            <Text style={s.progressSub}>
              {solidariteSolde ? 'Solidarité soldée' : `${formatCurrency(solidariteUnpaid)} restant à payer`}
            </Text>
            {canPay && (
              <TouchableOpacity
                style={[s.btn, solidariteSolde ? s.btnGhost : s.btnOutline, solidariteSolde && s.btnDisabled]}
                onPress={onPaySolidarite}
                disabled={solidariteSolde}
                activeOpacity={0.8}
              >
                <Text style={[s.btnText, solidariteSolde ? s.btnTextGhost : s.btnTextOutline]}>
                  {solidariteSolde ? 'Solidarité soldée' : 'Payer solidarité'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* ── Carte renflouement ── */}
          <View style={s.card}>
            <Text style={s.cardTitle}>RENFLOUEMENT DÛ</Text>
            <DataRow
              label="Montant dû"
              value={formatCurrency(unpaidRenfoulement)}
              accent={renfoulementSolde ? COLORS.success : COLORS.error}
            />
            <DataRow
              label="Statut"
              value={renfoulementSolde ? 'Soldé' : 'Non payé'}
              accent={renfoulementSolde ? COLORS.success : COLORS.warning}
            />
            {canPay && (
              <TouchableOpacity
                style={[s.btn, renfoulementSolde ? s.btnGhost : s.btnPrimary, renfoulementSolde && s.btnDisabled]}
                onPress={onPayRenflouement}
                disabled={renfoulementSolde}
                activeOpacity={0.8}
              >
                <Text style={[s.btnText, renfoulementSolde && s.btnTextGhost]}>
                  {renfoulementSolde ? 'Renflouement soldé' : 'Enregistrer paiement'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* ── Exercices passés ── */}
          <View style={s.card}>
            <Text style={s.cardTitle}>EXERCICES PASSÉS</Text>
            {exercicesLoading ? (
              <ActivityIndicator size="small" color={COLORS.primary} style={{ marginVertical: 12 }} />
            ) : exercices.length === 0 ? (
              <View style={s.emptyCard}>
                <Ionicons name="time-outline" size={28} color={COLORS.gray[300]} />
                <Text style={s.emptyCardText}>Aucun exercice passé</Text>
              </View>
            ) : (
              exercices.map((item) => <ExerciceRow key={item.id} item={item} />)
            )}
          </View>
        </>
      )}

      <View style={s.txSeparator}>
        <Ionicons name="swap-horizontal-outline" size={13} color={COLORS.gray[400]} />
        <Text style={s.txSeparatorText}>TRANSACTIONS SOLIDARITE</Text>
      </View>
    </View>
  );
}

// ─── Écran ────────────────────────────────────────────────────────────────────

export default function MemberSolidariteScreen() {
  const { id } = useGlobalSearchParams<{ id: string }>();
  const memberId = Number(id);
  const qc = useQueryClient();

  const { data: member } = useMember(memberId);
  const { data: account, isLoading: accountLoading, refetch: refetchAccount } = useMemberAccount(memberId);
  const { data: exercices = [], isLoading: exercicesLoading } = useQuery({
    queryKey: ['bilan', 'member', memberId, 'exercices'],
    queryFn: async () => {
      const res = await bilanRepository.getMemberExercices(memberId);
      return res.data ?? [];
    },
    enabled: !!memberId,
  });
  const session = useCurrentSession();
  const { success, error } = useToast();
  const paySolidarite = usePaySolidarite();
  const role = useContextStore((s) => s.context?.role ?? null) as BackendRole | null;
  const canPay = canMakePayment(role);

  // ── Solidarité ──
  const [solidariteModal, setSolidariteModal] = useState(false);
  const [solidariteAmount, setSolidariteAmount] = useState('');

  // ── Renflouement ──
  const [payModal, setPayModal] = useState(false);
  const [renflouementAmount, setRenflouementAmount] = useState('');

  const unpaidRenfoulement = account?.unpaidRenfoulement ?? 0;

  const refetchAll = () => {
    refetchAccount();
    qc.invalidateQueries({ queryKey: ['members'] });
    qc.invalidateQueries({ queryKey: ['accounts'] });
    qc.invalidateQueries({ queryKey: ['transactions'] });
  };

  // ── Handlers solidarité ──
  const handleConfirmSolidarite = () => {
    if (!member) return;
    if (!session) { error('Aucune session active'); return; }
    const montant = parseFloat(solidariteAmount.replace(',', '.'));
    if (isNaN(montant) || montant <= 0) { error('Montant invalide'); return; }

    Alert.alert(
      'Confirmer le paiement',
      `Payer ${formatCurrency(montant)} de solidarité pour ${member.firstname} ${member.lastname} ?\nCette opération est irréversible.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: () =>
            paySolidarite.mutate(
              { membreId: member.id, montant, sessionId: session.id },
              {
                onSuccess: () => { success('Solidarité payée avec succès'); setSolidariteModal(false); setSolidariteAmount(''); refetchAll(); },
                onError: (err: unknown) => { error((err as { message?: string })?.message ?? 'Erreur lors du paiement'); },
              }
            ),
        },
      ]
    );
  };

  // ── Handlers renflouement ──
  const payerMutation = useMutation({
    mutationFn: contributionRepository.pay,
    onSuccess: () => {
      success('Paiement de renflouement enregistré');
      setPayModal(false);
      setRenflouementAmount('');
      refetchAll();
    },
    onError: (err: unknown) => {
      error((err as { message?: string })?.message ?? 'Erreur lors du paiement');
    },
  });

  const handleConfirmRenflouement = () => {
    if (!member) return;
    const montant = parseFloat(renflouementAmount.replace(',', '.').trim());
    if (isNaN(montant) || montant <= 0) { error('Montant invalide'); return; }

    Alert.alert(
      'Confirmer le paiement',
      `Payer ${formatCurrency(montant)} de renflouement pour ${member.firstname} ${member.lastname} ?\nCette opération est irréversible.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: () => payerMutation.mutate({ memberId: member.id, amount: montant, contributionType: 'RENFOULEMENT' }),
        },
      ]
    );
  };

  const openPayRenflouement = () => {
    setRenflouementAmount(String(unpaidRenfoulement));
    setPayModal(true);
  };

  const listHeader = useMemo(
    () => (
      <SolidariteHeader
        account={account}
        accountLoading={accountLoading}
        exercices={exercices}
        exercicesLoading={exercicesLoading}
        onPaySolidarite={() => setSolidariteModal(true)}
        onPayRenflouement={openPayRenflouement}
        canPay={canPay}
      />
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [account, accountLoading, exercices, exercicesLoading, canPay]
  );

  return (
    <>
      <TransactionList
        filters={{ types: ['SOLIDARITE', 'RENFOULEMENT'], accountMemberId: account?.id }}
        showFilters={false}
        pageSize={5}
        emptyLabel="Aucune transaction de solidarité"
        ListHeaderComponent={listHeader}
        onRefresh={refetchAccount}
      />

      {/* ── Modal paiement solidarité ─────────────────────────────────────── */}
      <Modal
        visible={solidariteModal}
        transparent
        animationType="slide"
        onRequestClose={() => setSolidariteModal(false)}
      >
        <View style={s.overlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.sheet}>
            <View style={s.handle} />
            <Text style={s.modalTitle}>Payer solidarité</Text>
            {session && (
              <View style={s.infoRow}>
                <Text style={s.infoLabel}>Session</Text>
                <Text style={s.infoValue}>{session.name}</Text>
              </View>
            )}
            <Text style={s.inputLabel}>Montant (FCFA)</Text>
            <TextInput
              style={s.input}
              value={solidariteAmount}
              onChangeText={setSolidariteAmount}
              keyboardType="numeric"
              placeholder="Ex : 5000"
              placeholderTextColor={COLORS.gray[400]}
              returnKeyType="done"
            />
            <View style={s.modalBtns}>
              <TouchableOpacity
                style={[s.btnConfirm, paySolidarite.isPending && s.btnDisabled]}
                onPress={handleConfirmSolidarite}
                disabled={paySolidarite.isPending}
                activeOpacity={0.8}
              >
                {paySolidarite.isPending
                  ? <ActivityIndicator size="small" color={COLORS.white} />
                  : <Text style={s.btnConfirmText}>Confirmer</Text>}
              </TouchableOpacity>
              <TouchableOpacity
                style={s.btnCancel}
                onPress={() => { setSolidariteModal(false); setSolidariteAmount(''); }}
                activeOpacity={0.8}
              >
                <Text style={s.btnCancelText}>Annuler</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* ── Modal paiement renflouement ───────────────────────────────────── */}
      <Modal visible={payModal} transparent animationType="slide" onRequestClose={() => setPayModal(false)}>
        <View style={s.overlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.sheet}>
            <View style={s.handle} />
            <Text style={s.modalTitle}>Payer le renflouement</Text>
            <View style={s.infoRow}>
              <Text style={s.infoLabel}>Montant dû</Text>
              <Text style={[s.infoValue, { color: COLORS.error }]}>{formatCurrency(unpaidRenfoulement)}</Text>
            </View>
            <Text style={s.inputLabel}>Montant à payer (FCFA)</Text>
            <TextInput
              style={s.input}
              value={renflouementAmount}
              onChangeText={setRenflouementAmount}
              keyboardType="numeric"
              placeholder="Ex : 5000"
              placeholderTextColor={COLORS.gray[400]}
              returnKeyType="done"
            />
            <View style={s.modalBtns}>
              <TouchableOpacity
                style={[s.btnConfirm, payerMutation.isPending && s.btnDisabled]}
                onPress={handleConfirmRenflouement}
                disabled={payerMutation.isPending}
                activeOpacity={0.8}
              >
                {payerMutation.isPending
                  ? <ActivityIndicator size="small" color={COLORS.white} />
                  : <Text style={s.btnConfirmText}>Confirmer le paiement</Text>}
              </TouchableOpacity>
              <TouchableOpacity style={s.btnCancel} onPress={() => setPayModal(false)} activeOpacity={0.8}>
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
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: COLORS.gray[100],
  },
  dataLabel: { fontSize: 13, color: COLORS.gray[500], flex: 1 },
  dataValue: { fontSize: 13, fontWeight: '700', color: COLORS.gray[800], textAlign: 'right' },

  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressLabel: { fontSize: 12, color: COLORS.gray[500] },
  progressPct: { fontSize: 12, fontWeight: '700' },
  progressTrack: { width: '100%', height: 7, backgroundColor: COLORS.gray[100], borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
  progressSub: { fontSize: 11, color: COLORS.gray[400] },

  emptyCard: { alignItems: 'center', paddingVertical: 12, gap: 6 },
  emptyCardText: { fontSize: 13, color: COLORS.gray[400] },

  exerciceRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.gray[100],
  },
  exerciceLeft: { flex: 1, gap: 2 },
  exerciceName: { fontSize: 14, fontWeight: '700', color: COLORS.gray[800] },
  exerciceDate: { fontSize: 12, color: COLORS.gray[400] },
  exerciceRight: { alignItems: 'flex-end', gap: 4 },
  exerciceAmount: { fontSize: 13, fontWeight: '700' },
  exerciceBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  exerciceBadgeText: { fontSize: 10, fontWeight: '700', color: COLORS.white },

  btn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 12, borderRadius: 10, marginTop: 4,
  },
  btnPrimary: { backgroundColor: COLORS.primary },
  btnOutline: { backgroundColor: COLORS.white, borderWidth: 1.5, borderColor: COLORS.primary },
  btnGhost: { backgroundColor: COLORS.gray[100] },
  btnDisabled: { opacity: 0.45 },
  btnText: { color: COLORS.white, fontSize: 13, fontWeight: '700' },
  btnTextOutline: { color: COLORS.primary, fontSize: 13, fontWeight: '700' },
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
