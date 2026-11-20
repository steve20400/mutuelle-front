import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, PIN_LENGTH } from '@/src/constants';
import { verifyPIN } from '@/src/hooks/usePIN';
import { useAuthStore } from '@/src/store/authStore';
import { useForgotPIN } from '@/src/hooks/useAuth';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'];

interface LockScreenProps {
  visible: boolean;
}

export function LockScreen({ visible }: LockScreenProps) {
  const unlock = useAuthStore((s) => s.unlock);
  const forgotPIN = useForgotPIN();

  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  // Reset state each time the lock activates
  useEffect(() => {
    if (visible) {
      setPin('');
      setError('');
    }
  }, [visible]);

  const handleKey = async (key: string) => {
    setError('');

    if (key === 'del') {
      setPin((p) => p.slice(0, -1));
      return;
    }

    if (!key) return;

    const newPin = pin + key;
    setPin(newPin);

    if (newPin.length < PIN_LENGTH) return;

    const ok = await verifyPIN(newPin);
    if (ok) {
      unlock();
    } else {
      setError('Code PIN incorrect. Reessayez.');
      setPin('');
    }
  };

  const handleForgot = () => {
    Alert.alert(
      'Code PIN oublie',
      'Vous allez etre deconnecte et devrez vous reconnecter pour creer un nouveau PIN.',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Confirmer', style: 'destructive', onPress: forgotPIN },
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      statusBarTranslucent
      // Prevent Android hardware back from dismissing the lock
      onRequestClose={() => {}}
    >
      <StatusBar backgroundColor={COLORS.gray[50]} barStyle="dark-content" />
      <View style={styles.screen}>
      <View style={styles.container}>
        {/* Logo */}
        <View style={styles.header}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>M</Text>
          </View>
          <Text style={styles.title}>Application verrouilee</Text>
          <Text style={styles.subtitle}>Entrez votre code PIN pour continuer</Text>
        </View>

        {/* PIN dots */}
        <View style={styles.dots}>
          {Array.from({ length: PIN_LENGTH }).map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i < pin.length ? styles.dotFilled : styles.dotEmpty]}
            />
          ))}
        </View>

        {!!error && <Text style={styles.error}>{error}</Text>}

        {/* Keypad */}
        <View style={styles.keypad}>
          {KEYS.map((key, i) => {
            if (key === '') return <View key={i} style={styles.keyEmpty} />;

            if (key === 'del') {
              return (
                <TouchableOpacity
                  key={i}
                  style={styles.key}
                  onPress={() => handleKey('del')}
                  activeOpacity={0.7}
                >
                  <Ionicons name="backspace-outline" size={24} color={COLORS.gray[700]} />
                </TouchableOpacity>
              );
            }

            return (
              <TouchableOpacity
                key={i}
                style={styles.key}
                onPress={() => handleKey(key)}
                activeOpacity={0.7}
              >
                <Text style={styles.keyText}>{key}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Forgot PIN */}
        <TouchableOpacity onPress={handleForgot} style={styles.forgotBtn}>
          <Text style={styles.forgotText}>Code PIN oublie ?</Text>
        </TouchableOpacity>
      </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.gray[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    padding: 32,
    gap: 32,
  },
  header: { alignItems: 'center', gap: 8 },
  logo: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  logoText: { color: COLORS.white, fontSize: 28, fontWeight: '800' },
  title: { fontSize: 20, fontWeight: '700', color: COLORS.gray[900], textAlign: 'center' },
  subtitle: { fontSize: 14, color: COLORS.gray[500], textAlign: 'center' },
  dots: { flexDirection: 'row', gap: 16 },
  dot: { width: 16, height: 16, borderRadius: 8 },
  dotFilled: { backgroundColor: COLORS.primary },
  dotEmpty: { backgroundColor: COLORS.gray[300] },
  error: { color: COLORS.error, fontSize: 13, textAlign: 'center', fontWeight: '500' },
  keypad: {
    width: 240,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },
  key: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  keyEmpty: { width: 72, height: 72 },
  keyText: { fontSize: 22, fontWeight: '600', color: COLORS.gray[900] },
  forgotBtn: { marginTop: 8 },
  forgotText: { color: COLORS.primary, fontSize: 14, fontWeight: '600' },
});
