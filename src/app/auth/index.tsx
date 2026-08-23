import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  User
} from "@/components/ui/icons";
import { useRouter, type Href } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

import { appAlert } from "@/components/ui/app-alert";
import { SafeAreaView } from "react-native-safe-area-context";

import { useApp } from "@/context/AppContext";
import type { UserRole } from "@/data/types";
import { colors, fonts, radius, shadow, spacing, type } from "@/theme/tokens";

type Mode = "sign-in" | "sign-up";
/** Only two login types in the app UI */
type LoginType = "user" | "dealer";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


function preferredToLoginType(role: UserRole): LoginType {
  return role === "broker" ? "dealer" : "user";
}

function loginTypeToPreferred(loginType: LoginType): UserRole {
  return loginType === "dealer" ? "broker" : "user";
}

// ─── Decorative SVG-like dots for the hero background ───────────────────────
function HeroDots() {
  return (
    <View
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: "hidden",
      }}
      pointerEvents="none"
    >
      {/* Large faint circle top-right */}
      <View
        style={{
          position: "absolute",
          width: 220,
          height: 220,
          borderRadius: 110,
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.08)",
          top: -60,
          right: -60,
        }}
      />
      <View
        style={{
          position: "absolute",
          width: 140,
          height: 140,
          borderRadius: 70,
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.06)",
          top: -20,
          right: -20,
        }}
      />
      {/* Small accent dots */}
      <View
        style={{
          position: "absolute",
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: "rgba(224, 90, 54, 0.5)",
          top: 32,
          left: 28,
        }}
      />
      <View
        style={{
          position: "absolute",
          width: 5,
          height: 5,
          borderRadius: 3,
          backgroundColor: "rgba(255,255,255,0.15)",
          top: 56,
          left: 52,
        }}
      />
      <View
        style={{
          position: "absolute",
          width: 6,
          height: 6,
          borderRadius: 3,
          backgroundColor: "rgba(224, 90, 54, 0.3)",
          bottom: 24,
          right: 40,
        }}
      />
      {/* Bottom fade line */}
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 40,
          backgroundColor: "rgba(15,30,54,0.04)",
        }}
      />
    </View>
  );
}

export default function AuthScreen() {
  const router = useRouter();
  const { signIn, signUp, signOut, preferredRole, setPreferredRole, forgotPassword } = useApp();

  const [mode, setMode] = useState<Mode>("sign-in");
  const [loginType, setLoginType] = useState<LoginType>(preferredToLoginType(preferredRole));
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string }>({});
  const [busy, setBusy] = useState(false);
  const [focusedField, setFocusedField] = useState<"name" | "email" | "password" | null>(null);

  const isSignUp = mode === "sign-up";
  const isDealer = loginType === "dealer";

  const selectLoginType = (next: LoginType) => {
    setLoginType(next);
    setPreferredRole(loginTypeToPreferred(next));
    setErrors({});
  };

  const validate = () => {
    const next: typeof errors = {};
    if (isSignUp && name.trim().length < 2) {
      next.name = "Enter your name.";
    }
    if (!EMAIL_RE.test(email.trim())) {
      next.email = "Enter a valid email address.";
    }
    if (password.length < 8) {
      next.password = "Password must be at least 8 characters.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const finishAuth = (result: {
    ok: true;
    role: UserRole;
    dealerAccess?: string;
  }) => {
    const isDealerAccount = result.role === "broker" || result.dealerAccess === "pending";

    if (loginType === "user" && result.role === "broker") {
      signOut();
      appAlert(
        "Dealer account",
        "This email is registered as a Dealer. Switch to Dealer login and try again.",
      );
      return;
    }

    if (loginType === "dealer" && !isDealerAccount) {
      if (isSignUp) {
        setPreferredRole("broker");
        router.replace("/dealer-register" as Href);
        return;
      }
      signOut();
      appAlert(
        "Not a dealer account",
        "This email is a User account. Switch to User login, or sign up as Dealer to register your directory.",
      );
      return;
    }

    if (loginType === "dealer" && result.role !== "broker" && result.dealerAccess === "pending") {
      router.replace("/dealer-pending" as Href);
    }
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setBusy(true);
    try {
      if (isSignUp) {
        const result = await signUp({
          email: email.trim(),
          password,
          name: name.trim(),
        });
        if (!result.ok) {
          appAlert("Sign up failed", result.message);
          return;
        }
        setPreferredRole(loginTypeToPreferred(loginType));
        if (isDealer) {
          router.replace("/dealer-register" as Href);
        }
        return;
      }

      const result = await signIn(email.trim(), password);
      if (!result.ok) {
        appAlert(
          result.code === "admin_unsupported" ? "Use web admin" : "Sign in failed",
          result.message,
        );
        return;
      }
      finishAuth(result);
    } finally {
      setBusy(false);
    }
  };

  const switchMode = (next: Mode) => {
    setMode(next);
    setErrors({});
  };

  const fieldStyle = (field: "name" | "email" | "password") => ({
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: focusedField === field ? 1.5 : 1,
    borderColor:
      errors[field]
        ? colors.danger
        : focusedField === field
          ? colors.accent
          : colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    height: 52,
  });

  return (
    <SafeAreaView edges={["top", "bottom"]} style={{ flex: 1, backgroundColor: colors.primary }}>
      <KeyboardAvoidingView
        behavior={process.env.EXPO_OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1 }}
        >
          {/* ── Hero Header ─────────────────────────────────────────────── */}
          <View
            style={{
              backgroundColor: colors.primary,
              paddingHorizontal: 28,
              paddingTop: 28,
              paddingBottom: 44,
              alignItems: "center",
              gap: spacing.sm,
              minHeight: 180,
            }}
          >
            <HeroDots />

            {/* Brand wordmark */}
            <Text
              style={{
                fontFamily: fonts.logo,
                fontSize: 38,
                fontWeight: "600",
                color: "#FFFFFF",
                letterSpacing: -0.5,
              }}
            >
              SqftGo
            </Text>

            {/* Tagline */}
            <Text
              style={{
                fontFamily: fonts.sansRegular,
                fontSize: 14,
                fontWeight: "400",
                color: "rgba(255,255,255,0.55)",
                letterSpacing: 0.2,
              }}
            >
              {isDealer
                ? "Your dealer portal for listings & leads"
                : "Find your perfect home"}
            </Text>
          </View>

          {/* ── Form Sheet Card ─────────────────────────────────────────── */}
          <View
            style={{
              flex: 1,
              backgroundColor: colors.bg,
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              marginTop: -20,
              paddingHorizontal: 24,
              paddingTop: 28,
              paddingBottom: 24,
              gap: 24,
            }}
          >
            {/* Sheet header */}
            <View style={{ gap: 4 }}>
              <Text
                style={{
                  ...type.title,
                  color: colors.ink,
                  fontSize: 20,
                }}
              >
                {isSignUp ? "Create your account" : "Welcome back"}
              </Text>
              <Text style={{ ...type.body, color: colors.inkMuted, fontSize: 14 }}>
                {isDealer
                  ? isSignUp
                    ? "Register as a dealer to publish listings."
                    : "Sign in to manage your properties."
                  : isSignUp
                    ? "Save homes and contact local dealers."
                    : "Sign in to browse verified properties."}
              </Text>
            </View>

            {/* ── Account Type Pill Selector ───────────────────────────── */}
            <View
              style={{
                flexDirection: "row",
                backgroundColor: colors.surfaceSubtle,
                borderRadius: radius.full,
                padding: 3,
              }}
            >
              {(
                [
                  { id: "user" as const, label: "Buyer" },
                  { id: "dealer" as const, label: "Dealer" },
                ] as const
              ).map((opt) => {
                const active = loginType === opt.id;
                return (
                  <Pressable
                    key={opt.id}
                    onPress={() => selectLoginType(opt.id)}
                    disabled={busy}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    style={{
                      flex: 1,
                      height: 38,
                      borderRadius: radius.full,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: active ? colors.accent : "transparent",
                      boxShadow: active ? shadow.button : undefined,
                      opacity: busy ? 0.7 : 1,
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: fonts.sansSemiBold,
                        fontSize: 14,
                        fontWeight: "600",
                        color: active ? colors.onAccent : colors.inkMuted,
                      }}
                    >
                      {opt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* ── Form Input Fields ─────────────────────────────────────── */}
            <View style={{ gap: spacing.md }}>
              {isSignUp ? (
                <View style={{ gap: spacing.xs }}>
                  <Text style={{ ...type.label, color: colors.inkSecondary }}>Full name</Text>
                  <View style={fieldStyle("name")}>
                    <User size={17} color={focusedField === "name" ? colors.accent : colors.inkMuted} />
                    <TextInput
                      value={name}
                      onChangeText={(v) => {
                        setName(v);
                        if (errors.name) setErrors((e) => ({ ...e, name: undefined }));
                      }}
                      onFocus={() => setFocusedField("name")}
                      onBlur={() => setFocusedField(null)}
                      placeholder="Enter your name"
                      placeholderTextColor={colors.inkMuted}
                      autoCapitalize="words"
                      editable={!busy}
                      accessibilityLabel="Full name"
                      style={{ flex: 1, ...type.body, lineHeight: undefined, color: colors.ink }}
                    />
                  </View>
                  {errors.name ? (
                    <Text style={{ ...type.caption, color: colors.danger }}>{errors.name}</Text>
                  ) : null}
                </View>
              ) : null}

              <View style={{ gap: spacing.xs }}>
                <Text style={{ ...type.label, color: colors.inkSecondary }}>Email address</Text>
                <View style={fieldStyle("email")}>
                  <Mail size={17} color={focusedField === "email" ? colors.accent : colors.inkMuted} />
                  <TextInput
                    value={email}
                    onChangeText={(v) => {
                      setEmail(v);
                      if (errors.email) setErrors((e) => ({ ...e, email: undefined }));
                    }}
                    onFocus={() => setFocusedField("email")}
                    onBlur={() => setFocusedField(null)}
                    placeholder="name@example.com"
                    placeholderTextColor={colors.inkMuted}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="email"
                    editable={!busy}
                    accessibilityLabel="Email address"
                    style={{ flex: 1, ...type.body, lineHeight: undefined, color: colors.ink }}
                  />
                </View>
                {errors.email ? (
                  <Text selectable style={{ ...type.caption, color: colors.danger }}>
                    {errors.email}
                  </Text>
                ) : null}
              </View>

              <View style={{ gap: spacing.xs }}>
                <Text style={{ ...type.label, color: colors.inkSecondary }}>Password</Text>
                <View style={fieldStyle("password")}>
                  <Lock size={17} color={focusedField === "password" ? colors.accent : colors.inkMuted} />
                  <TextInput
                    value={password}
                    onChangeText={(v) => {
                      setPassword(v);
                      if (errors.password) setErrors((e) => ({ ...e, password: undefined }));
                    }}
                    onFocus={() => setFocusedField("password")}
                    onBlur={() => setFocusedField(null)}
                    placeholder={isSignUp ? "At least 8 characters" : "Enter password"}
                    placeholderTextColor={colors.inkMuted}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoComplete={isSignUp ? "new-password" : "current-password"}
                    editable={!busy}
                    accessibilityLabel="Password"
                    style={{ flex: 1, ...type.body, lineHeight: undefined, color: colors.ink }}
                  />
                  <Pressable
                    onPress={() => setShowPassword((s) => !s)}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff size={17} color={colors.inkMuted} />
                    ) : (
                      <Eye size={17} color={colors.inkMuted} />
                    )}
                  </Pressable>
                </View>
                {errors.password ? (
                  <Text style={{ ...type.caption, color: colors.danger }}>{errors.password}</Text>
                ) : null}
              </View>

              {!isSignUp ? (
                <Pressable
                  onPress={() => {
                    const target = email.trim();
                    if (!target) {
                      appAlert("Email required", "Enter your account email address.");
                      return;
                    }
                    void (async () => {
                      const res = await forgotPassword(target);
                      appAlert(
                        res.ok ? "Check your inbox" : "Reset failed",
                        res.message ?? (res.ok ? "Password reset instructions sent." : "Unable to send reset email."),
                      );
                    })();
                  }}
                  hitSlop={8}
                  disabled={busy}
                  accessibilityRole="button"
                  style={{ alignSelf: "flex-end" }}
                >
                  <Text style={{ ...type.caption, color: colors.accent, fontWeight: "500" }}>
                    Forgot password?
                  </Text>
                </Pressable>
              ) : null}

              {/* CTA Button */}
              <Pressable
                onPress={() => void handleSubmit()}
                disabled={busy}
                accessibilityRole="button"
                style={({ pressed }) => ({
                  height: 52,
                  borderRadius: radius.lg,
                  backgroundColor: colors.accent,
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: pressed || busy ? 0.85 : 1,
                  boxShadow: shadow.button,
                  marginTop: 4,
                })}
              >
                {busy ? (
                  <ActivityIndicator color={colors.onAccent} />
                ) : (
                  <Text
                    style={{
                      fontFamily: fonts.sansSemiBold,
                      fontSize: 16,
                      fontWeight: "600",
                      color: colors.onAccent,
                      letterSpacing: 0.1,
                    }}
                  >
                    {isSignUp ? "Create Account" : "Sign In"}
                  </Text>
                )}
              </Pressable>

              {/* Mode switcher */}
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: spacing.xs,
                  marginTop: spacing.xs,
                }}
              >
                <Text style={{ ...type.body, color: colors.inkMuted, fontSize: 14 }}>
                  {isSignUp ? "Already have an account?" : "Don't have an account?"}
                </Text>
                <Pressable
                  onPress={() => switchMode(isSignUp ? "sign-in" : "sign-up")}
                  disabled={busy}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel={isSignUp ? "Sign In" : "Sign Up"}
                >
                  <Text
                    style={{
                      fontFamily: fonts.sansSemiBold,
                      fontSize: 14,
                      fontWeight: "600",
                      color: colors.accent,
                    }}
                  >
                    {isSignUp ? "Sign In" : "Sign Up"}
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Terms */}
            <Text
              style={{
                ...type.caption,
                color: colors.inkMuted,
                textAlign: "center",
                marginTop: "auto",
                paddingTop: spacing.md,
              }}
            >
              By continuing, you agree to our Terms of Service and Privacy Policy.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
