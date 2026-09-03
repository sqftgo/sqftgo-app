import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft } from "@/components/ui/icons";

import { appAlert } from "@/components/ui/app-alert";
import type { Project, ProjectLifecycle, ProjectOwnershipRole } from "@/data/project";
import { apiGetProject, apiUpdateProject } from "@/lib/api/services/projects";
import { pickAndUploadPropertyImage } from "@/lib/media-upload";
import { colors, radius, shadow, spacing, type } from "@/theme/tokens";

const LIFECYCLES: ProjectLifecycle[] = ["Upcoming", "Under Construction", "Ready"];
const ROLES: ProjectOwnershipRole[] = ["Owner", "Builder", "Marketing Partner"];

export default function EditProjectScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [locality, setLocality] = useState("");
  const [lifecycle, setLifecycle] = useState<ProjectLifecycle>("Under Construction");
  const [ownershipRole, setOwnershipRole] = useState<ProjectOwnershipRole>("Builder");
  const [configurations, setConfigurations] = useState("");
  const [priceFrom, setPriceFrom] = useState("");
  const [priceTo, setPriceTo] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [status, setStatus] = useState<Project["status"]>("Draft");

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const p = await apiGetProject(id);
      setTitle(p.title);
      setDescription(p.description);
      setLocality(p.locality);
      setLifecycle(p.lifecycle);
      setOwnershipRole(p.ownershipRole);
      setConfigurations(p.configurations?.join(", ") ?? "");
      setPriceFrom(p.priceFrom != null ? String(p.priceFrom) : "");
      setPriceTo(p.priceTo != null ? String(p.priceTo) : "");
      setImages(p.images ?? []);
      setStatus(p.status);
    } catch (e) {
      appAlert("Load failed", e instanceof Error ? e.message : "Project not found", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    void load();
  }, [load]);

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

  const save = async () => {
    if (!id) return;
    setBusy(true);
    try {
      await apiUpdateProject(id, {
        title: title.trim(),
        description: description.trim(),
        locality: locality.trim(),
        lifecycle,
        ownershipRole,
        configurations: configurations
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        priceFrom: priceFrom ? Number(priceFrom) : undefined,
        priceTo: priceTo ? Number(priceTo) : undefined,
        images,
        status: status === "Active" ? undefined : status,
      });
      appAlert("Saved", "Project updated.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (e) {
      appAlert("Could not save", e instanceof Error ? e.message : "Try again.");
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={colors.accent} />
      </SafeAreaView>
    );
  }

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
        <Text style={{ ...type.heading, color: colors.ink, flex: 1 }}>Edit project</Text>
      </View>

      <KeyboardAvoidingView
        behavior={process.env.EXPO_OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ padding: spacing.xl, gap: spacing.md, paddingBottom: spacing.xxl }}
        >
          <Text style={{ ...type.caption, color: colors.inkMuted }}>Status: {status}</Text>
          <Text style={{ ...type.label, color: colors.inkMuted }}>TITLE</Text>
          <TextInput value={title} onChangeText={setTitle} style={inputStyle} />
          <Text style={{ ...type.label, color: colors.inkMuted }}>DESCRIPTION</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            multiline
            style={{ ...inputStyle, minHeight: 96, textAlignVertical: "top" as const }}
          />
          <Text style={{ ...type.label, color: colors.inkMuted }}>LOCALITY</Text>
          <TextInput value={locality} onChangeText={setLocality} style={inputStyle} />

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

          <Text style={{ ...type.label, color: colors.inkMuted }}>ROLE</Text>
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
          <TextInput value={configurations} onChangeText={setConfigurations} style={inputStyle} />

          <View style={{ flexDirection: "row", gap: spacing.md }}>
            <View style={{ flex: 1, gap: spacing.xs }}>
              <Text style={{ ...type.label, color: colors.inkMuted }}>PRICE FROM</Text>
              <TextInput value={priceFrom} onChangeText={setPriceFrom} keyboardType="numeric" style={inputStyle} />
            </View>
            <View style={{ flex: 1, gap: spacing.xs }}>
              <Text style={{ ...type.label, color: colors.inkMuted }}>PRICE TO</Text>
              <TextInput value={priceTo} onChangeText={setPriceTo} keyboardType="numeric" style={inputStyle} />
            </View>
          </View>

          <Pressable
            onPress={async () => {
              const url = await pickAndUploadPropertyImage();
              if (url) setImages((prev) => [url, ...prev]);
            }}
            style={{
              height: 48,
              borderRadius: radius.md,
              borderWidth: 1,
              borderColor: colors.border,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ ...type.label, color: colors.ink }}>
              {images.length ? `${images.length} image(s) — add another` : "Upload image"}
            </Text>
          </Pressable>

          <Pressable
            disabled={busy}
            onPress={save}
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
            <Text style={{ ...type.emphasis, color: colors.onAccent }}>Save changes</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
