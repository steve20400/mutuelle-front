import React, { useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useChatbot } from '@/src/hooks/useChatbot';
import { ChatBubble } from '@/src/components/chatbot/ChatBubble';
import { SuggestionChips } from '@/src/components/chatbot/SuggestionChips';
import { ChatInput } from '@/src/components/chatbot/ChatInput';
import { COLORS } from '@/src/constants';
import type { ChatMessage } from '@/src/services/chatbot/types';

// ─── Loader initial ───────────────────────────────────────────────────────────

function InitLoader() {
  return (
    <View style={styles.initLoader}>
      <View style={styles.initLoaderCard}>
        <View style={styles.initAvatar}>
          <Text style={styles.initAvatarText}>M</Text>
        </View>
        <Text style={styles.initTitle}>Préparation de l'assistant…</Text>
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 8 }} />
        <Text style={styles.initSub}>
          Chargement de vos données et de la configuration de la mutuelle
        </Text>
      </View>
    </View>
  );
}

// ─── Écran ────────────────────────────────────────────────────────────────────

export default function ChatbotScreen() {
  const { messages, isLoading, isReady, error, suggestions, sendMessage, reset } = useChatbot();
  const flatListRef = useRef<FlatList<ChatMessage>>(null);

  const renderItem = useCallback(
    ({ item }: { item: ChatMessage }) => <ChatBubble message={item} />,
    []
  );

  const keyExtractor = useCallback((item: ChatMessage) => item.id, []);

  // Scroll vers le bas quand un nouveau message arrive
  const onContentSizeChange = useCallback(() => {
    flatListRef.current?.scrollToEnd({ animated: true });
  }, []);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerAvatar}>
            <Text style={styles.headerAvatarText}>M</Text>
          </View>
          <View>
            <Text style={styles.headerTitle}>Assistant ENSPY</Text>
            <View style={styles.statusRow}>
              <View style={[styles.statusDot, { backgroundColor: isReady ? COLORS.success : COLORS.gray[300] }]} />
              <Text style={styles.statusLabel}>
                {isReady ? 'En ligne' : 'Connexion…'}
              </Text>
            </View>
          </View>
        </View>
        <TouchableOpacity
          onPress={reset}
          style={styles.resetBtn}
          hitSlop={12}
          activeOpacity={0.7}
        >
          <Ionicons name="refresh-outline" size={20} color={COLORS.gray[500]} />
        </TouchableOpacity>
      </View>

      {/* Corps */}
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {!isReady && messages.length === 0 ? (
          <InitLoader />
        ) : (
          <>
            {/* Liste des messages */}
            <FlatList
              ref={flatListRef}
              data={messages}
              renderItem={renderItem}
              keyExtractor={keyExtractor}
              contentContainerStyle={styles.list}
              onContentSizeChange={onContentSizeChange}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              ListFooterComponent={
                isLoading ? (
                  <View style={styles.typingRow}>
                    <View style={styles.typingBubble}>
                      <ActivityIndicator size="small" color={COLORS.gray[400]} />
                      <Text style={styles.typingText}>L'assistant rédige…</Text>
                    </View>
                  </View>
                ) : null
              }
            />

            {/* Erreur */}
            {error && (
              <View style={styles.errorBanner}>
                <Ionicons name="warning-outline" size={14} color={COLORS.error} />
                <Text style={styles.errorText}>Erreur : {error}</Text>
              </View>
            )}

            {/* Suggestions */}
            <SuggestionChips suggestions={suggestions} onSelect={sendMessage} />

            {/* Saisie */}
            <ChatInput
              onSend={sendMessage}
              isLoading={isLoading}
              disabled={!isReady}
            />
          </>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe:  { flex: 1, backgroundColor: COLORS.gray[50] },
  flex:  { flex: 1 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatarText: { color: COLORS.white, fontSize: 16, fontWeight: '800' },
  headerTitle: { fontSize: 15, fontWeight: '700', color: COLORS.gray[900] },
  statusRow:  { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  statusDot:  { width: 7, height: 7, borderRadius: 4 },
  statusLabel: { fontSize: 11, color: COLORS.gray[500] },
  resetBtn: { padding: 6 },

  // Liste
  list: { paddingVertical: 12, paddingBottom: 4 },

  // Indicateur "en train d'écrire"
  typingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
    marginTop: 4,
    marginBottom: 8,
    gap: 8,
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.white,
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  typingText: { fontSize: 13, color: COLORS.gray[400], fontStyle: 'italic' },

  // Erreur
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginHorizontal: 12,
    marginBottom: 4,
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  errorText: { fontSize: 12, color: COLORS.error, flex: 1 },

  // Init loader
  initLoader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  initLoaderCard: {
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 32,
    gap: 8,
    width: '100%',
    maxWidth: 320,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  initAvatar: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  initAvatarText: { color: COLORS.white, fontSize: 24, fontWeight: '800' },
  initTitle: { fontSize: 16, fontWeight: '700', color: COLORS.gray[900] },
  initSub:   { fontSize: 13, color: COLORS.gray[400], textAlign: 'center', marginTop: 4 },
});
