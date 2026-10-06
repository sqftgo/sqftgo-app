import { apiFetch } from "@/lib/api/client";

export interface ApiLocation {
  id: string;
  city: string;
  state: string;
  country: string;
  active: boolean;
  propertyCount: number;
  sortOrder: number;
}

export async function apiListLocations(): Promise<ApiLocation[]> {
  return apiFetch<ApiLocation[]>("/api/locations", { public: true });
}
