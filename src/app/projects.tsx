import { useQuery } from "@tanstack/react-query";
import { type Href } from "expo-router";
import React from "react";
import { FlatList, RefreshControl } from "react-native";

import { ErrorState, ListSkeleton, Screen } from "@/components/ds";
import { EmptyState } from "@/components/ui/empty-state";
import { Building2 } from "@/components/ui/icons";
import { ProjectCard } from "@/components/ui/project-card";
import { useApp } from "@/context/AppContext";
import { isApiMode } from "@/lib/api/config";
import { apiListProjects } from "@/lib/api/services/projects";
import { colors, spacing } from "@/theme/tokens";

export default function ProjectsBrowseScreen() {
  const { selectedCity } = useApp();
  const city = selectedCity && selectedCity.toLowerCase() !== "all india" ? selectedCity : undefined;
  const query = useQuery({
    queryKey: ["projects", "browse", city ?? "all"],
    queryFn: async () => (await apiListProjects({ city, limit: 50 })).filter((p) => p.status === "Active" || !p.status),
    enabled: isApiMode,
  });

  return (
    <Screen title="Projects" subtitle={city ? `Builder launches in ${city}` : "Builder launches"} scroll={false} contentStyle={{ paddingHorizontal: spacing.lg }} fallbackHref={"/" as Href}>
      {query.isPending && isApiMode ? (
        <ListSkeleton rows={3} />
      ) : query.isError ? (
        <ErrorState message="Check your connection and try again." onRetry={() => void query.refetch()} />
      ) : (
        <FlatList
          data={query.data ?? []}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ProjectCard project={item} />}
          refreshControl={
            isApiMode ? (
              <RefreshControl refreshing={query.isRefetching} onRefresh={() => void query.refetch()} tintColor={colors.accent} />
            ) : undefined
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ gap: spacing.md, flexGrow: 1, paddingTop: spacing.sm, paddingBottom: spacing.xxl }}
          ListEmptyComponent={
            <EmptyState
              icon={Building2}
              title={isApiMode ? (city ? `No projects in ${city} yet` : "No active projects") : "Needs a connection"}
              message={isApiMode ? "New launches appear here as soon as they're approved." : "Connect the app to SqftGo to see live projects."}
            />
          }
        />
      )}
    </Screen>
  );
}
