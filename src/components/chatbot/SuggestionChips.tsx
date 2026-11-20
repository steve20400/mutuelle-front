import React, { memo } from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { COLORS } from '@/src/constants';

interface SuggestionChipsProps {
  suggestions: string[];
  onSelect: (suggestion: string) => void;
}

export const SuggestionChips = memo(function SuggestionChips({
  suggestions,
  onSelect,
}: SuggestionChipsProps) {
  if (!suggestions.length) return null;

  return (
    <View style={styles.wrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        {suggestions.map((s) => (
          <TouchableOpacity
            key={s}
            style={styles.chip}
            onPress={() => onSelect(s)}
            activeOpacity={0.7}
          >
            <Text style={styles.label} numberOfLines={1}>{s}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper: {
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[100],
    backgroundColor: COLORS.white,
  },
  container: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    flexDirection: 'row',
  },
  chip: {
    backgroundColor: '#EFF6FF',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    maxWidth: 220,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.info,
  },
});
