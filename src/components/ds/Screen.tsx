import { useRouter, type Href } from "expo-router";
import React from "react";
import {
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ScreenNavbar, type HeaderAction } from "@/components/ui/screen-navbar";
import { colors, spacing } from "@/theme/tokens";

export interface ScreenProps {
  title: string;
  subtitle?: string;
  /** Hide the back button (tab roots). */
  root?: boolean;
  actions?: HeaderAction[];
  rightAction?: React.ReactNode;
  children: React.ReactNode;
  /** Pinned content under the scroll area (primary CTA). */
  footer?: React.ReactNode;
  /** Render children without a ScrollView (lists that virtualize themselves). */
  scroll?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  contentStyle?: StyleProp<ViewStyle>;
  /** Where back goes when there is no history (deep links). */
  fallbackHref?: Href;
}

export function useBack(fallbackHref: Href = "/") {
  const router = useRouter();
  return () => {
    if (router.canGoBack()) router.back();
    else router.replace(fallbackHref);
  };
}

export function Screen({
  title,
  subtitle,
  root,
  actions,
  rightAction,
  children,
  footer,
  scroll = true,
  refreshing,
  onRefresh,
  contentStyle,
  fallbackHref,
}: ScreenProps) {
  const back = useBack(fallbackHref);

  const header = (
    <View style={styles.header}>
      <ScreenNavbar
        title={title}
        subtitle={subtitle}
        onBack={root ? undefined : back}
        actions={actions}
        rightAction={rightAction}
      />
    </View>
  );

  return (
    <SafeAreaView edges={["top"]} style={styles.root}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.flex}>
        {header}
        {scroll ? (
          <ScrollView
            style={styles.flex}
            contentContainerStyle={[styles.content, contentStyle]}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            showsVerticalScrollIndicator={false}
            refreshControl={
              onRefresh ? (
                <RefreshControl refreshing={Boolean(refreshing)} onRefresh={onRefresh} tintColor={colors.accent} />
              ) : undefined
            }
          >
            {children}
          </ScrollView>
        ) : (
          <View style={[styles.flex, contentStyle]}>{children}</View>
        )}
        {footer ? (
          <SafeAreaView edges={["bottom"]} style={styles.footer}>
            {footer}
          </SafeAreaView>
        ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  header: { paddingHorizontal: spacing.lg },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing["4xl"], gap: spacing.xxl },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
});
