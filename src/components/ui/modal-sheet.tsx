import React from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
  DimensionValue,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X } from "@/components/ui/icons";
import { colors, radius, shadow, spacing, type } from "@/theme/tokens";

export interface ModalSheetCloseButtonProps {
  onClose: () => void;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

export function ModalSheetCloseButton({
  onClose,
  accessibilityLabel = "Close",
  style,
}: ModalSheetCloseButtonProps) {
  return (
    <Pressable
      onPress={onClose}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [
        styles.closeBtn,
        pressed && styles.closeBtnPressed,
        style,
      ]}
    >
      <X size={16} color={colors.inkSecondary} />
    </Pressable>
  );
}

export interface ModalSheetHeaderProps {
  title: string;
  subtitle?: string;
  onClose: () => void;
  rightAction?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function ModalSheetHeader({
  title,
  subtitle,
  onClose,
  rightAction,
  style,
}: ModalSheetHeaderProps) {
  return (
    <View style={[styles.header, style]}>
      <View style={styles.headerTitleBox}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>

      <View style={styles.headerActions}>
        {rightAction}
        <ModalSheetCloseButton onClose={onClose} />
      </View>
    </View>
  );
}

export interface ModalSheetProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  maxHeight?: DimensionValue;
  animationType?: "slide" | "fade" | "none";
  dismissable?: boolean;
  avoidKeyboard?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
}

export function ModalSheet({
  visible,
  onClose,
  children,
  maxHeight = "85%",
  animationType = "slide",
  dismissable = true,
  avoidKeyboard = false,
  contentStyle,
}: ModalSheetProps) {
  const insets = useSafeAreaInsets();

  const sheetContent = (
    <View style={styles.overlay}>
      <Pressable
        style={styles.backdrop}
        onPress={dismissable ? onClose : undefined}
        accessibilityLabel="Dismiss popup"
      />

      <View
        style={[
          styles.sheetContainer,
          {
            maxHeight,
            paddingBottom: insets.bottom + spacing.md,
          },
          contentStyle,
        ]}
      >
        {/* Consistent Drag Handle Indicator Bar */}
        <View style={styles.handleContainer}>
          <View style={styles.handleBar} />
        </View>

        {children}
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType={animationType}
      transparent
      onRequestClose={onClose}
    >
      {avoidKeyboard ? (
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.flex1}
        >
          {sheetContent}
        </KeyboardAvoidingView>
      ) : (
        sheetContent
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex1: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sheetContainer: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: radius.xl + 4,
    borderTopRightRadius: radius.xl + 4,
    borderCurve: "continuous",
    boxShadow: shadow.raised,
    overflow: "hidden",
  },
  handleContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  handleBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  headerTitleBox: {
    flex: 1,
    paddingRight: spacing.md,
  },
  title: {
    ...type.title,
    color: colors.ink,
  },
  subtitle: {
    ...type.caption,
    color: colors.inkMuted,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  closeBtnPressed: {
    opacity: 0.7,
  },
});
