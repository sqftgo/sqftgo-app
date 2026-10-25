import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter, type Href } from "expo-router";
import React, { useMemo, useState } from "react";
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";

import {
  Button,
  ChipGroup,
  ErrorState,
  ListSkeleton,
  Screen,
  StatusBadge,
  SwipeRow,
  toast,
  toneForStatus,
  type SwipeAction,
} from "@/components/ds";
import { appAlert } from "@/components/ui/app-alert";
import { EmptyState } from "@/components/ui/empty-state";
import { Archive, Building2, Plus, Trash2 } from "@/components/ui/icons";
import { formatProjectPriceRange } from "@/components/ui/project-card";
import type { Project } from "@/data/project";
import { isApiMode } from "@/lib/api/config";
import { apiDeleteProject, apiListProjects, apiUpdateProject } from "@/lib/api/services/projects";
import { userFacingError } from "@/lib/errors";
import { colors, radius, shadow, spacing, type } from "@/theme/tokens";

const MINE_KEY = ["projects", "mine"] as const;

type ProjectFilter = "All" | "Active" | "Pending Review" | "Draft" | "Rejected" | "Sold";
const FILTERS: ProjectFilter[] = ["All", "Active", "Pending Review", "Draft", "Rejected", "Sold"];

export default function DealerProjectsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{ status?: string }>();
  const query = useQuery({
    queryKey: MINE_KEY,
    queryFn: () => apiListProjects({ mine: true, limit: 100 }),
    enabled: isApiMode,
  });
  const items = query.data ?? [];
  const [filter, setFilter] = useState<ProjectFilter>(
    FILTERS.includes(params.status as ProjectFilter) ? (params.status as ProjectFilter) : "All",
  );

  const filtered = useMemo(
    () => (filter === "All" ? items : items.filter((p) => p.status === filter)),
    [items, filter],
  );

  const replace = (updated: Project) =>
    queryClient.setQueryData<Project[]>(MINE_KEY, (prev) => prev?.map((p) => (p.id === updated.id ? updated : p)));

  const handleDelete = (item: Project) => {
    appAlert("Delete project?", `"${item.title}" will be removed permanently.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await apiDeleteProject(item.id);
            queryClient.setQueryData<Project[]>(MINE_KEY, (prev) => prev?.filter((p) => p.id !== item.id));
            void queryClient.invalidateQueries({ queryKey: ["projects"] });
            toast("Project deleted");
          } catch (e) {
            appAlert("Couldn't delete", userFacingError(e, "Please try again."));
          }
        },
      },
    ]);
  };

  const handleSubmit = async (item: Project) => {
    try {
      replace(await apiUpdateProject(item.id, { status: "Pending Review" }));
      toast("Sent for review");
    } catch (e) {
      appAlert("Couldn't submit", userFacingError(e, "Add at least one photo, then try again."));
    }
  };

  const handleToDraft = async (item: Project) => {
    try {
      replace(await apiUpdateProject(item.id, { status: "Draft" }));
      toast("Moved to draft");
    } catch (e) {
      appAlert("Couldn't update", userFacingError(e, "Please try again."));
    }
  };

  const addAction = { icon: Plus, label: "Add project", tone: "accent" as const, onPress: () => router.push("/post-project" as Href) };

  return (
    <Screen
      title="My projects"
      actions={[addAction]}
      scroll={false}
      contentStyle={{ paddingHorizontal: spacing.lg }}
      fallbackHref={"/(dealer)" as Href}
    >
      {!isApiMode ? (
        <EmptyState icon={Building2} title="Needs a connection" message="Projects are saved on SqftGo servers. Connect the app to manage them." />
      ) : query.isPending ? (
        <ListSkeleton rows={3} />
      ) : query.isError ? (
        <ErrorState message="Check your connection and try again." onRetry={() => void query.refetch()} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={query.isRefetching} onRefresh={() => void query.refetch()} tintColor={colors.accent} />
          }
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <ChipGroup
              options={FILTERS}
              value={filter}
              onChange={setFilter}
              labelFor={(f) => f}
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon={Building2}
              title={filter === "All" ? "No projects yet" : `No ${filter.toLowerCase()} projects`}
              message="Showcase a new launch with its unit types, price range and photos."
              actionLabel="Add project"
              onAction={addAction.onPress}
            />
          }
          renderItem={({ item }) => {
            const actions: SwipeAction[] =
              item.status === "Active" ? [] : [{ label: "Delete", icon: Trash2, tone: "danger", onPress: () => handleDelete(item) }];
            const cover = item.images?.[0];
            return (
              <SwipeRow actions={actions}>
                <Pressable
                  onPress={() => router.push({ pathname: "/edit-project/[id]", params: { id: item.id } })}
                  accessibilityRole="button"
                  accessibilityHint="Opens the project editor"
                  style={({ pressed }) => [styles.card, pressed && { backgroundColor: colors.surfaceSubtle }]}
                >
                  <View style={styles.row}>
                    {cover ? (
                      <Image source={{ uri: cover }} style={styles.thumb} contentFit="cover" />
                    ) : (
                      <View style={[styles.thumb, styles.thumbEmpty]}>
                        <Building2 size={20} color={colors.inkMuted} />
                      </View>
                    )}
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text style={styles.title} numberOfLines={2}>
                        {item.title}
                      </Text>
                      <Text style={styles.meta} numberOfLines={1}>
                        {[item.locality, item.city].filter(Boolean).join(", ")}
                      </Text>
                      <Text style={styles.price}>{formatProjectPriceRange(item.priceFrom, item.priceTo)}</Text>
                    </View>
                    <StatusBadge label={item.status} tone={toneForStatus(item.status)} />
                  </View>
                  {item.status === "Rejected" && item.rejectionReason ? (
                    <Text style={styles.rejection}>Not approved: {item.rejectionReason}</Text>
                  ) : null}
                  <View style={styles.actions}>
                    {item.status === "Draft" ? (
                      <Button label="Submit for review" size="sm" onPress={() => void handleSubmit(item)} />
                    ) : null}
                    {item.status === "Pending Review" || item.status === "Rejected" ? (
                      <Button
                        label="Move to draft"
                        icon={Archive}
                        size="sm"
                        variant="secondary"
                        onPress={() => void handleToDraft(item)}
                      />
                    ) : null}
                  </View>
                </Pressable>
              </SwipeRow>
            );
          }}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.md, flexGrow: 1, paddingTop: spacing.sm, paddingBottom: spacing["3xl"] },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderCurve: "continuous",
    padding: spacing.md,
    gap: spacing.md,
    boxShadow: shadow.card,
  },
  row: { flexDirection: "row", alignItems: "flex-start", gap: spacing.md },
  thumb: { width: 64, height: 64, borderRadius: radius.md },
  thumbEmpty: { backgroundColor: colors.surfaceSubtle, alignItems: "center", justifyContent: "center" },
  title: { ...type.emphasis, color: colors.ink },
  meta: { ...type.caption, color: colors.inkMuted },
  price: { ...type.label, color: colors.accent, fontVariant: ["tabular-nums"] },
  rejection: { ...type.caption, color: colors.danger },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
});
