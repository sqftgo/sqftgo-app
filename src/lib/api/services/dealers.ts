import { apiFetch } from "@/lib/api/client";
import type { DirectoryProfile } from "@/data/types";

interface ListResponse<T> {
  items: T[];
  total?: number;
}

/** Keys accepted by the web's strict dealer create/update schemas. */
const WRITABLE_KEYS = [
  "firmName",
  "ownerName",
  "category",
  "city",
  "address",
  "email",
  "website",
  "mobile",
  "description",
  "reraId",
  "experience",
  "specialties",
  "teamSize",
  "serviceTypeId",
  "servicesOffered",
  "businessHours",
  "coverImageUrl",
  "logoUrl",
  "lat",
  "lng",
  "listingActive",
] as const satisfies readonly (keyof DirectoryProfile)[];

function normalize(p: DirectoryProfile): DirectoryProfile {
  return {
    ...p,
    avatarUrl: p.avatarUrl ?? p.logoUrl ?? undefined,
    coverUrl: p.coverUrl ?? p.coverImageUrl ?? undefined,
  };
}

function toBody(input: Partial<DirectoryProfile>): Record<string, unknown> {
  const source: Partial<DirectoryProfile> = {
    ...input,
    logoUrl: input.logoUrl !== undefined ? input.logoUrl : input.avatarUrl,
    coverImageUrl: input.coverImageUrl !== undefined ? input.coverImageUrl : input.coverUrl,
  };
  const body: Record<string, unknown> = {};
  for (const key of WRITABLE_KEYS) {
    if (source[key] !== undefined) body[key] = source[key];
  }
  return body;
}

export async function apiListDealers(mine = false): Promise<DirectoryProfile[]> {
  const q = mine ? "?mine=1" : "";
  const res = await apiFetch<ListResponse<DirectoryProfile> | DirectoryProfile[]>(
    `/api/dealers${q}`,
  );
  return (Array.isArray(res) ? res : (res.items ?? [])).map(normalize);
}

/** Public dealers directory (agents, consultants, builders) — mirrors Services `surface=services`. */
export async function apiListDealerDirectory(filters: {
  city?: string;
  search?: string;
  category?: string;
  limit?: number;
} = {}): Promise<DirectoryProfile[]> {
  const params = new URLSearchParams();
  params.set("surface", "dealers");
  if (filters.city) params.set("city", filters.city);
  if (filters.search) params.set("search", filters.search);
  if (filters.category) params.set("category", filters.category);
  params.set("limit", String(filters.limit ?? 60));
  const res = await apiFetch<ListResponse<DirectoryProfile> | DirectoryProfile[]>(
    `/api/dealers?${params.toString()}`,
    { public: true },
  );
  return (Array.isArray(res) ? res : (res.items ?? [])).map(normalize);
}

export async function apiCreateDealer(
  body: Omit<DirectoryProfile, "id" | "userId" | "listingsCount">,
): Promise<DirectoryProfile> {
  return normalize(await apiFetch<DirectoryProfile>("/api/dealers", { method: "POST", body: toBody(body) }));
}

export async function apiUpdateDealer(
  id: string,
  body: Partial<DirectoryProfile>,
): Promise<DirectoryProfile> {
  return normalize(
    await apiFetch<DirectoryProfile>(`/api/dealers/${id}`, { method: "PATCH", body: toBody(body) }),
  );
}

export async function apiGetDealer(id: string): Promise<DirectoryProfile> {
  return normalize(await apiFetch<DirectoryProfile>(`/api/dealers/${id}`));
}
