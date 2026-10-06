import { useApp } from "@/context/AppContext";

type App = ReturnType<typeof useApp>;

function pick<K extends keyof App>(app: App, keys: readonly K[]): Pick<App, K> {
  const out = {} as Pick<App, K>;
  for (const k of keys) out[k] = app[k];
  return out;
}

const SESSION_KEYS = [
  "isLoggedIn",
  "isHydrating",
  "authStatus",
  "authError",
  "retryAuthCheck",
  "profile",
  "userEmail",
  "userName",
  "userRole",
  "dealerAccess",
  "canAccessDealerDashboard",
  "signIn",
  "signUp",
  "signInWithGoogle",
  "signOut",
  "forgotPassword",
  "updatePassword",
  "updateProfile",
  "refreshSessionFromApi",
  "sessionNotice",
  "clearSessionNotice",
  "submitKyc",
  "registerAsDealer",
] as const;

const LISTING_KEYS = [
  "properties",
  "mergeProperties",
  "addProperty",
  "updateProperty",
  "deleteProperty",
  "refreshMyProperties",
  "catalogLoadFailed",
  "reloadCatalog",
  "myListingsCount",
  "canPostListing",
  "getLastActionError",
] as const;

const LEAD_KEYS = [
  "inquiries",
  "submitInquiry",
  "markInquiryRead",
  "archiveInquiry",
  "replyInquiry",
  "refreshInquiries",
  "messageThreads",
  "messagesByThread",
  "createMessageThread",
  "sendThreadMessage",
  "loadThreadMessages",
  "getLastActionError",
] as const;

const VISIT_KEYS = [
  "visits",
  "bookVisit",
  "updateVisitStatus",
  "rescheduleVisit",
  "cancelVisit",
  "refreshVisits",
  "getLastActionError",
] as const;

const DIRECTORY_KEYS = ["directoryProfiles", "updateDirectoryProfile", "registerServiceProfile"] as const;

const PREFERENCE_KEYS = [
  "selectedCity",
  "setSelectedCity",
  "favorites",
  "toggleFavorite",
  "notifPrefs",
  "setNotifPrefs",
  "hasCompletedOnboarding",
  "setHasCompletedOnboarding",
  "onboardingStep",
  "setOnboardingStep",
  "preferredRole",
  "setPreferredRole",
] as const;

const PLATFORM_KEYS = ["isApiMode", "platformSettings", "maintenanceMode"] as const;

/** Account, auth and role state. */
export const useSession = () => pick(useApp(), SESSION_KEYS);
/** Property catalogue cache plus owner/dealer listing writes and caps. */
export const useListings = () => pick(useApp(), LISTING_KEYS);
/** Inquiries and message threads (buyer and lister sides). */
export const useLeads = () => pick(useApp(), LEAD_KEYS);
/** Site visits for buyers and listers. */
export const useVisits = () => pick(useApp(), VISIT_KEYS);
/** Dealer and service-partner directory profiles. */
export const useDirectory = () => pick(useApp(), DIRECTORY_KEYS);
/** Device-level preferences: city, saved homes, onboarding, notification toggles. */
export const usePreferences = () => pick(useApp(), PREFERENCE_KEYS);
/** Public platform settings and runtime mode. */
export const usePlatform = () => pick(useApp(), PLATFORM_KEYS);
