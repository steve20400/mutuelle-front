import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useInfiniteMembers, useRegisterMember } from '@/src/hooks/useMembers';
import { useContextStore } from '@/src/store/contextStore';
import { COLORS } from '@/src/constants';
import { formatFullName, formatInitials, formatCurrency } from '@/src/utils/format';
import { canCreateMember } from '@/src/navigation/roles';
import type { MemberResponseDTO, MutuelleStatus, BackendRole } from '@/src/types';

const PAGE_SIZE = 8;

// ─── Configuration des statuts ────────────────────────────────────────────────

type StatusCfg = { bg: string; text: string; label: string };

const STATUS_CONFIG: Record<MutuelleStatus, StatusCfg> = {
  ACTIF:      { bg: COLORS.success, text: COLORS.white, label: 'ACTIF' },
  INSOLVABLE: { bg: COLORS.warning, text: COLORS.white, label: 'INSOLVABLE' },
  INACTIF:    { bg: COLORS.error,   text: COLORS.white, label: 'INACTIF' },
};

// ─── Skeleton loader ─────────────────────────────────────────────────────────

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

function MemberSkeletonRow() {
  return (
    <View style={skStyles.row}>
      <SkeletonBlock style={skStyles.avatar} />
      <View style={skStyles.info}>
        <SkeletonBlock style={skStyles.name} />
        <SkeletonBlock style={skStyles.meta} />
      </View>
      <View style={skStyles.right}>
        <SkeletonBlock style={skStyles.badge} />
        <SkeletonBlock style={skStyles.amount} />
      </View>
    </View>
  );
}

function MemberSkeleton() {
  return (
    <View style={skStyles.container}>
      {Array.from({ length: PAGE_SIZE }).map((_, i) => (
        <MemberSkeletonRow key={i} />
      ))}
    </View>
  );
}

const skStyles = StyleSheet.create({
  container: { paddingHorizontal: 12, paddingTop: 8, gap: 8 },
  row: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    elevation: 1,
  },
  avatar:  { width: 46, height: 46, borderRadius: 13, backgroundColor: COLORS.gray[200] },
  info:    { flex: 1, gap: 8 },
  name:    { height: 13, width: '55%', borderRadius: 6, backgroundColor: COLORS.gray[200] },
  meta:    { height: 11, width: '30%', borderRadius: 6, backgroundColor: COLORS.gray[200] },
  right:   { alignItems: 'flex-end', gap: 8 },
  badge:   { height: 18, width: 52, borderRadius: 9, backgroundColor: COLORS.gray[200] },
  amount:  { height: 11, width: 60, borderRadius: 6, backgroundColor: COLORS.gray[200] },
});

// ─── Footer "Charger plus" ────────────────────────────────────────────────────

function LoadMoreFooter({
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
}: {
  hasNextPage: boolean | undefined;
  isFetchingNextPage: boolean;
  onLoadMore: () => void;
}) {
  if (isFetchingNextPage) {
    return (
      <View style={styles.footerLoading}>
        <ActivityIndicator size="small" color={COLORS.primary} />
      </View>
    );
  }
  if (!hasNextPage) return null;
  return (
    <TouchableOpacity style={styles.footerBtn} onPress={onLoadMore} activeOpacity={0.7}>
      <Text style={styles.footerBtnText}>Charger plus</Text>
      <Ionicons name="chevron-down" size={14} color={COLORS.primary} />
    </TouchableOpacity>
  );
}

// ─── Ligne membre ─────────────────────────────────────────────────────────────

function MemberRow({
  member,
  onPress,
}: {
  member: MemberResponseDTO;
  onPress: () => void;
}) {
  const statusCfg: StatusCfg = STATUS_CONFIG[member.status] ?? STATUS_CONFIG.INACTIF;

  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {formatInitials(member.firstname, member.lastname)}
        </Text>
      </View>

      <View style={styles.rowInfo}>
        <Text style={styles.rowName} numberOfLines={1}>
          {formatFullName(member.firstname, member.lastname)}
        </Text>
        <Text style={styles.rowMeta}>N°{member.id}</Text>
      </View>

      <View style={styles.rowRight}>
        <View style={[styles.badge, { backgroundColor: statusCfg.bg }]}>
          <Text style={[styles.badgeText, { color: statusCfg.text }]}>
            {statusCfg.label}
          </Text>
        </View>
        <Text style={styles.rowAmount}>{formatCurrency(member.savingAmount ?? 0)}</Text>
        <View style={styles.detailLink}>
          <Text style={styles.detailLinkText}>Voir détail</Text>
          <Ionicons name="chevron-forward" size={11} color={COLORS.primary} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── Modal inscription membre ─────────────────────────────────────────────────

const EMPTY_FORM = { firstname: '', lastname: '', phone: '', email: '', password: '' };

function RegisterModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [showPwd, setShowPwd] = useState(false);
  const { mutate: register, isPending } = useRegisterMember();

  useEffect(() => {
    if (visible) { setForm(EMPTY_FORM); setShowPwd(false); }
  }, [visible]);

  const set = (k: keyof typeof EMPTY_FORM) => (v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const canSubmit =
    form.firstname.trim() &&
    form.lastname.trim() &&
    form.phone.trim() &&
    form.email.trim() &&
    form.password.length >= 6 &&
    !isPending;

  const handleSubmit = () => {
    register(
      {
        firstname: form.firstname.trim(),
        lastname:  form.lastname.trim(),
        phone:     form.phone.trim(),
        email:     form.email.trim(),
        password:  form.password,
      },
      { onSuccess: onClose }
    );
  };

  const handleClose = () => {
    if (isPending) return;
    if (Object.values(form).some(Boolean)) {
      Alert.alert(
        'Abandonner ?',
        'Les informations saisies seront perdues.',
        [
          { text: 'Continuer', style: 'cancel' },
          { text: 'Abandonner', style: 'destructive', onPress: onClose },
        ]
      );
    } else {
      onClose();
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={regStyles.overlay}
      >
        <View style={regStyles.sheet}>
          {/* Header */}
          <View style={regStyles.header}>
            <View>
              <Text style={regStyles.title}>Inscrire un membre</Text>
              <Text style={regStyles.subtitle}>Tous les champs sont requis sauf indication</Text>
            </View>
            <TouchableOpacity onPress={handleClose} hitSlop={8}>
              <Ionicons name="close" size={22} color={COLORS.gray[600]} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <View style={regStyles.fields}>
              {/* Prénom / Nom côte à côte */}
              <View style={regStyles.row2}>
                <View style={regStyles.fieldHalf}>
                  <Text style={regStyles.label}>Prénom *</Text>
                  <TextInput
                    style={regStyles.input}
                    value={form.firstname}
                    onChangeText={set('firstname')}
                    placeholder="Jean"
                    placeholderTextColor={COLORS.gray[400]}
                    autoCapitalize="words"
                  />
                </View>
                <View style={regStyles.fieldHalf}>
                  <Text style={regStyles.label}>Nom *</Text>
                  <TextInput
                    style={regStyles.input}
                    value={form.lastname}
                    onChangeText={set('lastname')}
                    placeholder="Dupont"
                    placeholderTextColor={COLORS.gray[400]}
                    autoCapitalize="words"
                  />
                </View>
              </View>

              {/* Téléphone */}
              <View style={regStyles.field}>
                <Text style={regStyles.label}>Téléphone *</Text>
                <TextInput
                  style={regStyles.input}
                  value={form.phone}
                  onChangeText={set('phone')}
                  placeholder="+237 6XX XXX XXX"
                  placeholderTextColor={COLORS.gray[400]}
                  keyboardType="phone-pad"
                />
              </View>

              {/* Email */}
              <View style={regStyles.field}>
                <Text style={regStyles.label}>Email *</Text>
                <TextInput
                  style={regStyles.input}
                  value={form.email}
                  onChangeText={set('email')}
                  placeholder="jean@exemple.com"
                  placeholderTextColor={COLORS.gray[400]}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              {/* Mot de passe */}
              <View style={regStyles.field}>
                <Text style={regStyles.label}>Mot de passe * (min. 6 car.)</Text>
                <View style={regStyles.pwdRow}>
                  <TextInput
                    style={[regStyles.input, regStyles.pwdInput]}
                    value={form.password}
                    onChangeText={set('password')}
                    placeholder="••••••••"
                    placeholderTextColor={COLORS.gray[400]}
                    secureTextEntry={!showPwd}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    style={regStyles.eyeBtn}
                    onPress={() => setShowPwd((v) => !v)}
                    hitSlop={8}
                  >
                    <Ionicons
                      name={showPwd ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color={COLORS.gray[500]}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </ScrollView>

          {/* Bouton soumettre */}
          <TouchableOpacity
            style={[regStyles.btn, !canSubmit && regStyles.btnDisabled]}
            onPress={handleSubmit}
            disabled={!canSubmit}
            activeOpacity={0.8}
          >
            {isPending
              ? <ActivityIndicator size="small" color={COLORS.white} />
              : <Text style={regStyles.btnText}>Inscrire le membre</Text>
            }
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const regStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '90%',
    gap: 16,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  title:    { fontSize: 18, fontWeight: '800', color: COLORS.gray[900] },
  subtitle: { fontSize: 12, color: COLORS.gray[400], marginTop: 2 },
  fields: { gap: 14 },
  row2:   { flexDirection: 'row', gap: 10 },
  field:  { gap: 6 },
  fieldHalf: { flex: 1, gap: 6 },
  label:  { fontSize: 13, fontWeight: '600', color: COLORS.gray[700] },
  input: {
    borderWidth: 1.5,
    borderColor: COLORS.gray[200],
    borderRadius: 10,
    paddingVertical: 11,
    paddingHorizontal: 12,
    fontSize: 15,
    color: COLORS.gray[900],
    backgroundColor: COLORS.gray[50],
  },
  pwdRow:  { flexDirection: 'row', alignItems: 'center' },
  pwdInput: { flex: 1 },
  eyeBtn: {
    position: 'absolute',
    right: 12,
    height: '100%',
    justifyContent: 'center',
  },
  btn: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 4,
  },
  btnDisabled: { opacity: 0.45 },
  btnText: { color: COLORS.white, fontSize: 15, fontWeight: '700' },
});

// ─── Écran ────────────────────────────────────────────────────────────────────

export default function MembersScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [showRegister, setShowRegister] = useState(false);
  const role = useContextStore((s) => s.context?.role ?? null) as BackendRole | null;
  const canCreate = canCreateMember(role);

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
    isError,
    isFetching,
  } = useInfiniteMembers({ search: search || undefined, size: PAGE_SIZE });

  const members = useMemo(
    () => data?.pages.flatMap((p) => p.items) ?? [],
    [data]
  );
  const totalElements = data?.pages[0]?.totalElements;
  const isRefreshing = isFetching && !isLoading && !isFetchingNextPage;
  const isInitialLoad = isLoading && members.length === 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Membres</Text>
          {totalElements !== undefined && (
            <Text style={styles.subtitle}>{totalElements} inscrit(s)</Text>
          )}
        </View>
        {canCreate && (
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => setShowRegister(true)}
          >
            <Ionicons name="person-add-outline" size={20} color={COLORS.white} />
          </TouchableOpacity>
        )}
      </View>

      {/* Barre de recherche */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={18} color={COLORS.gray[400]} />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher un membre..."
          placeholderTextColor={COLORS.gray[400]}
          value={search}
          onChangeText={setSearch}
        />
        {!!search && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color={COLORS.gray[400]} />
          </TouchableOpacity>
        )}
      </View>

      {/* Skeleton au premier chargement */}
      {isInitialLoad ? (
        <MemberSkeleton />
      ) : (
        <FlatList
          data={members}
          keyExtractor={(m) => String(m.id)}
          renderItem={({ item }) => (
            <MemberRow
              member={item}
              onPress={() => router.push(`/(app)/members/${item.id}` as never)}
            />
          )}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={refetch}
              tintColor={COLORS.primary}
              colors={[COLORS.primary]}
            />
          }
          ListFooterComponent={
            <LoadMoreFooter
              hasNextPage={hasNextPage}
              isFetchingNextPage={isFetchingNextPage}
              onLoadMore={fetchNextPage}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons
                name={isError ? 'alert-circle-outline' : 'people-outline'}
                size={48}
                color={isError ? COLORS.error : COLORS.gray[300]}
              />
              <Text style={styles.emptyText}>
                {isError
                  ? 'Erreur de chargement — vérifiez votre connexion'
                  : 'Aucun membre trouvé'}
              </Text>
            </View>
          }
        />
      )}

      <RegisterModal visible={showRegister} onClose={() => setShowRegister(false)} />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.gray[50] },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  title: { fontSize: 20, fontWeight: '800', color: COLORS.gray[900] },
  subtitle: { fontSize: 12, color: COLORS.gray[400], marginTop: 2 },
  addBtn: {
    backgroundColor: COLORS.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },

  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    margin: 12,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
  },
  searchInput: { flex: 1, fontSize: 15, color: COLORS.gray[900] },

  list: { paddingHorizontal: 12, paddingBottom: 24, gap: 8 },

  row: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: COLORS.gray[100],
  },

  avatar: {
    width: 46,
    height: 46,
    borderRadius: 13,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: { color: COLORS.white, fontSize: 15, fontWeight: '700' },

  rowInfo: { flex: 1, gap: 3, minWidth: 0 },
  rowName: { fontSize: 14, fontWeight: '700', color: COLORS.gray[900] },
  rowMeta: { fontSize: 12, color: COLORS.gray[500] },

  rowRight: { alignItems: 'flex-end', gap: 5 },

  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  badgeText: { fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },

  rowAmount: { fontSize: 12, fontWeight: '700', color: COLORS.gray[800] },

  detailLink: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  detailLinkText: { fontSize: 11, fontWeight: '600', color: COLORS.primary },

  footerLoading: { padding: 16, alignItems: 'center' },
  footerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: 16,
    marginBottom: 8,
  },
  footerBtnText: { fontSize: 14, fontWeight: '600', color: COLORS.primary },

  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    gap: 12,
  },
  emptyText: { fontSize: 15, color: COLORS.gray[500] },
});
