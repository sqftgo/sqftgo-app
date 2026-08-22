import React from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { Building2 } from "@/components/ui/icons";
import { colors, radius, spacing, type } from "@/theme/tokens";

const Building2Icon = Building2 as any;

export function AuthLoadingScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.logoBadge}>
        <Building2Icon size={32} color={colors.accent} />
      </View>
      <Text style={styles.appName}>SqftGo</Text>
      <View style={styles.spinnerContainer}>
        <ActivityIndicator size="small" color={colors.accent} />
        <Text style={styles.loadingText}>Loading your account...</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: radius.lg,
    backgroundColor: colors.accentSoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.accentBorder,
  },
  appName: {
    ...type.title,
    color: colors.ink,
    marginBottom: spacing.xl,
  },
  spinnerContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  loadingText: {
    ...type.caption,
    color: colors.inkSecondary,
  },
});
