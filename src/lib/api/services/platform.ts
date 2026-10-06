import { apiFetch } from "@/lib/api/client";

export interface PublicPlatformSettings {
  siteName: string;
  tagline: string;
  supportEmail: string;
  supportPhone: string;
  allowUserListings: boolean;
  maxListingsPerUser: number;
  /** Free dealer listing slots before purchased slots or a plan are needed. */
  maxListingsPerDealer: number;
  requireListingApproval: boolean;
  maintenanceMode: boolean;
  currencyCode: string;
}

export const DEFAULT_PLATFORM_SETTINGS: PublicPlatformSettings = {
  siteName: "SqftGo",
  tagline: "",
  supportEmail: "support@sqftgo.com",
  supportPhone: "",
  allowUserListings: true,
  maxListingsPerUser: 3,
  maxListingsPerDealer: 3,
  requireListingApproval: true,
  maintenanceMode: false,
  currencyCode: "INR",
};

function positive(n: unknown, fallback: number): number {
  return typeof n === "number" && n > 0 ? n : fallback;
}

export async function apiGetPlatformSettings(): Promise<PublicPlatformSettings> {
  const res = await apiFetch<Partial<PublicPlatformSettings>>("/api/platform/settings", {
    public: true,
  });
  return {
    siteName: res.siteName ?? DEFAULT_PLATFORM_SETTINGS.siteName,
    tagline: res.tagline ?? "",
    supportEmail: res.supportEmail ?? DEFAULT_PLATFORM_SETTINGS.supportEmail,
    supportPhone: res.supportPhone ?? "",
    allowUserListings: res.allowUserListings !== false,
    maxListingsPerUser: positive(res.maxListingsPerUser, DEFAULT_PLATFORM_SETTINGS.maxListingsPerUser),
    maxListingsPerDealer: positive(
      res.maxListingsPerDealer,
      DEFAULT_PLATFORM_SETTINGS.maxListingsPerDealer,
    ),
    requireListingApproval: res.requireListingApproval !== false,
    maintenanceMode: res.maintenanceMode === true,
    currencyCode: res.currencyCode ?? "INR",
  };
}
