import { apiFetch } from "@/lib/api/client";
import type { DirectoryProfile } from "@/data/types";

interface ListResponse<T> {
  items: T[];
  total?: number;
}

export async function apiListDealers(mine = false): Promise<DirectoryProfile[]> {
  const q = mine ? "?mine=1" : "";
  const res = await apiFetch<ListResponse<DirectoryProfile> | DirectoryProfile[]>(
    `/api/dealers${q}`,
  );
  return Array.isArray(res) ? res : res.items ?? [];
}

export async function apiCreateDealer(
  body: Omit<DirectoryProfile, "id" | "userId" | "listingsCount">,
): Promise<DirectoryProfile> {
  return apiFetch<DirectoryProfile>("/api/dealers", { method: "POST", body });
}

export async function apiUpdateDealer(
  id: string,
  body: Partial<DirectoryProfile>,
): Promise<DirectoryProfile> {
  return apiFetch<DirectoryProfile>(`/api/dealers/${id}`, { method: "PATCH", body });
}

export async function apiGetDealer(id: string): Promise<DirectoryProfile> {
  return apiFetch<DirectoryProfile>(`/api/dealers/${id}`);
}
