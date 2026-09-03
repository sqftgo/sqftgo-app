import { apiFetch } from "@/lib/api/client";
import type { DirectoryProfile } from "@/data/types";

export type ServiceType = {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  active: boolean;
  sortOrder?: number;
};

export type ServiceBookingStatus = "pending" | "confirmed" | "cancelled" | "completed";

export type ServiceBooking = {
  id: string;
  directoryProfileId: string;
  userId: string;
  preferredAt: string;
  message?: string;
  contactPhone: string;
  status: ServiceBookingStatus;
  ownerNotes?: string;
  createdAt: string;
  firmName?: string;
  city?: string;
};

interface ListResponse<T> {
  items: T[];
  total?: number;
}

export async function apiListServiceTypes(): Promise<ServiceType[]> {
  const res = await apiFetch<ServiceType[] | ListResponse<ServiceType>>(
    "/api/service-types",
    { public: true },
  );
  return Array.isArray(res) ? res : res.items ?? [];
}

export async function apiListServicePartners(filters: {
  city?: string;
  search?: string;
  limit?: number;
} = {}): Promise<DirectoryProfile[]> {
  const params = new URLSearchParams();
  params.set("surface", "services");
  if (filters.city) params.set("city", filters.city);
  if (filters.search) params.set("search", filters.search);
  params.set("limit", String(filters.limit ?? 50));
  const res = await apiFetch<ListResponse<DirectoryProfile> | DirectoryProfile[]>(
    `/api/dealers?${params.toString()}`,
    { public: true },
  );
  return Array.isArray(res) ? res : res.items ?? [];
}

export async function apiCreateServiceBooking(
  directoryProfileId: string,
  body: { preferredAt: string; contactPhone: string; message?: string },
): Promise<ServiceBooking> {
  return apiFetch<ServiceBooking>(`/api/services/${directoryProfileId}/bookings`, {
    method: "POST",
    body,
  });
}

export async function apiListMyServiceBookings(): Promise<ServiceBooking[]> {
  const res = await apiFetch<ListResponse<ServiceBooking> | ServiceBooking[]>(
    "/api/service-bookings",
  );
  return Array.isArray(res) ? res : res.items ?? [];
}

export async function apiCancelServiceBooking(id: string): Promise<ServiceBooking> {
  return apiFetch<ServiceBooking>(`/api/service-bookings/${id}`, {
    method: "PATCH",
    body: { status: "cancelled" },
  });
}
