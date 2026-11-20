import React, { useEffect, useRef } from 'react';
import { Animated, Text, View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNetworkStore } from '@/src/store/networkStore';
import { COLORS } from '@/src/constants';

const BANNER_HEIGHT = 44;

export function NetworkBanner() {
  const isOffline = useNetworkStore((s) => s.isOffline);
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(-(BANNER_HEIGHT + insets.top))).current;

  useEffect(() => {
    Animated.spring(translateY, {
      toValue: isOffline ? 0 : -(BANNER_HEIGHT + insets.top),
      useNativeDriver: true,
      bounciness: 4,
    }).start();
  }, [isOffline, insets.top, translateY]);

  return (
    <Animated.View
      style={[
        styles.banner,
        { paddingTop: insets.top, transform: [{ translateY }] },
      ]}
      pointerEvents="none"
    >
      <View style={styles.inner}>
        <Ionicons name="wifi-outline" size={16} color={COLORS.white} />
        <Text style={styles.text}>Pas de connexion · Vérifiez votre réseau</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#DC2626',
    zIndex: 9999,
    elevation: 20,
  },
  inner: {
    height: BANNER_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
  },
  text: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '600',
  },
});
