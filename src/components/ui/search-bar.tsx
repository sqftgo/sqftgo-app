import React from "react";
import { Pressable, TextInput, View } from "react-native";
import { Search, X } from "@/components/ui/icons";

import { colors, radius, shadow, spacing, type } from "@/theme/tokens";

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  autoFocus?: boolean;
}

/** The one search field used across Home, Explore, and Services. */
export function SearchBar({ value, onChangeText, placeholder, autoFocus }: SearchBarProps) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.borderStrong,
        borderRadius: radius.md,
        borderCurve: "continuous",
        paddingHorizontal: spacing.md,
        height: 46,
        boxShadow: shadow.card,
      }}
    >
      <Search size={17} color={colors.inkMuted} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.inkMuted}
        autoFocus={autoFocus}
        returnKeyType="search"
        accessibilityLabel={placeholder}
        style={{ flex: 1, ...type.body, lineHeight: undefined, color: colors.ink, padding: 0 }}
      />
      {value !== "" && (
        <Pressable
          onPress={() => onChangeText("")}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Clear search"
        >
          <X size={16} color={colors.inkMuted} />
        </Pressable>
      )}
    </View>
  );
}
