import { apiFetch } from "@/lib/api/client";

export type GeneralEnquiryInput = {
  name: string;
  email: string;
  mobile: string;
  city?: string;
  propertyType?: string;
  budget?: string;
  remarks?: string;
  message?: string;
  payload?: Record<string, unknown>;
};

/** Public general enquiry (`POST /api/enquiries`), e.g. wedding venue requests. */
export async function apiCreateEnquiry(body: GeneralEnquiryInput): Promise<{ id: string }> {
  return apiFetch<{ id: string }>("/api/enquiries", { method: "POST", body, public: true });
}
