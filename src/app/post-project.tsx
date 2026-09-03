import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft } from "@/components/ui/icons";

import { appAlert } from "@/components/ui/app-alert";
import { useApp } from "@/context/AppContext";
import type { ProjectLifecycle, ProjectOwnershipRole } from "@/data/project";
import { CITIES } from "@/constants/cities";
import { isApiMode } from "@/lib/api/config";
import { apiCreateProject } from "@/lib/api/services/projects";
import { pickAndUploadPropertyImage } from "@/lib/media-upload";
import { colors, radius, shadow, spacing, type } from "@/theme/tokens";

const LIFECYCLES: ProjectLifecycle[] = ["Upcoming", "Under Construction", "Ready"];
const ROLES: ProjectOwnershipRole[] = ["Owner", "Builder", "Marketing Partner"];

export default function PostProjectScreen() {
  const router = useRouter();
  const { userName, profile, canAccessDealerDashboard } = useApp();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [city, setCity] = useState("Udaipur");
  const [locality, setLocality] = useState("");
  const [lifecycle, setLifecycle] = useState<ProjectLifecycle>("Under Construction");
  const [ownershipRole, setOwnershipRole] = useState<ProjectOwnershipRole>("Builder");
  const [configurations, setConfigurations] = useState("2 BHK, 3 BHK");
  const [priceFrom, setPriceFrom] = useState("");
  const [priceTo, setPriceTo] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [busy, setBusy] = useState(false);

  if (!canAccessDealerDashboard) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg, padding: spacing.xl }}>
        <Text style={{ ...type.heading, color: colors.ink }}>Dealer access required</Text>
        <Pressable onPress={() => router.back()} style={{ marginTop: spacing.lg }}>
          <Text style={{ ...type.label, color: colors.accent }}>Go back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

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

  const submit = async (asDraft: boolean) => {
    if (!isApiMode) {
      appAlert("API required", "Project create needs EXPO_PUBLIC_API_URL.");
      return;
    }
    if (!title.trim() || !description.trim() || !locality.trim()) {
      appAlert("Missing fields", "Title, description, and locality are required.");
      return;
    }
    if (!asDraft && !imageUrl) {
      appAlert("Image required", "Add at least one image before submitting for review.");
      return;
    }
    setBusy(true);
    try {
      await apiCreateProject({
        title: title.trim(),
        description: description.trim(),
        city,
        locality: locality.trim(),
        lifecycle,
        ownershipRole,
        propertyTypes: ["Apartment"],
        configurations: configurations
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        priceFrom: priceFrom ? Number(priceFrom) : undefined,
        priceTo: priceTo ? Number(priceTo) : undefined,
        amenities: [],
        images: imageUrl ? [imageUrl] : [],
        contactName: userName || profile?.name || "Dealer",
        contactPhone: profile?.phone || "+91",
        status: asDraft ? "Draft" : "Pending Review",
      });
      appAlert(
        asDraft ? "Draft saved" : "Submitted",
        asDraft ? "Open My projects to edit and submit." : "Waiting for admin approval.",
        [{ text: "OK", onPress: () => router.replace("/dealer-projects") }],
      );
    } catch (e) {
      appAlert("Could not save", e instanceof Error ? e.message : "Try again.");
    } finally {
      setBusy(false);
    }
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
        <Text style={{ ...type.heading, color: colors.ink, flex: 1 }}>Add project</Text>
      </View>

      <KeyboardAvoidingView
        behavior={process.env.EXPO_OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ padding: spacing.xl, gap: spacing.md, paddingBottom: spacing.xxl }}
        >
          <Text style={{ ...type.label, color: colors.inkMuted }}>TITLE *</Text>
          <TextInput value={title} onChangeText={setTitle} style={inputStyle} placeholder="Project name" placeholderTextColor={colors.inkMuted} />

          <Text style={{ ...type.label, color: colors.inkMuted }}>DESCRIPTION *</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            multiline
            style={{ ...inputStyle, minHeight: 96, textAlignVertical: "top" as const }}
            placeholder="Highlight location, amenities, USP"
            placeholderTextColor={colors.inkMuted}
          />

          <Text style={{ ...type.label, color: colors.inkMuted }}>CITY</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
            {CITIES.slice(0, 8).map((c) => {
              const active = city === c.name;
              return (
                <Pressable
                  key={c.name}
                  onPress={() => setCity(c.name)}
                  style={{
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.sm,
                    borderRadius: radius.md,
                    borderWidth: 1,
                    borderColor: active ? colors.accent : colors.border,
                    backgroundColor: active ? colors.accentSoft : colors.surface,
                  }}
                >
                  <Text style={{ ...type.micro, fontWeight: "700", color: active ? colors.accent : colors.inkMuted }}>
                    {c.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={{ ...type.label, color: colors.inkMuted }}>LOCALITY *</Text>
          <TextInput value={locality} onChangeText={setLocality} style={inputStyle} placeholder="e.g. Shobhagpura" placeholderTextColor={colors.inkMuted} />

          <Text style={{ ...type.label, color: colors.inkMuted }}>LIFECYCLE</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
            {LIFECYCLES.map((l) => {
              const active = lifecycle === l;
              return (
                <Pressable
                  key={l}
                  onPress={() => setLifecycle(l)}
                  style={{
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.sm,
                    borderRadius: radius.md,
                    borderWidth: 1,
                    borderColor: active ? colors.accent : colors.border,
                    backgroundColor: active ? colors.accentSoft : colors.surface,
                  }}
                >
                  <Text style={{ ...type.micro, fontWeight: "700", color: active ? colors.accent : colors.inkMuted }}>
                    {l}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={{ ...type.label, color: colors.inkMuted }}>YOUR ROLE</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
            {ROLES.map((r) => {
              const active = ownershipRole === r;
              return (
                <Pressable
                  key={r}
                  onPress={() => setOwnershipRole(r)}
                  style={{
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.sm,
                    borderRadius: radius.md,
                    borderWidth: 1,
                    borderColor: active ? colors.accent : colors.border,
                    backgroundColor: active ? colors.accentSoft : colors.surface,
                  }}
                >
                  <Text style={{ ...type.micro, fontWeight: "700", color: active ? colors.accent : colors.inkMuted }}>
                    {r}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={{ ...type.label, color: colors.inkMuted }}>CONFIGURATIONS</Text>
          <TextInput
            value={configurations}
            onChangeText={setConfigurations}
            style={inputStyle}
            placeholder="2 BHK, 3 BHK"
            placeholderTextColor={colors.inkMuted}
          />

          <View style={{ flexDirection: "row", gap: spacing.md }}>
            <View style={{ flex: 1, gap: spacing.xs }}>
              <Text style={{ ...type.label, color: colors.inkMuted }}>PRICE FROM</Text>
              <TextInput
                value={priceFrom}
                onChangeText={setPriceFrom}
                keyboardType="numeric"
                style={inputStyle}
                placeholder="INR"
                placeholderTextColor={colors.inkMuted}
              />
            </View>
            <View style={{ flex: 1, gap: spacing.xs }}>
              <Text style={{ ...type.label, color: colors.inkMuted }}>PRICE TO</Text>
              <TextInput
                value={priceTo}
                onChangeText={setPriceTo}
                keyboardType="numeric"
                style={inputStyle}
                placeholder="INR"
                placeholderTextColor={colors.inkMuted}
              />
            </View>
          </View>

          <Pressable
            onPress={async () => {
              const url = await pickAndUploadPropertyImage();
              if (url) setImageUrl(url);
            }}
            style={{
              height: 48,
              borderRadius: radius.md,
              borderWidth: 1,
              borderColor: colors.border,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: colors.surface,
            }}
          >
            <Text style={{ ...type.label, color: colors.ink }}>
              {imageUrl ? "Image added — tap to replace" : "Upload cover image"}
            </Text>
          </Pressable>

          <Pressable
            disabled={busy}
            onPress={() => submit(true)}
            style={{
              height: 48,
              borderRadius: radius.md,
              borderWidth: 1,
              borderColor: colors.border,
              alignItems: "center",
              justifyContent: "center",
              opacity: busy ? 0.6 : 1,
            }}
          >
            <Text style={{ ...type.emphasis, color: colors.ink }}>Save draft</Text>
          </Pressable>
          <Pressable
            disabled={busy}
            onPress={() => submit(false)}
            style={{
              height: 50,
              borderRadius: radius.md,
              backgroundColor: colors.accent,
              alignItems: "center",
              justifyContent: "center",
              boxShadow: shadow.accent,
              opacity: busy ? 0.6 : 1,
            }}
          >
            <Text style={{ ...type.emphasis, color: colors.onAccent }}>Submit for review</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
