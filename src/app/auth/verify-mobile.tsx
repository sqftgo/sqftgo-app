import { Redirect, useLocalSearchParams, useRouter, type Href } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/components/ds/Button";
import { ChevronLeft } from "@/components/ui/icons";
import { useApp } from "@/context/AppContext";
import { getLastPortal, postAuthDestination } from "@/lib/post-auth";
import { COUNTRY_CODES, formatMobile, validateMobile } from "@/lib/phone";
import { colors, fonts, radius, spacing, touchTarget, type } from "@/theme/tokens";

const CODE_LENGTH = 6;

export default function VerifyMobileScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ purpose?: string }>();
  const updating = params.purpose === "update";
  const {
    isLoggedIn,
    profile,
    userRole,
    dealerAccess,
    sendMobileOtp,
    verifyMobileOtp,
    signOut,
  } = useApp();

  const [countryCode, setCountryCode] = useState(profile?.countryCode || "91");
  const [mobile, setMobile] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [previewCode, setPreviewCode] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [busy, setBusy] = useState<"send" | "verify" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setInterval(() => setSecondsLeft((value) => Math.max(0, value - 1)), 1000);
    return () => clearInterval(timer);
  }, [secondsLeft]);

  const country = COUNTRY_CODES.find((item) => item.code === countryCode) ?? COUNTRY_CODES[0];

  const finish = () => {
    if (updating) {
      router.replace("/settings/profile" as Href);
      return;
    }
    const href = postAuthDestination({
      portal: getLastPortal(),
      role: userRole ?? "user",
      dealerAccess,
      needsMobile: false,
    });
    router.replace(href);
  };

  const send = async () => {
    const problem = validateMobile(countryCode, mobile);
    if (problem) {
      setError(problem);
      return;
    }
    setBusy("send");
    setError(null);
    try {
      const result = await sendMobileOtp({ countryCode, mobileNumber: mobile });
      if (!result.ok) {
        if (result.resendAfterSeconds) setSecondsLeft(result.resendAfterSeconds);
        setError(result.message);
        return;
      }
      setSent(true);
      setCode("");
      setPreviewCode(result.previewCode ?? null);
      setSecondsLeft(result.resendAfterSeconds);
      requestAnimationFrame(() => inputRef.current?.focus());
    } finally {
      setBusy(null);
    }
  };

  const verify = async (nextCode = code) => {
    if (nextCode.length !== CODE_LENGTH) {
      setError("Enter the 6-digit code.");
      return;
    }
    setBusy("verify");
    setError(null);
    try {
      const result = await verifyMobileOtp(nextCode);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      finish();
    } finally {
      setBusy(null);
    }
  };

  if (!isLoggedIn) {
    return <Redirect href={{ pathname: "/auth", params: { mode: "sign-in" } }} />;
  }

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.root}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.flex}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scroll}>
          <View style={styles.topRow}>
            <Pressable
              onPress={() => {
                if (updating && router.canGoBack()) router.back();
                else signOut();
              }}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel={updating ? "Back" : "Sign out"}
              style={styles.backBtn}
            >
              <ChevronLeft size={18} color={colors.ink} />
            </Pressable>
            <Text style={styles.logo}>SqftGo</Text>
            <View style={styles.headerSpacer} />
          </View>

          <View style={styles.headingBlock}>
            <Text style={styles.title}>{updating ? "Update your mobile" : "Verify your mobile"}</Text>
            <Text style={styles.subtitle}>
              {sent
                ? `Enter the code sent to ${formatMobile(countryCode, mobile)}.`
                : "Google sign-in is linked to your email. Add a mobile number so dealers and service partners can reach you."}
            </Text>
          </View>

          {sent ? (
            <View style={styles.form}>
              <Pressable onPress={() => inputRef.current?.focus()} accessibilityRole="button" accessibilityLabel="Verification code">
                <View style={styles.codeRow}>
                  {Array.from({ length: CODE_LENGTH }, (_, index) => {
                    const active = index === code.length;
                    return (
                      <View key={index} style={[styles.codeCell, active && styles.codeCellActive, code[index] ? styles.codeCellFilled : null]}>
                        <Text style={styles.codeDigit}>{code[index] ?? ""}</Text>
                      </View>
                    );
                  })}
                </View>
                <TextInput
                  ref={inputRef}
                  value={code}
                  onChangeText={(value) => {
                    const next = value.replace(/\D/g, "").slice(0, CODE_LENGTH);
                    setCode(next);
                    if (error) setError(null);
                    if (next.length === CODE_LENGTH) void verify(next);
                  }}
                  keyboardType="number-pad"
                  textContentType="oneTimeCode"
                  autoComplete="sms-otp"
                  maxLength={CODE_LENGTH}
                  style={styles.hiddenInput}
                  autoFocus
                />
              </Pressable>
              {previewCode ? (
                <Text style={styles.preview}>Offline preview code {previewCode}</Text>
              ) : null}
              <Pressable
                onPress={() => void send()}
                disabled={secondsLeft > 0 || busy !== null}
                accessibilityRole="button"
                style={styles.resend}
              >
                <Text style={[styles.resendText, (secondsLeft > 0 || busy !== null) && styles.resendDisabled]}>
                  {secondsLeft > 0 ? `Resend code in ${secondsLeft}s` : "Resend code"}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  setSent(false);
                  setCode("");
                  setPreviewCode(null);
                  setError(null);
                }}
                accessibilityRole="button"
              >
                <Text style={styles.changeNumber}>Use a different number</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.form}>
              <Text style={styles.label}>Mobile number</Text>
              <View style={styles.phoneRow}>
                <Pressable
                  onPress={() => setPickerOpen(true)}
                  accessibilityRole="button"
                  accessibilityLabel={`Country code +${country.code}`}
                  style={styles.countryBtn}
                >
                  <Text style={styles.countryText}>+{country.code}</Text>
                  <Text style={styles.countryName} numberOfLines={1}>{country.label}</Text>
                </Pressable>
                <TextInput
                  value={mobile}
                  onChangeText={(value) => {
                    setMobile(value.replace(/[^\d\s]/g, ""));
                    if (error) setError(null);
                  }}
                  placeholder={country.code === "91" ? "98765 43210" : "Mobile number"}
                  placeholderTextColor={colors.placeholder}
                  keyboardType="phone-pad"
                  autoComplete="tel"
                  style={styles.phoneInput}
                />
              </View>
            </View>
          )}

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Button
            label={sent ? "Verify and continue" : "Send code"}
            loading={busy !== null}
            onPress={() => void (sent ? verify() : send())}
            fullWidth
          />
          {!updating ? (
            <Pressable onPress={() => signOut()} accessibilityRole="button" style={styles.signOut}>
              <Text style={styles.changeNumber}>Sign out</Text>
            </Pressable>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={pickerOpen} animationType="slide" transparent onRequestClose={() => setPickerOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setPickerOpen(false)}>
          <Pressable style={styles.modalSheet} onPress={() => {}}>
            <Text style={styles.modalTitle}>Country code</Text>
            {COUNTRY_CODES.map((item) => {
              const selected = item.code === countryCode;
              return (
                <Pressable
                  key={item.code}
                  onPress={() => {
                    setCountryCode(item.code);
                    setPickerOpen(false);
                  }}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  style={[styles.countryOption, selected && styles.countryOptionActive]}
                >
                  <Text style={styles.countryOptionCode}>+{item.code}</Text>
                  <Text style={styles.countryOptionLabel}>{item.label}</Text>
                </Pressable>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>
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
  topRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
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
  logo: { fontFamily: fonts.logo, fontSize: 22, fontWeight: "600", color: colors.primary },
  headingBlock: { gap: spacing.xs },
  title: { ...type.hero, color: colors.ink },
  subtitle: { ...type.body, color: colors.inkMuted },
  form: { gap: spacing.lg },
  label: { ...type.label, color: colors.inkSecondary },
  phoneRow: { flexDirection: "row", gap: spacing.sm },
  countryBtn: {
    width: 108,
    minHeight: touchTarget + 8,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    justifyContent: "center",
    paddingHorizontal: spacing.md,
  },
  countryText: { ...type.label, color: colors.ink, fontFamily: fonts.sansSemiBold, fontWeight: "600" },
  countryName: { ...type.caption, color: colors.inkMuted },
  phoneInput: {
    flex: 1,
    minHeight: touchTarget + 8,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    ...type.body,
    color: colors.ink,
  },
  codeRow: { flexDirection: "row", justifyContent: "space-between", gap: spacing.sm },
  codeCell: {
    flex: 1,
    aspectRatio: 0.82,
    maxHeight: 64,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  codeCellActive: { borderColor: colors.primary },
  codeCellFilled: { backgroundColor: colors.primarySoft, borderColor: colors.primaryBorder },
  codeDigit: { ...type.title, color: colors.ink },
  hiddenInput: { position: "absolute", opacity: 0, height: 1, width: 1 },
  preview: { ...type.caption, color: colors.inkSecondary, textAlign: "center" },
  resend: { alignSelf: "center" },
  resendText: { ...type.label, color: colors.accent, fontFamily: fonts.sansSemiBold, fontWeight: "600" },
  resendDisabled: { color: colors.inkMuted },
  changeNumber: { ...type.label, color: colors.primary, textAlign: "center" },
  error: { ...type.body, color: colors.danger },
  signOut: { alignSelf: "center" },
  modalBackdrop: { flex: 1, justifyContent: "flex-end", backgroundColor: colors.overlay },
  modalSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.xl,
    gap: spacing.sm,
  },
  modalTitle: { ...type.title, color: colors.ink, marginBottom: spacing.sm },
  countryOption: {
    minHeight: touchTarget,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  countryOptionActive: { backgroundColor: colors.primarySoft },
  countryOptionCode: { width: 56, ...type.label, color: colors.ink, fontFamily: fonts.sansSemiBold, fontWeight: "600" },
  countryOptionLabel: { ...type.body, color: colors.ink },
});
