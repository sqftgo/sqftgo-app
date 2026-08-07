import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { WifiOff, RefreshCw } from "@/components/ui/icons";
import { colors, radius, spacing, type } from "@/theme/tokens";

const WifiOffIcon = WifiOff as any;
const RefreshCwIcon = RefreshCw as any;

interface AuthErrorScreenProps {
  message?: string;
  onRetry: () => void;
}

export function AuthErrorScreen({ message, onRetry }: AuthErrorScreenProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <WifiOffIcon size={36} color={colors.danger} />
      </View>
      <Text style={styles.title}>Connection Failed</Text>
      <Text style={styles.description}>
        {message ||
          "Unable to verify your session or retrieve account data. Please check your internet connection and try again."}
      </Text>

      <Pressable style={styles.retryBtn} onPress={onRetry}>
        <RefreshCwIcon size={18} color={colors.onAccent} />
        <Text style={styles.retryText}>Retry Connection</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xxl,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: radius.full,
    backgroundColor: colors.dangerSoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  title: {
    ...type.heading,
    color: colors.ink,
    fontSize: 20,
    marginBottom: spacing.sm,
    textAlign: "center",
  },
  description: {
    ...type.body,
    color: colors.inkSecondary,
    textAlign: "center",
    marginBottom: spacing.xxl,
    maxWidth: 300,
  },
  retryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
  },
  retryText: {
    ...type.label,
    color: colors.onAccent,
    fontSize: 15,
  },
});
