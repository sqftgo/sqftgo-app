import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/ds/Button";
import { WifiOff, InfoCircle } from "@/components/ui/icons";
import { colors, radius, spacing, type } from "@/theme/tokens";

export function ErrorState({
  title = "Couldn't load this",
  message,
  onRetry,
  offline,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
  offline?: boolean;
}) {
  const Icon = offline ? WifiOff : InfoCircle;
  return (
    <View style={styles.wrap} accessibilityRole="alert">
      <View style={styles.icon}>
        <Icon size={26} color={colors.danger} />
      </View>
      <Text style={styles.title}>{offline ? "You're offline" : title}</Text>
      {message ? <Text style={styles.message}>{message}</Text> : null}
      {onRetry ? <Button label="Try again" variant="secondary" size="md" onPress={onRetry} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", gap: spacing.md, paddingVertical: spacing["4xl"], paddingHorizontal: spacing.xl },
  icon: {
    width: 56,
    height: 56,
    borderRadius: radius.full,
    backgroundColor: colors.dangerSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { ...type.heading, color: colors.ink, textAlign: "center" },
  message: { ...type.body, color: colors.inkMuted, textAlign: "center", maxWidth: 300 },
});
