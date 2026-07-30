import { apiFetch } from "@/lib/api/client";

export async function apiListFavorites(): Promise<string[]> {
  return apiFetch<string[]>("/api/favorites");
}

export async function apiAddFavorite(propertyId: string): Promise<void> {
  await apiFetch("/api/favorites", {
    method: "POST",
    body: { propertyId },
  });
}

export async function apiRemoveFavorite(propertyId: string): Promise<void> {
  await apiFetch(`/api/favorites/${propertyId}`, { method: "DELETE" });
}
