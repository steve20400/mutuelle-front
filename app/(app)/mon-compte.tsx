import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useContextStore } from '@/src/store/contextStore';
import { useLogout, useForgotPIN } from '@/src/hooks/useAuth';
import {
  useUpdateMyProfile,
  useUpdateMyEmail,
  useUpdateMyPassword,
} from '@/src/hooks/useMembers';
import { useAuthStore } from '@/src/store/authStore';
import { useToast } from '@/src/store/toastStore';
import { COLORS } from '@/src/constants';
import { formatDate, formatFullName } from '@/src/utils/format';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.row}>
      <Text style={s.rowLabel}>{label}</Text>
      <Text style={s.rowValue} numberOfLines={1}>{value}</Text>
    </View>
  );
}

function ActionRow({
  icon,
  label,
  onPress,
  danger,
}: {
  icon: string;
  label: string;
  onPress: () => void;
  danger?: boolean;
}) {
  return (
    <TouchableOpacity style={s.actionRow} onPress={onPress} activeOpacity={0.7}>
      <Ionicons name={icon as never} size={20} color={danger ? COLORS.error : COLORS.primary} />
      <Text style={[s.actionLabel, danger && { color: COLORS.error }]}>{label}</Text>
      <Ionicons name="chevron-forward" size={16} color={COLORS.gray[300]} />
    </TouchableOpacity>
  );
}

// ─── Modaux ───────────────────────────────────────────────────────────────────

/** Modal générique avec titre, champs, bouton confirmer/annuler */
function BottomSheet({
  visible,
  title,
  onClose,
  onConfirm,
  isPending,
  canConfirm,
  children,
}: {
  visible: boolean;
  title: string;
  onClose: () => void;
  onConfirm: () => void;
  isPending: boolean;
  canConfirm: boolean;
  children: React.ReactNode;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={s.overlay}
      >
        <View style={s.sheet}>
          <View style={s.handle} />
          <Text style={s.sheetTitle}>{title}</Text>
          {children}
          <View style={s.sheetBtns}>
            <TouchableOpacity
              style={[s.btnConfirm, (!canConfirm || isPending) && s.btnDisabled]}
              onPress={onConfirm}
              disabled={!canConfirm || isPending}
              activeOpacity={0.8}
            >
              {isPending
                ? <ActivityIndicator size="small" color={COLORS.white} />
                : <Text style={s.btnConfirmText}>Enregistrer</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={s.btnCancel} onPress={onClose} activeOpacity={0.8}>
              <Text style={s.btnCancelText}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  keyboardType,
  secure,
  autoCapitalize,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'email-address' | 'phone-pad';
  secure?: boolean;
  autoCapitalize?: 'none' | 'words';
}) {
  const [show, setShow] = useState(false);
  return (
    <View style={s.field}>
      <Text style={s.fieldLabel}>{label}</Text>
      <View style={s.fieldRow}>
        <TextInput
          style={[s.fieldInput, secure && { paddingRight: 44 }]}
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor={COLORS.gray[400]}
          keyboardType={keyboardType ?? 'default'}
          secureTextEntry={secure && !show}
          autoCapitalize={autoCapitalize ?? 'none'}
          autoCorrect={false}
        />
        {secure && (
          <TouchableOpacity style={s.eyeBtn} onPress={() => setShow((v) => !v)} hitSlop={8}>
            <Ionicons
              name={show ? 'eye-off-outline' : 'eye-outline'}
              size={18}
              color={COLORS.gray[400]}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// ─── Modal : Modifier le profil ───────────────────────────────────────────────

function EditProfileModal({
  visible,
  initial,
  onClose,
}: {
  visible: boolean;
  initial: { firstname: string; lastname: string; phone: string };
  onClose: () => void;
}) {
  const [firstname, setFirstname] = useState('');
  const [lastname, setLastname]   = useState('');
  const [phone, setPhone]         = useState('');
  const { mutate, isPending } = useUpdateMyProfile();
  const { fetchContext } = useContextStore();

  useEffect(() => {
    if (visible) {
      setFirstname(initial.firstname);
      setLastname(initial.lastname);
      setPhone(initial.phone);
    }
  }, [visible, initial]);

  const canConfirm = firstname.trim().length > 0 && lastname.trim().length > 0;

  const handleConfirm = () => {
    mutate(
      { firstname: firstname.trim(), lastname: lastname.trim(), phone: phone.trim() },
      {
        onSuccess: () => {
          fetchContext();
          onClose();
        },
      }
    );
  };

  return (
    <BottomSheet
      visible={visible}
      title="Modifier le profil"
      onClose={onClose}
      onConfirm={handleConfirm}
      isPending={isPending}
      canConfirm={canConfirm}
    >
      <Field label="Prénom *" value={firstname} onChange={setFirstname}
        placeholder="Jean" autoCapitalize="words" />
      <Field label="Nom *" value={lastname} onChange={setLastname}
        placeholder="Dupont" autoCapitalize="words" />
      <Field label="Téléphone" value={phone} onChange={setPhone}
        placeholder="+237 6XX XXX XXX" keyboardType="phone-pad" />
    </BottomSheet>
  );
}

// ─── Modal : Changer l'email ──────────────────────────────────────────────────

function ChangeEmailModal({
  visible,
  onClose,
  onSuccess,
}: {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [newEmail, setNewEmail] = useState('');
  const [password, setPassword] = useState('');
  const { mutate, isPending } = useUpdateMyEmail();
  const { error } = useToast();

  useEffect(() => {
    if (visible) { setNewEmail(''); setPassword(''); }
  }, [visible]);

  const canConfirm = newEmail.trim().length > 3 && password.length >= 6;

  const handleConfirm = () => {
    mutate(
      { newEmail: newEmail.trim(), password },
      {
        onSuccess: () => { onClose(); onSuccess(); },
        onError: (err: unknown) => {
          error((err as { message?: string })?.message ?? 'Erreur');
        },
      }
    );
  };

  return (
    <BottomSheet
      visible={visible}
      title="Changer l'adresse email"
      onClose={onClose}
      onConfirm={handleConfirm}
      isPending={isPending}
      canConfirm={canConfirm}
    >
      <View style={s.warningBox}>
        <Ionicons name="warning-outline" size={14} color={COLORS.warning} />
        <Text style={s.warningText}>
          Vous serez déconnecté après le changement.
        </Text>
      </View>
      <Field label="Nouvel email *" value={newEmail} onChange={setNewEmail}
        placeholder="nouveau@email.com" keyboardType="email-address" />
      <Field label="Mot de passe actuel *" value={password} onChange={setPassword}
        placeholder="••••••••" secure />
    </BottomSheet>
  );
}

// ─── Modal : Changer le mot de passe ─────────────────────────────────────────

function ChangePasswordModal({
  visible,
  onClose,
  onSuccess,
}: {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [current, setCurrent]   = useState('');
  const [next, setNext]         = useState('');
  const [confirm, setConfirm]   = useState('');
  const { mutate, isPending } = useUpdateMyPassword();
  const { error } = useToast();

  useEffect(() => {
    if (visible) { setCurrent(''); setNext(''); setConfirm(''); }
  }, [visible]);

  const mismatch   = next.length > 0 && confirm.length > 0 && next !== confirm;
  const canConfirm = current.length >= 6 && next.length >= 6 && next === confirm;

  const handleConfirm = () => {
    mutate(
      { currentPassword: current, newPassword: next, confirmNewPassword: confirm },
      {
        onSuccess: () => { onClose(); onSuccess(); },
        onError: (err: unknown) => {
          error((err as { message?: string })?.message ?? 'Erreur');
        },
      }
    );
  };

  return (
    <BottomSheet
      visible={visible}
      title="Changer le mot de passe"
      onClose={onClose}
      onConfirm={handleConfirm}
      isPending={isPending}
      canConfirm={canConfirm}
    >
      <View style={s.warningBox}>
        <Ionicons name="warning-outline" size={14} color={COLORS.warning} />
        <Text style={s.warningText}>
          Vous serez déconnecté après le changement.
        </Text>
      </View>
      <Field label="Mot de passe actuel *" value={current} onChange={setCurrent}
        placeholder="••••••••" secure />
      <Field label="Nouveau mot de passe * (min. 6 car.)" value={next} onChange={setNext}
        placeholder="••••••••" secure />
      <Field label="Confirmer le nouveau mot de passe *" value={confirm} onChange={setConfirm}
        placeholder="••••••••" secure />
      {mismatch && (
        <Text style={s.mismatch}>Les mots de passe ne correspondent pas.</Text>
      )}
    </BottomSheet>
  );
}

// ─── Écran principal ──────────────────────────────────────────────────────────

export default function MonCompteScreen() {
  const { context }  = useContextStore();
  const { mutate: logout }  = useLogout();
  const forgotPIN = useForgotPIN();
  const authLogout = useAuthStore((s) => s.logout);

  const [editProfile,   setEditProfile]   = useState(false);
  const [changeEmail,   setChangeEmail]   = useState(false);
  const [changePwd,     setChangePwd]     = useState(false);

  const profile = context?.memberProfile;

  // ── Déconnexion forcée après changement sensible ─────────────────────────
  const forceLogout = (reason: 'email' | 'password') => {
    const labels = {
      email:    'votre adresse email',
      password: 'votre mot de passe',
    };
    Alert.alert(
      'Modification enregistrée',
      `${labels[reason].charAt(0).toUpperCase() + labels[reason].slice(1)} a été modifié(e).\n\nPour votre sécurité, vous allez être déconnecté.`,
      [{
        text: 'OK',
        onPress: async () => {
          await authLogout();
        },
      }]
    );
  };

  // ── Confirmation déconnexion manuelle ────────────────────────────────────
  const handleLogout = () => {
    Alert.alert('Déconnexion', 'Voulez-vous vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Se déconnecter', style: 'destructive', onPress: () => logout() },
    ]);
  };

  const handleForgotPIN = () => {
    Alert.alert(
      'Code PIN oublié',
      'Vous allez être déconnecté pour réinitialiser votre PIN.',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Confirmer', style: 'destructive', onPress: forgotPIN },
      ]
    );
  };

  const initial = {
    firstname: profile?.firstname ?? '',
    lastname:  profile?.lastname  ?? '',
    phone:     profile?.phone     ?? '',
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <Text style={s.title}>Mon compte</Text>
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

        {/* ── Avatar ─────────────────────────────────────────────────────── */}
        <View style={s.avatarSection}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>
              {profile
                ? `${profile.firstname.charAt(0)}${profile.lastname.charAt(0)}`
                : 'M'}
            </Text>
          </View>
          {profile && (
            <Text style={s.name}>{formatFullName(profile.firstname, profile.lastname)}</Text>
          )}
          <Text style={s.email}>{context?.email ?? ''}</Text>
          {profile && (
            <View style={[
              s.statusBadge,
              { backgroundColor: profile.status === 'ACTIF' ? '#D1FAE5' : '#FEE2E2' },
            ]}>
              <Text style={[
                s.statusText,
                { color: profile.status === 'ACTIF' ? COLORS.success : COLORS.error },
              ]}>
                {profile.status}
              </Text>
            </View>
          )}
        </View>

        {/* ── Infos personnelles ──────────────────────────────────────────── */}
        {profile && (
          <View style={s.section}>
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>INFORMATIONS PERSONNELLES</Text>
              <TouchableOpacity
                onPress={() => setEditProfile(true)}
                style={s.editChip}
                activeOpacity={0.7}
              >
                <Ionicons name="pencil-outline" size={13} color={COLORS.primary} />
                <Text style={s.editChipText}>Modifier</Text>
              </TouchableOpacity>
            </View>
            <InfoRow label="Prénom"   value={profile.firstname} />
            <InfoRow label="Nom"      value={profile.lastname} />
            <InfoRow label="Téléphone" value={profile.phone ?? '—'} />
            <InfoRow label="Email"    value={context?.email ?? '—'} />
            <InfoRow label="Membre depuis" value={formatDate(profile.createdAt)} />
          </View>
        )}

        {/* ── Sécurité ────────────────────────────────────────────────────── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>SECURITE</Text>
          <ActionRow
            icon="mail-outline"
            label="Changer l'email"
            onPress={() => setChangeEmail(true)}
          />
          <View style={s.divider} />
          <ActionRow
            icon="lock-closed-outline"
            label="Changer le mot de passe"
            onPress={() => setChangePwd(true)}
          />
          <View style={s.divider} />
          <ActionRow
            icon="keypad-outline"
            label="Réinitialiser le code PIN"
            onPress={handleForgotPIN}
          />
        </View>

        {/* ── Déconnexion ─────────────────────────────────────────────────── */}
        <TouchableOpacity style={s.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={20} color={COLORS.error} />
          <Text style={s.logoutText}>Se déconnecter</Text>
        </TouchableOpacity>

      </ScrollView>

      {/* ── Modaux ────────────────────────────────────────────────────────── */}
      <EditProfileModal
        visible={editProfile}
        initial={initial}
        onClose={() => setEditProfile(false)}
      />
      <ChangeEmailModal
        visible={changeEmail}
        onClose={() => setChangeEmail(false)}
        onSuccess={() => forceLogout('email')}
      />
      <ChangePasswordModal
        visible={changePwd}
        onClose={() => setChangePwd(false)}
        onSuccess={() => forceLogout('password')}
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.gray[50] },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  title: { fontSize: 20, fontWeight: '800', color: COLORS.gray[900] },
  content: { padding: 16, gap: 16, paddingBottom: 40 },

  // Avatar
  avatarSection: { alignItems: 'center', gap: 8, paddingVertical: 12 },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: COLORS.white, fontSize: 24, fontWeight: '800' },
  name:  { fontSize: 20, fontWeight: '800', color: COLORS.gray[900] },
  email: { fontSize: 13, color: COLORS.gray[500] },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, marginTop: 2 },
  statusText:  { fontSize: 12, fontWeight: '700' },

  // Section
  section: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 16,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { fontSize: 11, fontWeight: '700', color: COLORS.gray[500], letterSpacing: 0.8 },
  editChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  editChipText: { fontSize: 12, fontWeight: '700', color: COLORS.primary },

  // Info rows
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  rowLabel: { fontSize: 13, color: COLORS.gray[500] },
  rowValue: { fontSize: 13, fontWeight: '600', color: COLORS.gray[900], flexShrink: 1, textAlign: 'right', marginLeft: 16 },

  // Action rows
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 4 },
  actionLabel: { flex: 1, fontSize: 14, color: COLORS.gray[900], fontWeight: '500' },
  divider: { height: 1, backgroundColor: COLORS.gray[100] },

  // Logout
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    paddingVertical: 14,
  },
  logoutText: { color: COLORS.error, fontWeight: '700', fontSize: 15 },

  // Modal
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    paddingTop: 12,
    gap: 12,
  },
  handle: { width: 40, height: 4, backgroundColor: COLORS.gray[300], borderRadius: 2, alignSelf: 'center', marginBottom: 4 },
  sheetTitle: { fontSize: 17, fontWeight: '800', color: COLORS.gray[900], textAlign: 'center', marginBottom: 4 },

  // Field
  field: { gap: 5 },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: COLORS.gray[600] },
  fieldRow: { position: 'relative' },
  fieldInput: {
    backgroundColor: COLORS.gray[50],
    borderWidth: 1.5,
    borderColor: COLORS.gray[200],
    borderRadius: 10,
    paddingHorizontal: 13,
    paddingVertical: 11,
    fontSize: 15,
    color: COLORS.gray[900],
  },
  eyeBtn: { position: 'absolute', right: 12, top: 0, bottom: 0, justifyContent: 'center' },

  // Warning
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF3C7',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  warningText: { flex: 1, fontSize: 12, color: '#92400E', fontWeight: '600' },

  // Mismatch
  mismatch: { fontSize: 12, color: COLORS.error, fontWeight: '600' },

  // Boutons modal
  sheetBtns: { gap: 10, marginTop: 4 },
  btnConfirm: { backgroundColor: COLORS.primary, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  btnConfirmText: { color: COLORS.white, fontSize: 14, fontWeight: '700' },
  btnDisabled: { opacity: 0.4 },
  btnCancel: { backgroundColor: COLORS.gray[100], borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  btnCancelText: { color: COLORS.gray[600], fontSize: 14, fontWeight: '600' },
});
