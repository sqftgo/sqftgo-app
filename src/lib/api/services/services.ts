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

export type ServiceBookingStatus =
  | "pending"
  | "confirmed"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "rejected"
  | "reschedule_requested"
  | "reschedule_proposed";

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
  /** When set, only partners of this service type (server-side when supported). */
  serviceTypeId?: string;
  category?: string;
  limit?: number;
} = {}): Promise<DirectoryProfile[]> {
  const params = new URLSearchParams();
  params.set("surface", "services");
  if (filters.city) params.set("city", filters.city);
  if (filters.search) params.set("search", filters.search);
  if (filters.serviceTypeId) params.set("serviceTypeId", filters.serviceTypeId);
  if (filters.category) params.set("category", filters.category);
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

export type ServicePortfolioImage = {
  id: string;
  directoryProfileId: string;
  imageUrl: string;
  caption?: string;
  sortOrder?: number;
  createdAt?: string;
};

export type ServiceReview = {
  id: string;
  directoryProfileId: string;
  userId: string;
  rating: number;
  title?: string;
  body: string;
  status?: string;
  createdAt: string;
  reviewerName?: string;
};

export async function apiListServicePortfolio(
  directoryProfileId: string,
): Promise<ServicePortfolioImage[]> {
  const res = await apiFetch<{ items?: ServicePortfolioImage[] } | ServicePortfolioImage[]>(
    `/api/services/${directoryProfileId}/portfolio`,
    { public: true },
  );
  return Array.isArray(res) ? res : res.items ?? [];
}

export async function apiListServiceReviews(
  directoryProfileId: string,
): Promise<{ items: ServiceReview[]; averageRating?: number; total?: number }> {
  const res = await apiFetch<{
    items?: ServiceReview[];
    averageRating?: number;
    total?: number;
    avg?: number;
  }>(`/api/services/${directoryProfileId}/reviews`, { public: true });
  return {
    items: res.items ?? [],
    averageRating: res.averageRating ?? res.avg,
    total: res.total ?? res.items?.length ?? 0,
  };
}

export async function apiCreateServiceReview(
  directoryProfileId: string,
  body: { rating: number; title?: string; body: string },
): Promise<ServiceReview> {
  return apiFetch<ServiceReview>(`/api/services/${directoryProfileId}/reviews`, {
    method: "POST",
    body,
  });
}

export async function apiGetServiceWebsiteStatus(
  directoryProfileId: string,
): Promise<{ active: boolean; hasWebsite: boolean; websiteUrl?: string }> {
  return apiFetch(`/api/services/${directoryProfileId}/website-status`, { public: true });
}

export type WebsitePromotionPlan = {
  id: string;
  name: string;
  description?: string;
  amountPaise: number;
  durationDays: number;
  active?: boolean;
};

export async function apiListWebsitePromotionPlans(): Promise<WebsitePromotionPlan[]> {
  const res = await apiFetch<{ items?: WebsitePromotionPlan[] } | WebsitePromotionPlan[]>(
    "/api/services/website-promotion/plans",
  );
  return Array.isArray(res) ? res : res.items ?? [];
}

export async function apiGetMyWebsitePromotion(): Promise<{
  status?: string;
  expiresAt?: string | null;
  websiteUrl?: string | null;
  active?: boolean;
} | null> {
  try {
    return await apiFetch("/api/services/website-promotion");
  } catch {
    return null;
  }
}

export async function apiListMyServiceBookings(): Promise<ServiceBooking[]> {
  const res = await apiFetch<ListResponse<ServiceBooking> | ServiceBooking[]>(
    "/api/service-bookings",
  );
  return Array.isArray(res) ? res : res.items ?? [];
}

export async function apiCancelServiceBooking(id: string): Promise<ServiceBooking> {
  return apiUpdateServiceBooking(id, { status: "cancelled" });
}

export async function apiUpdateServiceBooking(
  id: string,
  body: Partial<{ status: ServiceBookingStatus; ownerNotes: string }>,
): Promise<ServiceBooking> {
  return apiFetch<ServiceBooking>(`/api/service-bookings/${id}`, { method: "PATCH", body });
}

/** Booking requests received by the signed-in service owner. */
export async function apiListOwnerServiceBookings(directoryProfileId: string): Promise<ServiceBooking[]> {
  const res = await apiFetch<ListResponse<ServiceBooking> | ServiceBooking[]>(
    `/api/services/${directoryProfileId}/bookings`,
  );
  return Array.isArray(res) ? res : res.items ?? [];
}

export type ServiceVerificationStatus = "draft" | "pending" | "approved" | "rejected";

export type ServiceVerification = {
  id: string;
  directoryProfileId: string;
  status: ServiceVerificationStatus;
  businessRegistrationId?: string | null;
  ownerNotes: string;
  rejectionReason?: string | null;
  submittedAt?: string | null;
  reviewedAt?: string | null;
};

export async function apiGetMyServiceVerification(): Promise<ServiceVerification | null> {
  return apiFetch<ServiceVerification | null>("/api/service-verifications");
}

export async function apiSubmitServiceVerification(body: {
  businessRegistrationId?: string | null;
  ownerNotes?: string;
}): Promise<ServiceVerification> {
  return apiFetch<ServiceVerification>("/api/service-verifications", { method: "POST", body });
}
