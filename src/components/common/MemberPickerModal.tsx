import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useInfiniteMembers } from '@/src/hooks/useMembers';
import { formatFullName, formatInitials } from '@/src/utils/format';
import { COLORS } from '@/src/constants';
import type { MemberResponseDTO } from '@/src/types';

interface MemberPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (member: MemberResponseDTO) => void;
  title?: string;
}

export function MemberPickerModal({ visible, onClose, onSelect, title = 'Sélectionner un membre' }: MemberPickerModalProps) {
  const [search, setSearch] = useState('');

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteMembers({ search: search || undefined, size: 10 });

  const members = useMemo(
    () => data?.pages.flatMap((p) => p.items) ?? [],
    [data]
  );

  const handleSelect = (member: MemberResponseDTO) => {
    onSelect(member);
    onClose();
    setSearch('');
  };

  const handleClose = () => {
    setSearch('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
      <SafeAreaView style={st.safe}>
        {/* Header */}
        <View style={st.header}>
          <TouchableOpacity onPress={handleClose} style={st.closeBtn} activeOpacity={0.7}>
            <Ionicons name="close" size={22} color={COLORS.gray[700]} />
          </TouchableOpacity>
          <Text style={st.title}>{title}</Text>
          <View style={st.closeBtn} />
        </View>

        {/* Barre de recherche */}
        <View style={st.searchBar}>
          <Ionicons name="search-outline" size={18} color={COLORS.gray[400]} />
          <TextInput
            style={st.searchInput}
            placeholder="Rechercher un membre..."
            placeholderTextColor={COLORS.gray[400]}
            value={search}
            onChangeText={setSearch}
            autoCorrect={false}
            returnKeyType="search"
          />
          {!!search && (
            <TouchableOpacity onPress={() => setSearch('')} activeOpacity={0.7}>
              <Ionicons name="close-circle" size={18} color={COLORS.gray[400]} />
            </TouchableOpacity>
          )}
        </View>

        {/* Liste */}
        {isLoading && members.length === 0 ? (
          <View style={st.center}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : members.length === 0 ? (
          <View style={st.center}>
            <Ionicons name="people-outline" size={40} color={COLORS.gray[300]} />
            <Text style={st.emptyText}>Aucun membre trouvé</Text>
          </View>
        ) : (
          <FlatList
            data={members}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={st.listContent}
            keyboardShouldPersistTaps="handled"
            onEndReachedThreshold={0.4}
            onEndReached={() => { if (hasNextPage && !isFetchingNextPage) fetchNextPage(); }}
            ListFooterComponent={isFetchingNextPage ? <ActivityIndicator color={COLORS.primary} style={st.footer} /> : null}
            renderItem={({ item }) => {
              const initials = formatInitials(item.firstname, item.lastname);
              const fullName = formatFullName(item.firstname, item.lastname);
              return (
                <TouchableOpacity
                  style={st.row}
                  onPress={() => handleSelect(item)}
                  activeOpacity={0.7}
                >
                  <View style={st.avatar}>
                    <Text style={st.avatarText}>{initials}</Text>
                  </View>
                  <Text style={st.rowName}>{fullName}</Text>
                  <Ionicons name="chevron-forward" size={16} color={COLORS.gray[400]} />
                </TouchableOpacity>
              );
            }}
          />
        )}
      </SafeAreaView>
    </Modal>
  );
}

const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.gray[50] },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  closeBtn: { width: 32, alignItems: 'flex-start' },
  title: { flex: 1, fontSize: 17, fontWeight: '800', color: COLORS.gray[900], textAlign: 'center' },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    margin: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
  },
  searchInput: { flex: 1, fontSize: 15, color: COLORS.gray[900] },

  listContent: { paddingHorizontal: 12, paddingBottom: 24 },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 8,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 14, fontWeight: '800', color: COLORS.primary },
  rowName: { flex: 1, fontSize: 15, fontWeight: '600', color: COLORS.gray[900] },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  emptyText: { fontSize: 14, color: COLORS.gray[400] },
  footer: { paddingVertical: 16 },
});
