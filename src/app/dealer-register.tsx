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
import { useRouter, type Href } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft } from "@/components/ui/icons";

import { useApp } from "@/context/AppContext";
import type { DirectoryCategory } from "@/data/types";
import { isDealerCategory } from "@/lib/is-dealer-category";
import { CITIES } from "@/constants/cities";
import { colors, radius, shadow, spacing, type } from "@/theme/tokens";

const CATEGORIES: DirectoryCategory[] = [
  "Agent & Broker",
  "Builder & Developer",
  "Property Consultant",
  "Interior Decorator",
  "Architect",
  "Building Contractor",
  "Vastu Consultant",
  "Home Valuation/Inspection",
  "Home Shifting/Deep Cleaning",
];

export default function DealerRegisterScreen() {
  const router = useRouter();
  const { registerAsDealer, userEmail, userName, dealerAccess, userRole } = useApp();

  const [firmName, setFirmName] = useState("");
  const [ownerName, setOwnerName] = useState(userName);
  const [category, setCategory] = useState<DirectoryCategory>("Agent & Broker");
  const [city, setCity] = useState("Udaipur");
  const [address, setAddress] = useState("");
  const [mobile, setMobile] = useState("");
  const [website, setWebsite] = useState("");
  const [description, setDescription] = useState("");
  const [reraId, setReraId] = useState("");

  if (userRole === "broker" || dealerAccess === "approved") {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg, padding: spacing.xl }}>
        <Text style={{ ...type.heading, color: colors.ink }}>You’re already a dealer</Text>
        <Pressable
          onPress={() => router.replace("/(tabs)/dashboard" as Href)}
          style={{
            marginTop: spacing.lg,
            height: 48,
            backgroundColor: colors.accent,
            borderRadius: radius.md,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ ...type.emphasis, color: colors.onAccent }}>Open dashboard</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  if (dealerAccess === "pending") {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg, padding: spacing.xl }}>
        <Text style={{ ...type.heading, color: colors.ink }}>Registration submitted</Text>
        <Text style={{ ...type.body, color: colors.inkMuted, marginTop: spacing.sm }}>
          Your directory card is waiting for web admin to promote your role to broker.
        </Text>
        <Pressable
          onPress={() => router.replace("/dealer-pending" as Href)}
          style={{
            marginTop: spacing.lg,
            height: 48,
            backgroundColor: colors.accent,
            borderRadius: radius.md,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ ...type.emphasis, color: colors.onAccent }}>View status</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const handleSubmit = async () => {
    if (!firmName.trim() || !ownerName.trim() || !address.trim() || !mobile.trim()) {
      Alert.alert("Missing details", "Firm name, owner, address, and mobile are required.");
      return;
    }
    const result = await registerAsDealer({
      firmName: firmName.trim(),
      ownerName: ownerName.trim(),
      category,
      city,
      address: address.trim(),
      email: userEmail,
      website: website.trim() || "—",
      mobile: mobile.trim(),
      description: description.trim() || `${firmName.trim()} on SqftGo`,
      reraId: reraId.trim() || undefined,
    });
    if (!result.ok) {
      Alert.alert("Could not register", result.message ?? "Try again.");
      return;
    }
    Alert.alert(
      "Directory submitted",
      isDealerCategory(category)
        ? "Your dealer card is live in the directory. Full dashboard unlocks after web admin sets your role to broker."
        : "Your service profile is submitted. Dealer listing tools require an Agent/Broker-style category and broker role.",
      [{ text: "OK", onPress: () => router.replace("/dealer-pending" as Href) }],
    );
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
  };

  return (
    <SafeAreaView edges={["top", "bottom"]} style={{ flex: 1, backgroundColor: colors.bg }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.md,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          gap: spacing.sm,
        }}
      >
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <ChevronLeft size={22} color={colors.ink} />
        </Pressable>
        <Text style={{ ...type.heading, color: colors.ink, flex: 1 }}>Become a dealer</Text>
      </View>

      <KeyboardAvoidingView
        behavior={process.env.EXPO_OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            padding: spacing.xl,
            gap: spacing.md,
            paddingBottom: spacing.xxl,
          }}
        >
          <Text style={{ ...type.body, color: colors.inkMuted }}>
            Create your public directory card. Signup stays as role{" "}
            <Text style={{ fontWeight: "700", color: colors.ink }}>user</Text> until web admin
            promotes you to <Text style={{ fontWeight: "700", color: colors.ink }}>broker</Text>.
            You cannot change role from the app.
          </Text>

          <Text style={{ ...type.label, color: colors.inkMuted }}>FIRM NAME *</Text>
          <TextInput
            value={firmName}
            onChangeText={setFirmName}
            placeholder="e.g. Lakeside Realty"
            placeholderTextColor={colors.inkMuted}
            style={inputStyle}
          />

          <Text style={{ ...type.label, color: colors.inkMuted }}>OWNER NAME *</Text>
          <TextInput
            value={ownerName}
            onChangeText={setOwnerName}
            placeholder="Your name"
            placeholderTextColor={colors.inkMuted}
            style={inputStyle}
          />

          <Text style={{ ...type.label, color: colors.inkMuted }}>CATEGORY</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
            {CATEGORIES.map((c) => {
              const active = category === c;
              return (
                <Pressable
                  key={c}
                  onPress={() => setCategory(c)}
                  style={{
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.sm,
                    borderRadius: radius.full,
                    borderWidth: 1,
                    borderColor: active ? colors.accent : colors.border,
                    backgroundColor: active ? colors.accentSoft : colors.surface,
                  }}
                >
                  <Text
                    style={{
                      ...type.micro,
                      fontWeight: "700",
                      color: active ? colors.accent : colors.inkMuted,
                    }}
                  >
                    {c}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={{ ...type.label, color: colors.inkMuted }}>CITY</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
            {CITIES.slice(0, 6).map((c) => {
              const active = city === c.name;
              return (
                <Pressable
                  key={c.name}
                  onPress={() => setCity(c.name)}
                  style={{
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.sm,
                    borderRadius: radius.full,
                    borderWidth: 1,
                    borderColor: active ? colors.accent : colors.border,
                    backgroundColor: active ? colors.accentSoft : colors.surface,
                  }}
                >
                  <Text
                    style={{
                      ...type.micro,
                      fontWeight: "700",
                      color: active ? colors.accent : colors.inkMuted,
                    }}
                  >
                    {c.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={{ ...type.label, color: colors.inkMuted }}>ADDRESS *</Text>
          <TextInput
            value={address}
            onChangeText={setAddress}
            placeholder="Office address"
            placeholderTextColor={colors.inkMuted}
            style={inputStyle}
          />

          <Text style={{ ...type.label, color: colors.inkMuted }}>MOBILE *</Text>
          <TextInput
            value={mobile}
            onChangeText={setMobile}
            placeholder="+91 ..."
            placeholderTextColor={colors.inkMuted}
            keyboardType="phone-pad"
            style={inputStyle}
          />

          <Text style={{ ...type.label, color: colors.inkMuted }}>WEBSITE</Text>
          <TextInput
            value={website}
            onChangeText={setWebsite}
            placeholder="https://"
            placeholderTextColor={colors.inkMuted}
            autoCapitalize="none"
            style={inputStyle}
          />

          <Text style={{ ...type.label, color: colors.inkMuted }}>RERA ID</Text>
          <TextInput
            value={reraId}
            onChangeText={setReraId}
            placeholder="Optional"
            placeholderTextColor={colors.inkMuted}
            style={inputStyle}
          />

          <Text style={{ ...type.label, color: colors.inkMuted }}>DESCRIPTION</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Tell buyers about your firm"
            placeholderTextColor={colors.inkMuted}
            multiline
            style={{ ...inputStyle, minHeight: 88, textAlignVertical: "top" as const }}
          />

          <Pressable
            onPress={handleSubmit}
            style={({ pressed }) => ({
              height: 50,
              marginTop: spacing.sm,
              borderRadius: radius.md,
              backgroundColor: colors.accent,
              alignItems: "center",
              justifyContent: "center",
              opacity: pressed ? 0.85 : 1,
              boxShadow: shadow.accent,
            })}
          >
            <Text style={{ ...type.emphasis, color: colors.onAccent }}>
              Submit directory card
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
