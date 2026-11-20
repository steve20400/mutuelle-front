import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useContextStore } from '@/src/store/contextStore';
import { useLogout } from '@/src/hooks/useAuth';
import { COLORS } from '@/src/constants';
import { formatCurrency, formatDate, formatFullName } from '@/src/utils/format';

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

export default function ProfilScreen() {
  const { context } = useContextStore();
  const { mutate: logout } = useLogout();

  const profile = context?.memberProfile;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Mon profil</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {profile
                ? `${profile.firstname.charAt(0)}${profile.lastname.charAt(0)}`
                : 'M'}
            </Text>
          </View>
          {profile && (
            <Text style={styles.name}>{formatFullName(profile.firstname, profile.lastname)}</Text>
          )}
          <Text style={styles.roleText}>{context?.email ?? ''}</Text>
        </View>

        {/* Informations */}
        {profile && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Informations personnelles</Text>
            <InfoRow label="Prenom" value={profile.firstname} />
            <InfoRow label="Nom" value={profile.lastname} />
            <InfoRow label="Telephone" value={profile.phone ?? '-'} />
            <InfoRow label="Email" value={context?.email ?? '-'} />
            <InfoRow label="Membre depuis" value={formatDate(profile.createdAt)} />
            <InfoRow label="Statut" value={profile.isActive ? 'Actif' : 'Inactif'} />
          </View>
        )}

        {/* Situation financiere */}
        {profile && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Situation financiere</Text>
            <InfoRow label="Epargne" value={formatCurrency(profile.savingAmount ?? 0)} />
            <InfoRow label="Solidarite" value={formatCurrency(profile.solidarityAmount ?? 0)} />
            <InfoRow label="Emprunt en cours" value={formatCurrency(profile.borrowAmount ?? 0)} />
          </View>
        )}

        {/* Deconnexion */}
        <TouchableOpacity style={styles.logoutBtn} onPress={() => logout()}>
          <Ionicons name="log-out-outline" size={20} color={COLORS.error} />
          <Text style={styles.logoutText}>Se deconnecter</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.gray[50] },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  title: { fontSize: 20, fontWeight: '800', color: COLORS.gray[900] },
  content: { padding: 16, gap: 16, paddingBottom: 32 },
  avatarSection: { alignItems: 'center', gap: 8, paddingVertical: 16 },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: COLORS.white, fontSize: 24, fontWeight: '800' },
  name: { fontSize: 20, fontWeight: '800', color: COLORS.gray[900] },
  roleText: { fontSize: 13, color: COLORS.gray[500] },
  section: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: COLORS.gray[900], marginBottom: 4 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  rowLabel: { fontSize: 13, color: COLORS.gray[500] },
  rowValue: { fontSize: 13, color: COLORS.gray[900], fontWeight: '600' },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 8,
  },
  logoutText: { color: COLORS.error, fontWeight: '700', fontSize: 15 },
});
