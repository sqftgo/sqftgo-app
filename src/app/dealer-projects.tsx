import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  View,
} from "react-native";
import { useRouter, type Href } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Building2, Plus, Trash2 } from "@/components/ui/icons";

import { appAlert } from "@/components/ui/app-alert";
import { EmptyState } from "@/components/ui/empty-state";
import { ScreenNavbar } from "@/components/ui/screen-navbar";
import type { Project, ProjectStatus } from "@/data/project";
import { isApiMode } from "@/lib/api/config";
import {
  apiDeleteProject,
  apiListProjects,
  apiUpdateProject,
} from "@/lib/api/services/projects";
import { colors, radius, shadow, spacing, type } from "@/theme/tokens";

const STATUS_TONE: Record<ProjectStatus, { bg: string; color: string }> = {
  Draft: { bg: colors.surfaceSubtle, color: colors.inkMuted },
  "Pending Review": { bg: "rgba(255, 184, 0, 0.12)", color: "#B45309" },
  Active: { bg: colors.successSoft, color: colors.success },
  Sold: { bg: colors.infoSoft, color: colors.info },
  Rejected: { bg: colors.dangerSoft, color: colors.danger },
};

export default function DealerProjectsScreen() {
  const router = useRouter();
  const [items, setItems] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!isApiMode) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      setItems(await apiListProjects({ mine: true, limit: 100 }));
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleDelete = (item: Project) => {
    if (item.status === "Active") {
      appAlert("Cannot delete", "Active projects cannot be deleted by dealers.");
      return;
    }
    appAlert("Delete project", `Remove "${item.title}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await apiDeleteProject(item.id);
            setItems((prev) => prev.filter((p) => p.id !== item.id));
          } catch (e) {
            appAlert("Could not delete", e instanceof Error ? e.message : "Try again.");
          }
        },
      },
    ]);
  };

  const handleSubmit = async (item: Project) => {
    if (item.status !== "Draft") return;
    try {
      const updated = await apiUpdateProject(item.id, { status: "Pending Review" });
      setItems((prev) => prev.map((p) => (p.id === item.id ? updated : p)));
      appAlert("Submitted", "Project is pending web admin approval.");
    } catch (e) {
      appAlert("Could not submit", e instanceof Error ? e.message : "Need at least one image.");
    }
  };

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ paddingHorizontal: spacing.lg, gap: spacing.sm }}>
        <ScreenNavbar
          title="My projects"
          subtitle="Builder launches you manage"
          rightAction={
            <Pressable
              onPress={() => router.push("/post-project" as Href)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
                backgroundColor: colors.accent,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.xs + 2,
                borderRadius: radius.md,
              }}
            >
              <Plus size={16} color={colors.onAccent} />
              <Text style={{ ...type.micro, fontWeight: "800", color: colors.onAccent }}>Add</Text>
            </Pressable>
          }
        />
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: spacing.lg, gap: spacing.md, flexGrow: 1 }}
          ListEmptyComponent={
            <EmptyState
              icon={Building2}
              title="No projects yet"
              message={
                isApiMode
                  ? "Add a project to showcase configurations and pricing."
                  : "API mode required for project CRUD."
              }
              actionLabel="Add project"
              onAction={() => router.push("/post-project" as Href)}
            />
          }
          renderItem={({ item }) => {
            const tone = STATUS_TONE[item.status] ?? STATUS_TONE.Draft;
            return (
              <View
                style={{
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: radius.lg,
                  padding: spacing.md,
                  gap: spacing.sm,
                  boxShadow: shadow.card,
                }}
              >
                <View style={{ flexDirection: "row", justifyContent: "space-between", gap: spacing.sm }}>
                  <Text style={{ ...type.emphasis, color: colors.ink, flex: 1 }} numberOfLines={2}>
                    {item.title}
                  </Text>
                  <View style={{ backgroundColor: tone.bg, paddingHorizontal: 8, paddingVertical: 4, borderRadius: radius.sm }}>
                    <Text style={{ ...type.micro, fontWeight: "700", color: tone.color }}>{item.status}</Text>
                  </View>
                </View>
                <Text style={{ ...type.caption, color: colors.inkMuted }}>
                  {item.locality}, {item.city} · {item.lifecycle}
                </Text>
                <View style={{ flexDirection: "row", gap: spacing.sm, marginTop: spacing.xs }}>
                  <Pressable
                    onPress={() => router.push(`/edit-project/${item.id}` as Href)}
                    style={{
                      flex: 1,
                      height: 40,
                      borderRadius: radius.md,
                      borderWidth: 1,
                      borderColor: colors.border,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text style={{ ...type.label, color: colors.ink }}>Edit</Text>
                  </Pressable>
                  {item.status === "Draft" ? (
                    <Pressable
                      onPress={() => handleSubmit(item)}
                      style={{
                        flex: 1,
                        height: 40,
                        borderRadius: radius.md,
                        backgroundColor: colors.accent,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Text style={{ ...type.label, color: colors.onAccent }}>Submit</Text>
                    </Pressable>
                  ) : null}
                  <Pressable
                    onPress={() => handleDelete(item)}
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: radius.md,
                      borderWidth: 1,
                      borderColor: colors.border,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Trash2 size={16} color={colors.danger} />
                  </Pressable>
                </View>
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}
