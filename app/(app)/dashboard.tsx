import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  FlatList,
  Modal,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useContextStore } from "@/src/store/contextStore";
import { useLogout } from "@/src/hooks/useAuth";
import { useMutuelleAccount } from "@/src/hooks/useMutuelleAccount";
import { useInfiniteMembers } from "@/src/hooks/useMembers";
import { COLORS } from "@/src/constants";
import {
  formatCurrency,
  formatDate,
  formatFullName,
  formatInitials,
} from "@/src/utils/format";
import { getRoleDisplayName, isAdmin, isMember } from "@/src/navigation/roles";
import type {
  BackendRole,
  CurrentContextResponseDTO,
  AccountMutuelle,
} from "@/src/types";

// ─── Carte stat (layout admin/president/tresorier) ────────────────────────────

function StatCard({
  label,
  value,
  sub,
  accent,
  onPress,
  isLoading,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: string;
  onPress?: () => void;
  isLoading?: boolean;
}) {
  const Wrapper = onPress ? TouchableOpacity : View;
  return (
    <Wrapper
      style={styles.statCard}
      {...(onPress ? { onPress, activeOpacity: 0.8 as number } : {})}
    >
      <Text style={styles.statLabel}>{label}</Text>
      {isLoading ? (
        <View style={styles.statSkeleton} />
      ) : (
        <Text style={[styles.statValue, accent ? { color: accent } : {}]}>
          {value}
        </Text>
      )}
      {sub && <Text style={styles.statSub}>{sub}</Text>}
    </Wrapper>
  );
}

// ─── Ligne mutuelle non-cliquable (section 2 membre) ─────────────────────────

function MutuelleRow({
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
    <View style={ms.mutuelleRow}>
      <Text style={ms.mutuelleLabel}>{label}</Text>
      {isLoading ? (
        <View style={ms.skeleton} />
      ) : (
        <Text style={[ms.mutuelleValue, accent ? { color: accent } : {}]}>
          {value}
        </Text>
      )}
    </View>
  );
}

// ─── Layout MEMBER ────────────────────────────────────────────────────────────

interface MemberDashboardProps {
  context: CurrentContextResponseDTO | null;
  account: AccountMutuelle | undefined;
  accountLoading: boolean;
  refreshing: boolean;
  onRefresh: () => void;
}

function MemberDashboard({
  context,
  account,
  accountLoading,
  refreshing,
  onRefresh,
}: MemberDashboardProps) {
  const router = useRouter();
  const [membersModalOpen, setMembersModalOpen] = useState(false);

  const profile = context?.memberProfile;
  const session = context?.currentSession;
  const exercice = context?.currentExercice;
  const config = context?.config;

  const {
    data: membersData,
    isLoading: membersLoading,
    isError: membersError,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteMembers({ size: 10 });

  const members = membersData?.pages.flatMap((p) => p.items) ?? [];
  const inscriptionSolde = (profile?.unpaidRegistrationAmount ?? 0) === 0;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: COLORS.gray[50] }}
      contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 40 }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={COLORS.primary}
        />
      }
    >
      {/* Bonjour */}
      <Text style={ms.greeting}>
        Bonjour
        {profile
          ? `, ${formatFullName(profile.firstname, profile.lastname)}`
          : ""}
      </Text>

      {/* ── SECTION 1 : Mes informations ─────────────────────────────── */}
      <Text style={ms.sectionTitle}>Mes informations</Text>

      {/* Épargne + Emprunt */}
      <View style={ms.cardsRow}>
        <View style={[ms.finCard, { flex: 1 }]}>
          <View style={[ms.finCardIcon, { backgroundColor: "#DCFCE7" }]}>
            <Ionicons name="wallet-outline" size={16} color={COLORS.success} />
          </View>
          <Text style={ms.finLabel}>Mon épargne</Text>
          <Text style={[ms.finValue, { color: COLORS.success }]}>
            {formatCurrency(profile?.savingAmount ?? 0)}
          </Text>
        </View>

        <View style={[ms.finCard, { flex: 1 }]}>
          <View
            style={[
              ms.finCardIcon,
              {
                backgroundColor:
                  (profile?.borrowAmount ?? 0) > 0
                    ? "#FEF3C7"
                    : COLORS.gray[100],
              },
            ]}
          >
            <Ionicons
              name="trending-up-outline"
              size={16}
              color={
                (profile?.borrowAmount ?? 0) > 0
                  ? COLORS.warning
                  : COLORS.gray[400]
              }
            />
          </View>
          <Text style={ms.finLabel}>Emprunt en cours</Text>
          <Text
            style={[
              ms.finValue,
              {
                color:
                  (profile?.borrowAmount ?? 0) > 0
                    ? COLORS.warning
                    : COLORS.gray[500],
              },
            ]}
          >
            {formatCurrency(profile?.borrowAmount ?? 0)}
          </Text>
        </View>
      </View>

      {/* Solidarité + Inscription */}
      <View style={ms.cardsRow}>
        <View style={[ms.finCard, { flex: 1 }]}>
          <View style={[ms.finCardIcon, { backgroundColor: "#EFF6FF" }]}>
            <Ionicons name="people-outline" size={16} color={COLORS.primary} />
          </View>
          <Text style={ms.finLabel}>Solidarité versée</Text>
          <Text style={[ms.finValue, { color: COLORS.primary }]}>
            {formatCurrency(profile?.solidarityAmount ?? 0)}
          </Text>
        </View>

        <View style={[ms.finCard, { flex: 1 }]}>
          <View
            style={[
              ms.finCardIcon,
              { backgroundColor: inscriptionSolde ? "#D1FAE5" : "#FEE2E2" },
            ]}
          >
            <Ionicons
              name={
                inscriptionSolde
                  ? "checkmark-circle-outline"
                  : "alert-circle-outline"
              }
              size={16}
              color={inscriptionSolde ? COLORS.success : COLORS.error}
            />
          </View>
          <Text style={ms.finLabel}>Inscription</Text>
          <Text
            style={[
              ms.finValue,
              { color: inscriptionSolde ? COLORS.success : COLORS.error },
            ]}
          >
            {inscriptionSolde
              ? "Soldée"
              : `${formatCurrency(profile?.unpaidRegistrationAmount ?? 0)} dû`}
          </Text>
        </View>
      </View>

      {/* Liens rapides section 1 */}
      <View style={ms.linksCard}>
        <TouchableOpacity
          style={ms.linkRow}
          onPress={() => router.push("/(app)/mes-finances" as never)}
          activeOpacity={0.7}
        >
          <Ionicons name="wallet-outline" size={18} color={COLORS.primary} />
          <Text style={ms.linkText}>Voir mes finances</Text>
          <Ionicons name="chevron-forward" size={16} color={COLORS.gray[400]} />
        </TouchableOpacity>
        <View style={ms.linkDivider} />
        <TouchableOpacity
          style={ms.linkRow}
          onPress={() => router.push("/(app)/historique" as never)}
          activeOpacity={0.7}
        >
          <Ionicons name="time-outline" size={18} color={COLORS.primary} />
          <Text style={ms.linkText}>Voir mon historique</Text>
          <Ionicons name="chevron-forward" size={16} color={COLORS.gray[400]} />
        </TouchableOpacity>
      </View>

      {/* ── SECTION 2 : État de la mutuelle ──────────────────────────── */}
      <Text style={ms.sectionTitle}>État de la mutuelle</Text>

      {/* Exercice + Session */}
      <View style={styles.exerciceCard}>
        <View style={styles.exerciceRow}>
          <View style={styles.exerciceLeft}>
            <Text style={styles.exerciceTag}>EXERCICE ACTIF</Text>
            <Text style={styles.exerciceName}>{exercice?.name ?? "-"}</Text>
            <Text style={styles.exerciceDates}>
              {formatDate(exercice?.startDate)} -{" "}
              {exercice?.endDate ? formatDate(exercice.endDate) : "En cours"}
            </Text>
          </View>
          <View style={styles.exerciceRight}>
            <Text style={styles.sessionTag}>SESSION</Text>
            <Text style={styles.sessionName}>{session?.name ?? "-"}</Text>
            {session?.status === "IN_PROGRESS" && (
              <View style={styles.activeBadge}>
                <View style={styles.activeDot} />
                <Text style={styles.activeText}>Active</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Totaux mutuelle (non cliquables) */}
      <View style={ms.mutuelleTotals}>
        <MutuelleRow
          label="Épargne totale de la mutuelle"
          value={formatCurrency(account?.savingAmount ?? 0)}
          accent={COLORS.success}
          isLoading={accountLoading}
        />
        <View style={ms.rowDivider} />
        <MutuelleRow
          label="Total inscriptions collectées"
          value={formatCurrency(account?.registrationAmount ?? 0)}
          isLoading={accountLoading}
        />
        <View style={ms.rowDivider} />
        <MutuelleRow
          label="Fonds de solidarité"
          value={formatCurrency(account?.solidarityAmount ?? 0)}
          accent={COLORS.success}
          isLoading={accountLoading}
        />
      </View>

      {/* Carte membres → modal */}
      <TouchableOpacity
        style={ms.membresCard}
        onPress={() => setMembersModalOpen(true)}
        activeOpacity={0.8}
      >
        <View style={ms.membresCardLeft}>
          <View style={ms.membresIcon}>
            <Ionicons name="people" size={20} color={COLORS.primary} />
          </View>
          <View>
            <Text style={ms.membresTitle}>
              {context?.totalMembers ?? 0} membres
            </Text>
            <Text style={ms.membresSub}>Voir la liste des membres</Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={18} color={COLORS.primary} />
      </TouchableOpacity>

      {/* Bilans */}
      <TouchableOpacity
        style={styles.bilanCard}
        onPress={() => router.push("/(app)/bilan" as never)}
        activeOpacity={0.85}
      >
        <View style={styles.bilanCardLeft}>
          <View style={styles.bilanCardIcon}>
            <Ionicons
              name="bar-chart-outline"
              size={20}
              color={COLORS.primary}
            />
          </View>
          <View>
            <Text style={styles.bilanCardTitle}>Bilans de la Mutuelle</Text>
            <Text style={styles.bilanCardSub}>
              Exercices et sessions clôturés
            </Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={18} color={COLORS.primary} />
      </TouchableOpacity>

      {/* Configuration active */}
      {config && (
        <View style={styles.configCard}>
          <Text style={styles.configTitle}>Configuration active</Text>
          <BilanRow
            label="Frais inscription"
            value={formatCurrency(config.registrationFeeAmount)}
          />
          <BilanRow
            label="Frais solidarité"
            value={formatCurrency(config.solidarityFeeAmount)}
          />
          <BilanRow
            label="Taux intérêt emprunt"
            value={`${config.loanInterestRatePercent}%`}
          />
        </View>
      )}

      {/* ── Modal liste des membres ───────────────────────────────────── */}
      <Modal
        visible={membersModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setMembersModalOpen(false)}
      >
        <View style={ms.modalOverlay}>
          {/* Backdrop — ferme la modal au tap */}
          <TouchableOpacity
            style={{ flex: 1 }}
            activeOpacity={1}
            onPress={() => setMembersModalOpen(false)}
          />
          {/* Sheet avec hauteur fixe pour que la FlatList ait des bornes */}
          <View style={ms.modalSheet}>
            <View style={ms.modalHandle} />
            <View style={ms.modalHeader}>
              <Text style={ms.modalTitle}>Membres de la mutuelle</Text>
              <TouchableOpacity
                onPress={() => setMembersModalOpen(false)}
                hitSlop={8}
              >
                <Ionicons name="close" size={22} color={COLORS.gray[500]} />
              </TouchableOpacity>
            </View>

            <View style={{ flex: 1 }}>
              {membersLoading && members.length === 0 ? (
                <View style={ms.modalLoading}>
                  <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
              ) : membersError ? (
                <View style={ms.modalEmpty}>
                  <Text style={ms.modalEmptyText}>
                    Impossible de charger la liste
                  </Text>
                </View>
              ) : (
                <FlatList
                  style={{ flex: 1 }}
                  data={members}
                  keyExtractor={(m) => String(m.id)}
                  renderItem={({ item }) => (
                    <View style={ms.memberRow}>
                      <View style={ms.memberAvatar}>
                        <Text style={ms.memberAvatarText}>
                          {formatInitials(item.firstname, item.lastname)}
                        </Text>
                      </View>
                      <Text style={ms.memberName}>
                        {formatFullName(item.firstname, item.lastname)}
                      </Text>
                    </View>
                  )}
                  onEndReached={() => {
                    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
                  }}
                  onEndReachedThreshold={0.3}
                  ListFooterComponent={
                    isFetchingNextPage ? (
                      <ActivityIndicator
                        size="small"
                        color={COLORS.primary}
                        style={{ marginVertical: 12 }}
                      />
                    ) : null
                  }
                  ListEmptyComponent={
                    <View style={ms.modalEmpty}>
                      <Text style={ms.modalEmptyText}>Aucun membre trouvé</Text>
                    </View>
                  }
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ paddingBottom: 24 }}
                />
              )}
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

// ─── Écran principal ──────────────────────────────────────────────────────────

export default function DashboardScreen() {
  const router = useRouter();
  const { context, fetchContext } = useContextStore();
  const {
    data: account,
    isLoading: accountLoading,
    refetch: refetchAccount,
  } = useMutuelleAccount();
  const { mutate: logout } = useLogout();
  const [refreshing, setRefreshing] = useState(false);
  const [bilanOpen, setBilanOpen] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchContext(), refetchAccount()]);
    setRefreshing(false);
  };

  const role = context?.role as BackendRole | undefined;
  const roleLabel = role ? getRoleDisplayName(role) : "";

  const session = context?.currentSession;
  const exercice = context?.currentExercice;
  const config = context?.config;

  const totalGlobal =
    (account?.savingAmount ?? 0) +
    (account?.solidarityAmount ?? 0) +
    (account?.registrationAmount ?? 0);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {/* Header — identique pour tous les rôles */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Mutuelle ENSPY</Text>
          <Text style={styles.headerRole}>{roleLabel.toUpperCase()}</Text>
        </View>
        <TouchableOpacity onPress={() => logout()} style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={22} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      {/* Branchement conditionnel MEMBER / autres rôles */}
      {isMember(role ?? null) ? (
        <MemberDashboard
          context={context}
          account={account}
          accountLoading={accountLoading}
          refreshing={refreshing}
          onRefresh={onRefresh}
        />
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={COLORS.primary}
            />
          }
        >
          <Text style={styles.pageTitle}>Tableau de bord</Text>
          <Text style={styles.pageSubtitle}>
            Situation financière de la mutuelle
          </Text>

          {/* Exercice + Session */}
          <View style={styles.exerciceCard}>
            <View style={styles.exerciceRow}>
              <View style={styles.exerciceLeft}>
                <Text style={styles.exerciceTag}>EXERCICE ACTIF</Text>
                <Text style={styles.exerciceName}>{exercice?.name ?? "-"}</Text>
                <Text style={styles.exerciceDates}>
                  {formatDate(exercice?.startDate)} -{" "}
                  {exercice?.endDate
                    ? formatDate(exercice.endDate)
                    : "En cours"}
                </Text>
              </View>
              <View style={styles.exerciceRight}>
                <Text style={styles.sessionTag}>SESSION</Text>
                <Text style={styles.sessionName}>{session?.name ?? "-"}</Text>
                {session?.status === "IN_PROGRESS" && (
                  <View style={styles.activeBadge}>
                    <View style={styles.activeDot} />
                    <Text style={styles.activeText}>Active</Text>
                  </View>
                )}
              </View>
            </View>

            {isAdmin(role ?? null) && (
              <TouchableOpacity
                style={styles.manageLink}
                onPress={() =>
                  router.push("/(app)/parametres/exercices" as never)
                }
                activeOpacity={0.7}
              >
                <Ionicons
                  name="settings-outline"
                  size={12}
                  color="rgba(255,255,255,0.55)"
                />
                <Text style={styles.manageLinkText}>
                  Gérer les exercices / sessions
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={12}
                  color="rgba(255,255,255,0.55)"
                />
              </TouchableOpacity>
            )}
          </View>

          {/* Stats */}
          <View style={styles.statsGrid}>
            <StatCard
              label="Membres"
              value={String(context?.totalMembers ?? 0)}
              sub=""
              onPress={() => router.push("/(app)/members" as never)}
            />
            <StatCard
              label="Epargne disponible"
              value={formatCurrency(account?.savingAmount ?? 0)}
              sub="FCFA"
              accent={COLORS.success}
              onPress={() => router.push("/(app)/tresorerie" as never)}
              isLoading={accountLoading}
            />
            <StatCard
              label="Inscription et Agapés"
              value={formatCurrency(account?.registrationAmount ?? 0)}
              sub="FCFA"
              onPress={() => router.push("/(app)/inscription" as never)}
              isLoading={accountLoading}
            />
            <StatCard
              label="Solidarite disponible"
              value={formatCurrency(account?.solidarityAmount ?? 0)}
              sub="FCFA"
              accent={COLORS.success}
              onPress={() => router.push("/(app)/solidarite" as never)}
              isLoading={accountLoading}
            />
          </View>

          {/* Accès aux bilans */}
          <TouchableOpacity
            style={styles.bilanCard}
            onPress={() => router.push("/(app)/bilan" as never)}
            activeOpacity={0.85}
          >
            <View style={styles.bilanCardLeft}>
              <View style={styles.bilanCardIcon}>
                <Ionicons
                  name="bar-chart-outline"
                  size={20}
                  color={COLORS.primary}
                />
              </View>
              <View>
                <Text style={styles.bilanCardTitle}>Bilans de la Mutuelle</Text>
                <Text style={styles.bilanCardSub}>
                  Exercices et sessions clôturés
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={COLORS.primary} />
          </TouchableOpacity>

          {/* Bilan Financier */}
          <TouchableOpacity
            style={styles.bilanHeader}
            onPress={() => setBilanOpen((o) => !o)}
            activeOpacity={0.8}
          >
            <View style={styles.bilanHeaderLeft}>
              <Ionicons
                name="bar-chart-outline"
                size={18}
                color={COLORS.white}
              />
              <Text style={styles.bilanHeaderText}>Bilan Financier</Text>
            </View>
            <Ionicons
              name={bilanOpen ? "chevron-up" : "chevron-down"}
              size={18}
              color={COLORS.white}
            />
          </TouchableOpacity>

          {bilanOpen && (
            <View style={styles.bilanBody}>
              <BilanRow
                label="Total epargne"
                value={formatCurrency(account?.savingAmount ?? 0)}
              />
              <BilanRow
                label="Total solidarite"
                value={formatCurrency(account?.solidarityAmount ?? 0)}
              />
              <BilanRow
                label="Total inscription"
                value={formatCurrency(account?.registrationAmount ?? 0)}
              />
              <BilanRow
                label="Total emprunts"
                value={formatCurrency(account?.borrowAmount ?? 0)}
              />
              <BilanRow
                label="Assistances (nombre)"
                value={String(context?.globalTotalAssistances ?? 0)}
              />
              <View style={styles.bilanDivider} />
              <BilanRow
                label="Total general"
                value={formatCurrency(totalGlobal)}
                bold
              />
            </View>
          )}

          {/* Config rapide */}
          {config && (
            <View style={styles.configCard}>
              <Text style={styles.configTitle}>Configuration active</Text>
              <BilanRow
                label="Frais inscription"
                value={formatCurrency(config.registrationFeeAmount)}
              />
              <BilanRow
                label="Frais solidarite"
                value={formatCurrency(config.solidarityFeeAmount)}
              />
              <BilanRow
                label="Taux interet emprunt"
                value={`${config.loanInterestRatePercent}%`}
              />
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// ─── Ligne bilan (réutilisée par les deux layouts) ────────────────────────────

function BilanRow({
  label,
  value,
  bold,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <View style={styles.bilanRow}>
      <Text style={[styles.bilanLabel, bold && styles.bilanLabelBold]}>
        {label}
      </Text>
      <Text style={[styles.bilanValue, bold && styles.bilanValueBold]}>
        {value}
      </Text>
    </View>
  );
}

// ─── Styles layout admin/president/tresorier (inchangés) ──────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.primary },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.primary,
  },
  headerTitle: { color: COLORS.white, fontSize: 17, fontWeight: "700" },
  headerRole: {
    color: COLORS.gray[400],
    fontSize: 11,
    fontWeight: "500",
    marginTop: 2,
  },
  logoutBtn: { padding: 8 },
  scroll: { flex: 1, backgroundColor: COLORS.gray[50] },
  scrollContent: { padding: 16, gap: 16, paddingBottom: 32 },
  pageTitle: { fontSize: 22, fontWeight: "800", color: COLORS.gray[900] },
  pageSubtitle: { fontSize: 13, color: COLORS.gray[500], marginTop: 2 },

  exerciceCard: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    padding: 20,
    marginTop: 4,
    gap: 14,
  },
  exerciceRow: { flexDirection: "row", justifyContent: "space-between" },
  exerciceLeft: { gap: 4 },
  exerciceTag: {
    color: COLORS.gray[400],
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
  },
  exerciceName: { color: COLORS.white, fontSize: 18, fontWeight: "800" },
  exerciceDates: { color: COLORS.gray[400], fontSize: 12 },
  exerciceRight: { alignItems: "flex-end", gap: 4 },
  sessionTag: {
    color: COLORS.gray[400],
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
  },
  sessionName: { color: COLORS.white, fontSize: 16, fontWeight: "700" },
  activeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(16,185,129,0.2)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.success,
  },
  activeText: { color: COLORS.success, fontSize: 12, fontWeight: "600" },

  manageLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.12)",
    paddingTop: 10,
  },
  manageLinkText: {
    flex: 1,
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(255,255,255,0.55)",
  },

  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  statCard: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 14,
    gap: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderTopWidth: 3,
    borderTopColor: COLORS.primary,
  },
  statLabel: { fontSize: 12, color: COLORS.gray[500] },
  statValue: { fontSize: 18, fontWeight: "800", color: COLORS.gray[900] },
  statSkeleton: {
    height: 22,
    width: 100,
    borderRadius: 6,
    backgroundColor: COLORS.gray[200],
  },
  statSub: { fontSize: 11, color: COLORS.gray[400] },

  bilanHeader: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  bilanHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  bilanHeaderText: { color: COLORS.white, fontSize: 15, fontWeight: "700" },
  bilanBody: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    gap: 10,
    marginTop: -8,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  bilanRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  bilanLabel: { fontSize: 13, color: COLORS.gray[600] },
  bilanLabelBold: { fontWeight: "700", color: COLORS.gray[900] },
  bilanValue: { fontSize: 13, color: COLORS.gray[800], fontWeight: "600" },
  bilanValueBold: { fontWeight: "800", color: COLORS.primary },
  bilanDivider: { height: 1, backgroundColor: COLORS.gray[200] },

  configCard: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 16,
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  configTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.gray[900],
    marginBottom: 4,
  },

  bilanCard: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  bilanCardLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  bilanCardIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },
  bilanCardTitle: { fontSize: 14, fontWeight: "700", color: COLORS.gray[900] },
  bilanCardSub: { fontSize: 12, color: COLORS.gray[400], marginTop: 1 },
});

// ─── Styles layout MEMBER ─────────────────────────────────────────────────────

const ms = StyleSheet.create({
  greeting: { fontSize: 20, fontWeight: "800", color: COLORS.gray[900] },

  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.gray[500],
    letterSpacing: 0.5,
    marginTop: 4,
  },

  // Cartes finances (section 1)
  cardsRow: { flexDirection: "row", gap: 12 },
  finCard: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 14,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  finCardIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  finLabel: { fontSize: 11, color: COLORS.gray[500], fontWeight: "600" },
  finValue: { fontSize: 15, fontWeight: "800", color: COLORS.gray[900] },
  skeleton: {
    height: 18,
    width: 80,
    borderRadius: 6,
    backgroundColor: COLORS.gray[200],
  },

  // Liens rapides
  linksCard: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 13,
  },
  linkText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.gray[900],
  },
  linkDivider: { height: 1, backgroundColor: COLORS.gray[100] },

  // Totaux mutuelle non-cliquables
  mutuelleTotals: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  mutuelleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 13,
  },
  mutuelleLabel: { fontSize: 13, color: COLORS.gray[600] },
  mutuelleValue: { fontSize: 14, fontWeight: "700", color: COLORS.gray[900] },
  rowDivider: { height: 1, backgroundColor: COLORS.gray[100] },

  // Carte membres
  membresCard: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  membresCardLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  membresIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },
  membresTitle: { fontSize: 14, fontWeight: "700", color: COLORS.gray[900] },
  membresSub: { fontSize: 11, color: COLORS.gray[400], marginTop: 1 },

  // Modal membres
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  modalSheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
    height: "75%",
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.gray[300],
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  modalTitle: { fontSize: 17, fontWeight: "800", color: COLORS.gray[900] },
  modalLoading: { alignItems: "center", paddingVertical: 40 },
  modalEmpty: { alignItems: "center", paddingVertical: 40 },
  modalEmptyText: { fontSize: 14, color: COLORS.gray[400] },

  // Ligne membre dans la modal
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  memberAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  memberAvatarText: { color: COLORS.white, fontSize: 13, fontWeight: "700" },
  memberName: { fontSize: 14, fontWeight: "600", color: COLORS.gray[900] },
});
