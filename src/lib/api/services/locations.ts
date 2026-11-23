import { apiFetch } from "@/lib/api/client";
import { API_BASE_URL } from "@/lib/api/config";

export interface ApiLocation {
  id: string;
  city: string;
  state: string;
  country: string;
  active: boolean;
  propertyCount: number;
  sortOrder: number;
  /** Absolute or site-relative cover image from admin-managed locations. */
  coverImageUrl?: string | null;
}

/** Resolve catalog cover paths like `/cities/udaipur.jpg` against the BFF origin. */
export function resolveLocationCoverUrl(coverImageUrl?: string | null): string | null {
  const raw = coverImageUrl?.trim();
  if (!raw) return null;
  if (/^https?:\/\//i.test(raw)) return raw;
  if (!API_BASE_URL) return null;
  return `${API_BASE_URL}${raw.startsWith("/") ? raw : `/${raw}`}`;
}

export async function apiListLocations(): Promise<ApiLocation[]> {
  return apiFetch<ApiLocation[]>("/api/locations", { public: true });
}
