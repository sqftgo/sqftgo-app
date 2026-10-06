import { useLocalSearchParams, useRouter, type Href } from "expo-router";
import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/components/ds/Button";
import { SegmentedControl } from "@/components/ds/SegmentedControl";
import { TextField } from "@/components/ds/TextField";
import { appAlert } from "@/components/ui/app-alert";
import { Globe, X } from "@/components/ui/icons";
import { useApp } from "@/context/AppContext";
import type { UserRole } from "@/data/types";
import { colors, fonts, radius, spacing, type } from "@/theme/tokens";

type Mode = "sign-in" | "sign-up";
type LoginType = "user" | "dealer";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function AuthScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string }>();
  const {
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    preferredRole,
    setPreferredRole,
    forgotPassword,
    isApiMode,
  } = useApp();

  const [mode, setMode] = useState<Mode>(params.mode === "sign-up" ? "sign-up" : "sign-in");
  const [loginType, setLoginType] = useState<LoginType>(preferredRole === "broker" ? "dealer" : "user");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string }>({});
  const [busy, setBusy] = useState<"form" | "google" | null>(null);

  const isSignUp = mode === "sign-up";
  const isDealer = loginType === "dealer";

  const close = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/" as Href);
  };

  const selectLoginType = (next: LoginType) => {
    setLoginType(next);
    setPreferredRole((next === "dealer" ? "broker" : "user") as UserRole);
    setErrors({});
  };

  const validate = () => {
    const next: typeof errors = {};
    if (isSignUp && name.trim().length < 2) next.name = "Enter your name.";
    if (!EMAIL_RE.test(email.trim())) next.email = "Enter a valid email address.";
    if (password.length < 8) next.password = "Use at least 8 characters.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const finishAuth = (result: { ok: true; role: UserRole; dealerAccess?: string }) => {
    const isDealerAccount = result.role === "broker" || result.dealerAccess === "pending";
    if (loginType === "user" && result.role === "broker") {
      signOut();
      appAlert("Dealer account", "This email is registered as a Dealer. Switch to Dealer and try again.");
      return;
    }
    if (loginType === "dealer" && !isDealerAccount) {
      signOut();
      appAlert(
        "Not a dealer account",
        "This email is a customer account. Switch to Customer, or create a Dealer account.",
      );
      return;
    }
    if (loginType === "dealer" && result.role !== "broker" && result.dealerAccess === "pending") {
      router.replace("/dealer-pending" as Href);
    }
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setBusy("form");
    try {
      if (isSignUp) {
        const result = await signUp({
          email: email.trim(),
          password,
          name: name.trim(),
          intent: isDealer ? "dealer" : "user",
        });
        if (!result.ok) {
          appAlert("Couldn't create account", result.message);
          return;
        }
        if (isDealer) router.replace("/dealer-register" as Href);
        return;
      }
      const result = await signIn(email.trim(), password);
      if (!result.ok) {
        appAlert(result.code === "admin_unsupported" ? "Use the SqftGo website" : "Couldn't sign in", result.message);
        return;
      }
      finishAuth(result);
    } finally {
      setBusy(null);
    }
  };

  const handleGoogle = async () => {
    setBusy("google");
    try {
      const result = await signInWithGoogle();
      if (!result.ok) {
        if (!result.cancelled) appAlert("Google sign-in failed", result.message);
        return;
      }
      finishAuth(result);
    } finally {
      setBusy(null);
    }
  };

  const handleForgot = async () => {
    const target = email.trim();
    if (!EMAIL_RE.test(target)) {
      setErrors({ email: "Enter your account email first." });
      return;
    }
    const res = await forgotPassword(target);
    appAlert(
      res.ok ? "Check your inbox" : "Couldn't send reset link",
      res.ok
        ? "If an account exists for that email, you'll get a link. Open it to set a new password, then sign in here."
        : (res.message ?? "Please try again."),
    );
  };

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.root}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.topRow}>
            <Text style={styles.logo}>SqftGo</Text>
            <Pressable
              onPress={close}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Close"
              style={styles.closeBtn}
            >
              <X size={18} color={colors.inkSecondary} />
            </Pressable>
          </View>

          <View style={{ gap: spacing.xs }}>
            <Text style={styles.title}>{isSignUp ? "Create your account" : "Welcome back"}</Text>
            <Text style={styles.subtitle}>
              {isDealer
                ? isSignUp
                  ? "List properties and manage leads as a dealer."
                  : "Sign in to manage your listings and leads."
                : isSignUp
                  ? "Save homes, book visits and talk to dealers."
                  : "Sign in to see your saved homes and visits."}
            </Text>
          </View>

          <SegmentedControl
            segments={[
              { value: "user", label: "Customer" },
              { value: "dealer", label: "Dealer" },
            ]}
            value={loginType}
            onChange={selectLoginType}
          />

          {isApiMode ? (
            <>
              <Button
                label="Continue with Google"
                icon={Globe}
                variant="secondary"
                loading={busy === "google"}
                disabled={busy === "form"}
                onPress={() => void handleGoogle()}
                fullWidth
              />
              <View style={styles.dividerRow}>
                <View style={styles.divider} />
                <Text style={styles.dividerText}>or use email</Text>
                <View style={styles.divider} />
              </View>
            </>
          ) : null}

          <View style={{ gap: spacing.lg }}>
            {isSignUp ? (
              <TextField
                label="Full name"
                value={name}
                onChangeText={(v) => {
                  setName(v);
                  if (errors.name) setErrors((e) => ({ ...e, name: undefined }));
                }}
                placeholder="Your name"
                autoCapitalize="words"
                autoComplete="name"
                textContentType="name"
                error={errors.name}
                editable={!busy}
              />
            ) : null}
            <TextField
              label="Email"
              value={email}
              onChangeText={(v) => {
                setEmail(v);
                if (errors.email) setErrors((e) => ({ ...e, email: undefined }));
              }}
              placeholder="name@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              textContentType="emailAddress"
              error={errors.email}
              editable={!busy}
            />
            <TextField
              label="Password"
              value={password}
              onChangeText={(v) => {
                setPassword(v);
                if (errors.password) setErrors((e) => ({ ...e, password: undefined }));
              }}
              placeholder={isSignUp ? "At least 8 characters" : "Your password"}
              password
              autoCapitalize="none"
              autoComplete={isSignUp ? "new-password" : "current-password"}
              textContentType={isSignUp ? "newPassword" : "password"}
              error={errors.password}
              editable={!busy}
              returnKeyType="go"
              onSubmitEditing={() => void handleSubmit()}
            />
            {!isSignUp ? (
              <Pressable
                onPress={() => void handleForgot()}
                hitSlop={8}
                disabled={Boolean(busy)}
                accessibilityRole="button"
                style={{ alignSelf: "flex-end" }}
              >
                <Text style={styles.link}>Forgot password?</Text>
              </Pressable>
            ) : null}
          </View>

          <Button
            label={isSignUp ? "Create account" : "Sign in"}
            loading={busy === "form"}
            disabled={busy === "google"}
            onPress={() => void handleSubmit()}
            fullWidth
          />

          <View style={styles.switchRow}>
            <Text style={styles.subtitle}>{isSignUp ? "Already have an account?" : "New to SqftGo?"}</Text>
            <Pressable
              onPress={() => {
                setMode(isSignUp ? "sign-in" : "sign-up");
                setErrors({});
              }}
              disabled={Boolean(busy)}
              hitSlop={8}
              accessibilityRole="button"
            >
              <Text style={styles.link}>{isSignUp ? "Sign in" : "Create account"}</Text>
            </Pressable>
          </View>

          <Text style={styles.terms}>
            By continuing you agree to our{" "}
            <Text style={styles.termsLink} onPress={() => router.push("/legal/terms" as Href)}>
              Terms
            </Text>{" "}
            and{" "}
            <Text style={styles.termsLink} onPress={() => router.push("/legal/privacy" as Href)}>
              Privacy Policy
            </Text>
            .
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scroll: { flexGrow: 1, paddingHorizontal: spacing.xxl, paddingTop: spacing.md, paddingBottom: spacing.xxl, gap: spacing.xxl },
  topRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  logo: { fontFamily: fonts.logo, fontSize: 28, fontWeight: "600", color: colors.primary },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceSubtle,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { ...type.hero, color: colors.ink },
  subtitle: { ...type.body, color: colors.inkMuted },
  dividerRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  divider: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: colors.borderStrong },
  dividerText: { ...type.caption, color: colors.inkMuted },
  link: { ...type.label, color: colors.accent, fontFamily: fonts.sansSemiBold, fontWeight: "600" },
  switchRow: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: spacing.xs },
  terms: { ...type.caption, color: colors.inkMuted, textAlign: "center", marginTop: "auto" },
  termsLink: { color: colors.primary, textDecorationLine: "underline" },
});
