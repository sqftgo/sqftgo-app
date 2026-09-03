import { apiFetch } from "@/lib/api/client";
import type { Project, ProjectInput, ProjectStatus } from "@/data/project";

interface ListResponse<T> {
  items: T[];
  total?: number;
}

export type ProjectListFilters = {
  city?: string;
  status?: ProjectStatus | string;
  search?: string;
  limit?: number;
  mine?: boolean;
};

function toQuery(filters: ProjectListFilters = {}): string {
  const params = new URLSearchParams();
  if (filters.mine) params.set("mine", "1");
  if (filters.city) params.set("city", filters.city);
  if (filters.status) params.set("status", filters.status);
  if (filters.search) params.set("search", filters.search);
  params.set("limit", String(filters.limit ?? 50));
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export async function apiListProjects(
  filters: ProjectListFilters = {},
): Promise<Project[]> {
  const res = await apiFetch<ListResponse<Project> | Project[]>(
    `/api/projects${toQuery(filters)}`,
    { public: !filters.mine },
  );
  return Array.isArray(res) ? res : res.items ?? [];
}

export async function apiGetProject(id: string): Promise<Project> {
  return apiFetch<Project>(`/api/projects/${id}`, { public: true });
}

export async function apiCreateProject(body: Partial<ProjectInput>): Promise<Project> {
  return apiFetch<Project>("/api/projects", { method: "POST", body });
}

export async function apiUpdateProject(
  id: string,
  body: Partial<ProjectInput>,
): Promise<Project> {
  return apiFetch<Project>(`/api/projects/${id}`, { method: "PATCH", body });
}

export async function apiDeleteProject(id: string): Promise<void> {
  await apiFetch(`/api/projects/${id}`, { method: "DELETE" });
}
