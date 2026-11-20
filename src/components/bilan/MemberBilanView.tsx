import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/src/constants';
import { formatCurrency, formatDate } from '@/src/utils/format';
import {
  useBilanMemberExercices,
  useBilanMemberSessions,
  useDownloadBilanPdf,
} from '@/src/hooks/useBilan';
import type { MemberExerciceBilanDTO, MemberSessionBilanDTO } from '@/src/types';

// ─── UI primitifs ─────────────────────────────────────────────────────────────

function BLine({
  label, value, highlight, sub, debit, credit,
}: {
  label: string; value: string; highlight?: boolean; sub?: boolean; debit?: boolean; credit?: boolean;
}) {
  return (
    <View style={blineStyles.row}>
      <Text style={[blineStyles.label, sub && blineStyles.subLabel]}>{label}</Text>
      <Text style={[
        blineStyles.value,
        highlight && blineStyles.valueHL,
        sub && blineStyles.subValue,
        debit && { color: COLORS.error },
        credit && { color: COLORS.success },
      ]}>
        {value}
      </Text>
    </View>
  );
}

const blineStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  label: { fontSize: 13, color: COLORS.gray[600], flex: 1 },
  subLabel: { fontSize: 12, color: COLORS.gray[400], paddingLeft: 8 },
  value: { fontSize: 13, fontWeight: '600', color: COLORS.gray[800], textAlign: 'right' },
  valueHL: { color: COLORS.primary, fontWeight: '800', fontSize: 14 },
  subValue: { fontSize: 12, color: COLORS.gray[500] },
});

function SLabel({ children }: { children: React.ReactNode }) {
  return <Text style={sLabelStyle}>{children}</Text>;
}
const sLabelStyle: object = {
  fontSize: 10,
  fontWeight: '700',
  color: COLORS.gray[400],
  letterSpacing: 0.8,
  marginTop: 8,
  marginBottom: 2,
};

function Div() {
  return <View style={{ height: 1, backgroundColor: COLORS.gray[100], marginVertical: 6 }} />;
}

// ─── Bouton PDF ───────────────────────────────────────────────────────────────

function PdfBtn({ loading, onPress }: { loading: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      style={pdfStyles.btn}
      onPress={onPress}
      disabled={loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator size="small" color={COLORS.primary} />
      ) : (
        <>
          <Ionicons name="download-outline" size={13} color={COLORS.primary} />
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
    gap: 3,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderRadius: 7,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 52,
    justifyContent: 'center',
  },
  text: { fontSize: 11, fontWeight: '700', color: COLORS.primary },
});

// ─── Bilan d'une session (données) ───────────────────────────────────────────

function SessionBilanData({ s }: { s: MemberSessionBilanDTO }) {
  const net = s.netSession;
  const netColor = net >= 0 ? COLORS.success : COLORS.error;

  return (
    <View style={dataStyles.box}>
      <SLabel>VERSEMENTS</SLabel>
      <BLine label="Épargne déposée"     value={formatCurrency(s.epargneDeposited)} debit />
      <BLine label="Solidarité"          value={formatCurrency(s.solidaritePaid)} debit />
      <BLine label="Inscription"         value={formatCurrency(s.registrationPaid)} debit />
      <BLine label="Renflouement"        value={formatCurrency(s.renfoulementPaid)} debit />
      <BLine label="Remboursement"       value={formatCurrency(s.remboursementAmount)} debit />

      <SLabel>REÇUS</SLabel>
      <BLine label="Épargne retirée"     value={formatCurrency(s.epargneWithdrawn)} credit />
      <BLine label="Emprunt accordé"     value={formatCurrency(s.empruntAmount)} credit />
      <BLine label="Assistance reçue"   value={formatCurrency(s.assistanceReceived)} credit />
      <BLine label="Agapé"              value={formatCurrency(s.agapeShare)} credit />

      <Div />
      <BLine label="Total versé"         value={formatCurrency(s.totalVerse)} debit />
      <BLine label="Total reçu"          value={formatCurrency(s.totalRecu)} credit />
      <View style={[dataStyles.netRow, { borderColor: netColor + '40' }]}>
        <Text style={dataStyles.netLabel}>Net session</Text>
        <Text style={[dataStyles.netValue, { color: netColor }]}>
          {net >= 0 ? '+' : ''}{formatCurrency(net)}
        </Text>
      </View>

      <Div />
      <SLabel>Etat de caisse a la cloture</SLabel>
      <BLine label="Épargne courante"    value={formatCurrency(s.snapshotSavingAmount)} sub />
      <BLine label="Emprunt en cours"    value={formatCurrency(s.snapshotBorrowAmount)} sub />
      {s.snapshotUnpaidSolidarity > 0 && (
        <BLine label="Solidarité impayée" value={formatCurrency(s.snapshotUnpaidSolidarity)} sub />
      )}
      {s.snapshotUnpaidRegistration > 0 && (
        <BLine label="Inscription impayée" value={formatCurrency(s.snapshotUnpaidRegistration)} sub />
      )}
      {s.snapshotUnpaidRenfoulement > 0 && (
        <BLine label="Renflouement impayé" value={formatCurrency(s.snapshotUnpaidRenfoulement)} sub />
      )}
    </View>
  );
}

// ─── Bilan d'un exercice (données) ───────────────────────────────────────────

function ExerciceBilanData({ e }: { e: MemberExerciceBilanDTO }) {
  const net = e.netExercice;
  const netColor = net >= 0 ? COLORS.success : COLORS.error;

  return (
    <View style={dataStyles.box}>
      <SLabel>VERSEMENTS ({e.sessionsCount} SESSION{e.sessionsCount > 1 ? 'S' : ''})</SLabel>
      <BLine label="Épargne déposée"       value={formatCurrency(e.totalEpargneDeposited)} debit />
      <BLine label="Solidarité"            value={formatCurrency(e.totalSolidaritePaid)} debit />
      <BLine label="Inscription"           value={formatCurrency(e.totalRegistrationPaid)} debit />
      <BLine label="Renflouement versé"    value={formatCurrency(e.totalRenfoulementPaid)} debit />
      <BLine label="Remboursements"        value={formatCurrency(e.totalRemboursementAmount)} debit />

      <SLabel>REÇUS</SLabel>
      <BLine label="Épargne retirée"       value={formatCurrency(e.totalEpargneWithdrawn)} credit />
      <BLine label="Emprunts accordés"     value={formatCurrency(e.totalEmpruntAmount)} credit />
      <BLine label="Assistance reçue"     value={formatCurrency(e.totalAssistanceReceived)} credit />
      <BLine label="Agapé"                value={formatCurrency(e.totalAgapeShare)} credit />
      <BLine label="Renflouement reçu"    value={formatCurrency(e.renfoulementDistributed)} credit />

      <Div />
      <BLine label="Total versé"           value={formatCurrency(e.totalVerse)} debit />
      <BLine label="Total reçu"            value={formatCurrency(e.totalRecu)} credit />
      <View style={[dataStyles.netRow, { borderColor: netColor + '40' }]}>
        <Text style={dataStyles.netLabel}>Net exercice</Text>
        <Text style={[dataStyles.netValue, { color: netColor }]}>
          {net >= 0 ? '+' : ''}{formatCurrency(net)}
        </Text>
      </View>

      <Div />
      <SLabel>Etat de caisse a la fin de L'exercice</SLabel>
      <BLine label="Épargne courante"      value={formatCurrency(e.snapshotSavingAmount)} sub />
      <BLine label="Emprunt en cours"      value={formatCurrency(e.snapshotBorrowAmount)} sub />
      {e.snapshotUnpaidSolidarity > 0 && (
        <BLine label="Solidarité impayée"  value={formatCurrency(e.snapshotUnpaidSolidarity)} sub />
      )}
      {e.snapshotUnpaidRegistration > 0 && (
        <BLine label="Inscription impayée" value={formatCurrency(e.snapshotUnpaidRegistration)} sub />
      )}
      {e.snapshotUnpaidRenfoulement > 0 && (
        <BLine label="Renflouement impayé" value={formatCurrency(e.snapshotUnpaidRenfoulement)} sub />
      )}
    </View>
  );
}

const dataStyles = StyleSheet.create({
  box: {
    backgroundColor: COLORS.gray[50],
    borderRadius: 10,
    padding: 12,
    marginTop: 8,
  },
  netRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    marginTop: 4,
  },
  netLabel: { fontSize: 13, fontWeight: '700', color: COLORS.gray[700] },
  netValue: { fontSize: 15, fontWeight: '800' },
});

// ─── Item session ─────────────────────────────────────────────────────────────

interface SessionItemProps {
  session: MemberSessionBilanDTO;
  memberId: number;
  downloading: string | null;
  onDownload: () => void;
}

function SessionItem({ session, downloading, onDownload }: SessionItemProps) {
  const [open, setOpen] = useState(false);
  const dlKey = `member-session-${session.sessionId}`;
  const net = session.netSession;
  const netColor = net >= 0 ? COLORS.success : COLORS.error;

  return (
    <View style={sessStyles.wrap}>
      <TouchableOpacity
        style={sessStyles.row}
        onPress={() => setOpen((o) => !o)}
        activeOpacity={0.7}
      >
        <View style={sessStyles.icon}>
          <Ionicons name="calendar-outline" size={13} color={COLORS.info} />
        </View>
        <View style={sessStyles.info}>
          <Text style={sessStyles.name}>{session.sessionName}</Text>
          <Text style={sessStyles.dates}>
            {formatDate(session.sessionStartDate)}
            {session.sessionEndDate ? ` → ${formatDate(session.sessionEndDate)}` : ''}
          </Text>
        </View>
        <Text style={[sessStyles.net, { color: netColor }]}>
          {net >= 0 ? '+' : ''}{formatCurrency(net)}
        </Text>
        <PdfBtn loading={downloading === dlKey} onPress={onDownload} />
        <Ionicons
          name={open ? 'chevron-up' : 'chevron-down'}
          size={15}
          color={COLORS.gray[400]}
        />
      </TouchableOpacity>
      {open && <SessionBilanData s={session} />}
    </View>
  );
}

const sessStyles = StyleSheet.create({
  wrap: {
    borderLeftWidth: 2,
    borderLeftColor: COLORS.info,
    marginLeft: 8,
    paddingLeft: 10,
    marginTop: 6,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  icon: {
    width: 24,
    height: 24,
    borderRadius: 7,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { flex: 1 },
  name: { fontSize: 13, fontWeight: '700', color: COLORS.gray[800] },
  dates: { fontSize: 11, color: COLORS.gray[400], marginTop: 1 },
  net: { fontSize: 12, fontWeight: '700' },
});

// ─── Item exercice ────────────────────────────────────────────────────────────

interface ExerciceItemProps {
  exercice: MemberExerciceBilanDTO;
  sessions: MemberSessionBilanDTO[];
  memberId: number;
  downloading: string | null;
  onDownloadExercice: () => void;
  onDownloadSession: (session: MemberSessionBilanDTO) => void;
}

function ExerciceItem({
  exercice,
  sessions,
  memberId,
  downloading,
  onDownloadExercice,
  onDownloadSession,
}: ExerciceItemProps) {
  const [open, setOpen] = useState(false);
  const dlKey = `member-exercice-${memberId}-${exercice.exerciceId}`;
  const net = exercice.netExercice;
  const netColor = net >= 0 ? COLORS.success : COLORS.error;

  return (
    <View style={exStyles.card}>
      {/* En-tête */}
      <TouchableOpacity
        style={exStyles.header}
        onPress={() => setOpen((o) => !o)}
        activeOpacity={0.8}
      >
        <View style={[exStyles.dot, open && exStyles.dotOpen]} />
        <View style={exStyles.info}>
          <Text style={exStyles.name}>{exercice.exerciceName}</Text>
          <Text style={exStyles.dates}>
            {formatDate(exercice.exerciceStartDate)}
            {exercice.exerciceEndDate ? ` → ${formatDate(exercice.exerciceEndDate)}` : ''}
            {'  ·  '}{exercice.sessionsCount} session{exercice.sessionsCount > 1 ? 's' : ''}
          </Text>
        </View>
        <Text style={[exStyles.net, { color: netColor }]}>
          {net >= 0 ? '+' : ''}{formatCurrency(net)}
        </Text>
        <PdfBtn loading={downloading === dlKey} onPress={onDownloadExercice} />
        <Ionicons
          name={open ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={open ? COLORS.primary : COLORS.gray[400]}
        />
      </TouchableOpacity>

      {/* Contenu */}
      {open && (
        <View style={exStyles.body}>
          <ExerciceBilanData e={exercice} />

          {sessions.length > 0 && (
            <View style={exStyles.sessionsWrap}>
              <View style={exStyles.sessHeader}>
                <Ionicons name="layers-outline" size={12} color={COLORS.gray[400]} />
                <Text style={exStyles.sessHeaderText}>
                  SESSIONS CLÔTURÉES ({sessions.length})
                </Text>
              </View>
              {sessions.map((s) => (
                <SessionItem
                  key={s.sessionId}
                  session={s}
                  memberId={memberId}
                  downloading={downloading}
                  onDownload={() => onDownloadSession(s)}
                />
              ))}
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
    gap: 10,
    padding: 14,
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: COLORS.gray[300],
    flexShrink: 0,
  },
  dotOpen: { backgroundColor: COLORS.primary },
  info: { flex: 1 },
  name: { fontSize: 14, fontWeight: '800', color: COLORS.gray[900] },
  dates: { fontSize: 11, color: COLORS.gray[400], marginTop: 2 },
  net: { fontSize: 13, fontWeight: '700' },
  body: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[100],
    gap: 10,
  },
  sessionsWrap: { gap: 4 },
  sessHeader: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4, marginBottom: 2 },
  sessHeaderText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.gray[400],
    letterSpacing: 0.8,
  },
});

// ─── Composant principal exporté ─────────────────────────────────────────────

interface MemberBilanViewProps {
  memberId: number;
}

export function MemberBilanView({ memberId }: MemberBilanViewProps) {
  const { data: exercices, isLoading: exLoading } = useBilanMemberExercices(memberId);
  const { data: allSessions, isLoading: sessLoading } = useBilanMemberSessions(memberId);
  const { downloading, downloadMemberExercicePdf, downloadMemberSessionPdf } = useDownloadBilanPdf();

  // Groupe les sessions par exerciceName pour les associer aux exercices
  const sessionsByExercice = useMemo(() => {
    const map = new Map<string, MemberSessionBilanDTO[]>();
    (allSessions ?? []).forEach((s) => {
      const arr = map.get(s.exerciceName) ?? [];
      arr.push(s);
      map.set(s.exerciceName, arr);
    });
    return map;
  }, [allSessions]);

  const sortedExercices = useMemo(
    () => [...(exercices ?? [])].sort((a, b) =>
      new Date(b.exerciceEndDate ?? 0).getTime() - new Date(a.exerciceEndDate ?? 0).getTime()
    ),
    [exercices]
  );

  const isLoading = exLoading || sessLoading;

  if (isLoading) {
    return (
      <View style={viewStyles.loading}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={viewStyles.loadingText}>Chargement des bilans...</Text>
      </View>
    );
  }

  if (!exercices?.length) {
    return (
      <View style={viewStyles.empty}>
        <Ionicons name="bar-chart-outline" size={48} color={COLORS.gray[300]} />
        <Text style={viewStyles.emptyTitle}>Aucun bilan disponible</Text>
        <Text style={viewStyles.emptyText}>
          Les bilans apparaissent une fois qu'un exercice est clôturé.
        </Text>
      </View>
    );
  }

  return (
    <View style={viewStyles.root}>
      {sortedExercices.map((ex) => (
        <ExerciceItem
          key={ex.exerciceId}
          exercice={ex}
          sessions={sessionsByExercice.get(ex.exerciceName) ?? []}
          memberId={memberId}
          downloading={downloading}
          onDownloadExercice={() => downloadMemberExercicePdf(memberId, ex.exerciceId)}
          onDownloadSession={(s) => downloadMemberSessionPdf(memberId, s.sessionId)}
        />
      ))}
    </View>
  );
}

const viewStyles = StyleSheet.create({
  root: { gap: 12 },
  loading: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    gap: 12,
  },
  loadingText: { fontSize: 14, color: COLORS.gray[500] },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    gap: 10,
    paddingHorizontal: 32,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: COLORS.gray[700] },
  emptyText: { fontSize: 13, color: COLORS.gray[400], textAlign: 'center' },
});
