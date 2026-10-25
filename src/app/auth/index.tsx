import { Redirect, useLocalSearchParams, useRouter, type Href } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/components/ds/Button";
import { SegmentedControl } from "@/components/ds/SegmentedControl";
import { TextField } from "@/components/ds/TextField";
import { appAlert } from "@/components/ui/app-alert";
import { ChevronLeft, Globe, MapPin } from "@/components/ui/icons";
import { useApp } from "@/context/AppContext";
import type { UserRole } from "@/data/types";
import { userFacingError } from "@/lib/errors";
import { colors, fonts, radius, spacing, touchTarget, type } from "@/theme/tokens";

type Mode = "sign-in" | "sign-up";
type LoginType = "user" | "dealer";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function modeFromParam(raw?: string): Mode {
  return raw === "sign-up" ? "sign-up" : "sign-in";
}

export default function AuthScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string }>();
  const {
    isLoggedIn,
    userRole,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    preferredRole,
    setPreferredRole,
    selectedCity,
    forgotPassword,
    isApiMode,
  } = useApp();

  const [mode, setMode] = useState<Mode>(modeFromParam(params.mode));
  const [loginType, setLoginType] = useState<LoginType>(
    preferredRole === "broker" ? "dealer" : "user",
  );
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});
  const [busy, setBusy] = useState<"form" | "google" | null>(null);

  const isSignUp = mode === "sign-up";
  const isDealer = loginType === "dealer";

  useEffect(() => {
    setMode(modeFromParam(params.mode));
  }, [params.mode]);

  useEffect(() => {
    setLoginType(preferredRole === "broker" ? "dealer" : "user");
  }, [preferredRole]);

  const copy = useMemo(() => {
    const city = selectedCity?.trim() || "your city";
    if (isSignUp) {
      return {
        title: isDealer ? "Create dealer account" : "Create your account",
        subtitle: isDealer
          ? `List properties and manage leads in ${city}.`
          : `Save homes, book visits, and talk to dealers in ${city}.`,
        cta: isDealer ? "Create dealer account" : "Create customer account",
      };
    }
    return {
      title: "Welcome back",
      subtitle: isDealer
        ? `Sign in to manage your ${city} listings and leads.`
        : `Sign in to see saved homes and visits in ${city}.`,
      cta: isDealer ? "Sign in as dealer" : "Sign in",
    };
  }, [isDealer, isSignUp, selectedCity]);

  const close = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/onboarding" as Href);
  };

  const selectMode = (next: Mode) => {
    setMode(next);
    setErrors({});
    setPassword("");
    setConfirmPassword("");
  };

  const selectLoginType = (next: LoginType) => {
    setLoginType(next);
    setPreferredRole(next === "dealer" ? "broker" : "user");
    setErrors({});
  };

  const validate = () => {
    const next: typeof errors = {};
    if (isSignUp && name.trim().length < 2) next.name = "Enter your full name.";
    if (!EMAIL_RE.test(email.trim())) next.email = "Enter a valid email address.";
    if (password.length < 8) next.password = "Use at least 8 characters.";
    if (isSignUp && password !== confirmPassword) {
      next.confirmPassword = "Passwords do not match.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const finishAuth = (result: { ok: true; role: UserRole; dealerAccess?: string }) => {
    const isDealerAccount = result.role === "broker" || result.dealerAccess === "pending";
    if (loginType === "user" && result.role === "broker") {
      signOut();
      appAlert(
        "Dealer account",
        "This email is registered as a Dealer. Switch to Dealer and try again.",
      );
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
        if (isDealer) {
          router.replace("/dealer-register" as Href);
        }
        return;
      }

      const result = await signIn(email.trim(), password);
      if (!result.ok) {
        appAlert(
          result.code === "admin_unsupported" ? "Use the SqftGo website" : "Couldn't sign in",
          result.message,
        );
        return;
      }
      finishAuth(result);
    } catch (error) {
      appAlert(
        isSignUp ? "Couldn't create account" : "Couldn't sign in",
        userFacingError(error, "Please try again."),
      );
    } finally {
      setBusy(null);
    }
  };

  const handleGoogle = async () => {
    if (isSignUp && isDealer) {
      appAlert(
        "Email signup required",
        "Dealer accounts need email signup so we can set up your listing workspace. Use Create dealer account below.",
      );
      return;
    }
    setBusy("google");
    try {
      const result = await signInWithGoogle();
      if (!result.ok) {
        if (!result.cancelled) {
          appAlert("Google sign-in failed", result.message);
        }
        return;
      }
      finishAuth(result);
    } catch (error) {
      appAlert("Google sign-in failed", userFacingError(error, "Please try again."));
    } finally {
      setBusy(null);
    }
  };

  const handleForgot = async () => {
    const target = email.trim();
    if (!EMAIL_RE.test(target)) {
      setErrors((e) => ({ ...e, email: "Enter your account email first." }));
      return;
    }
    try {
      const res = await forgotPassword(target);
      appAlert(
        res.ok ? "Check your inbox" : "Couldn't send reset link",
        res.ok
          ? "If an account exists for that email, you'll get a link. Open it to set a new password, then sign in here."
          : (res.message ?? "Please try again."),
      );
    } catch (error) {
      appAlert("Couldn't send reset link", userFacingError(error, "Please try again."));
    }
  };

  const showGoogle = isApiMode && !(isSignUp && isDealer);

  if (isLoggedIn) {
    return (
      <Redirect href={(userRole === "broker" ? "/(dealer)" : "/(tabs)") as Href} />
    );
  }

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.root}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.topRow}>
            <Pressable
              onPress={close}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Back to onboarding"
              style={styles.backBtn}
            >
              <ChevronLeft size={18} color={colors.ink} />
            </Pressable>
            <Text style={styles.logo}>SqftGo</Text>
            <View style={styles.headerSpacer} />
          </View>

          <SegmentedControl
            segments={[
              { value: "sign-in", label: "Sign in" },
              { value: "sign-up", label: "Create account" },
            ]}
            value={mode}
            onChange={selectMode}
          />

          <View style={styles.headingBlock}>
            <Text style={styles.title}>{copy.title}</Text>
            <Text style={styles.subtitle}>{copy.subtitle}</Text>
            {selectedCity ? (
              <View style={styles.cityChip}>
                <MapPin size={14} color={colors.primary} />
                <Text style={styles.cityChipText}>{selectedCity}</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>I am a</Text>
            <SegmentedControl
              segments={[
                { value: "user", label: "Customer" },
                { value: "dealer", label: "Dealer" },
              ]}
              value={loginType}
              onChange={selectLoginType}
            />
          </View>

          {showGoogle ? (
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

          <View style={styles.form}>
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
                required
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
              required
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
              required
              returnKeyType={isSignUp ? "next" : "go"}
              onSubmitEditing={() => {
                if (!isSignUp) void handleSubmit();
              }}
            />
            {isSignUp ? (
              <TextField
                label="Confirm password"
                value={confirmPassword}
                onChangeText={(v) => {
                  setConfirmPassword(v);
                  if (errors.confirmPassword) {
                    setErrors((e) => ({ ...e, confirmPassword: undefined }));
                  }
                }}
                placeholder="Re-enter password"
                password
                autoCapitalize="none"
                autoComplete="new-password"
                textContentType="newPassword"
                error={errors.confirmPassword}
                editable={!busy}
                required
                returnKeyType="go"
                onSubmitEditing={() => void handleSubmit()}
              />
            ) : (
              <Pressable
                onPress={() => void handleForgot()}
                hitSlop={8}
                disabled={Boolean(busy)}
                accessibilityRole="button"
                style={styles.forgotBtn}
              >
                <Text style={styles.link}>Forgot password?</Text>
              </Pressable>
            )}
          </View>

          <Button
            label={copy.cta}
            loading={busy === "form"}
            disabled={busy === "google"}
            onPress={() => void handleSubmit()}
            fullWidth
          />

          {isSignUp && isDealer ? (
            <Text style={styles.helperNote}>
              After signup you&apos;ll complete your dealer profile for {selectedCity || "your city"}.
            </Text>
          ) : null}

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
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
    gap: spacing.xl,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backBtn: {
    width: touchTarget,
    height: touchTarget,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  headerSpacer: { width: touchTarget },
  logo: {
    fontFamily: fonts.logo,
    fontSize: 22,
    fontWeight: "600",
    color: colors.primary,
  },
  headingBlock: { gap: spacing.xs },
  title: { ...type.hero, color: colors.ink },
  subtitle: { ...type.body, color: colors.inkMuted },
  cityChip: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginTop: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.sm,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
  },
  cityChipText: {
    ...type.caption,
    fontFamily: fonts.sansMedium,
    color: colors.primary,
  },
  section: { gap: spacing.sm },
  sectionLabel: { ...type.label, color: colors.inkSecondary },
  dividerRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  divider: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: colors.borderStrong },
  dividerText: { ...type.caption, color: colors.inkMuted },
  form: { gap: spacing.lg },
  forgotBtn: { alignSelf: "flex-end", marginTop: -spacing.sm },
  link: {
    ...type.label,
    color: colors.accent,
    fontFamily: fonts.sansSemiBold,
    fontWeight: "600",
  },
  helperNote: {
    ...type.caption,
    color: colors.inkMuted,
    textAlign: "center",
    marginTop: -spacing.sm,
  },
  terms: {
    ...type.caption,
    color: colors.inkMuted,
    textAlign: "center",
    marginTop: "auto",
  },
  termsLink: { color: colors.primary, textDecorationLine: "underline" },
});
