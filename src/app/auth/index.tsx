import { Image } from "expo-image";
import { Redirect, useLocalSearchParams, useRouter, type Href } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
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
import { SegmentedControl } from "@/components/ds/SegmentedControl";
import { TextField } from "@/components/ds/TextField";
import { appAlert } from "@/components/ui/app-alert";
import { ChevronLeft, Globe, MapPin } from "@/components/ui/icons";
import { useApp } from "@/context/AppContext";
import { useCities } from "@/hooks/use-cities";
import { userFacingError } from "@/lib/errors";
import { COUNTRY_CODES, formatMobile, nationalDigits, validateMobile } from "@/lib/phone";
import type { AuthPortal } from "@/lib/service-access";
import { colors, fonts, radius, spacing, touchTarget, type } from "@/theme/tokens";

type Mode = "sign-in" | "sign-up";
type LoginType = AuthPortal;
type SignInChannel = "email" | "mobile";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CODE_LENGTH = 6;
const HERO_FALLBACK = require("../../../assets/images/OnBoarding1.jpg");

function modeFromParam(raw?: string): Mode {
  return raw === "sign-up" ? "sign-up" : "sign-in";
}

export default function AuthScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string }>();
  const { cities } = useCities();
  const {
    isLoggedIn,
    userRole,
    signIn,
    signUp,
    signInWithGoogle,
    sendAuthMobileOtp,
    verifyRegisterMobileOtp,
    signInWithMobile,
    preferredRole,
    setPreferredRole,
    landingHref,
    selectedCity,
    forgotPassword,
    isApiMode,
  } = useApp();

  const [mode, setMode] = useState<Mode>(modeFromParam(params.mode));
  const [loginType, setLoginType] = useState<LoginType>(
    preferredRole === "broker" ? "dealer" : "user",
  );
  const [signInChannel, setSignInChannel] = useState<SignInChannel>("email");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [countryCode, setCountryCode] = useState("91");
  const [mobile, setMobile] = useState("");
  const [code, setCode] = useState("");
  const [registerOtpStep, setRegisterOtpStep] = useState(false);
  const [mobileOtpSent, setMobileOtpSent] = useState(false);
  const [claimToken, setClaimToken] = useState<string | null>(null);
  const [previewCode, setPreviewCode] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [pickerOpen, setPickerOpen] = useState(false);
  const otpInputRef = useRef<TextInput>(null);
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    mobile?: string;
  }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState<"form" | "google" | "otp-send" | "otp-verify" | null>(null);

  const isSignUp = mode === "sign-up";
  const isDealer = loginType === "dealer";
  const showSignInChannelToggle = !isSignUp && loginType !== "provider";
  const useMobileSignIn = !isSignUp && signInChannel === "mobile" && loginType !== "provider";

  const heroSource = useMemo(() => {
    const match = cities.find((c) => c.name.toLowerCase() === selectedCity?.trim().toLowerCase());
    if (match?.image) return { uri: match.image };
    return HERO_FALLBACK;
  }, [cities, selectedCity]);

  const cityId = useMemo(() => {
    const match = cities.find((c) => c.name.toLowerCase() === selectedCity?.trim().toLowerCase());
    return match?.id;
  }, [cities, selectedCity]);

  const country = COUNTRY_CODES.find((item) => item.code === countryCode) ?? COUNTRY_CODES[0];

  useEffect(() => {
    setMode(modeFromParam(params.mode));
  }, [params.mode]);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setInterval(() => setSecondsLeft((value) => Math.max(0, value - 1)), 1000);
    return () => clearInterval(timer);
  }, [secondsLeft]);

  const copy = useMemo(() => {
    const city = selectedCity?.trim() || "your city";
    if (loginType === "provider") {
      return {
        title: "Service provider sign in",
        subtitle: `Open your ${city} dashboard if this account is an approved service provider.`,
        cta: "Sign in as provider",
      };
    }
    if (isSignUp) {
      return {
        title: isDealer ? "Create dealer account" : "Create your account",
        subtitle: isDealer
          ? `List properties and manage leads in ${city}.`
          : `Save homes, book visits, and talk to dealers in ${city}.`,
        cta: isDealer ? "Create dealer account" : "Create customer account",
      };
    }
    if (useMobileSignIn) {
      return {
        title: "Sign in with mobile",
        subtitle: `We'll send a one-time code on WhatsApp to sign you in.`,
        cta: mobileOtpSent ? "Verify and sign in" : "Send WhatsApp code",
      };
    }
    return {
      title: "Welcome back",
      subtitle: isDealer
        ? `Sign in to manage your ${city} listings and leads.`
        : `Sign in to see saved homes and visits in ${city}.`,
      cta: isDealer ? "Sign in as dealer" : "Sign in",
    };
  }, [isDealer, isSignUp, loginType, selectedCity, useMobileSignIn, mobileOtpSent]);

  const close = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/onboarding" as Href);
  };

  const resetOtpState = () => {
    setRegisterOtpStep(false);
    setMobileOtpSent(false);
    setCode("");
    setPreviewCode(null);
    setSecondsLeft(0);
    setClaimToken(null);
    setFormError(null);
  };

  const selectMode = (next: Mode) => {
    setMode(next);
    setErrors({});
    setPassword("");
    setConfirmPassword("");
    resetOtpState();
    setSignInChannel("email");
  };

  const selectLoginType = (next: LoginType) => {
    setLoginType(next);
    if (next !== "provider") setPreferredRole(next === "dealer" ? "broker" : "user");
    setErrors({});
    resetOtpState();
    if (next === "provider") setSignInChannel("email");
  };

  const validateEmailForm = () => {
    const next: typeof errors = {};
    if (isSignUp && name.trim().length < 2) next.name = "Enter your full name.";
    if (!EMAIL_RE.test(email.trim())) next.email = "Enter a valid email address.";
    if (password.length < 8) next.password = "Use at least 8 characters.";
    if (isSignUp && password !== confirmPassword) {
      next.confirmPassword = "Passwords do not match.";
    }
    if (isSignUp) {
      const mobileProblem = validateMobile(countryCode, mobile);
      if (mobileProblem) next.mobile = mobileProblem;
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const sendRegisterOtp = async () => {
    const mobileProblem = validateMobile(countryCode, mobile);
    if (mobileProblem) {
      setErrors((e) => ({ ...e, mobile: mobileProblem }));
      return;
    }
    setBusy("otp-send");
    setFormError(null);
    try {
      const result = await sendAuthMobileOtp({
        purpose: "register",
        countryCode,
        mobileNumber: mobile,
      });
      if (!result.ok) {
        if (result.resendAfterSeconds) setSecondsLeft(result.resendAfterSeconds);
        setFormError(result.message);
        return;
      }
      setRegisterOtpStep(true);
      setPreviewCode(result.previewCode ?? null);
      setSecondsLeft(result.resendAfterSeconds);
      requestAnimationFrame(() => otpInputRef.current?.focus());
    } finally {
      setBusy(null);
    }
  };

  const sendLoginOtp = async () => {
    const mobileProblem = validateMobile(countryCode, mobile);
    if (mobileProblem) {
      setFormError(mobileProblem);
      return;
    }
    setBusy("otp-send");
    setFormError(null);
    try {
      const result = await sendAuthMobileOtp({
        purpose: "login",
        countryCode,
        mobileNumber: mobile,
      });
      if (!result.ok) {
        if (result.resendAfterSeconds) setSecondsLeft(result.resendAfterSeconds);
        setFormError(result.message);
        return;
      }
      setMobileOtpSent(true);
      setCode("");
      setPreviewCode(result.previewCode ?? null);
      setSecondsLeft(result.resendAfterSeconds);
      requestAnimationFrame(() => otpInputRef.current?.focus());
    } finally {
      setBusy(null);
    }
  };

  const completeSignUp = async (token: string) => {
    setBusy("form");
    try {
      const result = await signUp({
        email: email.trim(),
        password,
        name: name.trim(),
        intent: isDealer ? "dealer" : "user",
        countryCode,
        mobileNumber: nationalDigits(countryCode, mobile),
        mobileClaimToken: token,
        cityId,
      });
      if (!result.ok) {
        appAlert("Couldn't create account", result.message);
        return;
      }
      if (isDealer) {
        router.replace("/dealer-register" as Href);
      }
    } catch (error) {
      appAlert("Couldn't create account", userFacingError(error, "Please try again."));
    } finally {
      setBusy(null);
    }
  };

  const verifyRegisterOtp = async (nextCode = code) => {
    if (nextCode.length !== CODE_LENGTH) {
      setFormError("Enter the 6-digit code.");
      return;
    }
    setBusy("otp-verify");
    setFormError(null);
    try {
      const result = await verifyRegisterMobileOtp({
        countryCode,
        mobileNumber: mobile,
        code: nextCode,
      });
      if (!result.ok) {
        setFormError(result.message);
        return;
      }
      setClaimToken(result.claimToken);
      await completeSignUp(result.claimToken);
    } finally {
      setBusy(null);
    }
  };

  const verifyLoginOtp = async (nextCode = code) => {
    if (nextCode.length !== CODE_LENGTH) {
      setFormError("Enter the 6-digit code.");
      return;
    }
    setBusy("otp-verify");
    setFormError(null);
    try {
      const result = await signInWithMobile(
        { countryCode, mobileNumber: mobile, code: nextCode },
        loginType,
      );
      if (!result.ok) {
        appAlert("Couldn't sign in", result.message);
      }
    } catch (error) {
      appAlert("Couldn't sign in", userFacingError(error, "Please try again."));
    } finally {
      setBusy(null);
    }
  };

  const handleSubmit = async () => {
    if (useMobileSignIn) {
      if (mobileOtpSent) {
        await verifyLoginOtp();
      } else {
        await sendLoginOtp();
      }
      return;
    }

    if (isSignUp && registerOtpStep) {
      await verifyRegisterOtp();
      return;
    }

    if (!validateEmailForm()) return;

    if (isSignUp && !claimToken) {
      await sendRegisterOtp();
      return;
    }

    setBusy("form");
    setFormError(null);
    try {
      if (isSignUp) {
        const token = claimToken;
        if (!token) {
          await sendRegisterOtp();
          return;
        }
        await completeSignUp(token);
        return;
      }

      const result = await signIn(email.trim(), password, loginType);
      if (!result.ok) {
        appAlert(
          result.code === "admin_unsupported" ? "Use the SqftGo website" : "Couldn't sign in",
          result.message,
        );
      }
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
    setFormError(null);
    try {
      const result = await signInWithGoogle(loginType);
      if (!result.ok) {
        if (!result.cancelled) {
          appAlert("Google sign-in failed", result.message);
        }
      }
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

  const showGoogle = isApiMode && !(isSignUp && (isDealer || loginType === "provider"));
  const providerSignup = isSignUp && loginType === "provider";
  const showOtpCells = (isSignUp && registerOtpStep) || (useMobileSignIn && mobileOtpSent);
  const busyAny = busy !== null;

  if (isLoggedIn) {
    return (
      <Redirect href={(landingHref ?? (userRole === "broker" ? "/(dealer)" : "/(tabs)")) as Href} />
    );
  }

  const otpSubtitle = showOtpCells
    ? `Enter the WhatsApp code sent to ${formatMobile(countryCode, mobile)}.`
    : null;

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

          <Image source={heroSource} style={styles.hero} contentFit="cover" accessibilityLabel="" />

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
            <Text style={styles.subtitle}>
              {otpSubtitle ?? copy.subtitle}
            </Text>
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
                { value: "provider", label: "Provider" },
              ]}
              value={loginType}
              onChange={selectLoginType}
            />
          </View>

          {showSignInChannelToggle ? (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Sign in with</Text>
              <SegmentedControl
                segments={[
                  { value: "email", label: "Email" },
                  { value: "mobile", label: "Mobile" },
                ]}
                value={signInChannel}
                onChange={(v) => {
                  setSignInChannel(v as SignInChannel);
                  resetOtpState();
                  setFormError(null);
                }}
              />
            </View>
          ) : null}

          {showGoogle && !useMobileSignIn && !registerOtpStep ? (
            <>
              <Button
                label="Continue with Google"
                icon={Globe}
                variant="secondary"
                loading={busy === "google"}
                disabled={busyAny && busy !== "google"}
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

          {providerSignup ? (
            <Text style={styles.helperNote}>
              Service provider access is approved on an existing account. Switch to Sign in and use the email on your approved profile.
            </Text>
          ) : null}

          {providerSignup ? null : showOtpCells ? (
            <View style={styles.form}>
              <Pressable
                onPress={() => otpInputRef.current?.focus()}
                accessibilityRole="button"
                accessibilityLabel="Verification code"
              >
                <View style={styles.codeRow}>
                  {Array.from({ length: CODE_LENGTH }, (_, index) => {
                    const active = index === code.length;
                    return (
                      <View
                        key={index}
                        style={[
                          styles.codeCell,
                          active && styles.codeCellActive,
                          code[index] ? styles.codeCellFilled : null,
                        ]}
                      >
                        <Text style={styles.codeDigit}>{code[index] ?? ""}</Text>
                      </View>
                    );
                  })}
                </View>
                <TextInput
                  ref={otpInputRef}
                  value={code}
                  onChangeText={(value) => {
                    const next = value.replace(/\D/g, "").slice(0, CODE_LENGTH);
                    setCode(next);
                    if (formError) setFormError(null);
                    if (next.length === CODE_LENGTH) {
                      void (isSignUp ? verifyRegisterOtp(next) : verifyLoginOtp(next));
                    }
                  }}
                  keyboardType="number-pad"
                  textContentType="oneTimeCode"
                  autoComplete="sms-otp"
                  maxLength={CODE_LENGTH}
                  style={styles.hiddenInput}
                  editable={!busyAny}
                />
              </Pressable>
              {previewCode ? (
                <Text style={styles.preview}>Offline preview code {previewCode}</Text>
              ) : null}
              <Pressable
                onPress={() =>
                  void (isSignUp
                    ? sendRegisterOtp()
                    : sendLoginOtp())
                }
                disabled={secondsLeft > 0 || busyAny}
                accessibilityRole="button"
                style={styles.resend}
              >
                <Text
                  style={[
                    styles.resendText,
                    (secondsLeft > 0 || busyAny) && styles.resendDisabled,
                  ]}
                >
                  {secondsLeft > 0 ? `Resend WhatsApp code in ${secondsLeft}s` : "Resend WhatsApp code"}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  if (isSignUp) {
                    setRegisterOtpStep(false);
                  } else {
                    setMobileOtpSent(false);
                  }
                  setCode("");
                  setPreviewCode(null);
                  setFormError(null);
                }}
                accessibilityRole="button"
              >
                <Text style={styles.changeNumber}>Use a different number</Text>
              </Pressable>
            </View>
          ) : useMobileSignIn ? (
            <View style={styles.form}>
              <Text style={styles.fieldLabel}>Mobile number</Text>
              <View style={styles.phoneRow}>
                <Pressable
                  onPress={() => setPickerOpen(true)}
                  accessibilityRole="button"
                  accessibilityLabel={`Country code +${country.code}`}
                  style={styles.countryBtn}
                  disabled={busyAny}
                >
                  <Text style={styles.countryText}>+{country.code}</Text>
                  <Text style={styles.countryName} numberOfLines={1}>
                    {country.label}
                  </Text>
                </Pressable>
                <TextInput
                  value={mobile}
                  onChangeText={(value) => {
                    setMobile(value.replace(/[^\d\s]/g, ""));
                    if (formError) setFormError(null);
                  }}
                  placeholder={country.code === "91" ? "98765 43210" : "Mobile number"}
                  placeholderTextColor={colors.placeholder}
                  keyboardType="phone-pad"
                  autoComplete="tel"
                  style={styles.phoneInput}
                  editable={!busyAny}
                />
              </View>
            </View>
          ) : (
            <View style={styles.form}>
              {isSignUp && !registerOtpStep ? (
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
                  editable={!busyAny}
                  required
                />
              ) : null}
              {!registerOtpStep ? (
                <>
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
                    editable={!busyAny}
                    required
                  />
                  {isSignUp ? (
                    <>
                      <Text style={styles.fieldLabel}>Mobile number</Text>
                      <View style={styles.phoneRow}>
                        <Pressable
                          onPress={() => setPickerOpen(true)}
                          accessibilityRole="button"
                          accessibilityLabel={`Country code +${country.code}`}
                          style={styles.countryBtn}
                          disabled={busyAny}
                        >
                          <Text style={styles.countryText}>+{country.code}</Text>
                          <Text style={styles.countryName} numberOfLines={1}>
                            {country.label}
                          </Text>
                        </Pressable>
                        <TextInput
                          value={mobile}
                          onChangeText={(value) => {
                            setMobile(value.replace(/[^\d\s]/g, ""));
                            if (errors.mobile) setErrors((e) => ({ ...e, mobile: undefined }));
                          }}
                          placeholder={country.code === "91" ? "98765 43210" : "Mobile number"}
                          placeholderTextColor={colors.placeholder}
                          keyboardType="phone-pad"
                          autoComplete="tel"
                          style={[
                            styles.phoneInput,
                            errors.mobile ? styles.phoneInputError : null,
                          ]}
                          editable={!busyAny}
                        />
                      </View>
                      {errors.mobile ? <Text style={styles.fieldError}>{errors.mobile}</Text> : null}
                      <Text style={styles.whatsappHint}>
                        We&apos;ll verify this number with a WhatsApp code before creating your account.
                      </Text>
                    </>
                  ) : null}
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
                    editable={!busyAny}
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
                      editable={!busyAny}
                      required
                      returnKeyType="go"
                      onSubmitEditing={() => void handleSubmit()}
                    />
                  ) : (
                    <Pressable
                      onPress={() => void handleForgot()}
                      hitSlop={8}
                      disabled={busyAny}
                      accessibilityRole="button"
                      style={styles.forgotBtn}
                    >
                      <Text style={styles.link}>Forgot password?</Text>
                    </Pressable>
                  )}
                </>
              ) : null}
            </View>
          )}

          {formError ? <Text style={styles.formError}>{formError}</Text> : null}

          {providerSignup ? (
            <Button label="Go to sign in" onPress={() => selectMode("sign-in")} fullWidth />
          ) : (
            <Button
              label={copy.cta}
              loading={busy === "form" || busy === "otp-send" || busy === "otp-verify"}
              disabled={busy === "google"}
              onPress={() => void handleSubmit()}
              fullWidth
            />
          )}

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

      <Modal
        visible={pickerOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setPickerOpen(false)}
      >
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
  hero: {
    width: "100%",
    height: 150,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSubtle,
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
  fieldLabel: { ...type.label, color: colors.inkSecondary },
  fieldError: { ...type.caption, color: colors.danger, marginTop: -spacing.sm },
  whatsappHint: { ...type.caption, color: colors.inkMuted, marginTop: -spacing.sm },
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
  countryText: {
    ...type.label,
    color: colors.ink,
    fontFamily: fonts.sansSemiBold,
    fontWeight: "600",
  },
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
  phoneInputError: { borderColor: colors.danger },
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
  resendText: {
    ...type.label,
    color: colors.accent,
    fontFamily: fonts.sansSemiBold,
    fontWeight: "600",
  },
  resendDisabled: { color: colors.inkMuted },
  changeNumber: { ...type.label, color: colors.primary, textAlign: "center" },
  formError: { ...type.body, color: colors.danger, textAlign: "center" },
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
  countryOptionCode: {
    width: 56,
    ...type.label,
    color: colors.ink,
    fontFamily: fonts.sansSemiBold,
    fontWeight: "600",
  },
  countryOptionLabel: { ...type.body, color: colors.ink },
});