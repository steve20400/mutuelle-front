import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useContextStore } from '@/src/store/contextStore';
import { useLogout } from '@/src/hooks/useAuth';
import { COLORS } from '@/src/constants';
import { getRoleDisplayName } from '@/src/navigation/roles';
import { BorrowingCeilingGrid } from '@/src/components/common/BorrowingCeilingGrid';
import type { BackendRole } from '@/src/types';

interface MenuItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  destructive?: boolean;
}

function MenuItem({ icon, label, onPress, destructive }: MenuItemProps) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
      <Ionicons name={icon} size={20} color={destructive ? COLORS.error : COLORS.primary} />
      <Text style={[styles.menuLabel, destructive && { color: COLORS.error }]}>{label}</Text>
      {!destructive && <Ionicons name="chevron-forward" size={16} color={COLORS.gray[400]} />}
    </TouchableOpacity>
  );
}

export default function ParametresScreen() {
  const router = useRouter();
  const { context } = useContextStore();
  const { mutate: logout } = useLogout();

  const role = context?.role as BackendRole | undefined;
  const profile = context?.adminProfile;

  const [grillModal, setGrillModal] = useState(false);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Parametres</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Profil admin */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {profile ? `${profile.firstname.charAt(0)}${profile.lastname.charAt(0)}` : 'A'}
            </Text>
          </View>
          <View>
            <Text style={styles.profileName}>
              {profile ? `${profile.firstname} ${profile.lastname}` : context?.email ?? '-'}
            </Text>
            <Text style={styles.profileRole}>{role ? getRoleDisplayName(role) : ''}</Text>
            <Text style={styles.profileEmail}>{context?.email ?? ''}</Text>
          </View>
        </View>

        {/* Configuration mutuelle */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Administration</Text>
          <MenuItem
            icon="settings-outline"
            label="Configuration de la mutuelle"
            onPress={() => router.push('/(app)/parametres/config' as never)}
          />
          <MenuItem
            icon="people-outline"
            label="Gestion des membres"
            onPress={() => router.push('/(app)/members' as never)}
          />
          <MenuItem
            icon="calendar-outline"
            label="Exercices & Sessions"
            onPress={() => router.push('/(app)/parametres/exercices' as never)}
          />
          <MenuItem
            icon="trending-up-outline"
            label="Grille des taux d'emprunt"
            onPress={() => setGrillModal(true)}
          />
        </View>

        {/* Mon compte */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mon compte</Text>
          <MenuItem
            icon="person-outline"
            label="Mon profil"
            onPress={() => router.push('/(app)/parametres/mon-profil' as never)}
          />
        </View>

        {/* Deconnexion */}
        <View style={styles.section}>
          <MenuItem
            icon="log-out-outline"
            label="Se deconnecter"
            onPress={() => logout()}
            destructive
          />
        </View>
      </ScrollView>

      {/* ── Modal grille des taux d'emprunt ──────────────────────────────── */}
      <Modal
        visible={grillModal}
        animationType="slide"
        onRequestClose={() => setGrillModal(false)}
      >
        <SafeAreaView style={styles.modalSafe} edges={['top']}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Grille des taux d'emprunt</Text>
            <TouchableOpacity onPress={() => setGrillModal(false)} hitSlop={8} activeOpacity={0.7}>
              <Ionicons name="close" size={22} color={COLORS.gray[600]} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <BorrowingCeilingGrid />
          </ScrollView>
        </SafeAreaView>
      </Modal>
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
  profileCard: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: COLORS.white, fontSize: 18, fontWeight: '800' },
  profileName: { fontSize: 16, fontWeight: '700', color: COLORS.gray[900] },
  profileRole: { fontSize: 12, color: COLORS.primary, fontWeight: '600', marginTop: 2 },
  profileEmail: { fontSize: 12, color: COLORS.gray[500], marginTop: 2 },
  section: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.gray[500],
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
    letterSpacing: 0.5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[100],
  },
  menuLabel: { flex: 1, fontSize: 15, color: COLORS.gray[900], fontWeight: '500' },

  modalSafe: { flex: 1, backgroundColor: COLORS.gray[50] },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  modalTitle: { fontSize: 17, fontWeight: '800', color: COLORS.gray[900] },
  modalContent: {
    padding: 16,
    paddingBottom: 40,
  },
});
