import React from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

import type { IconComponent } from "@/components/ui/icons";
import { ModalSheet } from "@/components/ui/modal-sheet";
import { colors, radius, spacing, touchTarget, type } from "@/theme/tokens";

export interface SheetAction {
  label: string;
  onPress: () => void;
  icon?: IconComponent;
  destructive?: boolean;
  disabled?: boolean;
}

export interface ActionSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  actions: SheetAction[];
}

/** Bottom list of choices for a single item (edit, share, delete). The sheet closes before the action runs. */
export function ActionSheet({ visible, onClose, title, message, actions }: ActionSheetProps) {
  return (
    <ModalSheet visible={visible} onClose={onClose}>
      <View style={styles.body}>
        {title || message ? (
          <View style={styles.header}>
            {title ? <Text style={styles.title}>{title}</Text> : null}
            {message ? <Text style={styles.message}>{message}</Text> : null}
          </View>
        ) : null}
        <View style={styles.group}>
          {actions.map((a, i) => {
            const tint = a.destructive ? colors.danger : colors.ink;
            return (
              <Pressable
                key={a.label}
                disabled={a.disabled}
                onPress={() => {
                  onClose();
                  // iOS drops a modal presented while another one is still dismissing.
                  setTimeout(a.onPress, Platform.OS === "ios" ? 350 : 0);
                }}
                accessibilityRole="button"
                accessibilityState={{ disabled: a.disabled }}
                style={({ pressed }) => [
                  styles.row,
                  i > 0 && styles.divider,
                  pressed && { backgroundColor: colors.surfaceSubtle },
                  a.disabled && { opacity: 0.45 },
                ]}
              >
                {a.icon ? <a.icon size={20} color={tint} /> : null}
                <Text style={[styles.label, { color: tint }]}>{a.label}</Text>
              </Pressable>
            );
          })}
        </View>
        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          style={({ pressed }) => [styles.cancel, pressed && { backgroundColor: colors.surfaceSubtle }]}
        >
          <Text style={styles.cancelLabel}>Cancel</Text>
        </Pressable>
      </View>
    </ModalSheet>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, gap: spacing.md },
  header: { gap: spacing.xs, paddingTop: spacing.xs, alignItems: "center" },
  title: { ...type.heading, color: colors.ink, textAlign: "center" },
  message: { ...type.caption, color: colors.inkMuted, textAlign: "center" },
  group: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderCurve: "continuous",
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  row: {
    minHeight: touchTarget + 8,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.divider },
  label: { ...type.body },
  cancel: {
    minHeight: touchTarget + 8,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelLabel: { ...type.emphasis, color: colors.ink },
});
