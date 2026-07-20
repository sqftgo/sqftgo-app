import React from "react";
import { Alert, ScrollView, Text, View } from "react-native";
import { useRouter, type Href } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Bell,
  FileText,
  Heart,
  HelpCircle,
  Inbox,
  LayoutDashboard,
  LogOut,
  MessageSquare,
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
  const { signOut, userEmail, favorites, userRole, inquiries } = useApp();

  const handleLogout = () => {
    Alert.alert("Sign out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign out",
        style: "destructive",
        onPress: signOut,
      },
    ]);
  };

  const name = displayNameFromEmail(userEmail);
  const initials = initialsFromName(name);
  const roleLabel = userRole === "broker" ? "Broker / Dealer" : "Buyer / Tenant";

  const myInquiries = inquiries.filter((i) => i.buyerEmail === userEmail).length;
  const openLeads = inquiries.filter(
    (i) => i.brokerEmail === userEmail && i.status === "open",
  ).length;

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
            <Text style={{ ...type.micro, color: colors.accent }}>{roleLabel}</Text>
          </View>
        </View>

        <View style={{ gap: spacing.sm }}>
          <Text style={{ ...type.label, color: colors.inkMuted, letterSpacing: 0.4 }}>
            ACCOUNT
          </Text>
          <MenuGroup>
            {userRole === "user" ? (
              <>
                <MenuRow
                  icon={Heart}
                  label="Saved properties"
                  value={String(favorites.length)}
                  onPress={() => router.push("/(tabs)/favorites")}
                />
                <MenuRow
                  icon={MessageSquare}
                  label="My inquiries"
                  value={String(myInquiries)}
                  onPress={() => router.push("/(tabs)/my-inquiries" as Href)}
                />
              </>
            ) : null}
            {userRole === "broker" ? (
              <>
                <MenuRow
                  icon={LayoutDashboard}
                  label="Dealer dashboard"
                  onPress={() => router.push("/(tabs)/dashboard" as Href)}
                />
                <MenuRow
                  icon={Inbox}
                  label="Open leads"
                  value={String(openLeads)}
                  onPress={() => router.push("/(tabs)/inquiries" as Href)}
                />
                <MenuRow
                  icon={Plus}
                  label="Add property"
                  sub="Draft or publish live"
                  onPress={() => router.push("/post-property")}
                />
              </>
            ) : null}
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
