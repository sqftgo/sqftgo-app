import { useRouter, type Href } from "expo-router";
import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/ds/Button";
import { Lock } from "@/components/ui/icons";
import { ModalSheet } from "@/components/ui/modal-sheet";
import { useApp } from "@/context/AppContext";
import { colors, radius, spacing, type } from "@/theme/tokens";

type Gate = (reason: string, action?: () => void) => boolean;

const AuthGateContext = createContext<Gate | null>(null);

/**
 * Guests can browse freely; account actions (save, post, manage) call `requireAuth(reason, action)`.
 * Signed-in users run the action immediately, guests see a sign-in sheet.
 */
export function AuthGateProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isLoggedIn } = useApp();
  const [reason, setReason] = useState<string | null>(null);

  const requireAuth = useCallback<Gate>(
    (why, action) => {
      if (isLoggedIn) {
        action?.();
        return true;
      }
      setReason(why);
      return false;
    },
    [isLoggedIn],
  );

  const go = (mode: "sign-in" | "sign-up") => {
    setReason(null);
    router.push({ pathname: "/auth", params: { mode } } as unknown as Href);
  };

  const value = useMemo(() => requireAuth, [requireAuth]);

  return (
    <AuthGateContext.Provider value={value}>
      {children}
      <ModalSheet visible={reason !== null} onClose={() => setReason(null)} maxHeight="60%">
        <View style={styles.body}>
          <View style={styles.icon}>
            <Lock size={24} color={colors.accent} />
          </View>
          <Text style={styles.title}>Sign in to continue</Text>
          <Text style={styles.message}>{reason}</Text>
          <View style={styles.actions}>
            <Button label="Sign in" onPress={() => go("sign-in")} fullWidth />
            <Button label="Create an account" variant="secondary" onPress={() => go("sign-up")} fullWidth />
          </View>
        </View>
      </ModalSheet>
    </AuthGateContext.Provider>
  );
}

export function useRequireAuth(): Gate {
  const ctx = useContext(AuthGateContext);
  if (!ctx) throw new Error("useRequireAuth must be used within AuthGateProvider");
  return ctx;
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: spacing.xl, paddingTop: spacing.md, paddingBottom: spacing.lg, gap: spacing.md, alignItems: "center" },
  icon: {
    width: 56,
    height: 56,
    borderRadius: radius.full,
    backgroundColor: colors.accentSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { ...type.title, color: colors.ink, textAlign: "center" },
  message: { ...type.body, color: colors.inkMuted, textAlign: "center" },
  actions: { alignSelf: "stretch", gap: spacing.sm, marginTop: spacing.sm },
});
