import { apiFetch } from "@/lib/api/client";
import { mapVisitFromApi, mapVisitStatusToApi } from "@/lib/api/mappers";
import type { SiteVisit, VisitStatus } from "@/data/types";

interface ListResponse<T> {
  items: T[];
}

export async function apiListVisits(): Promise<SiteVisit[]> {
  const res = await apiFetch<ListResponse<unknown> | unknown[]>("/api/visits");
  const items = Array.isArray(res) ? res : res.items ?? [];
  return items.map((row) => mapVisitFromApi(row as Parameters<typeof mapVisitFromApi>[0]));
}

export async function apiCreateVisit(
  propertyId: string,
  body: {
    name: string;
    email: string;
    phone: string;
    date: string;
    time: string;
    notes?: string;
  },
): Promise<SiteVisit> {
  const raw = await apiFetch<Parameters<typeof mapVisitFromApi>[0]>(
    `/api/properties/${propertyId}/visits`,
    { method: "POST", body },
  );
  return mapVisitFromApi({ ...raw, propertyId: raw.propertyId ?? propertyId });
}

export async function apiPatchVisit(
  id: string,
  body: { status: VisitStatus },
): Promise<SiteVisit> {
  const raw = await apiFetch<Parameters<typeof mapVisitFromApi>[0]>(
    `/api/visits/${id}`,
    { method: "PATCH", body: { status: mapVisitStatusToApi(body.status) } },
  );
  return mapVisitFromApi(raw);
}
