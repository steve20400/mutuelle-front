import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '@/src/constants';
import type { ChatMessage } from '@/src/services/chatbot/types';

/**
 * Rendu Markdown minimal : gras (**text**) et sauts de ligne.
 * Évite une dépendance externe tout en restant lisible.
 */
function renderContent(text: string) {
  // Découpe en segments : texte normal et **gras**
  const parts = text.split(/(\*\*[^*]+\*\*)/g);

  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <Text key={i} style={styles.bold}>
          {part.slice(2, -2)}
        </Text>
      );
    }
    return <Text key={i}>{part}</Text>;
  });
}

interface ChatBubbleProps {
  message: ChatMessage;
}

export const ChatBubble = memo(function ChatBubble({ message }: ChatBubbleProps) {
  const isUser = message.role === 'user';

  const time = message.timestamp.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <View style={[styles.row, isUser && styles.rowUser]}>
      {/* Avatar bot */}
      {!isUser && (
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>M</Text>
        </View>
      )}

      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleBot]}>
        <Text style={[styles.content, isUser ? styles.contentUser : styles.contentBot]}>
          {renderContent(message.content)}
        </Text>
        <Text style={[styles.time, isUser ? styles.timeUser : styles.timeBot]}>
          {time}
        </Text>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    marginHorizontal: 12,
    marginVertical: 4,
  },
  rowUser: {
    justifyContent: 'flex-end',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginBottom: 18, // aligne avec le bas de la bulle
  },
  avatarText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '800',
  },
  bubble: {
    maxWidth: '78%',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  bubbleBot: {
    backgroundColor: COLORS.white,
    borderBottomLeftRadius: 4,
  },
  bubbleUser: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 4,
  },
  content: {
    fontSize: 14,
    lineHeight: 21,
  },
  contentBot: {
    color: COLORS.gray[900],
  },
  contentUser: {
    color: COLORS.white,
  },
  bold: {
    fontWeight: '700',
  },
  time: {
    fontSize: 10,
    marginTop: 5,
  },
  timeBot: {
    color: COLORS.gray[400],
    textAlign: 'left',
  },
  timeUser: {
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'right',
  },
});
