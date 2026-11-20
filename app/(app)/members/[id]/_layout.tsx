import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Tabs, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useMember } from '@/src/hooks/useMembers';
import { useContextStore } from '@/src/store/contextStore';
import { useToast } from '@/src/store/toastStore';
import { isMember } from '@/src/navigation/roles';
import { COLORS } from '@/src/constants';
import { formatFullName } from '@/src/utils/format';
import type { BackendRole } from '@/src/types';

export default function MemberDetailLayout() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: member } = useMember(Number(id));
  const role = useContextStore((s) => s.context?.role ?? null) as BackendRole | null;
  const { error } = useToast();

  useEffect(() => {
    if (role !== null && isMember(role)) {
      error('Accès non autorisé');
      router.replace('/(app)/dashboard' as never);
    }
  }, [role]);

  if (!role || isMember(role)) return null;

  return (
    <View style={{ flex: 1 }}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Ionicons name="arrow-back" size={22} color={COLORS.white} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerName} numberOfLines={1}>
            {member ? formatFullName(member.firstname, member.lastname) : 'Membre'}
          </Text>
          {member && <Text style={styles.headerEmail}>{member.email}</Text>}
        </View> 
      </View>

      <Tabs
        initialRouteName="index"
        screenOptions={{
          headerShown: false,
          tabBarPosition: 'top',
          tabBarActiveTintColor: COLORS.primary,
          tabBarInactiveTintColor: COLORS.gray[400],
          tabBarStyle: {
            backgroundColor: COLORS.white,
            borderBottomWidth: 1,
            borderBottomColor: COLORS.gray[200],
            elevation: 0,
            shadowOpacity: 0,
          },
          tabBarIndicatorStyle: {
            backgroundColor: COLORS.primary,
            height: 2,
          },
          tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
          tabBarItemStyle: { flex: 1, paddingHorizontal: 2 },
        }}
      >
        {/* Onglets visibles */}
        <Tabs.Screen
          name="index"
          options={{
            title: 'Infos',
            tabBarIcon: ({ color }) => (
              <Ionicons name="person-outline" size={18} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="inscription"
          options={{
            title: 'Inscript.',
            tabBarIcon: ({ color }) => (
              <Ionicons name="card-outline" size={18} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="solidarite"
          options={{
            title: 'Solidarité',
            tabBarIcon: ({ color }) => (
              <Ionicons name="people-outline" size={18} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="epargne"
          options={{
            title: 'Épargne',
            tabBarIcon: ({ color }) => (
              <Ionicons name="wallet-outline" size={18} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="assistance"
          options={{
            title: 'Assist.',
            tabBarIcon: ({ color }) => (
              <Ionicons name="heart-outline" size={18} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="bilan"
          options={{
            title: 'Bilan',
            tabBarIcon: ({ color }) => (
              <Ionicons name="bar-chart-outline" size={18} color={color} />
            ),
          }}
        />

        {/* Écrans masqués de la tab bar */}
        <Tabs.Screen name="historique" options={{ href: null }} />
        <Tabs.Screen name="sanctions" options={{ href: null }} />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 14,
    paddingTop: 50,
    gap: 12,
  },
  back: { padding: 4 },
  headerContent: { flex: 1 },
  headerName: { color: COLORS.white, fontSize: 17, fontWeight: '700' },
  headerEmail: { color: COLORS.gray[400], fontSize: 12, marginTop: 2 },
  editBtn: { padding: 4 },
});
