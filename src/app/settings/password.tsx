import { type Href } from "expo-router";
import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/ds/Button";
import { Screen, useBack } from "@/components/ds/Screen";
import { TextField } from "@/components/ds/TextField";
import { toast } from "@/components/ds/Toast";
import { appAlert } from "@/components/ui/app-alert";
import { useApp } from "@/context/AppContext";
import { colors, spacing, type } from "@/theme/tokens";

const MIN_PASSWORD_LENGTH = 8;

export default function ChangePasswordScreen() {
  const back = useBack("/settings" as Href);
  const { updatePassword, forgotPassword, userEmail } = useApp();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<{ current?: string; next?: string; confirm?: string }>({});
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    const e: typeof errors = {};
    if (!current) e.current = "Enter your current password.";
    if (next.length < MIN_PASSWORD_LENGTH) e.next = `Use at least ${MIN_PASSWORD_LENGTH} characters.`;
    else if (next === current) e.next = "Choose a password different from your current one.";
    if (confirm !== next) e.confirm = "Passwords don't match.";
    setErrors(e);
    if (Object.keys(e).length) return;

    setSaving(true);
    const result = await updatePassword({ currentPassword: current, newPassword: next });
    setSaving(false);
    if (!result.ok) {
      const msg = result.message ?? "Please try again.";
      if (/current password/i.test(msg)) setErrors({ current: msg });
      else appAlert("Couldn't change password", msg);
      return;
    }
    toast("Password changed");
    back();
  };

  const sendReset = async () => {
    const res = await forgotPassword(userEmail);
    appAlert(
      res.ok ? "Check your inbox" : "Couldn't send reset link",
      res.ok ? `We sent a link to ${userEmail} to set a new password.` : (res.message ?? "Please try again."),
    );
  };

  return (
    <Screen
      title="Change password"
      fallbackHref={"/settings" as Href}
      footer={<Button label="Update password" loading={saving} onPress={() => void submit()} fullWidth />}
    >
      <View style={{ gap: spacing.lg }}>
        <TextField
          label="Current password"
          value={current}
          onChangeText={setCurrent}
          password
          autoComplete="current-password"
          textContentType="password"
          error={errors.current}
        />
        <TextField
          label="New password"
          value={next}
          onChangeText={setNext}
          password
          autoComplete="new-password"
          textContentType="newPassword"
          hint={`At least ${MIN_PASSWORD_LENGTH} characters.`}
          error={errors.next}
        />
        <TextField
          label="Confirm new password"
          value={confirm}
          onChangeText={setConfirm}
          password
          autoComplete="new-password"
          textContentType="newPassword"
          error={errors.confirm}
          returnKeyType="go"
          onSubmitEditing={() => void submit()}
        />
      </View>

      <View style={{ gap: spacing.xs }}>
        <Text style={styles.caption}>Signed up with Google, or forgot your password?</Text>
        <Pressable onPress={() => void sendReset()} hitSlop={8} accessibilityRole="button">
          <Text style={styles.link}>Email me a reset link</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  caption: { ...type.caption, color: colors.inkMuted },
  link: { ...type.label, color: colors.accent, fontFamily: "Inter_600SemiBold", fontWeight: "600" },
});
