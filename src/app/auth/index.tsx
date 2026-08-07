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
import { useRouter, type Href } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Briefcase,
  Eye,
  EyeOff,
  Home as HomeIcon,
  Lock,
  Mail,
  User,
} from "@/components/ui/icons";

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
    borderCurve: "continuous" as const,
    paddingHorizontal: spacing.md,
    height: 50,
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
          <View style={{ alignItems: "center", gap: spacing.md }}>
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: radius.lg,
                borderCurve: "continuous",
                backgroundColor: colors.accent,
                alignItems: "center",
                justifyContent: "center",
                boxShadow: shadow.accent,
              }}
            >
              <HomeIcon size={28} color={colors.onAccent} />
            </View>
            <Text style={{ ...type.title, color: colors.ink }}>SqftGo</Text>
            <Text style={{ ...type.heading, color: colors.ink }}>
              {isSignUp ? "Create your account" : "Welcome back"}
            </Text>
            <Text
              style={{
                ...type.body,
                color: colors.inkMuted,
                textAlign: "center",
                maxWidth: 300,
              }}
            >
              {isDealer
                ? isSignUp
                  ? "Dealer signup creates a user account first, then you register your directory."
                  : "Sign in to your dealer dashboard to manage listings and leads."
                : isSignUp
                  ? "Save homes, inquire with dealers, and book site visits."
                  : "Sign in to browse homes, favorites, and inquiries."}
            </Text>
          </View>

          <View style={{ gap: spacing.sm }}>
            <Text style={{ ...type.label, color: colors.inkMuted, letterSpacing: 0.4 }}>
              CONTINUE AS
            </Text>
            <View style={{ flexDirection: "row", gap: spacing.sm }}>
              {(
                [
                  {
                    id: "user" as const,
                    label: "User",
                    desc: "Buy · Rent · Inquire",
                    Icon: User,
                  },
                  {
                    id: "dealer" as const,
                    label: "Dealer",
                    desc: "List · Leads · Visits",
                    Icon: Briefcase,
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
                      borderWidth: 1.5,
                      borderColor: active ? colors.accent : colors.border,
                      borderRadius: radius.lg,
                      borderCurve: "continuous",
                      padding: spacing.md,
                      gap: spacing.sm,
                      boxShadow: active ? shadow.card : undefined,
                      opacity: busy ? 0.7 : 1,
                    }}
                  >
                    <View
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: radius.md,
                        backgroundColor: active ? colors.accent : colors.surfaceSubtle,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <opt.Icon size={18} color={active ? colors.onAccent : colors.ink} />
                    </View>
                    <Text style={{ ...type.emphasis, color: active ? colors.accent : colors.ink }}>
                      {opt.label}
                    </Text>
                    <Text style={{ ...type.micro, color: colors.inkMuted }}>{opt.desc}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View
            style={{
              flexDirection: "row",
              backgroundColor: colors.surfaceSubtle,
              borderRadius: radius.md,
              borderCurve: "continuous",
              padding: spacing.xs,
            }}
          >
            {(
              [
                { id: "sign-in", label: "Sign In" },
                { id: "sign-up", label: "Sign Up" },
              ] as const
            ).map((tab) => {
              const active = mode === tab.id;
              return (
                <Pressable
                  key={tab.id}
                  onPress={() => switchMode(tab.id)}
                  disabled={busy}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: active }}
                  style={{
                    flex: 1,
                    alignItems: "center",
                    paddingVertical: spacing.sm + 2,
                    borderRadius: radius.sm,
                    borderCurve: "continuous",
                    backgroundColor: active ? colors.surface : "transparent",
                    boxShadow: active ? shadow.card : undefined,
                  }}
                >
                  <Text
                    style={{
                      ...type.label,
                      color: active ? colors.ink : colors.inkMuted,
                    }}
                  >
                    {tab.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={{ gap: spacing.md }}>
            {isSignUp ? (
              <View style={{ gap: spacing.xs }}>
                <View style={fieldStyle(!!errors.name)}>
                  <User size={16} color={colors.inkMuted} />
                  <TextInput
                    value={name}
                    onChangeText={(v) => {
                      setName(v);
                      if (errors.name) setErrors((e) => ({ ...e, name: undefined }));
                    }}
                    placeholder="Full name"
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
              <View style={fieldStyle(!!errors.email)}>
                <Mail size={16} color={colors.inkMuted} />
                <TextInput
                  value={email}
                  onChangeText={(v) => {
                    setEmail(v);
                    if (errors.email) setErrors((e) => ({ ...e, email: undefined }));
                  }}
                  placeholder="you@example.com"
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
              <View style={fieldStyle(!!errors.password)}>
                <Lock size={16} color={colors.inkMuted} />
                <TextInput
                  value={password}
                  onChangeText={(v) => {
                    setPassword(v);
                    if (errors.password) setErrors((e) => ({ ...e, password: undefined }));
                  }}
                  placeholder={isSignUp ? "Create a password" : "Password"}
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
                    Alert.alert("Email required", "Enter your account email first.");
                    return;
                  }
                  void (async () => {
                    const res = await forgotPassword(target);
                    Alert.alert(
                      res.ok ? "Check your email" : "Reset failed",
                      res.message ?? (res.ok ? "Reset link sent." : "Unable to reset."),
                    );
                  })();
                }}
                hitSlop={8}
                disabled={busy}
                accessibilityRole="button"
                style={{ alignSelf: "flex-end" }}
              >
                <Text style={{ ...type.label, color: colors.accent }}>Forgot password?</Text>
              </Pressable>
            ) : null}

            <Pressable
              onPress={() => void handleSubmit()}
              disabled={busy}
              accessibilityRole="button"
              style={({ pressed }) => ({
                height: 50,
                borderRadius: radius.md,
                borderCurve: "continuous",
                backgroundColor: colors.accent,
                alignItems: "center",
                justifyContent: "center",
                opacity: pressed || busy ? 0.85 : 1,
                boxShadow: shadow.accent,
              })}
            >
              {busy ? (
                <ActivityIndicator color={colors.onAccent} />
              ) : (
                <Text style={{ ...type.emphasis, color: colors.onAccent }}>
                  {isSignUp
                    ? isDealer
                      ? "Sign up as Dealer"
                      : "Sign up as User"
                    : isDealer
                      ? "Sign in as Dealer"
                      : "Sign in as User"}
                </Text>
              )}
            </Pressable>
          </View>

          <Text
            style={{
              ...type.caption,
              color: colors.inkMuted,
              textAlign: "center",
            }}
          >
            By continuing you agree to our Terms of Service and Privacy Policy.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
