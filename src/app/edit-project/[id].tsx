import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter, type Href } from "expo-router";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { ErrorState, ListSkeleton, Screen, StatusBadge, toast } from "@/components/ds";
import { ProjectForm, projectDraftFrom, type ProjectSaveStatus } from "@/components/listing/ProjectForm";
import { appAlert } from "@/components/ui/app-alert";
import type { ProjectInput } from "@/data/project";
import { apiGetProject, apiUpdateProject } from "@/lib/api/services/projects";
import { colors, radius, spacing, type } from "@/theme/tokens";

export default function EditProjectScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { id } = useLocalSearchParams<{ id: string }>();
  const query = useQuery({ queryKey: ["project", id], queryFn: () => apiGetProject(id), enabled: Boolean(id) });
  const project = query.data;

  if (query.isPending) {
    return (
      <Screen title="Edit project" fallbackHref={"/dealer-projects" as Href}>
        <ListSkeleton rows={4} />
      </Screen>
    );
  }
  if (!project) {
    return (
      <Screen title="Edit project" fallbackHref={"/dealer-projects" as Href}>
        <ErrorState title="Couldn't load this project" onRetry={() => void query.refetch()} />
      </Screen>
    );
  }

  const onSave = async (payload: Partial<ProjectInput>, status: ProjectSaveStatus) => {
    try {
      await apiUpdateProject(project.id, status ? { ...payload, status } : payload);
    } catch (e) {
      appAlert("Couldn't save project", e instanceof Error ? e.message : "Please try again.");
      return false;
    }
    void queryClient.invalidateQueries({ queryKey: ["project", project.id] });
    void queryClient.invalidateQueries({ queryKey: ["projects"] });
    toast(status === "Pending Review" ? "Sent for review" : "Changes saved");
    router.back();
    return true;
  };

  const banner = (
    <View style={[styles.banner, project.status === "Rejected" && styles.bannerWarn]}>
      <StatusBadge label={project.status} />
      {project.status === "Rejected" && project.rejectionReason ? (
        <Text style={styles.bannerText}>Not approved: {project.rejectionReason}</Text>
      ) : project.status === "Pending Review" ? (
        <Text style={styles.bannerText}>Our team is reviewing this project. Edits stay in review.</Text>
      ) : null}
    </View>
  );

  return (
    <ProjectForm
      key={project.id}
      mode="edit"
      screenTitle="Edit project"
      status={project.status}
      initial={projectDraftFrom(project)}
      banner={banner}
      onSave={onSave}
    />
  );
}

const styles = StyleSheet.create({
  banner: { gap: spacing.sm, padding: spacing.lg, borderRadius: radius.lg, backgroundColor: colors.surfaceSubtle, alignItems: "flex-start" },
  bannerWarn: { backgroundColor: colors.warningSoft, borderWidth: 1, borderColor: colors.warningBorder },
  bannerText: { ...type.body, color: colors.inkSecondary },
});
