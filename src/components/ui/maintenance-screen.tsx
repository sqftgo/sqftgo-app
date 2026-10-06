import React from "react";
import { Linking, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/components/ds/Button";
import { Settings } from "@/components/ui/icons";
import { colors, radius, spacing, type } from "@/theme/tokens";

/** Mirrors web /maintenance: shown when platform maintenance mode is on. */
export function MaintenanceScreen({
  supportEmail,
  onRetry,
}: {
  supportEmail?: string;
  onRetry: () => void;
}) {
  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.body}>
        <View style={styles.icon}>
          <Settings size={30} color={colors.accent} />
        </View>
        <Text style={styles.title}>We&apos;ll be right back</Text>
        <Text style={styles.message}>
          SqftGo is undergoing scheduled maintenance. Your account and listings are safe. Please check
          back shortly.
        </Text>
        <Button label="Try again" onPress={onRetry} fullWidth />
        {supportEmail ? (
          <Button
            label={`Contact ${supportEmail}`}
            variant="tertiary"
            onPress={() => Linking.openURL(`mailto:${supportEmail}`).catch(() => {})}
          />
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  body: { flex: 1, justifyContent: "center", alignItems: "center", gap: spacing.lg, paddingHorizontal: spacing["3xl"] },
  icon: {
    width: 72,
    height: 72,
    borderRadius: radius.full,
    backgroundColor: colors.accentSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { ...type.hero, color: colors.ink, textAlign: "center" },
  message: { ...type.body, color: colors.inkMuted, textAlign: "center" },
});
