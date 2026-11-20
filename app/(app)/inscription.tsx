import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useMutuelleAccount } from '@/src/hooks/useMutuelleAccount';
import { useCurrentSession, useCurrentExercice, useContextStore } from '@/src/store/contextStore';
import { usePayContribution } from '@/src/hooks/useContribution';
import { useToast } from '@/src/store/toastStore';
import { canMakePayment } from '@/src/navigation/roles';
import { transactionRepository } from '@/src/api/repositories/transactionRepository';
import { bilanRepository } from '@/src/api/repositories/bilanRepository';
import { COLORS } from '@/src/constants';
import { formatCurrency, formatDate, formatFullName } from '@/src/utils/format';
import type { TransactionResponseDTO, MemberResponseDTO, BackendRole } from '@/src/types';
import { MembersAmountModal } from '@/src/components/common/MembersAmountModal';
import { MemberPickerModal } from '@/src/components/common/MemberPickerModal';

// ─── Composants utilitaires ───────────────────────────────────────────────────

function DataRow({
  label,
  value,
  accent,
  isLoading,
  note,
}: {
  label: string;
  value: string;
  accent?: string;
  isLoading?: boolean;
  note?: string;
}) {
  return (
    <View style={s.dataRowWrap}>
      <View style={s.dataRow}>
        <Text style={s.dataLabel}>{label}</Text>
        {isLoading ? (
          <ActivityIndicator size="small" color={COLORS.primary} />
        ) : (
          <Text style={[s.dataValue, accent ? { color: accent } : {}]}>{value}</Text>
        )}
      </View>
      {!!note && <Text style={s.dataNote}>{note}</Text>}
    </View>
  );
}

function TxRow({
  item,
  iconName,
  iconBg,
  iconColor,
  amountColor,
  sign,
}: {
  item: TransactionResponseDTO;
  iconName: string;
  iconBg: string;
  iconColor: string;
  amountColor: string;
  sign: '+' | '-';
}) {
  return (
    <View style={s.txRow}>
      <View style={[s.txIcon, { backgroundColor: iconBg }]}>
        <Ionicons name={iconName as never} size={16} color={iconColor} />
      </View>
      <View style={s.txInfo}>
        <Text style={s.txName} numberOfLines={1}>
          {item.memberFullName ?? '—'}
        </Text>
        <Text style={s.txDate}>{formatDate(item.createdAt)}</Text>
      </View>
      <Text style={[s.txAmount, { color: amountColor }]}>
        {sign}{formatCurrency(item.amount)}
      </Text>
    </View>
  );
}

const TX_PAGE_SIZE = 5;

function TxPaginationBar({
  page,
  totalPages,
  onPrev,
  onNext,
}: {
  page: number;
  totalPages: number | null | undefined;
  onPrev: () => void;
  onNext: () => void;
}) {
  if (totalPages == null || totalPages <= 1) return null;

  return (
    <View style={s.paginationBar}>
      <TouchableOpacity
        style={[s.paginationBtn, page === 0 && s.paginationBtnDisabled]}
        onPress={onPrev}
        disabled={page === 0}
        activeOpacity={0.7}
      >
        <Text style={s.paginationBtnText}>Précédent</Text>
      </TouchableOpacity>
      <Text style={s.paginationLabel}>
        Page {page + 1} / {totalPages}
      </Text>
      <TouchableOpacity
        style={[s.paginationBtn, page >= totalPages - 1 && s.paginationBtnDisabled]}
        onPress={onNext}
        disabled={page >= totalPages - 1}
        activeOpacity={0.7}
      >
        <Text style={s.paginationBtnText}>Suivant</Text>
      </TouchableOpacity>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={s.section}>
      <Text style={s.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

// ─── Écran ────────────────────────────────────────────────────────────────────

export default function InscriptionScreen() {
  const router = useRouter();
  const qc = useQueryClient();

  const session = useCurrentSession();
  const exercice = useCurrentExercice();
  const { success, error } = useToast();
  const role = useContextStore((s) => s.context?.role ?? null) as BackendRole | null;
  const canPay = canMakePayment(role);
  const payContribution = usePayContribution();

  const { data: account, isLoading: accountLoading, refetch: refetchAccount } = useMutuelleAccount();

  // ── Payer ──
  const [pickerOpen, setPickerOpen] = useState(false);
  const [payModal, setPayModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<MemberResponseDTO | null>(null);
  const [inscAmount, setInscAmount] = useState('');

  const refetchAll = () => {
    refetchAccount();
    qc.invalidateQueries({ queryKey: ['transactions'] });
    qc.invalidateQueries({ queryKey: ['mutuelle-account'] });
  };

  const handleConfirmInscription = () => {
    if (!selectedMember) return;
    const montant = parseFloat(inscAmount.replace(',', '.').trim());
    if (isNaN(montant) || montant <= 0) { error('Montant invalide'); return; }

    Alert.alert(
      'Confirmer le paiement',
      `Payer ${formatCurrency(montant)} d'inscription pour ${formatFullName(selectedMember.firstname, selectedMember.lastname)} ?\nCette opération est irréversible.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: () =>
            payContribution.mutate(
              { memberId: selectedMember.id, amount: montant, contributionType: 'INSCRIPTION' },
              {
                onSuccess: () => { success('Inscription enregistrée'); setPayModal(false); setInscAmount(''); refetchAll(); },
                onError: (err: unknown) => { error((err as { message?: string })?.message ?? 'Erreur lors du paiement'); },
              }
            ),
        },
      ]
    );
  };

  const { data: bilanSession, isLoading: bilanLoading, refetch: refetchBilan } = useQuery({
    queryKey: ['bilan', 'mutuelle', 'session', session?.id],
    queryFn: async () => {
      const res = await bilanRepository.getMutuelleSession(session!.id);
      return res.data;
    },
    enabled: !!session?.id,
  });

  const [inscPageNum, setInscPageNum] = useState(0);
  const [agapePageNum, setAgapePageNum] = useState(0);
  const [membersModal, setMembersModal] = useState(false);

  const { data: inscResult, isLoading: inscLoading, refetch: refetchInsc } = useQuery({
    queryKey: ['transactions', 'recent', 'INSCRIPTION', inscPageNum],
    queryFn: async () => {
      const res = await transactionRepository.getAll({
        type: 'INSCRIPTION',
        page: inscPageNum,
        size: TX_PAGE_SIZE,
      });
      return { items: res.data ?? [], totalPages: res.totalPages };
    },
  });

  const { data: agapeResult, isLoading: agapeLoading, refetch: refetchAgape } = useQuery({
    queryKey: ['transactions', 'recent', 'AGAPE', agapePageNum],
    queryFn: async () => {
      const res = await transactionRepository.getAll({
        type: 'AGAPE',
        page: agapePageNum,
        size: TX_PAGE_SIZE,
      });
      return { items: res.data ?? [], totalPages: res.totalPages };
    },
  });

  const recentInscriptions = inscResult?.items ?? [];
  const inscTotalPages = inscResult?.totalPages;
  const recentAgapes = agapeResult?.items ?? [];
  const agapeTotalPages = agapeResult?.totalPages;

  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      refetchAccount(),
      refetchBilan(),
      refetchInsc(),
      refetchAgape(),
    ]);
    qc.invalidateQueries({ queryKey: ['mutuelle-account'] });
    setRefreshing(false);
  };

  const registrationAmount = account?.registrationAmount ?? 0;

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color={COLORS.gray[800]} />
        </TouchableOpacity>
        <Text style={s.title}>Inscriptions & Agapès</Text>
        {session && (
          <View style={s.sessionBadge}>
            <View style={s.sessionDot} />
            <Text style={s.sessionBadgeText}>Session active</Text>
          </View>
        )}
      </View>

      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
      >
        {/* ── Highlight card ────────────────────────────────────────────────── */}
        <View style={s.highlightCard}>
          <Text style={s.highlightTag}>CAISSE INSCRIPTION</Text>
          {accountLoading && !account ? (
            <ActivityIndicator size="large" color={COLORS.white} style={{ marginTop: 8 }} />
          ) : (
            <Text style={s.highlightAmount}>{formatCurrency(registrationAmount)}</Text>
          )}
          {exercice && (
            <Text style={s.highlightSub}>Exercice : {exercice.name}</Text>
          )}
        </View>

        {/* ── Bouton paiement ───────────────────────────────────────────────── */}
        {canPay && (
          <TouchableOpacity
            style={s.payBtn}
            onPress={() => setPickerOpen(true)}
            activeOpacity={0.8}
          >
            <View style={s.payBtnIcon}>
              <Ionicons name="add-circle-outline" size={20} color={COLORS.white} />
            </View>
            <Text style={s.payBtnText}>Enregistrer un paiement</Text>
            <Ionicons name="chevron-forward" size={16} color={COLORS.white} />
          </TouchableOpacity>
        )}

        {/* ── Détail ────────────────────────────────────────────────────────── */}
        <Section title="Détail">
          
         
          <DataRow
            label="Solde caisse inscription"
            value={formatCurrency(account?.registrationAmount ?? 0)}
            isLoading={accountLoading}
          />
        </Section>

        {/* ── Liste des membres ─────────────────────────────────────────────── */}
        <TouchableOpacity
          style={s.membersBtn}
          onPress={() => setMembersModal(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="people-outline" size={18} color={COLORS.primary} />
          <Text style={s.membersBtnText}>Membres ayant payé leur inscription</Text>
          <Ionicons name="chevron-forward" size={16} color={COLORS.primary} />
        </TouchableOpacity>

        {/* ── Inscriptions récentes ─────────────────────────────────────────── */}
        <Section title="Inscriptions récentes">
          {inscLoading ? (
            <ActivityIndicator size="small" color={COLORS.primary} style={{ marginVertical: 16 }} />
          ) : recentInscriptions.length === 0 ? (
            <View style={s.emptyState}>
              <Ionicons name="document-text-outline" size={28} color={COLORS.gray[300]} />
              <Text style={s.emptyText}>Aucune inscription récente</Text>
            </View>
          ) : (
            <>
              {recentInscriptions.map((tx: TransactionResponseDTO) => (
                <TxRow
                  key={tx.id}
                  item={tx}
                  iconName="document-text-outline"
                  iconBg="#DBEAFE"
                  iconColor={COLORS.info}
                  amountColor={COLORS.success}
                  sign="+"
                />
              ))}
              <TxPaginationBar
                page={inscPageNum}
                totalPages={inscTotalPages}
                onPrev={() => setInscPageNum((p) => Math.max(0, p - 1))}
                onNext={() => setInscPageNum((p) => p + 1)}
              />
            </>
          )}
        </Section>

        {/* ── Agapès récentes ──────────────────────────────────────────────── */}
        <Section title="Agapès récentes">
          {agapeLoading ? (
            <ActivityIndicator size="small" color={COLORS.primary} style={{ marginVertical: 16 }} />
          ) : recentAgapes.length === 0 ? (
            <View style={s.emptyState}>
              <Ionicons name="heart-outline" size={28} color={COLORS.gray[300]} />
              <Text style={s.emptyText}>Aucune agapè récente</Text>
            </View>
          ) : (
            <>
              {recentAgapes.map((tx: TransactionResponseDTO) => (
                <TxRow
                  key={tx.id}
                  item={tx}
                  iconName="heart-outline"
                  iconBg="#FCE7F3"
                  iconColor={COLORS.error}
                  amountColor={COLORS.error}
                  sign="-"
                />
              ))}
              <TxPaginationBar
                page={agapePageNum}
                totalPages={agapeTotalPages}
                onPrev={() => setAgapePageNum((p) => Math.max(0, p - 1))}
                onNext={() => setAgapePageNum((p) => p + 1)}
              />
            </>
          )}
        </Section>
      </ScrollView>

      <MembersAmountModal
        visible={membersModal}
        onClose={() => setMembersModal(false)}
        title="Membres ayant payé leur inscription"
        getAmount={(m) => m.baseRegistrationAmount - m.unpaidRegistrationAmount}
      />

      <MemberPickerModal
        visible={pickerOpen}
        onClose={() => setPickerOpen(false)}
        title="Choisir un membre"
        onSelect={(member) => { setSelectedMember(member); setInscAmount(''); setPayModal(true); }}
      />

      <Modal visible={payModal} transparent animationType="slide" onRequestClose={() => setPayModal(false)}>
        <View style={s.overlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.sheet}>
            <View style={s.handle} />
            <Text style={s.modalTitle}>Payer l'inscription</Text>
            {selectedMember && (
              <View style={s.memberTag}>
                <Ionicons name="person-outline" size={14} color={COLORS.primary} />
                <Text style={s.memberTagText}>{formatFullName(selectedMember.firstname, selectedMember.lastname)}</Text>
              </View>
            )}
            <Text style={s.inputLabel}>Montant (FCFA)</Text>
            <TextInput
              style={s.input}
              value={inscAmount}
              onChangeText={setInscAmount}
              keyboardType="numeric"
              placeholder="Ex : 5000"
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
              <TouchableOpacity style={s.btnCancel} onPress={() => setPayModal(false)} activeOpacity={0.8}>
                <Text style={s.btnCancelText}>Annuler</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.gray[50] },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  backBtn: { padding: 4 },
  title: { flex: 1, fontSize: 17, fontWeight: '800', color: COLORS.gray[900] },
  sessionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  sessionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.success,
  },
  sessionBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.success,
  },

  scroll: { padding: 16, gap: 16, paddingBottom: 40 },

  highlightCard: {
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    gap: 6,
  },
  highlightTag: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.gray[400],
    letterSpacing: 1.5,
  },
  highlightAmount: {
    fontSize: 34,
    fontWeight: '800',
    color: COLORS.white,
    marginTop: 4,
  },
  highlightSub: {
    fontSize: 13,
    color: COLORS.gray[400],
    marginTop: 2,
  },

  section: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 16,
    gap: 2,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.gray[500],
    letterSpacing: 0.5,
    marginBottom: 8,
  },

  dataRowWrap: { gap: 2 },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  dataLabel: { fontSize: 13, color: COLORS.gray[500], flex: 1 },
  dataValue: { fontSize: 14, fontWeight: '700', color: COLORS.gray[800] },
  dataNote: {
    fontSize: 11,
    color: COLORS.gray[400],
    fontStyle: 'italic',
    paddingBottom: 4,
  },

  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  txIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txInfo: { flex: 1, gap: 2 },
  txName: { fontSize: 13, fontWeight: '600', color: COLORS.gray[800] },
  txDate: { fontSize: 12, color: COLORS.gray[400] },
  txAmount: { fontSize: 14, fontWeight: '800' },

  emptyState: { alignItems: 'center', paddingVertical: 20, gap: 6 },
  emptyText: { fontSize: 13, color: COLORS.gray[400] },

  paginationBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
  },
  paginationBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  paginationBtnDisabled: {
    opacity: 0.4,
  },
  paginationBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
  paginationLabel: {
    fontSize: 13,
    color: COLORS.gray[500],
  },

  membersBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  membersBtnText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },

  payBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    padding: 16,
  },
  payBtnIcon: { width: 28, alignItems: 'center' },
  payBtnText: { flex: 1, fontSize: 14, fontWeight: '700', color: COLORS.white },

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

  memberTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  memberTagText: { fontSize: 14, fontWeight: '700', color: COLORS.primary },

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
  btnDisabled: { opacity: 0.45 },
});
