import { apiFetch } from "@/lib/api/client";
import { mapInquiryFromApi } from "@/lib/api/mappers";
import type { Inquiry, InquiryStatus } from "@/data/types";

interface ListResponse<T> {
  items: T[];
}

export async function apiListInquiries(): Promise<Inquiry[]> {
  const res = await apiFetch<ListResponse<unknown> | unknown[]>("/api/inquiries");
  const items = Array.isArray(res) ? res : res.items ?? [];
  return items.map((row) => mapInquiryFromApi(row as Parameters<typeof mapInquiryFromApi>[0]));
}

export async function apiCreateInquiry(
  propertyId: string,
  body: { name: string; email: string; phone: string; message: string },
): Promise<Inquiry> {
  const raw = await apiFetch<Parameters<typeof mapInquiryFromApi>[0]>(
    `/api/properties/${propertyId}/inquiries`,
    { method: "POST", body, public: true },
  );
  return mapInquiryFromApi({ ...raw, propertyId: raw.propertyId ?? propertyId });
}

export async function apiPatchInquiry(
  id: string,
  body: { status?: InquiryStatus; replyMessage?: string },
): Promise<Inquiry> {
  const raw = await apiFetch<Parameters<typeof mapInquiryFromApi>[0]>(
    `/api/inquiries/${id}`,
    { method: "PATCH", body },
  );
  return mapInquiryFromApi(raw);
}
