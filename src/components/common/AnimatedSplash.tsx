import React, { useEffect, useRef } from 'react';
import { Animated, View, Text, StyleSheet } from 'react-native';
import { COLORS } from '@/src/constants';

interface Props {
  onDone: () => void;
}

export function AnimatedSplash({ onDone }: Props) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.8)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        damping: 12,
        stiffness: 100,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setTimeout(() => {
        Animated.timing(opacity, {
          toValue: 0,
          duration: 350,
          useNativeDriver: true,
        }).start(() => onDone());
      }, 1200);
    });
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity }]}>
      <Animated.View style={[styles.content, { transform: [{ scale }] }]}>
        {/* Logo M */}
        <View style={styles.logoBox}>
          <Text style={styles.logoLetter}>M</Text>
        </View>

        {/* Nom */}
        <Text style={styles.appName}>Mutuelle</Text>
        <Text style={styles.appSub}>ENSPY</Text>

        {/* Séparateur */}
        <View style={styles.divider} />

        <Text style={styles.tagline}>Gestion de la mutuelle</Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  content: { alignItems: 'center', gap: 10 },

  logoBox: {
    width: 96,
    height: 96,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  logoLetter: {
    color: COLORS.white,
    fontSize: 48,
    fontWeight: '800',
  },

  appName: {
    fontSize: 30,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: 1,
  },
  appSub: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.50)',
    letterSpacing: 6,
    textTransform: 'uppercase',
  },

  divider: {
    width: 40,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.20)',
    borderRadius: 1,
    marginVertical: 6,
  },

  tagline: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.45)',
    letterSpacing: 0.5,
  },
});
