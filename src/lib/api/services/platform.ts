import { apiFetch } from "@/lib/api/client";

export interface PublicPlatformSettings {
  siteName: string;
  tagline: string;
  supportEmail: string;
  supportPhone: string;
  allowUserListings: boolean;
  maxListingsPerUser: number;
  currencyCode: string;
}

export const DEFAULT_PLATFORM_SETTINGS: PublicPlatformSettings = {
  siteName: "SqftGo",
  tagline: "",
  supportEmail: "support@sqftgo.com",
  supportPhone: "",
  allowUserListings: true,
  maxListingsPerUser: 2,
  currencyCode: "INR",
};

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
    maxListingsPerUser:
      typeof res.maxListingsPerUser === "number" && res.maxListingsPerUser > 0
        ? res.maxListingsPerUser
        : DEFAULT_PLATFORM_SETTINGS.maxListingsPerUser,
    currencyCode: res.currencyCode ?? "INR",
  };
}
