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
  Alert,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useApp } from "@/context/AppContext";
import type { UserRole } from "@/data/types";
import { colors, radius, shadow, spacing, type } from "@/theme/tokens";

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
      Alert.alert(
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
      Alert.alert(
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
          Alert.alert("Sign up failed", result.message);
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
        Alert.alert(
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

  const fieldStyle = (hasError: boolean) => ({
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: hasError ? colors.danger : colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 48,
  });

  return (
    <SafeAreaView edges={["top", "bottom"]} style={{ flex: 1, backgroundColor: colors.bg }}>
      <KeyboardAvoidingView
        behavior={process.env.EXPO_OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: "center",
            paddingHorizontal: spacing.xl,
            paddingVertical: spacing.xxl,
            gap: spacing.xl,
          }}
        >
          {/* Header Brand Section */}
          <View style={{ alignItems: "center", gap: spacing.xs }}>
            <Text style={{ ...type.logo, color: colors.primary, fontSize: 28 }}>SqftGo</Text>
            <Text style={{ ...type.title, color: colors.ink, marginTop: spacing.xs }}>
              {isSignUp ? "Create your account" : "Welcome"}
            </Text>
            <Text
              style={{
                ...type.body,
                color: colors.inkMuted,
                textAlign: "center",
                maxWidth: 320,
              }}
            >
              {isDealer
                ? isSignUp
                  ? "Register as a dealer to publish listings and connect with active buyers."
                  : "Sign in to your dealer portal to manage properties and client inquiries."
                : isSignUp
                  ? "Create a user account to save favorite homes and contact local dealers."
                  : "Sign in to browse verified properties, saved homes, and inquiries."}
            </Text>
          </View>

          {/* Account Type Selection (Plain outline icons when unselected) */}
          <View style={{ gap: spacing.xs + 2 }}>
            <Text style={{ ...type.label, color: colors.inkSecondary }}>
              Select account type
            </Text>
            <View style={{ flexDirection: "row", gap: spacing.sm }}>
              {(
                [
                  {
                    id: "user" as const,
                    label: "Buyer",
                  },
                  {
                    id: "dealer" as const,
                    label: "Dealer",
                  },
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
                      backgroundColor: active ? colors.accentSoft : colors.surface,
                      borderWidth: active ? 1.5 : 1,
                      borderColor: active ? colors.accent : colors.border,
                      borderRadius: radius.lg,
                      padding: spacing.md,
                      gap: 4,
                      boxShadow: active ? shadow.card : undefined,
                      opacity: busy ? 0.7 : 1,
                    }}
                  >
                    <Text style={{ ...type.emphasis, color: active ? colors.accent : colors.ink }}>
                      {opt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Form Input Fields */}
          <View style={{ gap: spacing.md }}>
            {isSignUp ? (
              <View style={{ gap: spacing.xs }}>
                <Text style={{ ...type.label, color: colors.inkSecondary }}>Full name</Text>
                <View style={fieldStyle(!!errors.name)}>
                  <User size={16} color={colors.inkMuted} />
                  <TextInput
                    value={name}
                    onChangeText={(v) => {
                      setName(v);
                      if (errors.name) setErrors((e) => ({ ...e, name: undefined }));
                    }}
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
              <View style={fieldStyle(!!errors.email)}>
                <Mail size={16} color={colors.inkMuted} />
                <TextInput
                  value={email}
                  onChangeText={(v) => {
                    setEmail(v);
                    if (errors.email) setErrors((e) => ({ ...e, email: undefined }));
                  }}
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
              <View style={fieldStyle(!!errors.password)}>
                <Lock size={16} color={colors.inkMuted} />
                <TextInput
                  value={password}
                  onChangeText={(v) => {
                    setPassword(v);
                    if (errors.password) setErrors((e) => ({ ...e, password: undefined }));
                  }}
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
                    <EyeOff size={16} color={colors.inkMuted} />
                  ) : (
                    <Eye size={16} color={colors.inkMuted} />
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
                    Alert.alert("Email required", "Enter your account email address.");
                    return;
                  }
                  void (async () => {
                    const res = await forgotPassword(target);
                    Alert.alert(
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

            <Pressable
              onPress={() => void handleSubmit()}
              disabled={busy}
              accessibilityRole="button"
              style={({ pressed }) => ({
                height: 48,
                borderRadius: radius.md,
                backgroundColor: colors.accent,
                alignItems: "center",
                justifyContent: "center",
                opacity: pressed || busy ? 0.88 : 1,
                boxShadow: shadow.button,
                borderWidth: 1,
                borderColor: colors.accentBorder,
              })}
            >
              {busy ? (
                <ActivityIndicator color={colors.onAccent} />
              ) : (
                <Text style={{ ...type.emphasis, color: colors.onAccent }}>
                  Sign In
                </Text>
              )}
            </Pressable>

            {/* Bottom Footer Switcher (Standard App Auth Layout) */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "center",
                alignItems: "center",
                gap: spacing.xs,
                marginTop: spacing.xs,
              }}
            >
              <Text style={{ ...type.body, color: colors.inkMuted }}>
                {isSignUp ? "Already have an account?" : "Don't have an account?"}
              </Text>
              <Pressable
                onPress={() => switchMode(isSignUp ? "sign-in" : "sign-up")}
                disabled={busy}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={isSignUp ? "Sign In" : "Sign Up"}
              >
                <Text style={{ ...type.emphasis, color: colors.accent, fontWeight: "600" }}>
                  {isSignUp ? "Sign In" : "Sign Up"}
                </Text>
              </Pressable>
            </View>
          </View>

          <Text
            style={{
              ...type.caption,
              color: colors.inkMuted,
              textAlign: "center",
            }}
          >
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

