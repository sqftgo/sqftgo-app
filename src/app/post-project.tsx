import { useQueryClient } from "@tanstack/react-query";
import { useRouter, type Href } from "expo-router";
import React from "react";

import { EmptyState, Screen, toast } from "@/components/ds";
import { emptyProjectDraft, ProjectForm, type ProjectSaveStatus } from "@/components/listing/ProjectForm";
import { appAlert } from "@/components/ui/app-alert";
import { Building2 } from "@/components/ui/icons";
import { useApp } from "@/context/AppContext";
import type { ProjectInput } from "@/data/project";
import { isApiMode } from "@/lib/api/config";
import { apiCreateProject } from "@/lib/api/services/projects";

export default function PostProjectScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { userName, profile, canAccessDealerDashboard, selectedCity } = useApp();

  if (!canAccessDealerDashboard || !isApiMode) {
    return (
      <Screen title="Add project" fallbackHref={"/dealer-projects" as Href}>
        <EmptyState
          icon={Building2}
          title={canAccessDealerDashboard ? "Needs a connection" : "For approved dealers"}
          message={
            canAccessDealerDashboard
              ? "Projects are saved on SqftGo servers. Connect the app to add one."
              : "Builder projects can be added once your dealer account is approved."
          }
        />
      </Screen>
    );
  }

  const onSave = async (payload: Partial<ProjectInput>, status: ProjectSaveStatus) => {
    try {
      await apiCreateProject({ ...payload, status: status ?? "Pending Review" });
    } catch (e) {
      appAlert("Couldn't save project", e instanceof Error ? e.message : "Please try again.");
      return false;
    }
    void queryClient.invalidateQueries({ queryKey: ["projects"] });
    toast(status === "Draft" ? "Draft saved" : "Sent for review");
    router.replace("/dealer-projects");
    return true;
  };

  return (
    <ProjectForm
      mode="create"
      screenTitle="Add project"
      initial={emptyProjectDraft({
        city: selectedCity,
        contactName: profile?.name || userName,
        contactPhone: profile?.phone ?? "",
      })}
      onSave={onSave}
    />
  );
}
