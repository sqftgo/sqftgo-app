import React, { useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft } from "lucide-react-native";

import { useApp } from "@/context/AppContext";
import type { Property } from "@/data/types";
import { ownsProperty } from "@/lib/ownership";
import { pickAndUploadPropertyImage } from "@/lib/media-upload";
import { colors, radius, spacing, type } from "@/theme/tokens";

export default function EditPropertyScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const {
    properties,
    updateProperty,
    profile,
    userEmail,
    canAccessDealerDashboard,
  } = useApp();

  const existing = useMemo(
    () => properties.find((p) => p.id === id),
    [properties, id],
  );

  const canEdit =
    canAccessDealerDashboard &&
    existing &&
    ownsProperty(existing, { userId: profile?.id, email: userEmail });

  const [title, setTitle] = useState(existing?.title ?? "");
  const [price, setPrice] = useState(existing ? String(existing.price) : "");
  const [locality, setLocality] = useState(existing?.locality ?? "");
  const [size, setSize] = useState(existing ? String(existing.size) : "");
  const [description, setDescription] = useState(existing?.description ?? "");
  const [imageUrl, setImageUrl] = useState(existing?.images?.[0] ?? "");
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  if (!existing || !canEdit) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg, padding: spacing.xl }}>
        <Text style={{ ...type.title, color: colors.ink }}>Cannot edit</Text>
        <Text style={{ ...type.body, color: colors.inkMuted, marginTop: spacing.sm }}>
          Listing not found or you do not own it.
        </Text>
        <Pressable onPress={() => router.back()} style={{ marginTop: spacing.xl }}>
          <Text style={{ ...type.label, color: colors.accent }}>Go back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const handleSave = async (submitForReview: boolean) => {
    if (!title.trim() || !price || !locality.trim() || !size || !description.trim()) {
      Alert.alert("Missing fields", "Title, price, locality, size, and description are required.");
      return;
    }
    setSaving(true);
    const patch: Partial<Property> = {
      title: title.trim(),
      price: parseFloat(price),
      locality: locality.trim(),
      size: parseFloat(size),
      description: description.trim(),
      images: imageUrl.trim() ? [imageUrl.trim()] : existing.images,
    };
    if (submitForReview && existing.status === "Draft") {
      patch.status = "Pending Review";
    }
    const updated = await updateProperty(existing.id, patch);
    setSaving(false);
    if (!updated) {
      Alert.alert("Save failed", "Could not update listing. Brokers cannot set Active.");
      return;
    }
    Alert.alert(
      "Saved",
      submitForReview
        ? "Listing submitted for review."
        : "Listing updated.",
      [{ text: "OK", onPress: () => router.back() }],
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
    marginBottom: spacing.md,
  };

  return (
    <SafeAreaView edges={["top", "bottom"]} style={{ flex: 1, backgroundColor: colors.bg }}>
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
        <Text style={{ ...type.heading, color: colors.ink, flex: 1 }}>Edit property</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.xl }}>
        <Text style={{ ...type.caption, color: colors.inkMuted, marginBottom: spacing.lg }}>
          Status: {existing.status}. You cannot set Active or featured — web admin activates
          listings.
        </Text>

        <Text style={{ ...type.label, color: colors.inkMuted, marginBottom: 6 }}>Title</Text>
        <TextInput value={title} onChangeText={setTitle} style={inputStyle} />

        <Text style={{ ...type.label, color: colors.inkMuted, marginBottom: 6 }}>Price (₹)</Text>
        <TextInput
          value={price}
          onChangeText={setPrice}
          keyboardType="numeric"
          style={inputStyle}
        />

        <Text style={{ ...type.label, color: colors.inkMuted, marginBottom: 6 }}>Locality</Text>
        <TextInput value={locality} onChangeText={setLocality} style={inputStyle} />

        <Text style={{ ...type.label, color: colors.inkMuted, marginBottom: 6 }}>Size (sq.ft)</Text>
        <TextInput
          value={size}
          onChangeText={setSize}
          keyboardType="numeric"
          style={inputStyle}
        />

        <Text style={{ ...type.label, color: colors.inkMuted, marginBottom: 6 }}>Description</Text>
        <TextInput
          value={description}
          onChangeText={setDescription}
          multiline
          style={{ ...inputStyle, minHeight: 100, textAlignVertical: "top" }}
        />

        <Text style={{ ...type.label, color: colors.inkMuted, marginBottom: 6 }}>
          Image URL
        </Text>
        <TextInput
          value={imageUrl}
          onChangeText={setImageUrl}
          autoCapitalize="none"
          style={inputStyle}
        />
        <Pressable
          disabled={uploadingImage}
          onPress={() => {
            void (async () => {
              setUploadingImage(true);
              const url = await pickAndUploadPropertyImage();
              setUploadingImage(false);
              if (url) setImageUrl(url);
            })();
          }}
          style={{
            height: 40,
            marginBottom: spacing.md,
            borderRadius: radius.md,
            borderWidth: 1,
            borderColor: colors.border,
            alignItems: "center",
            justifyContent: "center",
            opacity: uploadingImage ? 0.6 : 1,
          }}
        >
          <Text style={{ ...type.label, color: colors.ink }}>
            {uploadingImage ? "Uploading…" : "Upload from gallery"}
          </Text>
        </Pressable>

        <Pressable
          disabled={saving}
          onPress={() => void handleSave(false)}
          style={{
            height: 48,
            borderRadius: radius.md,
            backgroundColor: colors.accent,
            alignItems: "center",
            justifyContent: "center",
            marginTop: spacing.sm,
            opacity: saving ? 0.7 : 1,
          }}
        >
          <Text style={{ ...type.emphasis, color: colors.onAccent }}>Save changes</Text>
        </Pressable>

        {existing.status === "Draft" ? (
          <Pressable
            disabled={saving}
            onPress={() => void handleSave(true)}
            style={{
              height: 48,
              borderRadius: radius.md,
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
              alignItems: "center",
              justifyContent: "center",
              marginTop: spacing.sm,
            }}
          >
            <Text style={{ ...type.emphasis, color: colors.ink }}>Save & submit for review</Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
