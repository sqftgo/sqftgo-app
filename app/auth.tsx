import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Eye, EyeOff, Home as HomeIcon, Lock, Mail } from "lucide-react-native";

import { useApp } from "@/context/AppContext";
import { colors, radius, shadow, spacing, type } from "@/theme/tokens";

type Mode = "sign-in" | "sign-up";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function AuthScreen() {
  const { signIn, preferredRole: role } = useApp();

  const [mode, setMode] = useState<Mode>("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const isSignUp = mode === "sign-up";

  const validate = () => {
    const next: typeof errors = {};
    if (!EMAIL_RE.test(email.trim())) {
      next.email = "Enter a valid email address.";
    }
    if (password.length < 6) {
      next.password = "Password must be at least 6 characters.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    // Mock auth: any valid credentials create a session.
    // Guards in the root layout navigate to the tabs automatically.
    signIn(email.trim(), role);
  };

  const handleDemo = () => {
    signIn(role === "broker" ? "broker@svrepl.com" : "dipesh@gmail.com", role);
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
          {/* Brand header */}
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
            <Text style={{ ...type.title, color: colors.ink }}>
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
              {isSignUp
                ? "Save homes, get price alerts, and post listings for free."
                : "Sign in to pick up where you left off."}
            </Text>
          </View>

          {/* Mode switch */}
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

          {/* Form */}
          <View style={{ gap: spacing.md }}>
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
                  accessibilityLabel="Email address"
                  style={{ flex: 1, ...type.body, lineHeight: undefined, color: colors.ink }}
                />
              </View>
              {errors.email && (
                <Text selectable style={{ ...type.caption, color: colors.danger }}>
                  {errors.email}
                </Text>
              )}
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
              {errors.password && (
                <Text selectable style={{ ...type.caption, color: colors.danger }}>
                  {errors.password}
                </Text>
              )}
            </View>

            {!isSignUp && (
              <Pressable
                onPress={() =>
                  Alert.alert("Reset password", "Password reset will be available soon.")
                }
                hitSlop={8}
                accessibilityRole="button"
                style={{ alignSelf: "flex-end" }}
              >
                <Text style={{ ...type.label, color: colors.accent }}>Forgot password?</Text>
              </Pressable>
            )}

            <Pressable
              onPress={handleSubmit}
              accessibilityRole="button"
              style={({ pressed }) => ({
                height: 50,
                borderRadius: radius.md,
                borderCurve: "continuous",
                backgroundColor: colors.accent,
                alignItems: "center",
                justifyContent: "center",
                opacity: pressed ? 0.85 : 1,
                boxShadow: shadow.accent,
              })}
            >
              <Text style={{ ...type.emphasis, color: colors.onAccent }}>
                {isSignUp ? "Create account" : "Sign in"}
              </Text>
            </Pressable>

            <Pressable
              onPress={handleDemo}
              hitSlop={8}
              accessibilityRole="button"
              style={{ alignItems: "center", paddingVertical: spacing.sm }}
            >
              <Text style={{ ...type.label, color: colors.inkMuted }}>
                Continue with demo account
              </Text>
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
