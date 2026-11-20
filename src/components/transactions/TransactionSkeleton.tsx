import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { COLORS } from '@/src/constants';

// Single animated block — reusable for any skeleton shape
function SkeletonBlock({ style }: { style: object }) {
  const opacity = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.85, duration: 650, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.35, duration: 650, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [opacity]);

  return <Animated.View style={[style, { opacity }]} />;
}

function SkeletonRow() {
  return (
    <View style={styles.row}>
      <SkeletonBlock style={styles.icon} />
      <View style={styles.content}>
        <SkeletonBlock style={styles.titleLine} />
        <SkeletonBlock style={styles.subLine} />
      </View>
      <SkeletonBlock style={styles.amount} />
    </View>
  );
}

interface TransactionSkeletonProps {
  count?: number;
}

export function TransactionSkeleton({ count = 7 }: TransactionSkeletonProps) {
  return (
    <View style={styles.container}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonRow key={i} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 12, gap: 8 },
  row: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    elevation: 1,
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.gray[200],
  },
  content: { flex: 1, gap: 8 },
  titleLine: {
    height: 13,
    width: '60%',
    borderRadius: 6,
    backgroundColor: COLORS.gray[200],
  },
  subLine: {
    height: 11,
    width: '35%',
    borderRadius: 6,
    backgroundColor: COLORS.gray[200],
  },
  amount: {
    height: 14,
    width: 72,
    borderRadius: 6,
    backgroundColor: COLORS.gray[200],
  },
});
