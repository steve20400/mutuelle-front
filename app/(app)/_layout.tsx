import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ALL_TABS } from '@/src/navigation/tabConfig';
import { CustomTabBar } from '@/src/components/common/CustomTabBar';
import { LockScreen } from '@/src/components/common/LockScreen';
import { useAuthStore } from '@/src/store/authStore';
import { useAppLock } from '@/src/hooks/useAppLock';

function TabIcon({
  name,
  focused,
  color,
  size,
}: {
  name: string;
  focused: boolean;
  color: string;
  size: number;
}) {
  const tab = ALL_TABS.find((t) => t.name === name);
  if (!tab) return null;
  const icon = focused ? tab.iconNameFocused : tab.iconName;
  return <Ionicons name={icon as never} size={size} color={color} />;
}

export default function AppLayout() {
  useAppLock();
  const isLocked = useAuthStore((s) => s.isLocked);

  return (
    <>
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      {/* Accueil */}
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Accueil',
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon name="dashboard" focused={focused} color={color} size={size} />
          ),
        }}
      />

      {/* Admin / Président / Trésorier */}
      <Tabs.Screen
        name="assistances"
        options={{
          title: 'Assistance',
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon name="assistances" focused={focused} color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="renfoulement"
        options={{
          title: 'Renflouement',
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon name="renfoulement" focused={focused} color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="parametres"
        options={{
          title: 'Parametres',
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon name="parametres" focused={focused} color={color} size={size} />
          ),
        }}
      />

      {/* Membre */}
      <Tabs.Screen
        name="mes-finances"
        options={{
          title: 'Mes finances',
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon name="mes-finances" focused={focused} color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="historique"
        options={{
          title: 'Historique',
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon name="historique" focused={focused} color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="mon-compte"
        options={{
          title: 'Mon compte',
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon name="mon-compte" focused={focused} color={color} size={size} />
          ),
        }}
      />

      {/* Assistant IA */}
      <Tabs.Screen
        name="chatbot"
        options={{
          title: 'Assistant',
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon name="chatbot" focused={focused} color={color} size={size} />
          ),
        }}
      />

      {/* Écrans hors tab bar — déclarés pour qu'Expo Router les connaisse */}
      <Tabs.Screen name="bilan"           options={{ title: 'Bilans', headerShown: false }} />
      <Tabs.Screen name="mon-bilan"       options={{ title: 'Mes Bilans', headerShown: false }} />
      <Tabs.Screen name="members"         options={{ title: 'Membres' }} />
      <Tabs.Screen name="cotisations"     options={{ title: 'Cotisations' }} />
      <Tabs.Screen name="tresorerie"      options={{ title: 'Tresorerie' }} />
      <Tabs.Screen name="mes-cotisations" options={{ title: 'Mes cotisations' }} />
      <Tabs.Screen name="mes-assistances" options={{ title: 'Mes assistances' }} />
      <Tabs.Screen name="profil"          options={{ title: 'Profil' }} />
    </Tabs>
    <LockScreen visible={isLocked} />
    </>
  );
}
