import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useContextStore } from '@/src/store/contextStore';
import { COLORS } from '@/src/constants';
import { useUpdateProfileInfo, useUpdatePassword, useUpdateEmail } from '@/src/hooks/useProfile';

// ─── Field component ──────────────────────────────────────────────────────────

interface FieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  secureText?: boolean;
  keyboardType?: 'default' | 'email-address' | 'phone-pad';
}

function Field({ label, value, onChange, placeholder, secureText, keyboardType }: FieldProps) {
  const [visible, setVisible] = useState(!secureText);

  return (
    <View style={fieldStyles.wrapper}>
      <Text style={fieldStyles.label}>{label}</Text>
      <View style={fieldStyles.row}>
        <TextInput
          style={fieldStyles.input}
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor={COLORS.gray[400]}
          secureTextEntry={secureText && !visible}
          keyboardType={keyboardType ?? 'default'}
          autoCapitalize="none"
        />
        {secureText && (
          <TouchableOpacity onPress={() => setVisible((v) => !v)} style={fieldStyles.eyeBtn}>
            <Ionicons
              name={visible ? 'eye-off-outline' : 'eye-outline'}
              size={18}
              color={COLORS.gray[400]}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const fieldStyles = StyleSheet.create({
  wrapper: { gap: 6 },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.gray[700] },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.gray[300],
    borderRadius: 10,
    backgroundColor: COLORS.white,
    overflow: 'hidden',
  },
  input: {
    flex: 1,
    paddingVertical: 11,
    paddingHorizontal: 12,
    fontSize: 15,
    color: COLORS.gray[900],
  },
  eyeBtn: { padding: 10 },
});

// ─── Save button ──────────────────────────────────────────────────────────────

function SaveBtn({
  label,
  onPress,
  isPending,
}: {
  label: string;
  onPress: () => void;
  isPending: boolean;
}) {
  return (
    <TouchableOpacity
      style={[saveBtnStyles.btn, isPending && saveBtnStyles.disabled]}
      onPress={onPress}
      disabled={isPending}
      activeOpacity={0.8}
    >
      {isPending ? (
        <ActivityIndicator size="small" color={COLORS.white} />
      ) : (
        <Text style={saveBtnStyles.text}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}

const saveBtnStyles = StyleSheet.create({
  btn: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  disabled: { opacity: 0.6 },
  text: { color: COLORS.white, fontSize: 14, fontWeight: '700' },
});

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function MonProfilScreen() {
  const router = useRouter();
  const { context } = useContextStore();

  const profile = context?.adminProfile ?? context?.memberProfile;

  const [firstname, setFirstname] = useState(profile?.firstname ?? '');
  const [lastname, setLastname] = useState(profile?.lastname ?? '');
  const [phone, setPhone] = useState(profile?.phone ?? '');

  const [newEmail, setNewEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');

  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');

  const { mutate: updateInfo, isPending: isSavingInfo } = useUpdateProfileInfo();
  const { mutate: updateEmail, isPending: isSavingEmail } = useUpdateEmail();
  const { mutate: updatePassword, isPending: isSavingPwd } = useUpdatePassword();

  const handleSaveInfo = () => {
    updateInfo({
      firstname: firstname.trim() || undefined,
      lastname: lastname.trim() || undefined,
      phone: phone.trim() || undefined,
    });
  };

  const handleSaveEmail = () => {
    if (!newEmail.trim() || !emailPassword) {
      Alert.alert('Champs requis', 'Remplissez le nouvel email et votre mot de passe.');
      return;
    }
    Alert.alert(
      "Modifier l'email",
      `Changer votre email pour "${newEmail.trim()}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: () =>
            updateEmail(
              { newEmail: newEmail.trim(), password: emailPassword },
              {
                onSuccess: () => {
                  setNewEmail('');
                  setEmailPassword('');
                },
              }
            ),
        },
      ]
    );
  };

  const handleSavePassword = () => {
    if (!currentPwd || !newPwd || !confirmPwd) {
      Alert.alert('Champs requis', 'Remplissez tous les champs.');
      return;
    }
    if (newPwd !== confirmPwd) {
      Alert.alert('Erreur', 'Les nouveaux mots de passe ne correspondent pas.');
      return;
    }
    updatePassword(
      { currentPassword: currentPwd, newPassword: newPwd, confirmNewPassword: confirmPwd },
      {
        onSuccess: () => {
          setCurrentPwd('');
          setNewPwd('');
          setConfirmPwd('');
        },
      }
    );
  };

  const initials = profile
    ? `${profile.firstname.charAt(0)}${profile.lastname.charAt(0)}`.toUpperCase()
    : '?';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Ionicons name="arrow-back" size={22} color={COLORS.gray[900]} />
        </TouchableOpacity>
        <Text style={styles.title}>Mon profil</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Avatar */}
        <View style={styles.avatarCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.emailDisplay}>{context?.email ?? ''}</Text>
        </View>

        {/* Informations personnelles */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>INFORMATIONS PERSONNELLES</Text>
          <Field label="Prenom" value={firstname} onChange={setFirstname} placeholder="Prenom" />
          <Field label="Nom" value={lastname} onChange={setLastname} placeholder="Nom" />
          <Field
            label="Telephone"
            value={phone}
            onChange={setPhone}
            placeholder="+237 6XX XXX XXX"
            keyboardType="phone-pad"
          />
          <SaveBtn
            label="Enregistrer les infos"
            onPress={handleSaveInfo}
            isPending={isSavingInfo}
          />
        </View>

        {/* Changer email */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>CHANGER L'EMAIL</Text>
          <Field
            label="Nouvel email"
            value={newEmail}
            onChange={setNewEmail}
            placeholder="nouveau@email.com"
            keyboardType="email-address"
          />
          <Field
            label="Mot de passe actuel"
            value={emailPassword}
            onChange={setEmailPassword}
            placeholder="Confirmez votre mot de passe"
            secureText
          />
          <SaveBtn
            label="Changer l'email"
            onPress={handleSaveEmail}
            isPending={isSavingEmail}
          />
        </View>

        {/* Changer mot de passe */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>CHANGER LE MOT DE PASSE</Text>
          <Field
            label="Mot de passe actuel"
            value={currentPwd}
            onChange={setCurrentPwd}
            placeholder="Mot de passe actuel"
            secureText
          />
          <Field
            label="Nouveau mot de passe"
            value={newPwd}
            onChange={setNewPwd}
            placeholder="Nouveau mot de passe"
            secureText
          />
          <Field
            label="Confirmer le nouveau mot de passe"
            value={confirmPwd}
            onChange={setConfirmPwd}
            placeholder="Confirmer le mot de passe"
            secureText
          />
          <SaveBtn
            label="Changer le mot de passe"
            onPress={handleSavePassword}
            isPending={isSavingPwd}
          />
        </View>
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
  back: { padding: 4 },
  title: { flex: 1, fontSize: 18, fontWeight: '700', color: COLORS.gray[900] },
  content: { padding: 16, gap: 16, paddingBottom: 48 },
  avatarCard: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: COLORS.white, fontSize: 24, fontWeight: '800' },
  emailDisplay: { fontSize: 14, color: COLORS.gray[500] },
  section: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 16,
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.gray[500],
    letterSpacing: 0.8,
  },
});
