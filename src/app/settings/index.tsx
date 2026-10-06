import Constants from "expo-constants";
import { useRouter, type Href } from "expo-router";
import React, { useState } from "react";
import { Linking, StyleSheet, Switch, Text } from "react-native";

import { ListRow, ListSection } from "@/components/ds/ListRow";
import { Screen } from "@/components/ds/Screen";
import CitySelectionModal from "@/components/ui/CitySelectionModal";
import { appAlert } from "@/components/ui/app-alert";
import {
  Bell,
  Calendar,
  FileText,
  HelpCircle,
  Lock,
  LogOut,
  Mail,
  MapPin,
  MessageSquare,
  Shield,
  User,
} from "@/components/ui/icons";
import { useApp } from "@/context/AppContext";
import { colors, type } from "@/theme/tokens";

export default function SettingsScreen() {
  const router = useRouter();
  const { notifPrefs, setNotifPrefs, selectedCity, signOut, platformSettings, userEmail } = useApp();
  const [cityOpen, setCityOpen] = useState(false);

  const confirmSignOut = () =>
    appAlert("Sign out?", "You can keep browsing as a guest.", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign out", style: "destructive", onPress: signOut },
    ]);

  const requestDeletion = () =>
    appAlert(
      "Delete account",
      `Account deletion is handled by our support team. We'll open an email to ${platformSettings.supportEmail} from ${userEmail}.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Email support",
          onPress: () =>
            void Linking.openURL(
              `mailto:${platformSettings.supportEmail}?subject=${encodeURIComponent("Account deletion request")}&body=${encodeURIComponent(`Please delete the SqftGo account for ${userEmail}.`)}`,
            ),
        },
      ],
    );

  const toggle = (key: keyof typeof notifPrefs) => (
    <Switch
      value={notifPrefs[key]}
      onValueChange={(v) => setNotifPrefs({ [key]: v })}
      trackColor={{ true: colors.accent, false: colors.borderStrong }}
    />
  );

  return (
    <Screen title="Settings" fallbackHref={"/profile" as Href}>
      <ListSection title="Account">
        <ListRow icon={User} title="Edit profile" onPress={() => router.push("/settings/profile" as Href)} />
        <ListRow icon={Lock} title="Change password" onPress={() => router.push("/settings/password" as Href)} />
        <ListRow icon={MapPin} title="City" value={selectedCity} onPress={() => setCityOpen(true)} />
      </ListSection>

      <ListSection
        title="Notifications"
        footer="These preferences are saved on this device only. Server push routing isn't available yet."
      >
        <ListRow icon={Bell} title="New inquiries" accessory={toggle("inquiries")} showChevron={false} />
        <ListRow icon={Calendar} title="Visit updates" accessory={toggle("visits")} showChevron={false} />
        <ListRow icon={MessageSquare} title="Messages" accessory={toggle("messages")} showChevron={false} />
      </ListSection>

      <ListSection title="Support">
        <ListRow icon={HelpCircle} title="Help & support" onPress={() => router.push("/help" as Href)} />
        <ListRow icon={Shield} title="Privacy Policy" onPress={() => router.push("/legal/privacy" as Href)} />
        <ListRow icon={FileText} title="Terms of Service" onPress={() => router.push("/legal/terms" as Href)} />
      </ListSection>

      <ListSection>
        <ListRow icon={LogOut} title="Sign out" destructive showChevron={false} onPress={confirmSignOut} />
        <ListRow icon={Mail} title="Delete account" destructive showChevron={false} onPress={requestDeletion} />
      </ListSection>

      <Text style={styles.version}>SqftGo v{Constants.expoConfig?.version ?? "1.0.0"}</Text>

      <CitySelectionModal visible={cityOpen} onClose={() => setCityOpen(false)} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  version: { ...type.caption, color: colors.inkMuted, textAlign: "center" },
});
