import React, { useState } from "react";
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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMutuelleAccount } from "@/src/hooks/useMutuelleAccount";
import { useContextStore } from "@/src/store/contextStore";
import { transactionRepository } from "@/src/api/repositories/transactionRepository";
import { epargneRepository } from "@/src/api/repositories/epargneRepository";
import { empruntRepository } from "@/src/api/repositories/empruntRepository";
import { useToast } from "@/src/store/toastStore";
import { canMakePayment } from "@/src/navigation/roles";
import { COLORS } from "@/src/constants";
import { formatCurrency, formatDate, formatFullName } from "@/src/utils/format";
import type { TransactionResponseDTO, MemberResponseDTO, BackendRole } from "@/src/types";
import { MembersAmountModal } from "@/src/components/common/MembersAmountModal";
import { MemberPickerModal } from "@/src/components/common/MemberPickerModal";

type EpargneOp = 'deposer' | 'retirer' | 'emprunter' | 'rembourser';

// ─── Ligne de données ─────────────────────────────────────────────────────────

function DataRow({
  label,
  value,
  accent,
  isLoading,
}: {
  label: string;
  value: string;
  accent?: string;
  isLoading?: boolean;
}) {
  return (
    <View style={s.dataRow}>
      <Text style={s.dataLabel}>{label}</Text>
      {isLoading ? (
        <ActivityIndicator size="small" color={COLORS.primary} />
      ) : (
        <Text style={[s.dataValue, accent ? { color: accent } : {}]}>
          {value}
        </Text>
      )}
    </View>
  );
}

// ─── Ligne de transaction ────────────────────────────────────────────────────

function TxRow({ item }: { item: TransactionResponseDTO }) {
  const isEpargne = item.transactionType === "EPARGNE";
  const isCredit = item.transactionDirection === "CREDIT";
  const iconColor = isEpargne ? COLORS.success : COLORS.warning;
  const amountColor = isCredit ? COLORS.success : COLORS.error;
  const sign = isCredit ? "+" : "-";

  return (
    <View style={s.txRow}>
      <View
        style={[
          s.txIconWrap,
          { backgroundColor: isEpargne ? "#DCFCE7" : "#FEF3C7" },
        ]}
      >
        <Ionicons
          name={isEpargne ? "wallet-outline" : "cash-outline"}
          size={16}
          color={iconColor}
        />
      </View>
      <View style={s.txInfo}>
        <Text style={s.txType}>{item.transactionType}</Text>
        <Text style={s.txDate}>{formatDate(item.createdAt)}</Text>
      </View>
      <Text style={[s.txAmount, { color: amountColor }]}>
        {sign}
        {formatCurrency(item.amount)}
      </Text>
    </View>
  );
}

const TX_PAGE_SIZE = 5;

// ─── Pagination ───────────────────────────────────────────────────────────────

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
        style={[
          s.paginationBtn,
          page >= totalPages - 1 && s.paginationBtnDisabled,
        ]}
        onPress={onNext}
        disabled={page >= totalPages - 1}
        activeOpacity={0.7}
      >
        <Text style={s.paginationBtnText}>Suivant</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Section ─────────────────────────────────────────────────────────────────

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={s.section}>
      <Text style={s.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

// ─── Écran ────────────────────────────────────────────────────────────────────

export default function TresorerieScreen() {
  const router = useRouter();
  const qc = useQueryClient();
  const { success, error } = useToast();
  const role = useContextStore((s) => s.context?.role ?? null) as BackendRole | null;
  const canPay = canMakePayment(role);

  const {
    data: account,
    isLoading: accountLoading,
    refetch: refetchAccount,
  } = useMutuelleAccount();

  const [epargnePageNum, setEpargnePageNum] = useState(0);
  const [empruntPageNum, setEmpruntPageNum] = useState(0);
  const [membersModal, setMembersModal] = useState(false);

  // ── Payer ──
  const [pickerOpen, setPickerOpen] = useState(false);
  const [payModal, setPayModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<MemberResponseDTO | null>(null);
  const [opType, setOpType] = useState<EpargneOp>('deposer');
  const [amount, setAmount] = useState('');

  const refetchAll = () => {
    refetchAccount();
    qc.invalidateQueries({ queryKey: ['transactions'] });
    qc.invalidateQueries({ queryKey: ['mutuelle-account'] });
  };

  const epargnerMutation = useMutation({
    mutationFn: epargneRepository.epargner,
    onSuccess: () => { success(opType === 'deposer' ? 'Dépôt enregistré' : 'Retrait enregistré'); setPayModal(false); setAmount(''); refetchAll(); },
    onError: (err: unknown) => { error((err as { message?: string })?.message ?? "Erreur lors de l'opération"); },
  });

  const emprunterMutation = useMutation({
    mutationFn: empruntRepository.emprunter,
    onSuccess: () => { success('Emprunt enregistré'); setPayModal(false); setAmount(''); refetchAll(); },
    onError: (err: unknown) => { error((err as { message?: string })?.message ?? 'Erreur'); },
  });

  const rembourserMutation = useMutation({
    mutationFn: empruntRepository.rembourser,
    onSuccess: () => { success('Remboursement enregistré'); setPayModal(false); setAmount(''); refetchAll(); },
    onError: (err: unknown) => { error((err as { message?: string })?.message ?? 'Erreur'); },
  });

  const isPending = epargnerMutation.isPending || emprunterMutation.isPending || rembourserMutation.isPending;

  const handleConfirm = () => {
    if (!selectedMember) return;
    const montant = parseFloat(amount.replace(',', '.').trim());
    if (isNaN(montant) || montant <= 0) { error('Montant invalide'); return; }

    const labels: Record<EpargneOp, string> = {
      deposer: 'déposer', retirer: 'retirer', emprunter: 'emprunter', rembourser: 'rembourser',
    };
    Alert.alert(
      'Confirmer l\'opération',
      `${labels[opType].charAt(0).toUpperCase() + labels[opType].slice(1)} ${formatCurrency(montant)} pour ${formatFullName(selectedMember.firstname, selectedMember.lastname)} ?\nCette opération est irréversible.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: () => {
            const id = selectedMember.id;
            if (opType === 'deposer')    epargnerMutation.mutate({ memberId: id, amount: montant, transactionDirection: 'CREDIT' });
            if (opType === 'retirer')    epargnerMutation.mutate({ memberId: id, amount: montant, transactionDirection: 'DEBIT' });
            if (opType === 'emprunter')  emprunterMutation.mutate({ memberId: id, amount: montant });
            if (opType === 'rembourser') rembourserMutation.mutate({ memberId: id, amount: montant });
          },
        },
      ]
    );
  };

  const opLabels: Record<EpargneOp, string> = {
    deposer: 'Déposer épargne', retirer: 'Retirer épargne', emprunter: 'Emprunter', rembourser: 'Rembourser',
  };

  const {
    data: epargneResult,
    isLoading: epargneLoading,
    refetch: refetchEpargne,
  } = useQuery({
    queryKey: ["transactions", "recent", "EPARGNE", epargnePageNum],
    queryFn: async () => {
      const res = await transactionRepository.getAll({
        type: "EPARGNE",
        page: epargnePageNum,
        size: TX_PAGE_SIZE,
      });
      return { items: res.data ?? [], totalPages: res.totalPages };
    },
  });

  const {
    data: empruntResult,
    isLoading: empruntLoading,
    refetch: refetchEmprunt,
  } = useQuery({
    queryKey: ["transactions", "recent", "EMPRUNT", empruntPageNum],
    queryFn: async () => {
      const res = await transactionRepository.getAll({
        type: "EMPRUNT",
        page: empruntPageNum,
        size: TX_PAGE_SIZE,
      });
      return { items: res.data ?? [], totalPages: res.totalPages };
    },
  });

  const recentEpargne = epargneResult?.items ?? [];
  const epargneTotalPages = epargneResult?.totalPages;
  const recentEmprunt = empruntResult?.items ?? [];
  const empruntTotalPages = empruntResult?.totalPages;

  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      refetchAccount(),
      refetchEpargne(),
      refetchEmprunt(),
    ]);
    qc.invalidateQueries({ queryKey: ["mutuelle-account"] });
    setRefreshing(false);
  };

  const isAccountLoading = accountLoading && !account;
  const savingAmount = account?.savingAmount ?? 0;
  const borrowAmount = account?.borrowAmount ?? 0;
  const epargneTotaleCollectee = savingAmount + borrowAmount;

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <View style={s.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={s.backBtn}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={22} color={COLORS.gray[800]} />
        </TouchableOpacity>
        <Text style={s.title}>Épargne disponible</Text>
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
        {/* ── Highlight ─────────────────────────────────────────────────────── */}
        <View style={s.highlightCard}>
          <Text style={s.highlightTag}>ÉPARGNE DISPONIBLE</Text>
          {isAccountLoading ? (
            <ActivityIndicator
              size="large"
              color={COLORS.white}
              style={{ marginTop: 8 }}
            />
          ) : (
            <Text style={s.highlightAmount}>
              {formatCurrency(savingAmount)}
            </Text>
          )}
          <Text style={s.highlightSub}>
            Trésorerie liquide disponible dans la caisse
          </Text>
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
            <Text style={s.payBtnText}>Enregistrer un mouvement</Text>
            <Ionicons name="chevron-forward" size={16} color={COLORS.white} />
          </TouchableOpacity>
        )}

        {/* ── Métriques épargne ─────────────────────────────────────────────── */}
        <Section title="Épargne">
          <DataRow
            label="Épargne totale collectée (session)"
            value={formatCurrency(epargneTotaleCollectee)}
            accent={COLORS.success}
            isLoading={accountLoading}
          />
          <DataRow
            label="Total emprunté (en cours)"
            value={formatCurrency(borrowAmount)}
            accent={borrowAmount > 0 ? COLORS.error : COLORS.success}
            isLoading={accountLoading}
          />
          <DataRow
            label="Épargne disponible"
            value={formatCurrency(account?.savingAmount ?? 0)}
            accent={COLORS.success}
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
          <Text style={s.membersBtnText}>Membres ayant épargné</Text>
          <Ionicons name="chevron-forward" size={16} color={COLORS.primary} />
        </TouchableOpacity>

        {/* ── Épargne récente ───────────────────────────────────────────────── */}
        <Section title="Épargne récente">
          {epargneLoading ? (
            <ActivityIndicator
              size="small"
              color={COLORS.primary}
              style={{ marginVertical: 16 }}
            />
          ) : recentEpargne.length === 0 ? (
            <View style={s.emptyTx}>
              <Ionicons
                name="wallet-outline"
                size={28}
                color={COLORS.gray[300]}
              />
              <Text style={s.emptyTxText}>Aucune transaction d'épargne</Text>
            </View>
          ) : (
            <>
              {recentEpargne.map((tx) => (
                <TxRow key={tx.id} item={tx} />
              ))}
              <TxPaginationBar
                page={epargnePageNum}
                totalPages={epargneTotalPages}
                onPrev={() => setEpargnePageNum((p) => Math.max(0, p - 1))}
                onNext={() => setEpargnePageNum((p) => p + 1)}
              />
            </>
          )}
        </Section>

        {/* ── Emprunts récents ──────────────────────────────────────────────── */}
        <Section title="Emprunts récents">
          {empruntLoading ? (
            <ActivityIndicator
              size="small"
              color={COLORS.primary}
              style={{ marginVertical: 16 }}
            />
          ) : recentEmprunt.length === 0 ? (
            <View style={s.emptyTx}>
              <Ionicons
                name="cash-outline"
                size={28}
                color={COLORS.gray[300]}
              />
              <Text style={s.emptyTxText}>Aucune transaction d'emprunt</Text>
            </View>
          ) : (
            <>
              {recentEmprunt.map((tx) => (
                <TxRow key={tx.id} item={tx} />
              ))}
              <TxPaginationBar
                page={empruntPageNum}
                totalPages={empruntTotalPages}
                onPrev={() => setEmpruntPageNum((p) => Math.max(0, p - 1))}
                onNext={() => setEmpruntPageNum((p) => p + 1)}
              />
            </>
          )}
        </Section>
      </ScrollView>

      <MembersAmountModal
        visible={membersModal}
        onClose={() => setMembersModal(false)}
        title="Membres ayant épargné"
        getAmount={(m) => m.savingAmount}
      />

      {/* ── Picker membre ─────────────────────────────────────────────────── */}
      <MemberPickerModal
        visible={pickerOpen}
        onClose={() => setPickerOpen(false)}
        title="Choisir un membre"
        onSelect={(member) => { setSelectedMember(member); setOpType('deposer'); setAmount(''); setPayModal(true); }}
      />

      {/* ── Modal paiement ────────────────────────────────────────────────── */}
      <Modal visible={payModal} transparent animationType="slide" onRequestClose={() => setPayModal(false)}>
        <View style={s.overlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.sheet}>
            <View style={s.handle} />
            <Text style={s.modalTitle}>Enregistrer un mouvement</Text>
            {selectedMember && (
              <View style={s.memberTag}>
                <Ionicons name="person-outline" size={14} color={COLORS.primary} />
                <Text style={s.memberTagText}>{formatFullName(selectedMember.firstname, selectedMember.lastname)}</Text>
              </View>
            )}

            {/* Choix de l'opération */}
            <View style={s.opGrid}>
              {(['deposer', 'retirer', 'emprunter', 'rembourser'] as EpargneOp[]).map((op) => (
                <TouchableOpacity
                  key={op}
                  style={[s.opBtn, opType === op && s.opBtnActive]}
                  onPress={() => setOpType(op)}
                  activeOpacity={0.7}
                >
                  <Text style={[s.opBtnText, opType === op && s.opBtnTextActive]}>{opLabels[op]}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={s.inputLabel}>Montant (FCFA)</Text>
            <TextInput
              style={s.input}
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              placeholder="Ex : 10000"
              placeholderTextColor={COLORS.gray[400]}
              returnKeyType="done"
            />

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
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  backBtn: { padding: 4 },
  title: { fontSize: 18, fontWeight: "800", color: COLORS.gray[900] },
  scroll: { padding: 16, gap: 16, paddingBottom: 40 },

  highlightCard: {
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    padding: 28,
    alignItems: "center",
    gap: 6,
  },
  highlightTag: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.gray[400],
    letterSpacing: 1.5,
  },
  highlightAmount: {
    fontSize: 36,
    fontWeight: "800",
    color: COLORS.white,
    marginTop: 4,
  },
  highlightSub: {
    fontSize: 13,
    color: COLORS.gray[400],
    marginTop: 2,
    textAlign: "center",
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
    fontWeight: "700",
    color: COLORS.gray[500],
    letterSpacing: 0.5,
    marginBottom: 8,
  },

  dataRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  dataLabel: { fontSize: 13, color: COLORS.gray[500], flex: 1 },
  dataValue: { fontSize: 14, fontWeight: "700", color: COLORS.gray[800] },

  txRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  txIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  txInfo: { flex: 1, gap: 2 },
  txType: { fontSize: 13, fontWeight: "600", color: COLORS.gray[800] },
  txDate: { fontSize: 12, color: COLORS.gray[400] },
  txAmount: { fontSize: 14, fontWeight: "800" },

  emptyTx: { alignItems: "center", paddingVertical: 20, gap: 6 },
  emptyTxText: { fontSize: 13, color: COLORS.gray[400] },

  paginationBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
    fontWeight: "600",
    color: COLORS.primary,
  },
  paginationLabel: {
    fontSize: 13,
    color: COLORS.gray[500],
  },

  membersBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  membersBtnText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.primary,
  },

  payBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    padding: 16,
  },
  payBtnIcon: { width: 28, alignItems: "center" },
  payBtnText: { flex: 1, fontSize: 14, fontWeight: "700", color: COLORS.white },

  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingBottom: 36,
    paddingTop: 12,
    gap: 12,
  },
  handle: { width: 40, height: 4, backgroundColor: COLORS.gray[300], borderRadius: 2, alignSelf: "center", marginBottom: 4 },
  modalTitle: { fontSize: 17, fontWeight: "800", color: COLORS.gray[800], textAlign: "center" },

  memberTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#EFF6FF",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  memberTagText: { fontSize: 14, fontWeight: "700", color: COLORS.primary },

  opGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  opBtn: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: COLORS.gray[100],
    borderWidth: 1.5,
    borderColor: COLORS.gray[200],
  },
  opBtnActive: { backgroundColor: COLORS.primary + "15", borderColor: COLORS.primary },
  opBtnText: { fontSize: 13, fontWeight: "600", color: COLORS.gray[600] },
  opBtnTextActive: { color: COLORS.primary },

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
  btnConfirm: { backgroundColor: COLORS.primary, borderRadius: 12, paddingVertical: 14, alignItems: "center" },
  btnConfirmText: { color: COLORS.white, fontSize: 14, fontWeight: "700" },
  btnCancel: { backgroundColor: COLORS.gray[100], borderRadius: 12, paddingVertical: 14, alignItems: "center" },
  btnCancelText: { color: COLORS.gray[600], fontSize: 14, fontWeight: "600" },
  btnDisabled: { opacity: 0.45 },
});
