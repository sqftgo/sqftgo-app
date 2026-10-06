import { apiFetch } from "@/lib/api/client";

export interface ApiAmenity {
  id: string;
  name: string;
  active: boolean;
  sortOrder?: number;
}

export async function apiListAmenities(): Promise<ApiAmenity[]> {
  return apiFetch<ApiAmenity[]>("/api/amenities", { public: true });
}
