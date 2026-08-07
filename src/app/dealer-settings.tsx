import React, { useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft } from "@/components/ui/icons";

import { useApp } from "@/context/AppContext";
import { colors, radius, spacing, type } from "@/theme/tokens";

export default function DealerSettingsScreen() {
  const router = useRouter();
  const {
    updatePassword,
    notifPrefs,
    setNotifPrefs,
    isApiMode,
    canAccessDealerDashboard,
  } = useApp();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);

  const handlePassword = async () => {
    if (!currentPassword || !newPassword) {
      Alert.alert("Missing fields", "Enter current and new password.");
      return;
    }
    setSaving(true);
    const result = await updatePassword({ currentPassword, newPassword });
    setSaving(false);
    if (!result.ok) {
      Alert.alert("Could not update", result.message ?? "Try again.");
      return;
    }
    setCurrentPassword("");
    setNewPassword("");
    Alert.alert("Password updated", "Your password has been changed.");
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
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.md,
          gap: spacing.sm,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <ChevronLeft size={22} color={colors.ink} />
        </Pressable>
        <Text style={{ ...type.heading, color: colors.ink }}>Settings</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.xl, gap: spacing.lg }}>
        <View>
          <Text style={{ ...type.label, color: colors.inkMuted, marginBottom: spacing.md }}>
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
              height: 48,
              borderRadius: radius.md,
              backgroundColor: colors.accent,
              alignItems: "center",
              justifyContent: "center",
              opacity: saving ? 0.7 : 1,
            }}
          >
            <Text style={{ ...type.emphasis, color: colors.onAccent }}>Update password</Text>
          </Pressable>
        </View>

        <View>
          <Text style={{ ...type.label, color: colors.inkMuted, marginBottom: spacing.md }}>
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
          ).map((row) => (
            <View
              key={row.key}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingVertical: spacing.sm,
                borderBottomWidth: 1,
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

        <View>
          <Text style={{ ...type.label, color: colors.inkMuted, marginBottom: spacing.md }}>
            ACCOUNT
          </Text>
          <Pressable
            onPress={() =>
              Alert.alert(
                "Deactivate account",
                "Account deactivation is not available in the app yet. Contact support from the web portal.",
              )
            }
            style={{
              height: 48,
              borderRadius: radius.md,
              borderWidth: 1,
              borderColor: colors.danger,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ ...type.emphasis, color: colors.danger }}>Deactivate account</Text>
          </Pressable>
          {!canAccessDealerDashboard ? (
            <Text style={{ ...type.caption, color: colors.inkMuted, marginTop: spacing.sm }}>
              Some dealer settings apply after broker approval.
            </Text>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
