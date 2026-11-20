import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, PIN_LENGTH } from '@/src/constants';
import { savePIN, verifyPIN, hasPIN } from '@/src/hooks/usePIN';
import { useForgotPIN } from '@/src/hooks/useAuth';

type Mode = 'loading' | 'create' | 'confirm' | 'verify';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'];

export default function PinScreen() {
  const router = useRouter();
  const forgotPIN = useForgotPIN();

  const [mode, setMode] = useState<Mode>('loading');
  const [pin, setPin] = useState('');
  const [pinToConfirm, setPinToConfirm] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    hasPIN().then((exists) => {
      setMode(exists ? 'verify' : 'create');
    });
  }, []);

  const title =
    mode === 'create'
      ? 'Creez votre code PIN'
      : mode === 'confirm'
      ? 'Confirmez votre code PIN'
      : 'Saisissez votre code PIN';

  const subtitle =
    mode === 'create'
      ? 'Ce code securise votre acces local'
      : mode === 'confirm'
      ? 'Ressaisissez le meme code PIN'
      : 'Entrez votre code PIN pour continuer';

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

    // PIN complet
    if (mode === 'create') {
      setPinToConfirm(newPin);
      setPin('');
      setMode('confirm');
      return;
    }

    if (mode === 'confirm') {
      if (newPin === pinToConfirm) {
        await savePIN(newPin);
        router.replace('/(app)/dashboard' as never);
      } else {
        setError('Les codes PIN ne correspondent pas. Reessayez.');
        setPin('');
        setPinToConfirm('');
        setMode('create');
      }
      return;
    }

    if (mode === 'verify') {
      const ok = await verifyPIN(newPin);
      if (ok) {
        router.replace('/(app)/dashboard' as never);
      } else {
        setError('Code PIN incorrect. Reessayez.');
        setPin('');
      }
    }
  };

  const handleForgot = () => {
    Alert.alert(
      'Code PIN oublie',
      'Vous allez etre deconnecte et devrez vous reconnecter pour creer un nouveau PIN.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          style: 'destructive',
          onPress: forgotPIN,
        },
      ]
    );
  };

  if (mode === 'loading') {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>M</Text>
        </View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>

      <View style={styles.dotsContainer}>
        {Array.from({ length: PIN_LENGTH }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i < pin.length ? styles.dotFilled : styles.dotEmpty,
            ]}
          />
        ))}
      </View>

      {!!error && <Text style={styles.error}>{error}</Text>}

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

      {mode === 'verify' && (
        <TouchableOpacity onPress={handleForgot} style={styles.forgotBtn}>
          <Text style={styles.forgotText}>Code PIN oublie ?</Text>
        </TouchableOpacity>
      )}
    </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
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
  logoContainer: {
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
  dotsContainer: { flexDirection: 'row', gap: 16 },
  dot: { width: 16, height: 16, borderRadius: 8 },
  dotFilled: { backgroundColor: COLORS.primary },
  dotEmpty: { backgroundColor: COLORS.gray[300] },
  error: { color: COLORS.error, fontSize: 13, textAlign: 'center', fontWeight: '500' },
  keypad: {
    // 3 touches × 72 + 2 espacements × 12 = 240 → toujours 3 colonnes
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
