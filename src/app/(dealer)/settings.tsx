import React, { useState } from "react";
import {
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { appAlert } from "@/components/ui/app-alert";
import { SafeAreaView } from "react-native-safe-area-context";



import { ScreenNavbar } from "@/components/ui/screen-navbar";
import { useApp } from "@/context/AppContext";
import { colors, radius, shadow, spacing, type } from "@/theme/tokens";

export default function DealerSettingsScreen() {
  const {
    updatePassword,

    notifPrefs,
    setNotifPrefs,
    isApiMode,
  } = useApp();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);

  const handlePassword = async () => {
    if (!currentPassword || !newPassword) {
      appAlert("Missing fields", "Enter current and new password.");
      return;
    }
    setSaving(true);
    const result = await updatePassword({ currentPassword, newPassword });
    setSaving(false);
    if (!result.ok) {
      appAlert("Could not update", result.message ?? "Try again.");
      return;
    }
    setCurrentPassword("");
    setNewPassword("");
    appAlert("Password updated", "Your password has been changed.");
  };

  const inputStyle = {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    ...type.body,
    color: colors.ink,
    marginBottom: spacing.md,
  };

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ paddingHorizontal: spacing.lg }}>
        <ScreenNavbar
          eyebrow="Dealer portal"
          title="Settings"
          subtitle="Account and notification preferences"
        />
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing["3xl"], gap: spacing.lg }}>
        {/* Password */}
        <View
          style={{
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: radius.lg,
            borderCurve: "continuous",
            padding: spacing.lg,
            boxShadow: shadow.card,
          }}
        >
          <Text style={{ ...type.label, color: colors.inkMuted, marginBottom: spacing.sm }}>
            PASSWORD
          </Text>
          {!isApiMode ? (
            <Text style={{ ...type.caption, color: colors.inkMuted, marginBottom: spacing.md }}>
              Offline mock: password is stored on this device only.
            </Text>
          ) : null}
          <TextInput
            value={currentPassword}
            onChangeText={setCurrentPassword}
            placeholder="Current password"
            secureTextEntry
            placeholderTextColor={colors.inkMuted}
            style={inputStyle}
          />
          <TextInput
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder="New password"
            secureTextEntry
            placeholderTextColor={colors.inkMuted}
            style={inputStyle}
          />
          <Pressable
            disabled={saving}
            onPress={() => void handlePassword()}
            style={{
              height: 46,
              borderRadius: radius.md,
              backgroundColor: colors.accent,
              alignItems: "center",
              justifyContent: "center",
              opacity: saving ? 0.7 : 1,
              boxShadow: shadow.button,
            }}
          >
            <Text style={{ ...type.emphasis, color: colors.onAccent }}>Update password</Text>
          </Pressable>
        </View>

        {/* Notifications */}
        <View
          style={{
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: radius.lg,
            borderCurve: "continuous",
            padding: spacing.lg,
            boxShadow: shadow.card,
          }}
        >
          <Text style={{ ...type.label, color: colors.inkMuted, marginBottom: spacing.xs }}>
            NOTIFICATIONS (DEVICE LOCAL)
          </Text>
          <Text style={{ ...type.caption, color: colors.inkMuted, marginBottom: spacing.md }}>
            These toggles stay on this device — they are not server push routing.
          </Text>
          {(
            [
              { key: "inquiries" as const, label: "New inquiries" },
              { key: "visits" as const, label: "Visit updates" },
              { key: "messages" as const, label: "Messages" },
            ] as const
          ).map((row, index, arr) => (
            <View
              key={row.key}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingVertical: spacing.sm + 2,
                borderBottomWidth: index === arr.length - 1 ? 0 : 1,
                borderBottomColor: colors.border,
              }}
            >
              <Text style={{ ...type.body, color: colors.ink }}>{row.label}</Text>
              <Switch
                value={notifPrefs[row.key]}
                onValueChange={(v) => setNotifPrefs({ [row.key]: v })}
                trackColor={{ true: colors.accent, false: colors.borderStrong }}
              />
            </View>
          ))}
        </View>

        {/* Danger Zone */}
        <View
          style={{
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: radius.lg,
            borderCurve: "continuous",
            padding: spacing.lg,
            boxShadow: shadow.card,
          }}
        >
          <Text style={{ ...type.label, color: colors.inkMuted, marginBottom: spacing.sm }}>
            ACCOUNT
          </Text>
          <Pressable
            onPress={() =>
              appAlert(
                "Deactivate account",
                "Account deactivation is not available in the app yet. Contact support from the web portal.",
              )
            }
            style={{
              height: 46,
              borderRadius: radius.md,
              borderWidth: 1,
              borderColor: colors.danger,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ ...type.emphasis, color: colors.danger }}>Deactivate account</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );

}
