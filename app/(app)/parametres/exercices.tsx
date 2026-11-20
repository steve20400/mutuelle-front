import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useContextStore } from "@/src/store/contextStore";
import { isAdmin } from "@/src/navigation/roles";
import { COLORS } from "@/src/constants";
import { formatDate, formatCurrency } from "@/src/utils/format";
import {
  useExercices,
  useCreateExercice,
  useUpdateExercice,
  useStartExercice,
  useCloseExercice,
} from "@/src/hooks/useExercices";
import {
  useSessionsByExercice,
  useCreateSession,
  useUpdateSession,
  useStartSession,
  useCloseSession,
} from "@/src/hooks/useSessions";
import type {
  BackendRole,
  ExerciceResponseDTO,
  SessionResponseDTO,
  EntityStatus,
} from "@/src/types";

// ─── Status badge ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  EntityStatus,
  { label: string; color: string; bg: string }
> = {
  PLANNED: { label: "Planifie", color: COLORS.gray[600], bg: COLORS.gray[100] },
  IN_PROGRESS: { label: "En cours", color: "#059669", bg: "#D1FAE5" },
  COMPLETED: { label: "Cloture", color: COLORS.info, bg: "#EFF6FF" },
  CANCELLED: { label: "Annule", color: COLORS.error, bg: "#FEF2F2" },
};

function StatusBadge({ status }: { status: EntityStatus }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.PLANNED;
  return (
    <View style={[badgeStyles.badge, { backgroundColor: cfg.bg }]}>
      <Text style={[badgeStyles.text, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
}

const badgeStyles = StyleSheet.create({
  badge: { borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  text: { fontSize: 11, fontWeight: "700" },
});

// ─── Helpers date automatique ────────────────────────────────────────────────

const MOIS_FR = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
];

function genExerciceName() {
  return `Exercice ${new Date().getFullYear()}`;
}

function genSessionName() {
  const d = new Date();
  return `Session ${MOIS_FR[d.getMonth()]} ${d.getFullYear()}`;
}

function formatNow() {
  const d = new Date();
  const jour = String(d.getDate()).padStart(2, "0");
  const mois = MOIS_FR[d.getMonth()].toLowerCase();
  const annee = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${jour} ${mois} ${annee} · ${hh}h${mm}`;
}

// ─── Exercice modal ───────────────────────────────────────────────────────────

interface ExerciceModalProps {
  visible: boolean;
  initial?: ExerciceResponseDTO | null;
  onClose: () => void;
}

function ExerciceModal({ visible, initial, onClose }: ExerciceModalProps) {
  const [name, setName] = useState("");
  const { mutate: create, isPending: isCreating } = useCreateExercice();
  const { mutate: update, isPending: isUpdating } = useUpdateExercice();

  useEffect(() => {
    if (visible) setName(initial?.name ?? genExerciceName());
  }, [visible, initial]);

  const isPending = isCreating || isUpdating;
  const isCreation = !initial;

  const handleSubmit = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (initial) {
      update(
        { id: initial.id, payload: { name: trimmed } },
        { onSuccess: onClose },
      );
    } else {
      create({ name: trimmed }, { onSuccess: onClose });
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={modalStyles.overlay}
      >
        <View style={modalStyles.sheet}>
          <View style={modalStyles.sheetHeader}>
            <Text style={modalStyles.sheetTitle}>
              {initial ? "Modifier l'exercice" : "Nouvel exercice"}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={22} color={COLORS.gray[600]} />
            </TouchableOpacity>
          </View>

          <View style={modalStyles.body}>
            <Text style={modalStyles.fieldLabel}>Nom de l'exercice</Text>
            <TextInput
              style={[modalStyles.input, isCreation && modalStyles.inputAuto]}
              value={name}
              onChangeText={isCreation ? undefined : setName}
              editable={!isCreation}
              placeholderTextColor={COLORS.gray[400]}
              autoFocus={!isCreation}
            />
            {isCreation && (
              <View style={modalStyles.autoHint}>
                <Ionicons
                  name="calendar-outline"
                  size={13}
                  color={COLORS.gray[400]}
                />
                <Text style={modalStyles.autoHintText}>{formatNow()}</Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={[modalStyles.btn, isPending && modalStyles.btnDisabled]}
            onPress={handleSubmit}
            disabled={isPending}
            activeOpacity={0.8}
          >
            {isPending ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <Text style={modalStyles.btnText}>
                {initial ? "Enregistrer" : "Creer"}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Session modal ────────────────────────────────────────────────────────────

interface SessionModalProps {
  visible: boolean;
  exerciceId: number;
  initial?: SessionResponseDTO | null;
  onClose: () => void;
}

function SessionModal({
  visible,
  exerciceId,
  initial,
  onClose,
}: SessionModalProps) {
  const [name, setName] = useState("");
  const [agape, setAgape] = useState("");
  const { mutate: create, isPending: isCreating } = useCreateSession();
  const { mutate: update, isPending: isUpdating } = useUpdateSession();

  useEffect(() => {
    if (visible) {
      setName(initial?.name ?? genSessionName());
      setAgape(initial ? String(initial.agapeAmountPerMember) : "");
    }
  }, [visible, initial]);

  const isPending = isCreating || isUpdating;
  const isCreation = !initial;
  const canSubmit = !isPending;

  const handleSubmit = () => {
    const trimmedName = name.trim();
    if (!trimmedName) return;
    const agapeAmount = parseFloat(agape) || 0;

    if (initial) {
      update(
        {
          id: initial.id,
          payload: { name: trimmedName, agapeAmountPerMember: agapeAmount },
        },
        { onSuccess: onClose },
      );
    } else {
      create(
        { name: trimmedName, agapeAmountPerMember: agapeAmount, exerciceId },
        { onSuccess: onClose },
      );
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={modalStyles.overlay}
      >
        <View style={modalStyles.sheet}>
          <View style={modalStyles.sheetHeader}>
            <Text style={modalStyles.sheetTitle}>
              {initial ? "Modifier la session" : "Nouvelle session"}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={22} color={COLORS.gray[600]} />
            </TouchableOpacity>
          </View>

          <View style={modalStyles.body}>
            <Text style={modalStyles.fieldLabel}>Nom de la session</Text>
            <TextInput
              style={[modalStyles.input, isCreation && modalStyles.inputAuto]}
              value={name}
              onChangeText={isCreation ? undefined : setName}
              editable={!isCreation}
              placeholderTextColor={COLORS.gray[400]}
              autoFocus={!isCreation}
            />
            {isCreation && (
              <View style={modalStyles.autoHint}>
                <Ionicons
                  name="time-outline"
                  size={13}
                  color={COLORS.gray[400]}
                />
                <Text style={modalStyles.autoHintText}>{formatNow()}</Text>
              </View>
            )}
            <Text style={[modalStyles.fieldLabel, { marginTop: 14 }]}>
              Agape (FCFA)
            </Text>
            <TextInput
              style={modalStyles.input}
              value={agape}
              onChangeText={setAgape}
              placeholder="0"
              placeholderTextColor={COLORS.gray[400]}
              keyboardType="decimal-pad"
            />
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
              <Text style={modalStyles.btnText}>
                {initial ? "Enregistrer" : "Creer"}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    gap: 16,
    paddingBottom: Platform.OS === "ios" ? 40 : 24,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sheetTitle: { fontSize: 18, fontWeight: "700", color: COLORS.gray[900] },
  body: { gap: 4 },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.gray[700],
    marginBottom: 6,
  },
  input: {
    borderWidth: 1.5,
    borderColor: COLORS.gray[300],
    borderRadius: 10,
    paddingVertical: 11,
    paddingHorizontal: 12,
    fontSize: 15,
    color: COLORS.gray[900],
    backgroundColor: COLORS.white,
  },
  inputAuto: {
    backgroundColor: COLORS.gray[100],
    borderColor: COLORS.gray[200],
    color: COLORS.gray[500],
  },
  autoHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 6,
  },
  autoHintText: {
    fontSize: 11,
    color: COLORS.gray[400],
    fontStyle: "italic",
  },
  btn: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: COLORS.white, fontSize: 15, fontWeight: "700" },
});

// ─── Session item ─────────────────────────────────────────────────────────────

interface SessionItemProps {
  session: SessionResponseDTO;
  canEdit: boolean;
}

function SessionItem({ session, canEdit }: SessionItemProps) {
  const { mutate: start, isPending: isStarting } = useStartSession();
  const { mutate: close, isPending: isClosing } = useCloseSession();
  const [editModal, setEditModal] = useState(false);

  const handleStart = () =>
    Alert.alert("Demarrer la session", `Demarrer "${session.name}" ?`, [
      { text: "Annuler", style: "cancel" },
      { text: "Demarrer", onPress: () => start(session.id) },
    ]);

  const handleClose = () =>
    Alert.alert(
      "Cloturer la session",
      `Cloturer "${session.name}" ? Cette action est irreversible.`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Cloturer",
          style: "destructive",
          onPress: () => close(session.id),
        },
      ],
    );

  return (
    <View style={sessionStyles.item}>
      <View style={sessionStyles.row}>
        <View style={sessionStyles.dot} />
        <View style={sessionStyles.info}>
          <Text style={sessionStyles.name}>{session.name}</Text>
          <Text style={sessionStyles.meta}>
            {formatDate(session.startDate)}
            {session.endDate ? ` → ${formatDate(session.endDate)}` : ""}
          </Text>
          {session.agapeAmountPerMember > 0 && (
            <Text style={sessionStyles.meta}>
              Agape : {formatCurrency(session.agapeAmountPerMember)}
            </Text>
          )}
        </View>
        <StatusBadge status={session.status} />
      </View>

      {canEdit &&
        (session.status === "PLANNED" || session.status === "IN_PROGRESS") && (
          <View style={sessionStyles.actions}>
            {session.status === "PLANNED" && (
              <TouchableOpacity
                style={[
                  sessionStyles.actionBtn,
                  { backgroundColor: "#D1FAE5" },
                ]}
                onPress={handleStart}
                disabled={isStarting}
              >
                {isStarting ? (
                  <ActivityIndicator size="small" color="#059669" />
                ) : (
                  <Text
                    style={[sessionStyles.actionText, { color: "#059669" }]}
                  >
                    Demarrer
                  </Text>
                )}
              </TouchableOpacity>
            )}
            {session.status === "IN_PROGRESS" && (
              <TouchableOpacity
                style={[
                  sessionStyles.actionBtn,
                  { backgroundColor: "#FEF2F2" },
                ]}
                onPress={handleClose}
                disabled={isClosing}
              >
                {isClosing ? (
                  <ActivityIndicator size="small" color={COLORS.error} />
                ) : (
                  <Text
                    style={[sessionStyles.actionText, { color: COLORS.error }]}
                  >
                    Cloturer
                  </Text>
                )}
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[sessionStyles.actionBtn, { backgroundColor: "#EFF6FF" }]}
              onPress={() => setEditModal(true)}
            >
              <Text style={[sessionStyles.actionText, { color: COLORS.info }]}>
                Modifier
              </Text>
            </TouchableOpacity>
          </View>
        )}

      <SessionModal
        visible={editModal}
        exerciceId={session.exerciceId}
        initial={session}
        onClose={() => setEditModal(false)}
      />
    </View>
  );
}

const sessionStyles = StyleSheet.create({
  item: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[100],
    gap: 8,
  },
  row: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: COLORS.gray[300],
    marginTop: 5,
  },
  info: { flex: 1, gap: 2 },
  name: { fontSize: 14, fontWeight: "600", color: COLORS.gray[900] },
  meta: { fontSize: 12, color: COLORS.gray[500] },
  actions: { flexDirection: "row", gap: 8, paddingLeft: 17, flexWrap: "wrap" },
  actionBtn: {
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 6,
    minWidth: 84,
    alignItems: "center",
  },
  actionText: { fontSize: 12, fontWeight: "700" },
});

// ─── Sessions list (lazy loaded) ──────────────────────────────────────────────

interface SessionsListProps {
  exerciceId: number;
  canEdit: boolean;
}

function SessionsList({ exerciceId, canEdit }: SessionsListProps) {
  const { data: sessions, isLoading } = useSessionsByExercice(exerciceId);
  const [newModal, setNewModal] = useState(false);

  if (isLoading) {
    return (
      <View style={slStyles.loading}>
        <ActivityIndicator size="small" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View>
      {!sessions?.length ? (
        <View style={slStyles.empty}>
          <Text style={slStyles.emptyText}>
            Aucune session pour cet exercice
          </Text>
        </View>
      ) : (
        sessions.map((s) => (
          <SessionItem key={s.id} session={s} canEdit={canEdit} />
        ))
      )}

      {canEdit && (
        <>
          <TouchableOpacity
            style={slStyles.addBtn}
            onPress={() => setNewModal(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="add" size={15} color={COLORS.info} />
            <Text style={slStyles.addBtnText}>Nouvelle session</Text>
          </TouchableOpacity>
          <SessionModal
            visible={newModal}
            exerciceId={exerciceId}
            onClose={() => setNewModal(false)}
          />
        </>
      )}
    </View>
  );
}

const slStyles = StyleSheet.create({
  loading: { padding: 16, alignItems: "center" },
  empty: { padding: 14, alignItems: "center" },
  emptyText: { fontSize: 13, color: COLORS.gray[400] },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    margin: 10,
    paddingVertical: 9,
    borderWidth: 1.5,
    borderColor: COLORS.info,
    borderStyle: "dashed",
    borderRadius: 10,
  },
  addBtnText: { fontSize: 13, fontWeight: "600", color: COLORS.info },
});

// ─── Exercice card ────────────────────────────────────────────────────────────

interface ExerciceCardProps {
  exercice: ExerciceResponseDTO;
  canEdit: boolean;
}

function ExerciceCard({ exercice, canEdit }: ExerciceCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const { mutate: start, isPending: isStarting } = useStartExercice();
  const { mutate: close, isPending: isClosing } = useCloseExercice();

  const handleStart = () =>
    Alert.alert("Demarrer l'exercice", `Demarrer "${exercice.name}" ?`, [
      { text: "Annuler", style: "cancel" },
      { text: "Demarrer", onPress: () => start(exercice.id) },
    ]);

  const handleClose = () =>
    Alert.alert(
      "Cloturer l'exercice",
      `Cloturer "${exercice.name}" ? Toutes les sessions actives seront egalement cloturees.`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Cloturer",
          style: "destructive",
          onPress: () => close(exercice.id),
        },
      ],
    );

  return (
    <View style={cardStyles.card}>
      {/* Header / dropdown trigger */}
      <TouchableOpacity
        style={cardStyles.header}
        onPress={() => setExpanded((e) => !e)}
        activeOpacity={0.7}
      >
        <View style={cardStyles.headerLeft}>
          <Text style={cardStyles.name}>{exercice.name}</Text>
          <Text style={cardStyles.dates}>
            {formatDate(exercice.startDate)}
            {exercice.endDate ? ` → ${formatDate(exercice.endDate)}` : ""}
          </Text>
        </View>
        <StatusBadge status={exercice.status} />
        <Ionicons
          name={expanded ? "chevron-up" : "chevron-down"}
          size={18}
          color={COLORS.gray[400]}
          style={{ marginLeft: 4 }}
        />
        retire les info que tu met en
      </TouchableOpacity>

      {/* Admin actions */}
      {canEdit &&
        (exercice.status === "PLANNED" ||
          exercice.status === "IN_PROGRESS") && (
          <View style={cardStyles.actions}>
            {exercice.status === "PLANNED" && (
              <TouchableOpacity
                style={[cardStyles.actionBtn, { backgroundColor: "#D1FAE5" }]}
                onPress={handleStart}
                disabled={isStarting}
              >
                {isStarting ? (
                  <ActivityIndicator size="small" color="#059669" />
                ) : (
                  <>
                    <Ionicons name="play-outline" size={14} color="#059669" />
                    <Text style={[cardStyles.actionText, { color: "#059669" }]}>
                      Demarrer
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            )}
            {exercice.status === "IN_PROGRESS" && (
              <TouchableOpacity
                style={[cardStyles.actionBtn, { backgroundColor: "#FEF2F2" }]}
                onPress={handleClose}
                disabled={isClosing}
              >
                {isClosing ? (
                  <ActivityIndicator size="small" color={COLORS.error} />
                ) : (
                  <>
                    <Ionicons
                      name="stop-outline"
                      size={14}
                      color={COLORS.error}
                    />
                    <Text
                      style={[cardStyles.actionText, { color: COLORS.error }]}
                    >
                      Cloturer
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[cardStyles.actionBtn, { backgroundColor: "#EFF6FF" }]}
              onPress={() => setEditModal(true)}
            >
              <Ionicons name="pencil-outline" size={14} color={COLORS.info} />
              <Text style={[cardStyles.actionText, { color: COLORS.info }]}>
                Modifier
              </Text>
            </TouchableOpacity>
          </View>
        )}

      {/* Sessions (lazy loaded on expand) */}
      {expanded && (
        <View style={cardStyles.sessionsContainer}>
          <SessionsList exerciceId={exercice.id} canEdit={canEdit} />
        </View>
      )}

      <ExerciceModal
        visible={editModal}
        initial={exercice}
        onClose={() => setEditModal(false)}
      />
    </View>
  );
}

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 8,
  },
  headerLeft: { flex: 1, gap: 3 },
  name: { fontSize: 15, fontWeight: "700", color: COLORS.gray[900] },
  dates: { fontSize: 12, color: COLORS.gray[500] },
  actions: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexWrap: "wrap",
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  actionText: { fontSize: 12, fontWeight: "700" },
  sessionsContainer: {
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[100],
  },
});

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function ExercicesScreen() {
  const router = useRouter();
  const role = useContextStore(
    (s) => s.context?.role ?? null,
  ) as BackendRole | null;
  const canEdit = isAdmin(role);

  const { data: exercices, isLoading, isError, refetch } = useExercices();
  const [newExerciceModal, setNewExerciceModal] = useState(false);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Ionicons name="arrow-back" size={22} color={COLORS.gray[900]} />
        </TouchableOpacity>
        <Text style={styles.title}>Exercices & Sessions</Text>
        {canEdit ? (
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => setNewExerciceModal(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="add" size={22} color={COLORS.white} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 38 }} />
        )}
      </View>

      {!canEdit && (
        <View style={styles.readonlyBanner}>
          <Ionicons name="eye-outline" size={14} color={COLORS.info} />
          <Text style={styles.readonlyText}>Mode consultation uniquement</Text>
        </View>
      )}

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : isError ? (
        <View style={styles.center}>
          <Ionicons
            name="alert-circle-outline"
            size={40}
            color={COLORS.error}
          />
          <Text style={styles.centerText}>Erreur de chargement</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
            <Text style={styles.retryText}>Reessayer</Text>
          </TouchableOpacity>
        </View>
      ) : !exercices?.length ? (
        <View style={styles.center}>
          <Ionicons
            name="calendar-outline"
            size={52}
            color={COLORS.gray[300]}
          />
          <Text style={styles.centerText}>Aucun exercice</Text>
          {canEdit && (
            <TouchableOpacity
              style={styles.createFirstBtn}
              onPress={() => setNewExerciceModal(true)}
            >
              <Text style={styles.createFirstText}>
                Creer le premier exercice
              </Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {exercices.map((ex) => (
            <ExerciceCard key={ex.id} exercice={ex} canEdit={canEdit} />
          ))}
        </ScrollView>
      )}

      {canEdit && (
        <ExerciceModal
          visible={newExerciceModal}
          onClose={() => setNewExerciceModal(false)}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
  back: { padding: 4 },
  title: { flex: 1, fontSize: 18, fontWeight: "700", color: COLORS.gray[900] },
  addBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  readonlyBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#EFF6FF",
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  readonlyText: { fontSize: 12, color: COLORS.info, fontWeight: "600" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 14 },
  centerText: { fontSize: 15, color: COLORS.gray[500] },
  retryBtn: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    backgroundColor: COLORS.gray[100],
    borderRadius: 8,
  },
  retryText: { fontSize: 14, fontWeight: "600", color: COLORS.gray[700] },
  createFirstBtn: {
    paddingHorizontal: 20,
    paddingVertical: 11,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
  },
  createFirstText: { fontSize: 14, fontWeight: "700", color: COLORS.white },
  content: { padding: 16, gap: 12, paddingBottom: 40 },
});
