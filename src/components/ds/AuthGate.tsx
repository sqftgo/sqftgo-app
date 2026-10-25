import { useRouter, type Href } from "expo-router";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/ds/Button";
import { Lock } from "@/components/ui/icons";
import { ModalSheet } from "@/components/ui/modal-sheet";
import { useApp } from "@/context/AppContext";
import { colors, radius, spacing, type } from "@/theme/tokens";

type Gate = (reason: string, action?: () => void) => boolean;

const AuthGateContext = createContext<Gate | null>(null);

/**
 * Account actions call `requireAuth(reason, action)`. Signed-in users run the action
 * immediately. Guests see a sign-in sheet; after a successful sign-in, the deferred
 * `action` runs once so they do not need a second tap.
 * (Marketplace itself is gated behind onboarding + sign-in at the root stack.)
 */
export function AuthGateProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isLoggedIn } = useApp();
  const [reason, setReason] = useState<string | null>(null);
  const pendingActionRef = useRef<(() => void) | null>(null);
  const wasLoggedInRef = useRef(isLoggedIn);

  const requireAuth = useCallback<Gate>(
    (why, action) => {
      if (isLoggedIn) {
        action?.();
        return true;
      }
      pendingActionRef.current = action ?? null;
      setReason(why);
      return false;
    },
    [isLoggedIn],
  );

  const dismiss = useCallback(() => {
    setReason(null);
    pendingActionRef.current = null;
  }, []);

  const go = (mode: "sign-in" | "sign-up") => {
    // Close the sheet but keep the pending action so it can resume after auth.
    setReason(null);
    router.push({ pathname: "/auth", params: { mode } } as unknown as Href);
  };

  useEffect(() => {
    const justSignedIn = isLoggedIn && !wasLoggedInRef.current;
    wasLoggedInRef.current = isLoggedIn;

    if (!justSignedIn) return;

    const action = pendingActionRef.current;
    pendingActionRef.current = null;
    setReason(null);
    if (action) {
      // Let auth modal / stack settle before navigating or mutating.
      requestAnimationFrame(() => action());
    }
  }, [isLoggedIn]);

  const value = useMemo(() => requireAuth, [requireAuth]);

  return (
    <AuthGateContext.Provider value={value}>
      {children}
      <ModalSheet visible={reason !== null} onClose={dismiss} maxHeight="60%">
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
    borderRadius: radius.md,
    borderCurve: "continuous",
    backgroundColor: colors.accentSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { ...type.title, color: colors.ink, textAlign: "center" },
  message: { ...type.body, color: colors.inkMuted, textAlign: "center" },
  actions: { alignSelf: "stretch", gap: spacing.sm, marginTop: spacing.sm },
});
