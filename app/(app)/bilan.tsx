import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/src/constants';
import { formatCurrency, formatDate } from '@/src/utils/format';
import { useExercices } from '@/src/hooks/useExercices';
import { useSessionsByExercice } from '@/src/hooks/useSessions';
import { useBilanMutuelleExercice, useBilanMutuelleSession, useDownloadBilanPdf } from '@/src/hooks/useBilan';
import type {
  ExerciceResponseDTO,
  SessionResponseDTO,
  SessionHistoryResponseDTO,
  MutuelleExerciceBilanDTO,
} from '@/src/types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function BLine({ label, value, highlight, debit }: { label: string; value: string; highlight?: boolean; debit?: boolean }) {
  return (
    <View style={blineStyles.row}>
      <Text style={blineStyles.label}>{label}</Text>
      <Text style={[blineStyles.value, highlight && blineStyles.valueHL, debit && { color: COLORS.error }]}>{value}</Text>
    </View>
  );
}

const blineStyles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 5 },
  label: { fontSize: 13, color: COLORS.gray[600], flex: 1 },
  value: { fontSize: 13, fontWeight: '600', color: COLORS.gray[800], textAlign: 'right' },
  valueHL: { color: COLORS.primary, fontWeight: '800', fontSize: 14 },
});

function Divider() {
  return <View style={{ height: 1, backgroundColor: COLORS.gray[100], marginVertical: 6 }} />;
}

function SectionLabel({ children }: { children: string }) {
  return <Text style={sectionLabelStyle}>{children}</Text>;
}
const sectionLabelStyle: object = {
  fontSize: 10,
  fontWeight: '700',
  color: COLORS.gray[400],
  letterSpacing: 0.8,
  marginTop: 6,
  marginBottom: 2,
};

// ─── Bouton PDF ───────────────────────────────────────────────────────────────

function PdfButton({
  isLoading,
  onPress,
}: {
  isLoading: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={pdfStyles.btn}
      onPress={onPress}
      disabled={isLoading}
      activeOpacity={0.7}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color={COLORS.primary} />
      ) : (
        <>
          <Ionicons name="download-outline" size={14} color={COLORS.primary} />
          <Text style={pdfStyles.text}>PDF</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const pdfStyles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    minWidth: 58,
    justifyContent: 'center',
  },
  text: { fontSize: 12, fontWeight: '700', color: COLORS.primary },
});

// ─── Bilan session (données) ──────────────────────────────────────────────────

function SessionBilanData({ data }: { data: SessionHistoryResponseDTO }) {
  return (
    <View style={bilanDataStyles.container}>
      <SectionLabel>MOUVEMENTS</SectionLabel>
      <BLine label="Épargne déposée"        value={formatCurrency(data.totalEpargneDeposited)} />
      <BLine label="Épargne retirée"         value={formatCurrency(data.totalEpargneWithdrawn)} debit />
      <BLine label="Solidarité collectée"    value={formatCurrency(data.totalSolidarityCollected)} />
      <BLine label="Inscriptions"            value={formatCurrency(data.totalRegistrationCollected)} />
      <BLine label="Renflouement"            value={formatCurrency(data.totalRenfoulementCollected)} />
      <BLine label="Emprunts accordés"       value={formatCurrency(data.totalEmpruntAmount)} debit />
      <BLine label="Remboursements"          value={formatCurrency(data.totalRemboursementAmount)} />
      <BLine label="Assistances"             value={`${formatCurrency(data.totalAssistanceAmount)} (${data.totalAssistanceCount})`} debit />
      <BLine label="Agapé"                   value={formatCurrency(data.agapeAmount)} debit />

      <Divider />
      <SectionLabel>COMPTE MUTUELLE (SNAPSHOT)</SectionLabel>
      <BLine label="Caisse"                  value={formatCurrency(data.mutuelleCash)} />
      <BLine label="Épargne"                 value={formatCurrency(data.mutuellesSavingAmount)} />
      <BLine label="Solidarité"              value={formatCurrency(data.mutuelleSolidarityAmount)} />
      <BLine label="Inscription"             value={formatCurrency(data.mutuelleRegistrationAmount)} />
      <BLine label="Emprunts en cours"       value={formatCurrency(data.mutuelleBorrowAmount)} />

      <Divider />
      <SectionLabel>STATISTIQUES</SectionLabel>
      <BLine label="Membres actifs"          value={String(data.activeMembersCount)} />
      <BLine label="Total transactions"      value={String(data.totalTransactions)} highlight />
    </View>
  );
}

// ─── Bilan exercice (données) ─────────────────────────────────────────────────

function ExerciceBilanData({ data }: { data: MutuelleExerciceBilanDTO }) {
  return (
    <View style={bilanDataStyles.container}>
      <SectionLabel>MOUVEMENTS ({data.sessionsCount} SESSION{data.sessionsCount > 1 ? 'S' : ''})</SectionLabel>
      <BLine label="Épargne déposée"        value={formatCurrency(data.totalEpargneDeposited)} />
      <BLine label="Épargne retirée"         value={formatCurrency(data.totalEpargneWithdrawn)} debit />
      <BLine label="Solidarité collectée"    value={formatCurrency(data.totalSolidarityCollected)} />
      <BLine label="Inscriptions"            value={formatCurrency(data.totalRegistrationCollected)} />
      <BLine label="Renflouement"            value={formatCurrency(data.totalRenfoulementCollected)} />
      <BLine label="Emprunts accordés"       value={formatCurrency(data.totalEmpruntAmount)} debit />
      <BLine label="Remboursements"          value={formatCurrency(data.totalRemboursementAmount)} />
      <BLine label="Assistances"             value={`${formatCurrency(data.totalAssistanceAmount)} (${data.totalAssistanceCount})`} debit />
      <BLine label="Agapé"                   value={formatCurrency(data.totalAgapeAmount)} debit />

      <Divider />
      <SectionLabel>COMPTE MUTUELLE (SNAPSHOT FINAL)</SectionLabel>
      <BLine label="Caisse"                  value={formatCurrency(data.mutuelleCash)} />
      <BLine label="Épargne"                 value={formatCurrency(data.mutuelleSavingAmount)} />
      <BLine label="Solidarité"              value={formatCurrency(data.mutuelleSolidarityAmount)} />
      <BLine label="Inscription"             value={formatCurrency(data.mutuelleRegistrationAmount)} />
      <BLine label="Emprunts en cours"       value={formatCurrency(data.mutuelleBorrowAmount)} />

      <Divider />
      <SectionLabel>STATISTIQUES</SectionLabel>
      <BLine label="Membres actifs"          value={String(data.activeMembersCount)} />
      <BLine label="Total transactions"      value={String(data.totalTransactions)} highlight />
    </View>
  );
}

const bilanDataStyles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.gray[50],
    borderRadius: 10,
    padding: 14,
    marginTop: 10,
  },
});

// ─── Item session (accordion intérieur) ──────────────────────────────────────

interface SessionItemProps {
  session: SessionResponseDTO;
  downloading: string | null;
  onDownload: () => void;
}

function SessionItem({ session, downloading, onDownload }: SessionItemProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const isClosed = session.status === 'COMPLETED';
  const { data: bilan, isFetching } = useBilanMutuelleSession(open && isClosed ? session.id : null);

  const dlKey = `session-${session.id}`;

  return (
    <View style={sessionStyles.container}>
      {/* Ligne session */}
      <TouchableOpacity
        style={sessionStyles.header}
        onPress={() => setOpen((o) => !o)}
        activeOpacity={0.7}
      >
        <View style={sessionStyles.icon}>
          <Ionicons name="calendar-outline" size={14} color={COLORS.info} />
        </View>
        <View style={sessionStyles.info}>
          <Text style={sessionStyles.name}>{session.name}</Text>
          <Text style={sessionStyles.dates}>
            {formatDate(session.startDate)}
            {session.endDate ? ` → ${formatDate(session.endDate)}` : ''}
          </Text>
        </View>
        {!isClosed && (
          <View style={sessionStyles.badge}>
            <Text style={sessionStyles.badgeText}>EN COURS</Text>
          </View>
        )}
        {isClosed && (
          <>
            <PdfButton
              isLoading={downloading === dlKey}
              onPress={onDownload}
            />
            <TouchableOpacity
              style={sessionStyles.membresBtn}
              onPress={(e) => {
                (e as unknown as { stopPropagation?: () => void }).stopPropagation?.();
                router.push({ pathname: '/(app)/bilan-membres-session' as never, params: { id: session.id, name: session.name } });
              }}
              activeOpacity={0.7}
              hitSlop={8}
            >
              <Ionicons name="people-outline" size={15} color={COLORS.gray[500]} />
            </TouchableOpacity>
          </>
        )}
        <Ionicons
          name={open ? 'chevron-up' : 'chevron-down'}
          size={16}
          color={COLORS.gray[400]}
          style={{ marginLeft: 4 }}
        />
      </TouchableOpacity>

      {/* Bilan session */}
      {open && (
        !isClosed ? (
          <View style={sessionStyles.enCoursMsg}>
            <Text style={sessionStyles.enCoursMsgText}>Session en cours — bilan disponible à la clôture</Text>
          </View>
        ) : isFetching && !bilan ? (
          <View style={sessionStyles.loading}>
            <ActivityIndicator size="small" color={COLORS.primary} />
          </View>
        ) : bilan ? (
          <SessionBilanData data={bilan} />
        ) : null
      )}
    </View>
  );
}

const sessionStyles = StyleSheet.create({
  container: {
    borderLeftWidth: 2,
    borderLeftColor: COLORS.info,
    marginLeft: 8,
    paddingLeft: 10,
    marginTop: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  icon: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { flex: 1 },
  name: { fontSize: 13, fontWeight: '700', color: COLORS.gray[800] },
  dates: { fontSize: 11, color: COLORS.gray[400], marginTop: 1 },
  loading: { paddingVertical: 12, alignItems: 'center' },
  membresBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: COLORS.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    backgroundColor: '#FEF3C7',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeText: { fontSize: 9, fontWeight: '800', color: '#92400E', letterSpacing: 0.5 },
  enCoursMsg: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[100],
  },
  enCoursMsgText: { fontSize: 12, color: COLORS.gray[400], fontStyle: 'italic' },
});

// ─── Item exercice (accordion principal) ─────────────────────────────────────

interface ExerciceItemProps {
  exercice: ExerciceResponseDTO;
  downloading: string | null;
  onDownloadExercice: () => void;
  onDownloadSession: (sessionId: number, sessionName: string) => void;
}

function ExerciceItem({
  exercice,
  downloading,
  onDownloadExercice,
  onDownloadSession,
}: ExerciceItemProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const isClosed = exercice.status === 'COMPLETED';

  const { data: bilan, isFetching: bilanLoading } = useBilanMutuelleExercice(
    open && isClosed ? exercice.id : null
  );
  const { data: allSessions, isFetching: sessionsLoading } = useSessionsByExercice(
    open ? exercice.id : null
  );

  const currentSession = (allSessions ?? []).find((s) => s.status === 'IN_PROGRESS') ?? null;
  const closedSessions = (allSessions ?? [])
    .filter((s) => s.status === 'COMPLETED')
    .sort((a, b) => new Date(b.endDate ?? 0).getTime() - new Date(a.endDate ?? 0).getTime());
  const displayedSessions = currentSession ? [currentSession, ...closedSessions] : closedSessions;
  const dlKey = `exercice-${exercice.id}`;

  return (
    <View style={exStyles.card}>
      {/* En-tête exercice */}
      <TouchableOpacity
        style={exStyles.header}
        onPress={() => setOpen((o) => !o)}
        activeOpacity={0.8}
      >
        <View style={exStyles.headerLeft}>
          <View style={[exStyles.dot, open && exStyles.dotActive]} />
          <View style={exStyles.info}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={exStyles.name}>{exercice.name}</Text>
              {!isClosed && (
                <View style={exStyles.badge}>
                  <Text style={exStyles.badgeText}>EN COURS</Text>
                </View>
              )}
            </View>
            <Text style={exStyles.dates}>
              {formatDate(exercice.startDate)}
              {exercice.endDate ? ` → ${formatDate(exercice.endDate)}` : ''}
            </Text>
          </View>
        </View>
        <View style={exStyles.headerRight}>
          {isClosed && (
            <PdfButton
              isLoading={downloading === dlKey}
              onPress={onDownloadExercice}
            />
          )}
          {isClosed && (
            <TouchableOpacity
              style={exStyles.membresBtn}
              onPress={(e) => {
                (e as unknown as { stopPropagation?: () => void }).stopPropagation?.();
                router.push({ pathname: '/(app)/bilan-membres-exercice' as never, params: { id: exercice.id, name: exercice.name } });
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="people-outline" size={13} color={COLORS.gray[600]} />
              <Text style={exStyles.membresBtnText}>Membres</Text>
            </TouchableOpacity>
          )}
          <Ionicons
            name={open ? 'chevron-up' : 'chevron-down'}
            size={18}
            color={open ? COLORS.primary : COLORS.gray[400]}
          />
        </View>
      </TouchableOpacity>

      {/* Contenu accordion */}
      {open && (
        <View style={exStyles.body}>
          {/* Bilan exercice */}
          {!isClosed ? (
            <View style={exStyles.enCoursMsg}>
              <Text style={exStyles.enCoursMsgText}>Exercice en cours — bilan disponible à la clôture</Text>
            </View>
          ) : bilanLoading && !bilan ? (
            <View style={exStyles.loading}>
              <ActivityIndicator size="small" color={COLORS.primary} />
              <Text style={exStyles.loadingText}>Chargement du bilan...</Text>
            </View>
          ) : bilan ? (
            <ExerciceBilanData data={bilan} />
          ) : null}

          {/* Sessions */}
          {(displayedSessions.length > 0 || sessionsLoading) && (
            <View style={exStyles.sessionsSection}>
              <View style={exStyles.sessionsSectionHeader}>
                <Ionicons name="layers-outline" size={13} color={COLORS.gray[500]} />
                <Text style={exStyles.sessionsSectionTitle}>
                  {currentSession ? 'SESSIONS' : 'SESSIONS CLÔTURÉES'}
                  {sessionsLoading && !allSessions ? ' ...' : ` (${displayedSessions.length})`}
                </Text>
              </View>

              {displayedSessions.map((session) => (
                <SessionItem
                  key={session.id}
                  session={session}
                  downloading={downloading}
                  onDownload={() => onDownloadSession(session.id, session.name)}
                />
              ))}

              {!sessionsLoading && displayedSessions.length === 0 && (
                <Text style={exStyles.noSessions}>Aucune session dans cet exercice</Text>
              )}
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const exStyles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.gray[300],
    flexShrink: 0,
  },
  dotActive: { backgroundColor: COLORS.primary },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: '800', color: COLORS.gray[900] },
  dates: { fontSize: 12, color: COLORS.gray[400], marginTop: 2 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  membresBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: COLORS.gray[100],
    borderRadius: 7,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  membresBtnText: { fontSize: 11, fontWeight: '600', color: COLORS.gray[600] },

  body: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[100],
    gap: 12,
  },
  loading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
    justifyContent: 'center',
  },
  loadingText: { fontSize: 13, color: COLORS.gray[400] },

  sessionsSection: { gap: 4 },
  sessionsSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 4,
    marginTop: 4,
  },
  sessionsSectionTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.gray[500],
    letterSpacing: 0.8,
  },
  noSessions: { fontSize: 12, color: COLORS.gray[400], paddingLeft: 20, paddingVertical: 4 },
  badge: {
    backgroundColor: '#D1FAE5',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeText: { fontSize: 9, fontWeight: '800', color: '#065F46', letterSpacing: 0.5 },
  enCoursMsg: { paddingVertical: 8, paddingHorizontal: 4 },
  enCoursMsgText: { fontSize: 12, color: COLORS.gray[400], fontStyle: 'italic' },
});

// ─── Écran principal ──────────────────────────────────────────────────────────

export default function BilanScreen() {
  const router = useRouter();
  const { data: exercices, isLoading } = useExercices();
  const { downloading, downloadExercicePdf, downloadSessionPdf } = useDownloadBilanPdf();

  const allExercices = exercices ?? [];
  const currentExercice = allExercices.find((e) => e.status === 'IN_PROGRESS') ?? null;
  const closedExercices = allExercices
    .filter((e) => e.status === 'COMPLETED')
    .sort((a, b) => new Date(b.endDate ?? 0).getTime() - new Date(a.endDate ?? 0).getTime());
  const displayedExercices = currentExercice ? [currentExercice, ...closedExercices] : closedExercices;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="arrow-back" size={22} color={COLORS.gray[700]} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.title}>Bilans</Text>
          <Text style={styles.subtitle}>Exercices et sessions clôturés</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Chargement initial */}
        {isLoading && (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Chargement des exercices...</Text>
          </View>
        )}

        {/* Aucun exercice clôturé */}
        {!isLoading && displayedExercices.length === 0 && (
          <View style={styles.center}>
            <Ionicons name="bar-chart-outline" size={52} color={COLORS.gray[300]} />
            <Text style={styles.emptyTitle}>Aucun bilan disponible</Text>
            <Text style={styles.emptyText}>
              Les bilans seront disponibles une fois qu'un exercice sera clôturé.
            </Text>
          </View>
        )}

        {/* Liste des exercices */}
        {displayedExercices.map((exercice) => (
          <ExerciceItem
            key={exercice.id}
            exercice={exercice}
            downloading={downloading}
            onDownloadExercice={() => downloadExercicePdf(exercice.id, exercice.name)}
            onDownloadSession={downloadSessionPdf}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.gray[50] },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  headerText: { flex: 1 },
  title: { fontSize: 20, fontWeight: '800', color: COLORS.gray[900] },
  subtitle: { fontSize: 12, color: COLORS.gray[400], marginTop: 1 },

  scroll: { flex: 1 },
  content: { padding: 14, gap: 12, paddingBottom: 40 },

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    gap: 12,
  },
  loadingText: { fontSize: 14, color: COLORS.gray[500] },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: COLORS.gray[700] },
  emptyText: { fontSize: 13, color: COLORS.gray[400], textAlign: 'center', maxWidth: 280 },
});
