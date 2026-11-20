import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useContextStore } from '@/src/store/contextStore';
import { getTabsForRole } from '@/src/navigation/tabConfig';
import { COLORS } from '@/src/constants';
import type { BackendRole } from '@/src/types';

export function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { bottom } = useSafeAreaInsets();
  const role = useContextStore((s) => s.context?.role ?? null) as BackendRole | null;

  // Noms des onglets autorisés pour ce rôle
  const allowedNames = new Set(getTabsForRole(role).map((t) => t.name));

  // Routes visibles uniquement
  const visibleRoutes = state.routes.filter((r) => allowedNames.has(r.name));

  return (
    <View style={[styles.bar, { paddingBottom: bottom || 10 }]}>
      {visibleRoutes.map((route) => {
        const { options } = descriptors[route.key];
        const isFocused = state.routes[state.index]?.key === route.key;

        const color = isFocused ? COLORS.primary : COLORS.gray[400];

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name, {});
          }
        };

        const iconNode = options.tabBarIcon?.({ focused: isFocused, color, size: 24 });

        return (
          <TouchableOpacity
            key={route.key}
            style={styles.tab}
            onPress={onPress}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
          >
            {iconNode}
            <Text style={[styles.label, { color }]}>
              {options.title ?? route.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[200],
    paddingTop: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingVertical: 4,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
  },
});
