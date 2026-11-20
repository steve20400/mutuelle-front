import React, { useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useInfiniteMembers } from '@/src/hooks/useMembers';
import { COLORS } from '@/src/constants';
import { formatCurrency, formatInitials } from '@/src/utils/format';
import type { MemberResponseDTO } from '@/src/types';

interface MembersAmountModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  getAmount: (member: MemberResponseDTO) => number;
}

export function MembersAmountModal({
  visible,
  onClose,
  title,
  getAmount,
}: MembersAmountModalProps) {
  const router = useRouter();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteMembers({ size: 20 });

  const members = useMemo(
    // eslint-disable-next-line react-hooks/exhaustive-deps
    () => (data?.pages.flatMap((p) => p.items) ?? []).filter((m) => getAmount(m) > 0),
    [data]
  );

  const handlePress = (id: number) => {
    onClose();
    router.push(`/(app)/members/${id}` as never);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <SafeAreaView style={s.safe} edges={['top']}>
        <View style={s.header}>
          <Text style={s.title}>{title}</Text>
          <TouchableOpacity onPress={onClose} hitSlop={8} activeOpacity={0.7}>
            <Ionicons name="close" size={22} color={COLORS.gray[600]} />
          </TouchableOpacity>
        </View>

        {isLoading && members.length === 0 ? (
          <ActivityIndicator style={s.loader} color={COLORS.primary} size="large" />
        ) : (
          <FlatList
            data={members}
            keyExtractor={(m) => String(m.id)}
            contentContainerStyle={s.list}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={s.row}
                onPress={() => handlePress(item.id)}
                activeOpacity={0.7}
              >
                <View style={s.avatar}>
                  <Text style={s.avatarText}>
                    {formatInitials(item.firstname, item.lastname)}
                  </Text>
                </View>
                <Text style={s.name} numberOfLines={1}>
                  {item.firstname} {item.lastname}
                </Text>
                <Text style={s.amount}>{formatCurrency(getAmount(item))}</Text>
                <Ionicons name="chevron-forward" size={14} color={COLORS.gray[400]} />
              </TouchableOpacity>
            )}
            onEndReached={() => { if (hasNextPage) fetchNextPage(); }}
            onEndReachedThreshold={0.3}
            ListFooterComponent={
              isFetchingNextPage
                ? <ActivityIndicator style={s.footerLoader} color={COLORS.primary} />
                : null
            }
            ListEmptyComponent={
              <View style={s.empty}>
                <Ionicons name="people-outline" size={48} color={COLORS.gray[300]} />
                <Text style={s.emptyText}>Aucun membre</Text>
              </View>
            }
          />
        )}
      </SafeAreaView>
    </Modal>
  );
}

const s = StyleSheet.create({
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
  title: { flex: 1, fontSize: 17, fontWeight: '800', color: COLORS.gray[900] },
  loader: { marginTop: 60 },
  list: { padding: 12, gap: 8, paddingBottom: 32 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: { color: COLORS.white, fontSize: 14, fontWeight: '700' },
  name: { flex: 1, fontSize: 14, fontWeight: '600', color: COLORS.gray[800] },
  amount: { fontSize: 14, fontWeight: '800', color: COLORS.primary },
  footerLoader: { padding: 16 },
  empty: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 15, color: COLORS.gray[500] },
});
