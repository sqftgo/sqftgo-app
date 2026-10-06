import { apiFetch } from "@/lib/api/client";
import type { Property, PropertyStatus } from "@/data/types";

interface ListResponse<T> {
  items: T[];
  total?: number;
  limit?: number;
  offset?: number;
}

export type PropertyListFilters = {
  city?: string;
  type?: string;
  purpose?: string;
  status?: PropertyStatus | string;
  featured?: boolean;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  limit?: number;
  offset?: number;
};

function toQuery(filters: PropertyListFilters = {}): string {
  const params = new URLSearchParams();
  if (filters.city) params.set("city", filters.city);
  if (filters.type) params.set("type", filters.type);
  if (filters.purpose) params.set("purpose", filters.purpose);
  if (filters.status) params.set("status", filters.status);
  if (filters.featured) params.set("featured", "true");
  if (filters.search) params.set("search", filters.search);
  if (filters.minPrice != null) params.set("minPrice", String(filters.minPrice));
  if (filters.maxPrice != null) params.set("maxPrice", String(filters.maxPrice));
  params.set("limit", String(filters.limit ?? 100));
  if (filters.offset != null) params.set("offset", String(filters.offset));
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export async function apiListProperties(
  filters: PropertyListFilters = {},
): Promise<Property[]> {
  const res = await apiFetch<ListResponse<Property> | Property[]>(
    `/api/properties${toQuery(filters)}`,
    { public: true },
  );
  return Array.isArray(res) ? res : res.items ?? [];
}

export type PropertyPage = { items: Property[]; total: number; offset: number };

export async function apiListPropertiesPage(filters: PropertyListFilters = {}): Promise<PropertyPage> {
  const res = await apiFetch<ListResponse<Property> | Property[]>(
    `/api/properties${toQuery(filters)}`,
    { public: true },
  );
  if (Array.isArray(res)) return { items: res, total: res.length, offset: filters.offset ?? 0 };
  const items = res.items ?? [];
  return { items, total: res.total ?? items.length, offset: res.offset ?? filters.offset ?? 0 };
}

export async function apiGetProperty(id: string): Promise<Property> {
  return apiFetch<Property>(`/api/properties/${id}`, { public: true });
}

export async function apiListMyProperties(limit = 100): Promise<Property[]> {
  const res = await apiFetch<ListResponse<Property> | Property[]>(
    `/api/properties?mine=1&limit=${limit}`,
  );
  return Array.isArray(res) ? res : res.items ?? [];
}

export async function apiCreateProperty(
  body: Partial<Property> & { status?: PropertyStatus },
): Promise<Property> {
  return apiFetch<Property>("/api/properties", { method: "POST", body });
}

export async function apiUpdateProperty(
  id: string,
  body: Partial<Property>,
): Promise<Property> {
  return apiFetch<Property>(`/api/properties/${id}`, { method: "PATCH", body });
}

export async function apiDeleteProperty(id: string): Promise<void> {
  await apiFetch(`/api/properties/${id}`, { method: "DELETE" });
}
