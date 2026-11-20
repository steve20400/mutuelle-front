import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useMutuelleConfig, useContextStore } from '@/src/store/contextStore';
import { useUpdateConfig } from '@/src/hooks/useConfig';
import { isAdmin } from '@/src/navigation/roles';
import { COLORS } from '@/src/constants';
import { formatCurrency, formatDate } from '@/src/utils/format';
import type { BackendRole, ConfigMutuelleRequestDto } from '@/src/types';

// ─── Mode lecture ─────────────────────────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

// ─── Champ éditable ───────────────────────────────────────────────────────────

function EditField({
  label,
  value,
  onChange,
  suffix,
  isInteger,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  suffix?: string;
  isInteger?: boolean;
}) {
  return (
    <View style={styles.fieldWrapper}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.fieldRow}>
        <TextInput
          style={styles.fieldInput}
          value={value}
          onChangeText={onChange}
          keyboardType={isInteger ? 'number-pad' : 'decimal-pad'}
          placeholderTextColor={COLORS.gray[400]}
        />
        {suffix && <Text style={styles.fieldSuffix}>{suffix}</Text>}
      </View>
    </View>
  );
}

// ─── Écran principal ──────────────────────────────────────────────────────────

export default function ConfigScreen() {
  const router = useRouter();
  const config = useMutuelleConfig();
  const role = useContextStore((s) => s.context?.role ?? null) as BackendRole | null;
  const canEdit = isAdmin(role);

  const { mutate: update, isPending } = useUpdateConfig();

  // Formulaire (uniquement utilisé si canEdit)
  const [registrationFee, setRegistrationFee] = useState('');
  const [solidarityFee, setSolidarityFee] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [penaltyFixed, setPenaltyFixed] = useState('');
  const [penaltyThreshold, setPenaltyThreshold] = useState('');
  const [insolvencyThreshold, setInsolvencyThreshold] = useState('');

  // Initialiser le formulaire avec les valeurs courantes
  useEffect(() => {
    if (config && canEdit) {
      setRegistrationFee(String(config.registrationFeeAmount));
      setSolidarityFee(String(config.solidarityFeeAmount));
      setInterestRate(String(config.loanInterestRatePercent));
      setPenaltyFixed(String(config.loanPenaltyFixedAmount));
      setPenaltyThreshold(String(config.loanPenaltySessionThreshold));
      setInsolvencyThreshold(String(config.insolvencyThreshold));
    }
  }, [config, canEdit]);

  const handleSave = () => {
    const payload: ConfigMutuelleRequestDto = {
      registrationFeeAmount: parseFloat(registrationFee) || undefined,
      solidarityFeeAmount: parseFloat(solidarityFee) || undefined,
      loanInterestRatePercent: parseFloat(interestRate) || undefined,
      loanPenaltyFixedAmount: parseFloat(penaltyFixed) || undefined,
      loanPenaltySessionThreshold: parseInt(penaltyThreshold, 10) || undefined,
      insolvencyThreshold: parseFloat(insolvencyThreshold) || undefined,
    };

    Alert.alert(
      'Confirmer la modification',
      'Voulez-vous enregistrer ces modifications ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Enregistrer',
          onPress: () => update(payload),
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Ionicons name="arrow-back" size={22} color={COLORS.gray[900]} />
        </TouchableOpacity>
        <Text style={styles.title}>Configuration mutuelle</Text>
        {canEdit && (
          <View style={styles.adminBadge}>
            <Text style={styles.adminBadgeText}>Secretaire</Text>
          </View>
        )}
      </View>

      {!config ? (
        <View style={styles.center}>
          <Ionicons name="settings-outline" size={48} color={COLORS.gray[300]} />
          <Text style={styles.emptyText}>Configuration non disponible</Text>
        </View>
      ) : canEdit ? (
        // ── MODE ÉDITION (Secrétaire) ─────────────────────────────────────
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Frais et cotisations</Text>
            <EditField
              label="Frais inscription (FCFA)"
              value={registrationFee}
              onChange={setRegistrationFee}
            />
            <EditField
              label="Frais solidarite (FCFA)"
              value={solidarityFee}
              onChange={setSolidarityFee}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Emprunts</Text>
            <EditField
              label="Taux interet (%)"
              value={interestRate}
              onChange={setInterestRate}
              suffix="%"
            />
            <EditField
              label="Penalite fixe (FCFA)"
              value={penaltyFixed}
              onChange={setPenaltyFixed}
            />
            <EditField
              label="Seuil penalite (nombre de sessions)"
              value={penaltyThreshold}
              onChange={setPenaltyThreshold}
              isInteger
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Seuils</Text>
            <EditField
              label="Seuil insolvabilite (FCFA)"
              value={insolvencyThreshold}
              onChange={setInsolvencyThreshold}
            />
          </View>

          <View style={styles.metaSection}>
            <Text style={styles.metaText}>
              Derniere mise a jour : {formatDate(config.updatedAt)} par {config.updatedBy}
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.saveBtn, isPending && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={isPending}
            activeOpacity={0.8}
          >
            {isPending ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <>
                <Ionicons name="save-outline" size={18} color={COLORS.white} />
                <Text style={styles.saveBtnText}>Enregistrer les modifications</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      ) : (
        // ── MODE LECTURE (Président / Trésorier) ──────────────────────────
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.readonlyBanner}>
            <Ionicons name="eye-outline" size={16} color={COLORS.info} />
            <Text style={styles.readonlyText}>Consultation uniquement</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Frais et cotisations</Text>
            <InfoRow label="Frais inscription" value={formatCurrency(config.registrationFeeAmount)} />
            <InfoRow label="Frais solidarite" value={formatCurrency(config.solidarityFeeAmount)} />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Emprunts</Text>
            <InfoRow label="Taux interet" value={`${config.loanInterestRatePercent}%`} />
            <InfoRow label="Penalite fixe" value={formatCurrency(config.loanPenaltyFixedAmount)} />
            <InfoRow label="Seuil penalite (sessions)" value={String(config.loanPenaltySessionThreshold)} />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Seuils</Text>
            <InfoRow label="Seuil insolvabilite" value={formatCurrency(config.insolvencyThreshold)} />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Meta</Text>
            <InfoRow label="Derniere mise a jour" value={formatDate(config.updatedAt)} />
            <InfoRow label="Mis a jour par" value={config.updatedBy} />
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.gray[50] },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  back: { padding: 4 },
  title: { flex: 1, fontSize: 18, fontWeight: '700', color: COLORS.gray[900] },
  adminBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
  },
  adminBadgeText: { fontSize: 11, fontWeight: '700', color: COLORS.info },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyText: { fontSize: 15, color: COLORS.gray[400] },

  content: { padding: 16, gap: 16, paddingBottom: 40 },

  // Lecture seule
  readonlyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    padding: 12,
  },
  readonlyText: { fontSize: 13, color: COLORS.info, fontWeight: '600' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between' },
  infoLabel: { fontSize: 13, color: COLORS.gray[500] },
  infoValue: { fontSize: 13, fontWeight: '700', color: COLORS.gray[900] },

  // Section commune
  section: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 16,
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: COLORS.gray[500], letterSpacing: 0.5 },

  // Édition
  fieldWrapper: { gap: 6 },
  fieldLabel: { fontSize: 13, color: COLORS.gray[700], fontWeight: '500' },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.gray[300],
    borderRadius: 10,
    backgroundColor: COLORS.white,
    overflow: 'hidden',
  },
  fieldInput: {
    flex: 1,
    paddingVertical: 11,
    paddingHorizontal: 12,
    fontSize: 15,
    color: COLORS.gray[900],
  },
  fieldSuffix: {
    paddingHorizontal: 12,
    fontSize: 14,
    color: COLORS.gray[500],
    fontWeight: '600',
  },

  metaSection: {
    paddingHorizontal: 4,
  },
  metaText: { fontSize: 12, color: COLORS.gray[400], textAlign: 'center' },

  saveBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: COLORS.white, fontSize: 15, fontWeight: '700' },
});
