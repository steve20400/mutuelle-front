import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import {
  useMember,
  useUpdateMember,
  useUpdateMyProfile,
  useUpdateMyEmail,
  useUpdateMyPassword,
} from '@/src/hooks/useMembers';
import { useMemberAccount } from '@/src/hooks/useContribution';
import { useCurrentContext } from '@/src/store/contextStore';
import { isAdmin } from '@/src/navigation/roles';
import { COLORS } from '@/src/constants';
import type { BackendRole } from '@/src/types';
import { formatCurrency, formatDate, formatFullName, formatInitials } from '@/src/utils/format';

// ─── Ligne d'info ─────────────────────────────────────────────────────────────

function InfoRow({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <View style={s.infoRow}>
      <Text style={s.infoLabel}>{label}</Text>
      <Text style={[s.infoValue, accent ? { color: accent } : {}]}>{value}</Text>
    </View>
  );
}

// ─── Sélecteur d'onglet ───────────────────────────────────────────────────────

type EditTab = 'profil' | 'email' | 'password';

const TABS: { key: EditTab; label: string; icon: string }[] = [
  { key: 'profil',    label: 'Profil',       icon: 'person-outline' },
  { key: 'email',     label: 'Email',        icon: 'mail-outline' },
  { key: 'password',  label: 'Mot de passe', icon: 'lock-closed-outline' },
];

function TabSelector({ active, onChange }: { active: EditTab; onChange: (t: EditTab) => void }) {
  return (
    <View style={s.tabRow}>
      {TABS.map((t) => {
        const isActive = active === t.key;
        return (
          <TouchableOpacity
            key={t.key}
            style={[s.tab, isActive && s.tabActive]}
            onPress={() => onChange(t.key)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={t.icon as never}
              size={14}
              color={isActive ? COLORS.white : COLORS.gray[500]}
            />
            <Text style={[s.tabLabel, isActive && s.tabLabelActive]}>{t.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ─── Champ texte avec toggle visibilité ───────────────────────────────────────

function SecureField({
  label,
  value,
  onChangeText,
  placeholder,
  autoFocus,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <View style={s.field}>
      <Text style={s.fieldLabel}>{label}</Text>
      <View style={s.secureRow}>
        <TextInput
          style={[s.fieldInput, { flex: 1, borderRightWidth: 0, borderTopRightRadius: 0, borderBottomRightRadius: 0 }]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder ?? '••••••••'}
          placeholderTextColor={COLORS.gray[400]}
          secureTextEntry={!visible}
          autoFocus={autoFocus}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TouchableOpacity
          style={s.eyeBtn}
          onPress={() => setVisible((v) => !v)}
          hitSlop={8}
        >
          <Ionicons
            name={visible ? 'eye-off-outline' : 'eye-outline'}
            size={18}
            color={COLORS.gray[500]}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Contenu onglet Profil ────────────────────────────────────────────────────

function ProfilTab({
  firstname, lastname, phone,
  setFirstname, setLastname, setPhone,
  isPending, onSubmit,
}: {
  firstname: string; lastname: string; phone: string;
  setFirstname: (v: string) => void;
  setLastname:  (v: string) => void;
  setPhone:     (v: string) => void;
  isPending: boolean; onSubmit: () => void;
}) {
  const canSubmit = firstname.trim().length > 0 && lastname.trim().length > 0 && !isPending;
  return (
    <View style={s.tabContent}>
      <View style={s.field}>
        <Text style={s.fieldLabel}>Prénom *</Text>
        <TextInput
          style={s.fieldInput}
          value={firstname}
          onChangeText={setFirstname}
          placeholder="Prénom"
          placeholderTextColor={COLORS.gray[400]}
          autoCapitalize="words"
          autoFocus
        />
      </View>
      <View style={s.field}>
        <Text style={s.fieldLabel}>Nom *</Text>
        <TextInput
          style={s.fieldInput}
          value={lastname}
          onChangeText={setLastname}
          placeholder="Nom"
          placeholderTextColor={COLORS.gray[400]}
          autoCapitalize="words"
        />
      </View>
      <View style={s.field}>
        <Text style={s.fieldLabel}>Téléphone</Text>
        <TextInput
          style={s.fieldInput}
          value={phone}
          onChangeText={setPhone}
          placeholder="+237 6 00 00 00 00"
          placeholderTextColor={COLORS.gray[400]}
          keyboardType="phone-pad"
        />
      </View>
      <SubmitButton isPending={isPending} canSubmit={canSubmit} onPress={onSubmit} />
    </View>
  );
}

// ─── Contenu onglet Email ─────────────────────────────────────────────────────

function EmailTab({
  newEmail, password,
  setNewEmail, setPassword,
  isPending, onSubmit,
}: {
  newEmail: string; password: string;
  setNewEmail: (v: string) => void;
  setPassword: (v: string) => void;
  isPending: boolean; onSubmit: () => void;
}) {
  const canSubmit = newEmail.trim().includes('@') && password.trim().length > 0 && !isPending;
  return (
    <View style={s.tabContent}>
      <View style={s.infoHint}>
        <Ionicons name="information-circle-outline" size={15} color={COLORS.info} />
        <Text style={s.infoHintText}>
          Votre mot de passe actuel est requis pour confirmer le changement d'email.
        </Text>
      </View>
      <View style={s.field}>
        <Text style={s.fieldLabel}>Nouvel email *</Text>
        <TextInput
          style={s.fieldInput}
          value={newEmail}
          onChangeText={setNewEmail}
          placeholder="nouveau@email.com"
          placeholderTextColor={COLORS.gray[400]}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoFocus
        />
      </View>
      <SecureField
        label="Mot de passe actuel *"
        value={password}
        onChangeText={setPassword}
        placeholder="Votre mot de passe"
      />
      <SubmitButton isPending={isPending} canSubmit={canSubmit} onPress={onSubmit} />
    </View>
  );
}

// ─── Contenu onglet Mot de passe ──────────────────────────────────────────────

function PasswordTab({
  current, next, confirm,
  setCurrent, setNext, setConfirm,
  isPending, onSubmit,
}: {
  current: string; next: string; confirm: string;
  setCurrent: (v: string) => void;
  setNext:    (v: string) => void;
  setConfirm: (v: string) => void;
  isPending: boolean; onSubmit: () => void;
}) {
  const mismatch = next.length > 0 && confirm.length > 0 && next !== confirm;
  const canSubmit =
    current.trim().length > 0 &&
    next.trim().length >= 6 &&
    next === confirm &&
    !isPending;

  return (
    <View style={s.tabContent}>
      <SecureField
        label="Mot de passe actuel *"
        value={current}
        onChangeText={setCurrent}
        autoFocus
      />
      <SecureField
        label="Nouveau mot de passe * (min. 6 car.)"
        value={next}
        onChangeText={setNext}
        placeholder="Nouveau mot de passe"
      />
      <SecureField
        label="Confirmer le mot de passe *"
        value={confirm}
        onChangeText={setConfirm}
        placeholder="Confirmer"
      />
      {mismatch && (
        <Text style={s.errorText}>Les mots de passe ne correspondent pas</Text>
      )}
      <SubmitButton isPending={isPending} canSubmit={canSubmit} onPress={onSubmit} />
    </View>
  );
}

// ─── Bouton de soumission commun ──────────────────────────────────────────────

function SubmitButton({
  isPending, canSubmit, onPress,
}: { isPending: boolean; canSubmit: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      style={[s.submitBtn, !canSubmit && s.btnDisabled]}
      onPress={onPress}
      disabled={!canSubmit}
      activeOpacity={0.8}
    >
      {isPending ? (
        <ActivityIndicator size="small" color={COLORS.white} />
      ) : (
        <Text style={s.submitBtnText}>Enregistrer</Text>
      )}
    </TouchableOpacity>
  );
}

// ─── Modal d'édition ──────────────────────────────────────────────────────────

interface EditModalProps {
  visible: boolean;
  onClose: () => void;
  member: { firstname: string; lastname: string; phone?: string | null; email: string };
  onRefresh: () => void;
  /** true = le membre modifie son propre profil (3 onglets) */
  isSelf: boolean;
  /** id du membre cible — utilisé par l'admin quand isSelf=false */
  targetMemberId: number;
}

function EditModal({ visible, onClose, member, onRefresh, isSelf, targetMemberId }: EditModalProps) {
  const qc = useQueryClient();
  const [tab, setTab] = useState<EditTab>('profil');

  // Profil
  const [firstname, setFirstname] = useState('');
  const [lastname,  setLastname]  = useState('');
  const [phone,     setPhone]     = useState('');

  // Email (self seulement)
  const [newEmail,      setNewEmail]      = useState('');
  const [emailPassword, setEmailPassword] = useState('');

  // Mot de passe (self seulement)
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd,     setNewPwd]     = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');

  const updateMember   = useUpdateMember();      // admin → PATCH /members/:id
  const updateProfile  = useUpdateMyProfile();   // self  → PATCH /members/me
  const updateEmail    = useUpdateMyEmail();
  const updatePassword = useUpdateMyPassword();

  // Pré-remplit à l'ouverture
  useEffect(() => {
    if (visible) {
      setTab('profil');
      setFirstname(member.firstname);
      setLastname(member.lastname);
      setPhone(member.phone ?? '');
      setNewEmail('');
      setEmailPassword('');
      setCurrentPwd('');
      setNewPwd('');
      setConfirmPwd('');
    }
  }, [visible, member]);

  const handleClose = () => {
    updateMember.reset();
    updateProfile.reset();
    updateEmail.reset();
    updatePassword.reset();
    onClose();
  };

  const handleProfilSubmit = () => {
    const payload = {
      firstname: firstname.trim(),
      lastname: lastname.trim(),
      phone: phone.trim() || undefined,
    };

    if (isSelf) {
      updateProfile.mutate(payload, {
        onSuccess: () => { onRefresh(); qc.invalidateQueries({ queryKey: ['members'] }); handleClose(); },
      });
    } else {
      updateMember.mutate({ id: targetMemberId, payload }, {
        onSuccess: () => { onRefresh(); handleClose(); },
      });
    }
  };

  const handleEmailSubmit = () => {
    updateEmail.mutate(
      { newEmail: newEmail.trim(), password: emailPassword },
      {
        onSuccess: () => {
          onRefresh();
          handleClose();
        },
      }
    );
  };

  const handlePasswordSubmit = () => {
    updatePassword.mutate(
      { currentPassword: currentPwd, newPassword: newPwd, confirmNewPassword: confirmPwd },
      { onSuccess: handleClose }
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={s.overlay}
      >
        <View style={s.sheet}>
          {/* Handle + titre */}
          <View style={s.handle} />
          <View style={s.sheetHeader}>
            <Text style={s.sheetTitle}>
              {isSelf ? 'Modifier mon profil' : 'Modifier les informations'}
            </Text>
            <TouchableOpacity onPress={handleClose} hitSlop={8}>
              <Ionicons name="close" size={22} color={COLORS.gray[500]} />
            </TouchableOpacity>
          </View>

          {/* Onglets — admin : profil uniquement / membre : 3 onglets */}
          {isSelf
            ? <TabSelector active={tab} onChange={setTab} />
            : null
          }

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {/* Onglet Profil — toujours visible (admin + membre) */}
            {(!isSelf || tab === 'profil') && (
              <ProfilTab
                firstname={firstname} lastname={lastname} phone={phone}
                setFirstname={setFirstname} setLastname={setLastname} setPhone={setPhone}
                isPending={isSelf ? updateProfile.isPending : updateMember.isPending}
                onSubmit={handleProfilSubmit}
              />
            )}
            {/* Onglets réservés au membre lui-même */}
            {isSelf && tab === 'email' && (
              <EmailTab
                newEmail={newEmail} password={emailPassword}
                setNewEmail={setNewEmail} setPassword={setEmailPassword}
                isPending={updateEmail.isPending}
                onSubmit={handleEmailSubmit}
              />
            )}
            {isSelf && tab === 'password' && (
              <PasswordTab
                current={currentPwd} next={newPwd} confirm={confirmPwd}
                setCurrent={setCurrentPwd} setNext={setNewPwd} setConfirm={setConfirmPwd}
                isPending={updatePassword.isPending}
                onSubmit={handlePasswordSubmit}
              />
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Écran principal ──────────────────────────────────────────────────────────

export default function MemberInfoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const memberId = Number(id);

  const { data: member, isLoading, refetch } = useMember(memberId);
  const { data: account } = useMemberAccount(memberId);
  const context = useCurrentContext();

  const [editModal, setEditModal] = useState(false);

  if (isLoading && !member) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!member) {
    return (
      <View style={s.center}>
        <Ionicons name="alert-circle-outline" size={48} color={COLORS.gray[300]} />
        <Text style={s.centerText}>Membre introuvable</Text>
      </View>
    );
  }

  const role = (context?.role ?? null) as BackendRole | null;
  const isSelf = context?.memberProfile?.id === memberId;
  const canEdit = isSelf || isAdmin(role);

  // Données financières
  const savingAmount        = account?.savingAmount ?? 0;
  const borrowAmount        = account?.borrowAmount ?? 0;
  const unpaidRenfoulement  = account?.unpaidRenfoulement ?? 0;
  const unpaidRegistration  = account?.unpaidRegistrationAmount ?? 0;
  const unpaidSolidarity    = account?.unpaidSolidarityAmount ?? 0;
  const solidarityPaid      = account?.solidarityAmount ?? 0;
  const solidariteTotal     = solidarityPaid + unpaidSolidarity;
  const solidaritePercent   = solidariteTotal > 0 ? (solidarityPaid / solidariteTotal) * 100 : 0;
  const inscriptionSolde    = unpaidRegistration === 0;

  return (
    <>
      <ScrollView
        style={s.container}
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero ────────────────────────────────────────────────────────── */}
        <View style={s.hero}>
          <View style={s.heroTop}>
            <View style={s.heroAvatar}>
              <Text style={s.heroAvatarText}>
                {formatInitials(member.firstname, member.lastname)}
              </Text>
            </View>
            {/* {canEdit && (
              <TouchableOpacity
                style={s.editBtn}
                onPress={() => setEditModal(true)}
                activeOpacity={0.7}
              >
                <Ionicons name="create-outline" size={20} color={COLORS.white} />
              </TouchableOpacity>
            )} */}
          </View>

          <Text style={s.heroName}>{formatFullName(member.firstname, member.lastname)}</Text>
          <Text style={s.heroEmail}>{member.email}</Text>
          <Text style={s.heroSub}>N°{member.id} · Depuis le {formatDate(member.createdAt)}</Text>

          <View style={s.cards}>
            <View style={s.card}>
              <Text style={s.cardLabel}>ÉPARGNE</Text>
              <Text style={[s.cardVal, { color: COLORS.success }]}>
                {formatCurrency(savingAmount)}
              </Text>
            </View>
            <View style={[s.card, s.cardBorder]}>
              <Text style={s.cardLabel}>DETTE EMPRUNT</Text>
              <Text style={[s.cardVal, { color: COLORS.error }]}>
                {formatCurrency(borrowAmount)}
              </Text>
            </View>
            <View style={[s.card, s.cardBorder]}>
              <Text style={s.cardLabel}>RENFLOUMENT DU</Text>
              <Text style={[s.cardVal, { color: unpaidRenfoulement > 0 ? COLORS.warning : COLORS.white }]}>
                {formatCurrency(unpaidRenfoulement)}
              </Text>
            </View>
          </View>
        </View>

        {/* ── Informations personnelles ─────────────────────────────────── */}
        <View style={s.section}>
          <View style={s.sectionHeaderRow}>
            <Text style={s.sectionTitle}>Informations personnelles</Text>
            {canEdit && (
              <TouchableOpacity
                style={s.sectionEditBtn}
                onPress={() => setEditModal(true)}
                activeOpacity={0.7}
              >
                <Ionicons name="pencil-outline" size={13} color={COLORS.primary} />
                <Text style={s.sectionEditBtnText}>Modifier</Text>
              </TouchableOpacity>
            )}
          </View>
          <InfoRow label="Prénom"         value={member.firstname} />
          <InfoRow label="Nom"            value={member.lastname} />
          <InfoRow label="Email"          value={member.email} />
          <InfoRow label="Téléphone"      value={member.phone ?? '—'} />
          <InfoRow label="Rôle"           value={member.role} />
          <InfoRow
            label="Statut"
            value={member.status}
            accent={
              member.status === 'ACTIF'       ? COLORS.success :
              member.status === 'INSOLVABLE'  ? COLORS.warning : COLORS.error
            }
          />
          <InfoRow label="Membre depuis"  value={formatDate(member.createdAt)} />
        </View>

        {/* ── Situation financière ──────────────────────────────────────── */}
        {/* <View style={s.section}>
          <Text style={s.sectionTitle}>Situation financière</Text>
          <InfoRow label="Épargne"              value={formatCurrency(savingAmount)} />
          <InfoRow label="Emprunt en cours"     value={formatCurrency(borrowAmount)} />
          <InfoRow label="Renflouement impayé"  value={formatCurrency(unpaidRenfoulement)} />
          <InfoRow label="Inscription"
            value={inscriptionSolde ? 'À jour' : `Impayé : ${formatCurrency(unpaidRegistration)}`}
            accent={inscriptionSolde ? COLORS.success : COLORS.error}
          />
          <InfoRow
            label={`Solidarité (${solidaritePercent.toFixed(0)}%)`}
            value={`${formatCurrency(solidarityPaid)} / ${formatCurrency(solidariteTotal)}`}
          />
        </View> */}

        {/* {canEdit && (
          <TouchableOpacity
            style={s.editProfileBtn}
            onPress={() => setEditModal(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="create-outline" size={16} color={COLORS.white} />
            <Text style={s.editProfileBtnText}>Modifier mon profil</Text>
          </TouchableOpacity>
        )} */}
      </ScrollView>

      {canEdit && member && (
        <EditModal
          visible={editModal}
          onClose={() => setEditModal(false)}
          member={member}
          onRefresh={refetch}
          isSelf={isSelf}
          targetMemberId={memberId}
        />
      )}
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.gray[50] },
  scroll: { paddingBottom: 40 },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  centerText: { fontSize: 15, color: COLORS.gray[500] },

  // ── Hero ──────────────────────────────────────────────────────────────────────
  hero: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    alignItems: 'center',
    gap: 6,
  },
  heroTop: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  heroAvatar: {
    width: 68,
    height: 68,
    borderRadius: 18,
    backgroundColor: COLORS.primaryLight,
    borderWidth: 2,
    borderColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroAvatarText: { color: COLORS.white, fontSize: 24, fontWeight: '800' },
  editBtn: {
    position: 'absolute',
    right: 0,
    padding: 8,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 10,
  },
  heroName:  { color: COLORS.white,    fontSize: 18, fontWeight: '800', textAlign: 'center' },
  heroEmail: { color: COLORS.gray[400], fontSize: 12, textAlign: 'center' },
  heroSub:   { color: COLORS.gray[500], fontSize: 11, marginBottom: 8 },
  cards: {
    flexDirection: 'row',
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.primaryLight,
    marginTop: 4,
  },
  card: {
    flex: 1,
    backgroundColor: COLORS.primaryLight,
    paddingVertical: 10,
    alignItems: 'center',
    gap: 3,
  },
  cardBorder: { borderLeftWidth: 1, borderLeftColor: COLORS.primary },
  cardLabel:  { fontSize: 8,  color: COLORS.gray[400], fontWeight: '700', letterSpacing: 0.5 },
  cardVal:    { fontSize: 12, fontWeight: '800', color: COLORS.white, textAlign: 'center' },

  // ── Sections ──────────────────────────────────────────────────────────────────
  section: {
    margin: 12,
    marginBottom: 0,
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
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: COLORS.gray[500], letterSpacing: 0.5 },
  sectionEditBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
  },
  sectionEditBtnText: { fontSize: 12, fontWeight: '600', color: COLORS.primary },

  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  infoLabel: { fontSize: 13, color: COLORS.gray[500], flex: 1 },
  infoValue: { fontSize: 13, fontWeight: '600', color: COLORS.gray[800], textAlign: 'right', flexShrink: 1 },

  editProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    margin: 12,
    marginTop: 16,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
  },
  editProfileBtnText: { color: COLORS.white, fontSize: 14, fontWeight: '700' },

  // ── Modal ─────────────────────────────────────────────────────────────────────
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    paddingTop: 12,
    maxHeight: '85%',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.gray[300],
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 10,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sheetTitle: { fontSize: 17, fontWeight: '800', color: COLORS.gray[800] },

  // ── Onglets ───────────────────────────────────────────────────────────────────
  tabRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.gray[100],
    borderRadius: 12,
    padding: 3,
    gap: 3,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    borderRadius: 10,
  },
  tabActive: { backgroundColor: COLORS.primary },
  tabLabel:  { fontSize: 11, fontWeight: '600', color: COLORS.gray[500] },
  tabLabelActive: { color: COLORS.white },

  // ── Champs ────────────────────────────────────────────────────────────────────
  tabContent: { gap: 12, paddingBottom: 8 },
  field: { gap: 5 },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: COLORS.gray[600] },
  fieldInput: {
    backgroundColor: COLORS.gray[50],
    borderWidth: 1.5,
    borderColor: COLORS.gray[200],
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    color: COLORS.gray[800],
  },
  secureRow: { flexDirection: 'row' },
  eyeBtn: {
    borderWidth: 1.5,
    borderLeftWidth: 0,
    borderColor: COLORS.gray[200],
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
    paddingHorizontal: 12,
    justifyContent: 'center',
    backgroundColor: COLORS.gray[50],
  },

  infoHint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    padding: 10,
  },
  infoHintText: { fontSize: 12, color: COLORS.info, flex: 1, lineHeight: 18 },

  errorText: { fontSize: 12, color: COLORS.error, fontWeight: '500' },

  submitBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  submitBtnText: { color: COLORS.white, fontSize: 14, fontWeight: '700' },
  btnDisabled: { opacity: 0.45 },
});
