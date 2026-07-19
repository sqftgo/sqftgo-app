import React from "react";
import { Alert, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Bell,
  FileText,
  Heart,
  HelpCircle,
  LogOut,
  Plus,
  Shield,
  User,
} from "lucide-react-native";

import { MenuGroup, MenuRow } from "@/components/ui/menu-row";
import { useApp } from "@/context/AppContext";
import { displayNameFromEmail, initialsFromName } from "@/lib/format";
import { colors, radius, shadow, spacing, type } from "@/theme/tokens";

export default function ProfileScreen() {
  const router = useRouter();
  const { signOut, userEmail, favorites } = useApp();

  const handleLogout = () => {
    Alert.alert("Sign out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign out",
        style: "destructive",
        // Clearing the session flips the root route guard back to auth.
        onPress: signOut,
      },
    ]);
  };

  const name = displayNameFromEmail(userEmail);
  const initials = initialsFromName(name);

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: spacing.xl,
          paddingTop: spacing.lg,
          paddingBottom: spacing.xxl,
          gap: spacing.xl,
        }}
      >
        <Text style={{ ...type.title, color: colors.ink }}>Profile</Text>

        {/* Identity card */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: spacing.lg,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: radius.xl,
            borderCurve: "continuous",
            padding: spacing.lg,
            boxShadow: shadow.card,
          }}
        >
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: radius.full,
              backgroundColor: colors.accentSoft,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ ...type.heading, color: colors.accent }}>{initials}</Text>
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={{ ...type.heading, color: colors.ink }}>{name}</Text>
            <Text selectable style={{ ...type.caption, color: colors.inkMuted }}>
              {userEmail}
            </Text>
          </View>
        </View>

        {/* Account */}
        <View style={{ gap: spacing.sm }}>
          <Text style={{ ...type.label, color: colors.inkMuted, letterSpacing: 0.4 }}>
            ACCOUNT
          </Text>
          <MenuGroup>
            <MenuRow
              icon={Heart}
              label="Saved properties"
              value={String(favorites.length)}
              onPress={() => router.push("/(tabs)/favorites")}
            />
            <MenuRow
              icon={Plus}
              label="Post a property"
              sub="List for free"
              onPress={() => router.push("/post-property")}
            />
            <MenuRow
              icon={Bell}
              label="Notifications"
              sub="Price drops and new matches"
              onPress={() =>
                Alert.alert("Notifications", "Notification preferences will be available soon.")
              }
              showDivider={false}
            />
          </MenuGroup>
        </View>

        {/* Settings */}
        <View style={{ gap: spacing.sm }}>
          <Text style={{ ...type.label, color: colors.inkMuted, letterSpacing: 0.4 }}>
            SETTINGS
          </Text>
          <MenuGroup>
            <MenuRow
              icon={User}
              label="Account details"
              onPress={() => Alert.alert("Account", "Profile editing will be available soon.")}
            />
            <MenuRow
              icon={Shield}
              label="Privacy"
              sub="Data and permissions"
              onPress={() =>
                Alert.alert("Privacy", "Your data stays on this device in this demo.")
              }
              showDivider={false}
            />
          </MenuGroup>
        </View>

        {/* Support */}
        <View style={{ gap: spacing.sm }}>
          <Text style={{ ...type.label, color: colors.inkMuted, letterSpacing: 0.4 }}>
            HELP & SUPPORT
          </Text>
          <MenuGroup>
            <MenuRow
              icon={HelpCircle}
              label="Help center"
              onPress={() => Alert.alert("Help", "Visit support@svrepl.com for assistance.")}
            />
            <MenuRow
              icon={FileText}
              label="Terms & privacy policy"
              onPress={() => Alert.alert("Legal", "Terms of service will open here.")}
              showDivider={false}
            />
          </MenuGroup>
        </View>

        {/* Logout */}
        <MenuGroup>
          <MenuRow
            icon={LogOut}
            label="Sign out"
            onPress={handleLogout}
            destructive
            showChevron={false}
            showDivider={false}
          />
        </MenuGroup>
      </ScrollView>
    </SafeAreaView>
  );
}
