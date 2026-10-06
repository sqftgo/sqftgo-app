/**
 * SqftGo mobile client for the Next.js BFF (Supabase-backed).
 * Set EXPO_PUBLIC_API_URL for live auth + data. Unset = AsyncStorage mock demo.
 *
 * Dealer signup: pass intent `"dealer"` → BFF promotes `profiles.role` to `broker`
 * (same as web `/dealer/register`). Existing users still use `registerAsDealer`
 * for a directory card; dashboard unlock still needs broker role.
 */

import React, { createContext, useCallback, useEffect, useMemo, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { seedDirectoryProfiles } from "@/data/directory";
import { seedProperties } from "@/data/properties";
import type {
  AccountStatus,
  DealerAccessStatus,
  DealerAnalytics,
  DealerKyc,
  DirectoryProfile,
  Inquiry,
  InquiryStatus,
  ListerStatus,
  Message,
  MessageThread,
  Property,
  SiteVisit,
  UserProfile,
  UserRole,
  VisitStatus,
} from "@/data/types";
import { isApiMode } from "@/lib/api/config";
import { clearTokens, getTokens, setTokens } from "@/lib/api/auth-token";
import { ApiError, onSessionEvent } from "@/lib/api/client";
import {
  apiForgotPassword,
  apiGoogleSignIn,
  apiLogin,
  apiLogout,
  apiMe,
  apiSignup,
  apiUpdateMe,
  apiUpdatePassword,
  type AuthMeResponse,
} from "@/lib/api/services/auth";
import { deriveDealerAnalytics, apiGetDealerAnalytics } from "@/lib/api/services/analytics";
import {
  apiCreateDealer,
  apiListDealers,
  apiUpdateDealer,
} from "@/lib/api/services/dealers";
import {
  apiAddFavorite,
  apiListFavorites,
  apiRemoveFavorite,
} from "@/lib/api/services/favorites";
import { apiGetKyc, apiPutKyc } from "@/lib/api/services/kyc";
import {
  apiCreateInquiry,
  apiListInquiries,
  apiListReceivedInquiries,
  apiPatchInquiry,
} from "@/lib/api/services/inquiries";
import {
  apiCreateThread,
  apiListThreadMessages,
  apiListThreads,
  apiSendMessage,
} from "@/lib/api/services/messages";
import {
  apiCreateProperty,
  apiDeleteProperty,
  apiListMyProperties,
  apiListProperties,
  apiUpdateProperty,
} from "@/lib/api/services/properties";
import {
  apiGetPlatformSettings,
  DEFAULT_PLATFORM_SETTINGS,
  type PublicPlatformSettings,
} from "@/lib/api/services/platform";
import { apiCreateVisit, apiListVisits, apiPatchVisit } from "@/lib/api/services/visits";
import { ownsProperty } from "@/lib/ownership";

export type { Property, DirectoryProfile, Inquiry, SiteVisit, UserProfile } from "@/data/types";
export type { PublicPlatformSettings } from "@/lib/api/services/platform";

const STORAGE_KEYS = {
  onboarding: "hasCompletedOnboarding",
  onboardingStep: "onboarding_step",
  favorites: "favorites",
  city: "selectedCity",
  session: "session",
  preferredRole: "preferredRole",
  properties: "properties",
  inquiries: "inquiries",
  visits: "visits",
  accounts: "accounts",
  directory: "directory",
  messages: "message_threads",
  notifPrefs: "notif_prefs",
} as const;

interface StoredAccount {
  id: string;
  email: string;
  password: string;
  name: string;
  phone?: string;
  role: UserRole | "admin";
  status: AccountStatus;
  dealerAccess: DealerAccessStatus;
  directoryProfileId?: string;
  kyc?: DealerKyc;
  joinedDate: string;
}

interface Session {
  isLoggedIn: boolean;
  accountId: string;
  email: string;
  name: string;
  phone?: string;
  role: UserRole | null;
  status: AccountStatus;
  dealerAccess: DealerAccessStatus;
  listingStatus: ListerStatus;
  directoryProfileId?: string;
  kyc?: DealerKyc;
  joinedDate: string;
  bio?: string;
  city?: string;
  avatarUrl?: string;
}

const GUEST_SESSION: Session = {
  isLoggedIn: false,
  accountId: "",
  email: "",
  name: "",
  role: null,
  status: "active",
  dealerAccess: "none",
  listingStatus: "none",
  joinedDate: "",
};

/** Demo accounts — password sqftgo26 for walkthroughs. */
export const DEMO_ACCOUNTS: StoredAccount[] = [
  {
    id: "acc-buyer",
    email: "buyer@sqftgo.com",
    password: "sqftgo26",
    name: "Riya Sharma",
    phone: "+91 98765 43210",
    role: "user",
    status: "active",
    dealerAccess: "none",
    joinedDate: "2025-01-12T00:00:00.000Z",
  },
  {
    id: "acc-broker",
    email: "broker@sqftgo.com",
    password: "sqftgo26",
    name: "Aman Verma",
    phone: "+91 98111 22334",
    role: "broker",
    status: "active",
    dealerAccess: "approved",
    directoryProfileId: "dir-dealer-1",
    kyc: {
      status: "approved",
      panNumber: "ABCDE1234F",
      aadhaarLast4: "4321",
      submittedAt: "2025-02-01T00:00:00.000Z",
      reviewedAt: "2025-02-03T00:00:00.000Z",
    },
    joinedDate: "2024-11-01T00:00:00.000Z",
  },
  {
    id: "acc-pending",
    email: "pending@sqftgo.com",
    password: "sqftgo26",
    name: "Neha Patel",
    phone: "+91 99000 11122",
    role: "user",
    status: "active",
    dealerAccess: "pending",
    directoryProfileId: "dir-pending",
    kyc: {
      status: "pending",
      panNumber: "FGHIJ5678K",
      aadhaarLast4: "9876",
      submittedAt: "2026-07-20T00:00:00.000Z",
    },
    joinedDate: "2026-07-15T00:00:00.000Z",
  },
  {
    id: "acc-admin",
    email: "admin@sqftgo.com",
    password: "sqftgo26",
    name: "Admin",
    role: "admin",
    status: "active",
    dealerAccess: "none",
    joinedDate: "2024-01-01T00:00:00.000Z",
  },
];

const seedWithBroker: Property[] = seedProperties.map((p) => ({
  ...p,
  brokerEmail: p.brokerEmail ?? "broker@sqftgo.com",
  ownerEmail: p.brokerEmail ?? "broker@sqftgo.com",
  ownerId: "acc-broker",
}));

const PENDING_DIRECTORY: DirectoryProfile = {
  id: "dir-pending",
  firmName: "Patel Realty Advisors",
  ownerName: "Neha Patel",
  category: "Agent & Broker",
  city: "Udaipur",
  address: "Near Fateh Sagar, Udaipur",
  email: "pending@sqftgo.com",
  website: "https://patelrealty.example",
  mobile: "+91 99000 11122",
  description: "Waiting for approval from the SqftGo team.",
  experience: "6 years",
  specialties: ["Residential", "Resale"],
  listingsCount: 0,
  userId: "acc-pending",
};

type PropertyInput = Omit<
  Property,
  "id" | "inquiryCount" | "status" | "ownerName" | "ownerPhone" | "brokerEmail" | "ownerId"
> & {
  status?: Property["status"];
  ownerPhone?: string;
};

export type AuthResult =
  | { ok: true; role: UserRole; dealerAccess: DealerAccessStatus }
  | {
      ok: false;
      code: "invalid" | "suspended" | "admin_unsupported" | "exists" | "network";
      message: string;
    };

export type ActionResult = { ok: true } | { ok: false; message: string };

function failure(e: unknown, fallback: string): { ok: false; message: string } {
  return { ok: false, message: e instanceof Error && e.message ? e.message : fallback };
}

export interface NotifPrefs {
  inquiries: boolean;
  visits: boolean;
  messages: boolean;
}

const DEFAULT_NOTIF_PREFS: NotifPrefs = {
  inquiries: true,
  visits: true,
  messages: true,
};

interface AppContextType {
  selectedCity: string;
  setSelectedCity: (city: string) => void;
  properties: Property[];
  addProperty: (property: PropertyInput) => Promise<Property | null> | Property | null;
  updateProperty: (
    id: string,
    patch: Partial<Property>,
  ) => Promise<Property | null> | Property | null;
  deleteProperty: (id: string) => Promise<boolean> | boolean;
  favorites: string[];
  toggleFavorite: (id: string) => void;
  directoryProfiles: DirectoryProfile[];
  updateDirectoryProfile: (
    id: string,
    patch: Partial<DirectoryProfile>,
  ) => Promise<{ ok: boolean; message?: string }>;
  inquiries: Inquiry[];
  visits: SiteVisit[];
  messageThreads: MessageThread[];
  messagesByThread: Record<string, Message[]>;
  submitInquiry: (input: {
    propertyId: string;
    name: string;
    email: string;
    phone?: string;
    message: string;
  }) => Promise<Inquiry | null> | Inquiry | null;
  markInquiryRead: (id: string) => void;
  archiveInquiry: (id: string) => void;
  replyInquiry: (id: string, replyMessage: string) => Promise<ActionResult>;
  createMessageThread: (input: {
    buyerEmail: string;
    propertyId?: string;
    body: string;
  }) => Promise<MessageThread | null>;
  sendThreadMessage: (threadId: string, body: string) => Promise<Message | null>;
  loadThreadMessages: (threadId: string) => Promise<Message[]>;
  bookVisit: (input: {
    propertyId: string;
    visitDate: string;
    visitTime: string;
    phone?: string;
    notes?: string;
    /** Required for guests; defaults to the signed-in account. */
    name?: string;
    email?: string;
  }) => Promise<SiteVisit | null> | SiteVisit | null;
  /** Last error from bookVisit / submitInquiry / addProperty, for user-facing messages. */
  lastActionError: string | null;
  /** Latest action failure, safe to read right after awaiting an action. */
  getLastActionError: () => string | null;
  updateVisitStatus: (id: string, status: VisitStatus) => Promise<ActionResult>;
  rescheduleVisit: (id: string, input: { date: string; time: string }) => Promise<ActionResult>;
  cancelVisit: (id: string) => Promise<ActionResult>;
  refreshVisits: () => Promise<void>;
  refreshInquiries: () => Promise<void>;
  refreshMyProperties: () => Promise<void>;
  /** True when the public listings request failed (offline / server unreachable), as opposed to an empty catalog. */
  catalogLoadFailed: boolean;
  reloadCatalog: () => Promise<void>;
  /** Upserts properties fetched outside the context (detail screen, search pages). */
  mergeProperties: (items: Property[]) => void;
  fetchDealerAnalytics: () => Promise<DealerAnalytics>;
  updatePassword: (input: {
    currentPassword: string;
    newPassword: string;
  }) => Promise<{ ok: boolean; message?: string }>;
  notifPrefs: NotifPrefs;
  setNotifPrefs: (patch: Partial<NotifPrefs>) => void;
  isLoggedIn: boolean;
  profile: UserProfile | null;
  userEmail: string;
  userName: string;
  userRole: UserRole | null;
  dealerAccess: DealerAccessStatus;
  /** True when role is broker and account is active */
  canAccessDealerDashboard: boolean;
  isApiMode: boolean;
  platformSettings: PublicPlatformSettings;
  /** Owned listings count (user or broker). */
  myListingsCount: number;
  /** Whether the current user may create another listing under platform caps. */
  canPostListing: boolean;
  signIn: (email: string, password: string) => Promise<AuthResult> | AuthResult;
  signUp: (input: {
    email: string;
    password: string;
    name: string;
    intent?: "user" | "dealer";
  }) => Promise<AuthResult> | AuthResult;
  signInWithGoogle: () => Promise<AuthResult & { cancelled?: boolean }>;
  signOut: () => void;
  refreshSessionFromApi: () => Promise<void>;
  updateProfile: (patch: {
    name?: string;
    phone?: string;
    bio?: string;
    city?: string;
    avatarUrl?: string | null;
  }) => Promise<ActionResult>;
  /** Platform-wide maintenance flag from public settings. */
  maintenanceMode: boolean;
  /** Message shown after a forced sign-out (session expired / account suspended). */
  sessionNotice: string | null;
  clearSessionNotice: () => void;
  forgotPassword: (email: string) => Promise<{ ok: boolean; message?: string }>;
  registerAsDealer: (input: Omit<DirectoryProfile, "id" | "userId" | "listingsCount">) => Promise<{
    ok: boolean;
    message?: string;
  }>;
  registerServiceProfile: (
    input: Omit<DirectoryProfile, "id" | "userId" | "listingsCount">,
  ) => Promise<{ ok: true; profile: DirectoryProfile } | { ok: false; message: string }>;
  /** Demo-only stand-in for web admin role promotion — mock mode only */
  simulateDealerApproval: () => void;
  submitKyc: (input: {
    panNumber: string;
    aadhaarLast4: string;
    dealerNotes?: string;
  }) => Promise<ActionResult>;
  hasCompletedOnboarding: boolean | undefined;
  setHasCompletedOnboarding: (val: boolean) => void;
  onboardingStep: number;
  setOnboardingStep: (step: number) => void;
  isHydrating: boolean;
  authStatus: "idle" | "checking" | "authenticated" | "unauthenticated" | "error";
  authError: string | null;
  retryAuthCheck: () => Promise<void>;
  preferredRole: UserRole;
  setPreferredRole: (role: UserRole) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

function normalizeInquiryStatus(raw: string): InquiryStatus {
  if (raw === "new" || raw === "read" || raw === "archived") return raw;
  if (raw === "open") return "new";
  if (raw === "replied") return "read";
  if (raw === "dismissed") return "archived";
  return "new";
}

function dealerAccessFromRole(
  role: UserRole | "admin",
  dealerAccess?: DealerAccessStatus,
): DealerAccessStatus {
  if (role === "broker") return "approved";
  return dealerAccess ?? "none";
}

function sessionFromAccount(account: StoredAccount): Session {
  if (account.role === "admin") {
    return { ...GUEST_SESSION };
  }
  return {
    isLoggedIn: true,
    accountId: account.id,
    email: account.email,
    name: account.name,
    phone: account.phone,
    role: account.role,
    status: account.status,
    dealerAccess: dealerAccessFromRole(account.role, account.dealerAccess),
    listingStatus: "none",
    directoryProfileId: account.directoryProfileId,
    kyc: account.kyc,
    joinedDate: account.joinedDate,
  };
}

/**
 * `/api/auth/me` does not report pending dealer access, listing verification or KYC,
 * so those are carried over from the previous session when the API omits them.
 */
function sessionFromApiUser(user: AuthMeResponse, previous?: Session): Session {
  if (user.role === "admin") return { ...GUEST_SESSION };
  const carry = previous?.isLoggedIn && previous.accountId === user.id ? previous : undefined;
  const apiAccess = dealerAccessFromRole(user.role, user.dealerAccess);
  return {
    isLoggedIn: true,
    accountId: user.id,
    email: user.email,
    name: user.name,
    phone: user.phone,
    role: user.role,
    status: user.status,
    dealerAccess:
      apiAccess === "none" && carry?.dealerAccess === "pending" ? "pending" : apiAccess,
    listingStatus: user.listingStatus ?? carry?.listingStatus ?? "none",
    directoryProfileId: user.directoryProfileId ?? carry?.directoryProfileId,
    kyc: user.kyc ?? carry?.kyc,
    joinedDate: user.joinedDate ?? carry?.joinedDate ?? new Date().toISOString(),
    bio: user.bio,
    city: user.city,
    avatarUrl: user.avatarUrl ?? undefined,
  };
}

function profileFromSession(session: Session): UserProfile | null {
  if (!session.isLoggedIn || !session.role) return null;
  return {
    id: session.accountId,
    email: session.email,
    name: session.name,
    phone: session.phone,
    role: session.role,
    status: session.status,
    joinedDate: session.joinedDate,
    dealerAccess: session.dealerAccess,
    listingStatus: session.listingStatus,
    directoryProfileId: session.directoryProfileId,
    kyc: session.kyc,
    bio: session.bio,
    city: session.city,
    avatar: session.avatarUrl,
  };
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedCity, setSelectedCityState] = useState("Udaipur");
  const [properties, setProperties] = useState<Property[]>(isApiMode ? [] : seedWithBroker);
  const [catalogLoadFailed, setCatalogLoadFailed] = useState(false);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [visits, setVisits] = useState<SiteVisit[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [messageThreads, setMessageThreads] = useState<MessageThread[]>([]);
  const [messagesByThread, setMessagesByThread] = useState<Record<string, Message[]>>({});
  const [directoryProfiles, setDirectoryProfiles] = useState<DirectoryProfile[]>(
    isApiMode
      ? []
      : [
          ...seedDirectoryProfiles.map((d, i) => (i === 0 ? { ...d, userId: "acc-broker" } : d)),
          PENDING_DIRECTORY,
        ],
  );
  const [accounts, setAccounts] = useState<StoredAccount[]>(DEMO_ACCOUNTS);
  const [session, setSession] = useState<Session>(GUEST_SESSION);
  const [preferredRole, setPreferredRoleState] = useState<UserRole>("user");
  const [hasCompletedOnboarding, setHasCompletedOnboardingState] = useState<boolean | undefined>(
    undefined,
  );
  const [onboardingStep, setOnboardingStepState] = useState<number>(0);
  const [isHydrating, setIsHydrating] = useState<boolean>(true);
  const [authStatus, setAuthStatus] = useState<
    "idle" | "checking" | "authenticated" | "unauthenticated" | "error"
  >("checking");
  const [authError, setAuthError] = useState<string | null>(null);
  const [notifPrefs, setNotifPrefsState] = useState<NotifPrefs>(DEFAULT_NOTIF_PREFS);
  const [platformSettings, setPlatformSettings] = useState<PublicPlatformSettings>(
    DEFAULT_PLATFORM_SETTINGS,
  );
  const [sessionNotice, setSessionNotice] = useState<string | null>(null);
  const [lastActionError, setLastActionErrorState] = useState<string | null>(null);
  // Callers read the failure right after `await`, before the state update renders.
  const lastActionErrorRef = useRef<string | null>(null);
  const setLastActionError = useCallback((message: string | null) => {
    lastActionErrorRef.current = message;
    setLastActionErrorState(message);
  }, []);
  const getLastActionError = useCallback(() => lastActionErrorRef.current, []);

  const persistProperties = useCallback((next: Property[]) => {
    AsyncStorage.setItem(STORAGE_KEYS.properties, JSON.stringify(next)).catch(() => {});
  }, []);

  const persistInquiries = useCallback((next: Inquiry[]) => {
    AsyncStorage.setItem(STORAGE_KEYS.inquiries, JSON.stringify(next)).catch(() => {});
  }, []);

  const persistVisits = useCallback((next: SiteVisit[]) => {
    AsyncStorage.setItem(STORAGE_KEYS.visits, JSON.stringify(next)).catch(() => {});
  }, []);

  const persistAccounts = useCallback((next: StoredAccount[]) => {
    AsyncStorage.setItem(STORAGE_KEYS.accounts, JSON.stringify(next)).catch(() => {});
  }, []);

  const persistDirectory = useCallback((next: DirectoryProfile[]) => {
    AsyncStorage.setItem(STORAGE_KEYS.directory, JSON.stringify(next)).catch(() => {});
  }, []);

  const persistMessages = useCallback(
    (threads: MessageThread[], byThread: Record<string, Message[]>) => {
      AsyncStorage.setItem(
        STORAGE_KEYS.messages,
        JSON.stringify({ threads, byThread }),
      ).catch(() => {});
    },
    [],
  );

  const persistSession = useCallback((next: Session) => {
    setSession(next);
    if (next.isLoggedIn) {
      AsyncStorage.setItem(STORAGE_KEYS.session, JSON.stringify(next)).catch(() => {});
    } else {
      AsyncStorage.removeItem(STORAGE_KEYS.session).catch(() => {});
    }
  }, []);

  const patchAccount = useCallback(
    (accountId: string, patch: Partial<StoredAccount>) => {
      setAccounts((prev) => {
        const next = prev.map((a) => (a.id === accountId ? { ...a, ...patch } : a));
        persistAccounts(next);
        return next;
      });
    },
    [persistAccounts],
  );

  const hydrateFromApi = useCallback(async (role?: UserRole | null) => {
    if (!isApiMode) return;
    try {
      const [
        publicList,
        mine,
        dirsPublic,
        dirsMine,
        inqs,
        receivedInqs,
        vs,
        threads,
        favIds,
        settings,
      ] = await Promise.all([
          apiListProperties({ status: "Active", limit: 100 }).catch(() => null),
          role === "broker" || role === "user"
            ? apiListMyProperties().catch(() => [] as Property[])
            : Promise.resolve([] as Property[]),
          apiListDealers(false).catch(() => [] as DirectoryProfile[]),
          role === "broker" || role === "user"
            ? apiListDealers(true).catch(() => [] as DirectoryProfile[])
            : Promise.resolve([] as DirectoryProfile[]),
          apiListInquiries().catch(() => [] as Inquiry[]),
          role === "user"
            ? apiListReceivedInquiries().catch(() => [] as Inquiry[])
            : Promise.resolve([] as Inquiry[]),
          apiListVisits().catch(() => [] as SiteVisit[]),
          apiListThreads().catch(() => [] as MessageThread[]),
          role ? apiListFavorites().catch(() => null) : Promise.resolve(null),
          apiGetPlatformSettings().catch(() => DEFAULT_PLATFORM_SETTINGS),
        ]);

      setPlatformSettings(settings);
      setCatalogLoadFailed(publicList === null);
      const byId = new Map<string, Property>();
      for (const p of publicList ?? []) byId.set(p.id, p);
      for (const p of mine) byId.set(p.id, p);
      const merged = [...byId.values()];
      setProperties(merged);

      const dirById = new Map<string, DirectoryProfile>();
      for (const d of dirsPublic) dirById.set(d.id, d);
      for (const d of dirsMine) dirById.set(d.id, d);
      setDirectoryProfiles([...dirById.values()]);

      const titleById = new Map(merged.map((p) => [p.id, p.title]));
      const inquiryById = new Map<string, Inquiry>();
      for (const inq of [...inqs, ...receivedInqs]) {
        inquiryById.set(inq.id, {
          ...inq,
          propertyTitle: inq.propertyTitle || titleById.get(inq.propertyId) || "Property",
          status: normalizeInquiryStatus(inq.status as string),
        });
      }
      setInquiries([...inquiryById.values()]);
      setVisits(
        vs.map((v: SiteVisit) => ({
          ...v,
          propertyTitle: v.propertyTitle || titleById.get(v.propertyId) || "Property",
        })),
      );
      setMessageThreads(threads);
      if (favIds) {
        setFavorites(favIds);
        AsyncStorage.setItem(STORAGE_KEYS.favorites, JSON.stringify(favIds)).catch(() => {});
      }
    } catch {
      // keep local state
    }
  }, []);

  const loadInitialState = useCallback(async () => {
    setIsHydrating(true);
    setAuthStatus("checking");
    setAuthError(null);
    try {
      const [
        onboarding,
        storedStep,
        storedFavorites,
        storedCity,
        storedSession,
        storedRole,
        storedProperties,
        storedInquiries,
        storedVisits,
        storedAccounts,
        storedDirectory,
        storedMessages,
        storedNotif,
      ] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.onboarding),
        AsyncStorage.getItem(STORAGE_KEYS.onboardingStep),
        AsyncStorage.getItem(STORAGE_KEYS.favorites),
        AsyncStorage.getItem(STORAGE_KEYS.city),
        AsyncStorage.getItem(STORAGE_KEYS.session),
        AsyncStorage.getItem(STORAGE_KEYS.preferredRole),
        AsyncStorage.getItem(STORAGE_KEYS.properties),
        AsyncStorage.getItem(STORAGE_KEYS.inquiries),
        AsyncStorage.getItem(STORAGE_KEYS.visits),
        AsyncStorage.getItem(STORAGE_KEYS.accounts),
        AsyncStorage.getItem(STORAGE_KEYS.directory),
        AsyncStorage.getItem(STORAGE_KEYS.messages),
        AsyncStorage.getItem(STORAGE_KEYS.notifPrefs),
      ]);

      if (storedStep) {
        const stepNum = parseInt(storedStep, 10);
        if (!isNaN(stepNum) && stepNum >= 0 && stepNum <= 3) {
          setOnboardingStepState(stepNum);
        }
      }

      if (storedFavorites) setFavorites(JSON.parse(storedFavorites));
      if (storedCity) setSelectedCityState(storedCity);
      if (storedNotif) {
        try {
          setNotifPrefsState({ ...DEFAULT_NOTIF_PREFS, ...JSON.parse(storedNotif) });
        } catch {
          /* ignore */
        }
      }

      if (storedAccounts) {
        const parsed: StoredAccount[] = JSON.parse(storedAccounts);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const emails = new Set(parsed.map((a) => a.email.toLowerCase()));
          const merged = [...parsed];
          for (const demo of DEMO_ACCOUNTS) {
            if (!emails.has(demo.email.toLowerCase())) merged.push(demo);
          }
          setAccounts(merged);
        }
      }

      if (!isApiMode && storedDirectory) {
        const parsed: DirectoryProfile[] = JSON.parse(storedDirectory);
        if (Array.isArray(parsed) && parsed.length > 0) setDirectoryProfiles(parsed);
      }

      if (!isApiMode && storedMessages) {
        const parsed = JSON.parse(storedMessages) as {
          threads?: MessageThread[];
          byThread?: Record<string, Message[]>;
        };
        if (parsed.threads) setMessageThreads(parsed.threads);
        if (parsed.byThread) setMessagesByThread(parsed.byThread);
      }

      let activeSession = GUEST_SESSION;

      if (storedSession) {
        const parsed = JSON.parse(storedSession) as {
          isLoggedIn?: boolean;
          role?: string;
          dealerAccess?: DealerAccessStatus;
          accountId?: string;
          email?: string;
          name?: string;
          phone?: string;
          status?: AccountStatus;
          directoryProfileId?: string;
          kyc?: DealerKyc;
          listingStatus?: ListerStatus;
          joinedDate?: string;
          bio?: string;
          city?: string;
          avatarUrl?: string;
          /** Legacy: tokens used to live in the session blob. */
          accessToken?: string;
        };
        if (parsed?.role === "admin" || !parsed?.isLoggedIn) {
          activeSession = GUEST_SESSION;
          setSession(GUEST_SESSION);
        } else if (parsed.role === "user" || parsed.role === "broker") {
          const nextSession: Session = {
            ...GUEST_SESSION,
            isLoggedIn: true,
            accountId: parsed.accountId ?? "",
            email: parsed.email ?? "",
            name: parsed.name ?? "",
            phone: parsed.phone,
            role: parsed.role,
            status: parsed.status ?? "active",
            dealerAccess:
              parsed.role === "broker" ? "approved" : (parsed.dealerAccess ?? "none"),
            listingStatus: parsed.listingStatus ?? "none",
            directoryProfileId: parsed.directoryProfileId,
            kyc: parsed.kyc,
            joinedDate: parsed.joinedDate ?? "",
            bio: parsed.bio,
            city: parsed.city,
            avatarUrl: parsed.avatarUrl,
          };
          activeSession = nextSession;
          setSession(nextSession);
          if (isApiMode) {
            const tokens = await getTokens();
            if (!tokens.accessToken && parsed.accessToken) {
              await setTokens({ accessToken: parsed.accessToken });
            }
            if (!tokens.accessToken && !parsed.accessToken) {
              activeSession = GUEST_SESSION;
              setSession(GUEST_SESSION);
              AsyncStorage.removeItem(STORAGE_KEYS.session).catch(() => {});
            } else {
              try {
                const me = await apiMe();
                if (me.role === "admin" || me.status === "suspended") {
                  activeSession = GUEST_SESSION;
                  setSession(GUEST_SESSION);
                  await clearTokens();
                  AsyncStorage.removeItem(STORAGE_KEYS.session).catch(() => {});
                  if (me.status === "suspended") {
                    setSessionNotice("This account is suspended. Contact support.");
                  }
                } else {
                  const refreshed = sessionFromApiUser(me, nextSession);
                  activeSession = refreshed;
                  setSession(refreshed);
                  AsyncStorage.setItem(STORAGE_KEYS.session, JSON.stringify(refreshed)).catch(
                    () => {},
                  );
                  await hydrateFromApi(refreshed.role);
                }
              } catch (e) {
                if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
                  activeSession = GUEST_SESSION;
                  setSession(GUEST_SESSION);
                  await clearTokens();
                  AsyncStorage.removeItem(STORAGE_KEYS.session).catch(() => {});
                  setSessionNotice(
                    e.status === 403
                      ? "This account is suspended. Contact support."
                      : "Your session expired. Please sign in again.",
                  );
                }
                // Network errors keep the restored session for offline use.
              }
            }
          }
        }
      }

      if (storedRole === "user" || storedRole === "broker") {
        setPreferredRoleState(storedRole);
      }

      if (!isApiMode && storedProperties) {
        const parsed: Property[] = JSON.parse(storedProperties);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setProperties(parsed.filter((p) => p.id !== "prop-pending-demo"));
        }
      }

      if (!isApiMode && storedInquiries) {
        const parsed: Inquiry[] = JSON.parse(storedInquiries);
        if (Array.isArray(parsed)) {
          setInquiries(
            parsed.map((inq) => ({
              ...inq,
              buyerName: inq.buyerName || inq.buyerEmail.split("@")[0],
              status: normalizeInquiryStatus(inq.status as string),
            })),
          );
        }
      }

      if (!isApiMode && storedVisits) {
        const parsed: SiteVisit[] = JSON.parse(storedVisits);
        if (Array.isArray(parsed)) setVisits(parsed);
      }

      setHasCompletedOnboardingState(onboarding === "true");

      // API mode: load public catalog for guests (logged-in hydrate runs separately).
      if (isApiMode && !activeSession.isLoggedIn) {
        const [publicList, dirs, settings] = await Promise.all([
          apiListProperties({ status: "Active", limit: 100 }).catch(() => null),
          apiListDealers(false).catch(() => [] as DirectoryProfile[]),
          apiGetPlatformSettings().catch(() => null),
        ]);
        setCatalogLoadFailed(publicList === null);
        setProperties(publicList ?? []);
        setDirectoryProfiles(dirs);
        if (settings) setPlatformSettings(settings);
      }

      setAuthStatus(activeSession.isLoggedIn ? "authenticated" : "unauthenticated");
    } catch (err: any) {
      setHasCompletedOnboardingState(false);
      setAuthStatus("error");
      setAuthError(err?.message || "Failed to initialize app session.");
    } finally {
      setIsHydrating(false);
    }
  }, [hydrateFromApi]);

  useEffect(() => {
    loadInitialState();
  }, [loadInitialState]);

  const retryAuthCheck = useCallback(async () => {
    await loadInitialState();
  }, [loadInitialState]);

  const setOnboardingStep = useCallback((step: number) => {
    setOnboardingStepState(step);
    AsyncStorage.setItem(STORAGE_KEYS.onboardingStep, String(step)).catch(() => {});
  }, []);

  const setPreferredRole = useCallback((role: UserRole) => {
    setPreferredRoleState(role);
    AsyncStorage.setItem(STORAGE_KEYS.preferredRole, role).catch(() => {});
  }, []);

  const setHasCompletedOnboarding = useCallback((val: boolean) => {
    setHasCompletedOnboardingState(val);
    AsyncStorage.setItem(STORAGE_KEYS.onboarding, String(val)).catch(() => {});
    if (val) {
      setOnboardingStepState(0);
      AsyncStorage.removeItem(STORAGE_KEYS.onboardingStep).catch(() => {});
    }
  }, []);

  const setSelectedCity = useCallback((city: string) => {
    setSelectedCityState(city);
    AsyncStorage.setItem(STORAGE_KEYS.city, city).catch(() => {});
  }, []);

  const setNotifPrefs = useCallback((patch: Partial<NotifPrefs>) => {
    setNotifPrefsState((prev) => {
      const next = { ...prev, ...patch };
      AsyncStorage.setItem(STORAGE_KEYS.notifPrefs, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const toggleFavorite = useCallback(
    (id: string) => {
      setFavorites((prev) => {
        const removing = prev.includes(id);
        const next = removing ? prev.filter((favId) => favId !== id) : [...prev, id];
        AsyncStorage.setItem(STORAGE_KEYS.favorites, JSON.stringify(next)).catch(() => {});
        if (isApiMode && session.isLoggedIn) {
          (removing ? apiRemoveFavorite(id) : apiAddFavorite(id)).catch(() => {});
        }
        return next;
      });
    },
    [session.isLoggedIn],
  );

  const completeApiSignIn = useCallback(
    async (res: AuthMeResponse): Promise<AuthResult> => {
      if (res.role === "admin") {
        await clearTokens();
        return {
          ok: false,
          code: "admin_unsupported",
          message: "Admin accounts sign in on the SqftGo website. Use a buyer or dealer account here.",
        };
      }
      if (res.status === "suspended") {
        await clearTokens();
        return {
          ok: false,
          code: "suspended",
          message: "This account is suspended. Contact support.",
        };
      }
      const next = sessionFromApiUser(res);
      setSessionNotice(null);
      persistSession(next);
      await hydrateFromApi(next.role);
      return {
        ok: true,
        role: res.role,
        dealerAccess: dealerAccessFromRole(res.role, res.dealerAccess),
      };
    },
    [persistSession, hydrateFromApi],
  );

  useEffect(() => {
    if (!isApiMode) return;
    return onSessionEvent((event) => {
      persistSession(GUEST_SESSION);
      setInquiries([]);
      setVisits([]);
      setMessageThreads([]);
      setMessagesByThread({});
      setSessionNotice(
        event === "suspended"
          ? "This account is suspended. Contact support."
          : "Your session expired. Please sign in again.",
      );
    });
  }, [persistSession]);

  const signIn = useCallback(
    async (email: string, password: string): Promise<AuthResult> => {
      if (isApiMode) {
        try {
          const res = await apiLogin(email.trim().toLowerCase(), password);
          return await completeApiSignIn(res);
        } catch (e) {
          const status = e instanceof ApiError ? e.status : 0;
          return {
            ok: false,
            code: status === 401 ? "invalid" : status === 403 ? "suspended" : "network",
            message: e instanceof Error ? e.message : "Sign in failed.",
          };
        }
      }

      const lower = email.trim().toLowerCase();
      const account = accounts.find((a) => a.email.toLowerCase() === lower);
      if (!account || account.password !== password) {
        return { ok: false, code: "invalid", message: "Invalid email or password." };
      }
      if (account.status === "suspended") {
        return {
          ok: false,
          code: "suspended",
          message: "This account is suspended. Contact support.",
        };
      }
      if (account.role === "admin") {
        return {
          ok: false,
          code: "admin_unsupported",
          message: "Admin accounts sign in on the SqftGo website. Use a buyer or dealer account here.",
        };
      }
      persistSession(sessionFromAccount(account));
      return {
        ok: true,
        role: account.role,
        dealerAccess: dealerAccessFromRole(account.role, account.dealerAccess),
      };
    },
    [accounts, persistSession, completeApiSignIn],
  );

  const signInWithGoogle = useCallback(async (): Promise<
    AuthResult & { cancelled?: boolean }
  > => {
    if (!isApiMode) {
      return {
        ok: false,
        code: "network",
        message: "Google sign-in isn't available in offline preview.",
      };
    }
    const res = await apiGoogleSignIn();
    if (!res.ok) {
      return { ok: false, code: "network", message: res.message, cancelled: res.cancelled };
    }
    return completeApiSignIn(res.me);
  }, [completeApiSignIn]);

  const signUp = useCallback(
    async (input: {
      email: string;
      password: string;
      name: string;
      intent?: "user" | "dealer";
    }): Promise<AuthResult> => {
      if (isApiMode) {
        try {
          const res = await apiSignup({
            email: input.email.trim().toLowerCase(),
            password: input.password,
            name: input.name.trim(),
            intent: input.intent === "dealer" ? "dealer" : "user",
          });
          if ("status" in res && res.status === "confirm_email") {
            return {
              ok: false,
              code: "network",
              message: res.message || "Check your email to confirm your account before signing in.",
            };
          }
          return await completeApiSignIn(res);
        } catch (e) {
          const msg = e instanceof Error ? e.message : "Sign up failed.";
          return {
            ok: false,
            code: msg.toLowerCase().includes("exist") ? "exists" : "network",
            message: msg,
          };
        }
      }

      const email = input.email.trim().toLowerCase();
      if (accounts.some((a) => a.email.toLowerCase() === email)) {
        return { ok: false, code: "exists", message: "An account with this email already exists." };
      }
      const asDealer = input.intent === "dealer";
      const account: StoredAccount = {
        id: `acc-${Date.now()}`,
        email,
        password: input.password,
        name: input.name.trim() || email.split("@")[0],
        role: asDealer ? "broker" : "user",
        status: "active",
        dealerAccess: asDealer ? "approved" : "none",
        joinedDate: new Date().toISOString(),
      };
      const nextAccounts = [...accounts, account];
      setAccounts(nextAccounts);
      persistAccounts(nextAccounts);
      persistSession(sessionFromAccount(account));
      return {
        ok: true,
        role: asDealer ? "broker" : "user",
        dealerAccess: asDealer ? "approved" : "none",
      };
    },
    [accounts, persistAccounts, persistSession, completeApiSignIn],
  );

  const signOut = useCallback(() => {
    if (isApiMode) {
      apiLogout().catch(() => {});
      setInquiries([]);
      setVisits([]);
      setMessageThreads([]);
      setMessagesByThread({});
      setProperties((prev) => prev.filter((p) => p.status === "Active"));
    }
    clearTokens();
    persistSession(GUEST_SESSION);
  }, [persistSession]);

  const refreshSessionFromApi = useCallback(async () => {
    if (!isApiMode || !session.isLoggedIn) return;
    try {
      const me = await apiMe();
      if (me.role === "admin") {
        signOut();
        return;
      }
      persistSession(sessionFromApiUser(me, session));
      await hydrateFromApi(me.role === "broker" ? "broker" : "user");
    } catch {
      // keep current session
    }
  }, [session, persistSession, hydrateFromApi, signOut]);

  const updateProfile = useCallback(
    async (patch: {
      name?: string;
      phone?: string;
      bio?: string;
      city?: string;
      avatarUrl?: string | null;
    }): Promise<ActionResult> => {
      if (!session.isLoggedIn) return { ok: false, message: "Sign in required." };
      if (isApiMode) {
        try {
          const me = await apiUpdateMe({
            name: patch.name?.trim(),
            phone: patch.phone?.trim(),
            bio: patch.bio?.trim(),
            city: patch.city?.trim(),
            avatarUrl: patch.avatarUrl,
          });
          persistSession(sessionFromApiUser(me, session));
          return { ok: true };
        } catch (e) {
          return failure(e, "Could not save your profile.");
        }
      }
      const next: Session = {
        ...session,
        name: patch.name?.trim() || session.name,
        phone: patch.phone !== undefined ? patch.phone.trim() : session.phone,
        bio: patch.bio !== undefined ? patch.bio.trim() : session.bio,
        city: patch.city !== undefined ? patch.city.trim() : session.city,
        avatarUrl:
          patch.avatarUrl !== undefined ? (patch.avatarUrl ?? undefined) : session.avatarUrl,
      };
      persistSession(next);
      patchAccount(session.accountId, { name: next.name, phone: next.phone });
      return { ok: true };
    },
    [session, persistSession, patchAccount],
  );

  const forgotPassword = useCallback(async (email: string) => {
    if (!isApiMode) {
      return {
        ok: false,
        message: "Password reset isn't available in offline preview.",
      };
    }
    try {
      await apiForgotPassword(email);
      return {
        ok: true,
        message: "If that email exists, a reset link has been sent.",
      };
    } catch (e) {
      return {
        ok: false,
        message: e instanceof Error ? e.message : "Unable to send reset email.",
      };
    }
  }, []);

  const registerAsDealer = useCallback(
    async (input: Omit<DirectoryProfile, "id" | "userId" | "listingsCount">) => {
      if (!session.isLoggedIn || !session.role) {
        return { ok: false, message: "Sign in required." };
      }
      if (session.role === "broker" || session.dealerAccess === "approved") {
        return { ok: false, message: "You already have dealer access." };
      }
      if (session.dealerAccess === "pending") {
        return { ok: false, message: "Dealer access is already pending approval." };
      }

      if (isApiMode) {
        try {
          const profile = await apiCreateDealer(input);
          const nextSession: Session = {
            ...session,
            dealerAccess: "pending",
            directoryProfileId: profile.id,
          };
          persistSession(nextSession);
          setDirectoryProfiles((prev) => [profile, ...prev.filter((p) => p.id !== profile.id)]);
          return { ok: true };
        } catch (e) {
          return {
            ok: false,
            message: e instanceof Error ? e.message : "Could not create dealer profile.",
          };
        }
      }

      const profile: DirectoryProfile = {
        ...input,
        id: `dir-${Date.now()}`,
        userId: session.accountId,
        listingsCount: 0,
        email: input.email || session.email,
      };

      setDirectoryProfiles((prev) => {
        const next = [profile, ...prev];
        persistDirectory(next);
        return next;
      });

      const nextSession: Session = {
        ...session,
        dealerAccess: "pending",
        directoryProfileId: profile.id,
      };
      persistSession(nextSession);
      patchAccount(session.accountId, {
        dealerAccess: "pending",
        directoryProfileId: profile.id,
      });

      return { ok: true };
    },
    [session, persistDirectory, persistSession, patchAccount],
  );

  /** Service-partner directory profile; unlike dealer registration it doesn't touch dealer access. */
  const registerServiceProfile = useCallback(
    async (
      input: Omit<DirectoryProfile, "id" | "userId" | "listingsCount">,
    ): Promise<{ ok: true; profile: DirectoryProfile } | { ok: false; message: string }> => {
      if (!session.isLoggedIn) return { ok: false, message: "Sign in required." };
      if (isApiMode) {
        try {
          const profile = await apiCreateDealer(input);
          setDirectoryProfiles((prev) => [profile, ...prev.filter((p) => p.id !== profile.id)]);
          return { ok: true, profile };
        } catch (e) {
          return { ok: false, message: e instanceof Error ? e.message : "Could not create your profile." };
        }
      }
      const profile: DirectoryProfile = {
        ...input,
        id: `dir-${Date.now()}`,
        userId: session.accountId,
        listingsCount: 0,
      };
      setDirectoryProfiles((prev) => {
        const next = [profile, ...prev];
        persistDirectory(next);
        return next;
      });
      return { ok: true, profile };
    },
    [session, persistDirectory],
  );

  const updateDirectoryProfile = useCallback(
    async (id: string, patch: Partial<DirectoryProfile>) => {
      if (!session.isLoggedIn) return { ok: false, message: "Sign in required." };

      if (isApiMode) {
        try {
          const updated = await apiUpdateDealer(id, patch);
          setDirectoryProfiles((prev) => prev.map((d) => (d.id === id ? { ...d, ...updated } : d)));
          return { ok: true };
        } catch (e) {
          return {
            ok: false,
            message: e instanceof Error ? e.message : "Update failed.",
          };
        }
      }

      setDirectoryProfiles((prev) => {
        const next = prev.map((d) => (d.id === id ? { ...d, ...patch } : d));
        persistDirectory(next);
        return next;
      });
      return { ok: true };
    },
    [session, persistDirectory],
  );

  const simulateDealerApproval = useCallback(() => {
    if (isApiMode) return;
    if (!session.isLoggedIn || session.dealerAccess !== "pending") return;
    const nextSession: Session = {
      ...session,
      role: "broker",
      dealerAccess: "approved",
    };
    persistSession(nextSession);
    patchAccount(session.accountId, {
      role: "broker",
      dealerAccess: "approved",
    });
  }, [session, persistSession, patchAccount]);

  const submitKyc = useCallback(
    async (input: {
      panNumber: string;
      aadhaarLast4: string;
      dealerNotes?: string;
    }): Promise<ActionResult> => {
      if (!session.isLoggedIn) return { ok: false, message: "Sign in required." };

      if (isApiMode) {
        try {
          const kyc = await apiPutKyc({
            panNumber: input.panNumber.trim().toUpperCase(),
            aadhaarLast4: input.aadhaarLast4.trim(),
            dealerNotes: input.dealerNotes?.trim(),
            status: "pending",
          });
          persistSession({ ...session, kyc });
          return { ok: true };
        } catch (e) {
          return failure(e, "Could not submit KYC. Please try again.");
        }
      }

      const kyc: DealerKyc = {
        status: "pending",
        panNumber: input.panNumber.trim().toUpperCase(),
        aadhaarLast4: input.aadhaarLast4.trim(),
        dealerNotes: input.dealerNotes?.trim(),
        submittedAt: new Date().toISOString(),
      };
      persistSession({ ...session, kyc });
      patchAccount(session.accountId, { kyc });
      return { ok: true };
    },
    [session, persistSession, patchAccount],
  );

  const addProperty = useCallback(
    async (prop: PropertyInput) => {
      const deny = (message: string) => {
        setLastActionError(message);
        return null;
      };
      if (session.role !== "broker" && session.role !== "user") {
        return deny("Sign in to list a property.");
      }
      if (session.status !== "active") return deny("Your account is not active.");
      if (session.role === "user" && session.listingStatus === "rejected") {
        return deny("Your listing access was declined. Contact support for help.");
      }
      if (session.role === "user" && !platformSettings.allowUserListings) {
        return deny("Owner listings are paused right now.");
      }

      const ownedCount = properties.filter(
        (p) =>
          p.status !== "Rejected" &&
          ownsProperty(p, { userId: session.accountId, email: session.email }),
      ).length;
      if (
        session.role === "user" &&
        ownedCount >= platformSettings.maxListingsPerUser
      ) {
        return deny(
          `You can have up to ${platformSettings.maxListingsPerUser} listings. Remove one to add another.`,
        );
      }

      const status =
        prop.status === "Draft" || prop.status === "Pending Review"
          ? prop.status
          : "Pending Review";

      if (isApiMode) {
        setLastActionError(null);
        try {
          const created = await apiCreateProperty({
            ...prop,
            status,
            featured: false,
          });
          setProperties((prev) => [created, ...prev.filter((p) => p.id !== created.id)]);
          return created;
        } catch (e) {
          setLastActionError(failure(e, "Could not save the listing.").message);
          return null;
        }
      }

      const newProperty: Property = {
        ...prop,
        id: `prop-${Date.now()}`,
        inquiryCount: 0,
        status,
        ownerId: session.accountId,
        ownerName: session.name,
        ownerPhone: prop.ownerPhone ?? session.phone ?? "+91 98765 00000",
        ownerEmail: session.email,
        brokerEmail: session.email,
        country: prop.country ?? "India",
        featured: false,
      };
      setProperties((prev) => {
        const next = [newProperty, ...prev];
        persistProperties(next);
        return next;
      });
      return newProperty;
    },
    [session, persistProperties, platformSettings, properties, setLastActionError],
  );

  const updateProperty = useCallback(
    async (id: string, patch: Partial<Property>) => {
      if (session.role !== "broker" && session.role !== "user") return null;
      if (session.status !== "active") return null;
      const existing = properties.find((p) => p.id === id);
      if (
        !existing ||
        !ownsProperty(existing, { userId: session.accountId, email: session.email })
      ) {
        setLastActionError("You can only edit your own listings.");
        return null;
      }

      // Brokers cannot self-activate or feature
      const safePatch = { ...patch };
      delete safePatch.featured;
      if (safePatch.status === "Active") {
        delete safePatch.status;
      }

      if (isApiMode) {
        setLastActionError(null);
        try {
          const updated = await apiUpdateProperty(id, safePatch);
          setProperties((prev) => prev.map((p) => (p.id === id ? { ...p, ...updated } : p)));
          return updated;
        } catch (e) {
          setLastActionError(failure(e, "Could not update the listing.").message);
          return null;
        }
      }

      let updated: Property | null = null;
      setProperties((prev) => {
        const next = prev.map((p) => {
          if (p.id !== id) return p;
          updated = { ...p, ...safePatch, featured: false };
          return updated;
        });
        persistProperties(next);
        return next;
      });
      return updated;
    },
    [session, properties, persistProperties, setLastActionError],
  );

  const deleteProperty = useCallback(
    async (id: string) => {
      if (session.role !== "broker" && session.role !== "user") return false;
      if (session.status !== "active") return false;
      const existing = properties.find((p) => p.id === id);
      if (
        !existing ||
        !ownsProperty(existing, { userId: session.accountId, email: session.email })
      ) {
        return false;
      }

      if (isApiMode) {
        try {
          await apiDeleteProperty(id);
          setProperties((prev) => prev.filter((p) => p.id !== id));
          return true;
        } catch {
          return false;
        }
      }

      setProperties((prev) => {
        const next = prev.filter((p) => p.id !== id);
        persistProperties(next);
        return next;
      });
      return true;
    },
    [session, properties, persistProperties],
  );

  const submitInquiry = useCallback(
    async (input: {
      propertyId: string;
      name: string;
      email: string;
      phone?: string;
      message: string;
    }) => {
      const property = properties.find((p) => p.id === input.propertyId);
      setLastActionError(null);
      if (!property || property.status !== "Active") {
        setLastActionError("This listing is not accepting inquiries.");
        return null;
      }

      if (isApiMode) {
        try {
          const phone = input.phone?.trim() || session.phone || "";
          if (!phone) {
            setLastActionError("Add a phone number so the dealer can reach you.");
            return null;
          }
          const inquiry = await apiCreateInquiry(property.id, {
            name: input.name.trim(),
            email: input.email.trim().toLowerCase(),
            phone,
            message: input.message.trim(),
          });
          const enriched = {
            ...inquiry,
            propertyTitle: inquiry.propertyTitle || property.title,
            brokerEmail: inquiry.brokerEmail || property.brokerEmail || "",
          };
          if (session.isLoggedIn) {
            setInquiries((prev) => [enriched, ...prev.filter((i) => i.id !== enriched.id)]);
          }
          setProperties((prev) =>
            prev.map((p) =>
              p.id === property.id ? { ...p, inquiryCount: (p.inquiryCount ?? 0) + 1 } : p,
            ),
          );
          return enriched;
        } catch (e) {
          setLastActionError(failure(e, "Could not send your inquiry.").message);
          return null;
        }
      }

      const inquiry: Inquiry = {
        id: `inq-${Date.now()}`,
        propertyId: property.id,
        propertyTitle: property.title,
        buyerName: input.name.trim(),
        buyerEmail: input.email.trim().toLowerCase(),
        buyerPhone: input.phone?.trim(),
        message: input.message.trim(),
        brokerEmail: property.brokerEmail ?? "broker@sqftgo.com",
        status: "new",
        createdAt: new Date().toISOString(),
      };

      setInquiries((prev) => {
        const next = [inquiry, ...prev];
        persistInquiries(next);
        return next;
      });
      setProperties((prev) => {
        const next = prev.map((p) =>
          p.id === property.id ? { ...p, inquiryCount: p.inquiryCount + 1 } : p,
        );
        persistProperties(next);
        return next;
      });
      return inquiry;
    },
    [properties, persistInquiries, persistProperties, session.phone, session.isLoggedIn, setLastActionError],
  );

  const markInquiryRead = useCallback(
    (id: string) => {
      if (isApiMode) {
        apiPatchInquiry(id, { status: "read" }).catch(() => {});
      }
      setInquiries((prev) => {
        const next = prev.map((inq) =>
          inq.id === id && inq.status === "new" ? { ...inq, status: "read" as const } : inq,
        );
        persistInquiries(next);
        return next;
      });
    },
    [persistInquiries],
  );

  const archiveInquiry = useCallback(
    (id: string) => {
      if (isApiMode) {
        apiPatchInquiry(id, { status: "archived" }).catch(() => {});
      }
      setInquiries((prev) => {
        const next = prev.map((inq) =>
          inq.id === id ? { ...inq, status: "archived" as const } : inq,
        );
        persistInquiries(next);
        return next;
      });
    },
    [persistInquiries],
  );

  const replyInquiry = useCallback(
    async (id: string, replyMessage: string): Promise<ActionResult> => {
      const trimmed = replyMessage.trim();
      if (!trimmed) return { ok: false, message: "Write a reply first." };
      const target = inquiries.find((i) => i.id === id);
      if (!target) return { ok: false, message: "Inquiry not found." };

      if (isApiMode) {
        if (session.role !== "broker") {
          return {
            ok: false,
            message: "Reply to this buyer by phone or email from the inquiry details.",
          };
        }
        try {
          const thread = await apiCreateThread({
            participantEmail: target.buyerEmail,
            subject: `Re: ${target.propertyTitle || "Property inquiry"}`,
            propertyId: target.propertyId,
            body: trimmed,
          });
          setMessageThreads((prev) => [thread, ...prev.filter((t) => t.id !== thread.id)]);
          await apiPatchInquiry(id, { status: "read" }).catch(() => {});
          setInquiries((prev) =>
            prev.map((inq) => (inq.id === id ? { ...inq, status: "read" as const } : inq)),
          );
          return { ok: true };
        } catch (e) {
          return failure(e, "Could not send your reply.");
        }
      }

      setInquiries((prev) => {
        const next = prev.map((inq) =>
          inq.id === id
            ? {
                ...inq,
                status: "read" as const,
                replyMessage: trimmed,
              }
            : inq,
        );
        persistInquiries(next);
        return next;
      });

      const inq = target;
      {
        const existing = messageThreads.find(
          (t) =>
            t.buyerEmail.toLowerCase() === inq.buyerEmail.toLowerCase() &&
            (t.propertyId === inq.propertyId || !t.propertyId),
        );
        if (!existing) {
          const thread: MessageThread = {
            id: `thread-${Date.now()}`,
            buyerEmail: inq.buyerEmail,
            buyerName: inq.buyerName,
            propertyId: inq.propertyId,
            propertyTitle: inq.propertyTitle,
            lastMessage: trimmed,
            lastMessageAt: new Date().toISOString(),
          };
          const msg: Message = {
            id: `msg-${Date.now()}`,
            threadId: thread.id,
            body: trimmed,
            senderRole: "broker",
            senderEmail: session.email,
            createdAt: new Date().toISOString(),
          };
          const nextThreads = [thread, ...messageThreads];
          const nextBy = { ...messagesByThread, [thread.id]: [msg] };
          setMessageThreads(nextThreads);
          setMessagesByThread(nextBy);
          persistMessages(nextThreads, nextBy);
        }
      }
      return { ok: true };
    },
    [
      persistInquiries,
      inquiries,
      messageThreads,
      messagesByThread,
      persistMessages,
      session.email,
      session.role,
    ],
  );

  const createMessageThread = useCallback(
    async (input: { buyerEmail: string; propertyId?: string; body: string }) => {
      if (session.role !== "broker") return null;
      const body = input.body.trim();
      if (!body) return null;

      if (isApiMode) {
        try {
          const prop = input.propertyId
            ? properties.find((p) => p.id === input.propertyId)
            : undefined;
          const thread = await apiCreateThread({
            participantEmail: input.buyerEmail.trim().toLowerCase(),
            subject: prop?.title ? `Re: ${prop.title}` : "Property inquiry",
            propertyId: input.propertyId,
            body,
          });
          setMessageThreads((prev) => [thread, ...prev.filter((t) => t.id !== thread.id)]);
          return thread;
        } catch {
          return null;
        }
      }

      const prop = input.propertyId
        ? properties.find((p) => p.id === input.propertyId)
        : undefined;
      const thread: MessageThread = {
        id: `thread-${Date.now()}`,
        buyerEmail: input.buyerEmail.trim().toLowerCase(),
        propertyId: input.propertyId,
        propertyTitle: prop?.title,
        lastMessage: body,
        lastMessageAt: new Date().toISOString(),
        unreadCount: 0,
      };
      const msg: Message = {
        id: `msg-${Date.now()}`,
        threadId: thread.id,
        body,
        senderRole: "broker",
        senderEmail: session.email,
        createdAt: new Date().toISOString(),
      };
      const nextThreads = [thread, ...messageThreads];
      const nextBy = { ...messagesByThread, [thread.id]: [msg] };
      setMessageThreads(nextThreads);
      setMessagesByThread(nextBy);
      persistMessages(nextThreads, nextBy);
      return thread;
    },
    [session, properties, messageThreads, messagesByThread, persistMessages],
  );

  const sendThreadMessage = useCallback(
    async (threadId: string, body: string) => {
      if (session.role !== "broker") return null;
      const trimmed = body.trim();
      if (!trimmed) return null;

      if (isApiMode) {
        try {
          const msg = await apiSendMessage(threadId, trimmed);
          setMessagesByThread((prev) => ({
            ...prev,
            [threadId]: [...(prev[threadId] ?? []), msg],
          }));
          setMessageThreads((prev) =>
            prev.map((t) =>
              t.id === threadId
                ? { ...t, lastMessage: trimmed, lastMessageAt: msg.createdAt }
                : t,
            ),
          );
          return msg;
        } catch {
          return null;
        }
      }

      const msg: Message = {
        id: `msg-${Date.now()}`,
        threadId,
        body: trimmed,
        senderRole: "broker",
        senderEmail: session.email,
        createdAt: new Date().toISOString(),
      };
      const nextBy = {
        ...messagesByThread,
        [threadId]: [...(messagesByThread[threadId] ?? []), msg],
      };
      const nextThreads = messageThreads.map((t) =>
        t.id === threadId
          ? { ...t, lastMessage: trimmed, lastMessageAt: msg.createdAt }
          : t,
      );
      setMessagesByThread(nextBy);
      setMessageThreads(nextThreads);
      persistMessages(nextThreads, nextBy);
      return msg;
    },
    [session, messageThreads, messagesByThread, persistMessages],
  );

  const loadThreadMessages = useCallback(
    async (threadId: string) => {
      if (isApiMode) {
        try {
          const msgs = await apiListThreadMessages(threadId);
          setMessagesByThread((prev) => ({ ...prev, [threadId]: msgs }));
          return msgs;
        } catch {
          return messagesByThread[threadId] ?? [];
        }
      }
      return messagesByThread[threadId] ?? [];
    },
    [messagesByThread],
  );

  const bookVisit = useCallback(
    async (input: {
      propertyId: string;
      visitDate: string;
      visitTime: string;
      phone?: string;
      notes?: string;
      name?: string;
      email?: string;
    }) => {
      const property = properties.find((p) => p.id === input.propertyId);
      setLastActionError(null);
      if (!property || property.status !== "Active") {
        setLastActionError("This listing is not accepting visits.");
        return null;
      }
      const name = input.name?.trim() || session.name;
      const email = (input.email?.trim() || session.email).toLowerCase();
      if (!name || !email) {
        setLastActionError("Enter your name and email.");
        return null;
      }

      if (isApiMode) {
        const phone = input.phone?.trim() || session.phone || "";
        if (phone.length < 5) {
          setLastActionError("Add a phone number so the dealer can confirm your visit.");
          return null;
        }
        try {
          const visit = await apiCreateVisit(property.id, {
            name,
            email,
            phone,
            date: input.visitDate,
            time: input.visitTime,
            notes: input.notes?.trim(),
          });
          const enriched = {
            ...visit,
            propertyTitle: visit.propertyTitle || property.title,
            brokerEmail: visit.brokerEmail || property.brokerEmail || "",
          };
          if (session.isLoggedIn) {
            setVisits((prev) => [enriched, ...prev.filter((v) => v.id !== enriched.id)]);
          }
          return enriched;
        } catch (e) {
          setLastActionError(failure(e, "Could not book the visit.").message);
          return null;
        }
      }

      const visit: SiteVisit = {
        id: `visit-${Date.now()}`,
        propertyId: property.id,
        propertyTitle: property.title,
        buyerName: name,
        buyerEmail: email,
        buyerPhone: input.phone?.trim() || session.phone,
        brokerEmail: property.brokerEmail ?? "broker@sqftgo.com",
        visitDate: input.visitDate,
        visitTime: input.visitTime,
        status: "pending",
        createdAt: new Date().toISOString(),
        notes: input.notes?.trim(),
      };

      setVisits((prev) => {
        const next = [visit, ...prev];
        persistVisits(next);
        return next;
      });
      return visit;
    },
    [properties, session, persistVisits, setLastActionError],
  );

  const applyVisitPatch = useCallback(
    async (
      id: string,
      patch: { status?: VisitStatus; date?: string; time?: string },
      fallback: string,
    ): Promise<ActionResult> => {
      if (!session.isLoggedIn) return { ok: false, message: "Sign in required." };
      if (isApiMode) {
        try {
          const updated = await apiPatchVisit(id, patch);
          setVisits((prev) =>
            prev.map((v) =>
              v.id === id ? { ...v, ...updated, propertyTitle: updated.propertyTitle || v.propertyTitle } : v,
            ),
          );
          return { ok: true };
        } catch (e) {
          return failure(e, fallback);
        }
      }
      setVisits((prev) => {
        const next = prev.map((v) =>
          v.id === id
            ? {
                ...v,
                ...(patch.status ? { status: patch.status } : {}),
                ...(patch.date ? { visitDate: patch.date } : {}),
                ...(patch.time ? { visitTime: patch.time } : {}),
              }
            : v,
        );
        persistVisits(next);
        return next;
      });
      return { ok: true };
    },
    [session.isLoggedIn, persistVisits],
  );

  const updateVisitStatus = useCallback(
    (id: string, status: VisitStatus) =>
      applyVisitPatch(id, { status }, "Could not update the visit."),
    [applyVisitPatch],
  );

  const rescheduleVisit = useCallback(
    (id: string, input: { date: string; time: string }) =>
      applyVisitPatch(id, input, "Could not reschedule the visit."),
    [applyVisitPatch],
  );

  const cancelVisit = useCallback(
    (id: string) => applyVisitPatch(id, { status: "cancelled" }, "Could not cancel the visit."),
    [applyVisitPatch],
  );

  const refreshVisits = useCallback(async () => {
    if (!isApiMode || !session.isLoggedIn) return;
    try {
      const vs = await apiListVisits();
      setVisits(vs);
    } catch {
      // keep current list
    }
  }, [session.isLoggedIn]);

  const refreshInquiries = useCallback(async () => {
    if (!isApiMode || !session.isLoggedIn) return;
    try {
      const [mine, received] = await Promise.all([
        apiListInquiries(),
        session.role === "user" ? apiListReceivedInquiries() : Promise.resolve([] as Inquiry[]),
      ]);
      const byId = new Map<string, Inquiry>();
      for (const inq of [...mine, ...received]) {
        byId.set(inq.id, { ...inq, status: normalizeInquiryStatus(inq.status as string) });
      }
      setInquiries([...byId.values()]);
    } catch {
      // keep current list
    }
  }, [session.isLoggedIn, session.role]);

  const mergeProperties = useCallback((items: Property[]) => {
    if (!items.length) return;
    setProperties((prev) => {
      const byId = new Map(prev.map((p) => [p.id, p]));
      for (const p of items) byId.set(p.id, { ...byId.get(p.id), ...p });
      return [...byId.values()];
    });
  }, []);

  const refreshMyProperties = useCallback(async () => {
    if (!isApiMode || !session.isLoggedIn) return;
    try {
      mergeProperties(await apiListMyProperties());
    } catch {
      // keep current list
    }
  }, [session.isLoggedIn, mergeProperties]);

  const reloadCatalog = useCallback(async () => {
    if (!isApiMode) return;
    try {
      mergeProperties(await apiListProperties({ status: "Active", limit: 100 }));
      setCatalogLoadFailed(false);
    } catch {
      setCatalogLoadFailed(true);
    }
  }, [mergeProperties]);

  const fetchDealerAnalytics = useCallback(async () => {
    if (isApiMode) {
      try {
        return await apiGetDealerAnalytics();
      } catch {
        // fall through to derived
      }
    }
    return deriveDealerAnalytics(properties, inquiries, visits, {
      userId: session.accountId,
      email: session.email,
    });
  }, [properties, inquiries, visits, session]);

  const updatePassword = useCallback(
    async (input: { currentPassword: string; newPassword: string }) => {
      if (!session.isLoggedIn) return { ok: false, message: "Sign in required." };

      if (isApiMode) {
        try {
          await apiUpdatePassword(input);
          return { ok: true };
        } catch (e) {
          return {
            ok: false,
            message: e instanceof Error ? e.message : "Password update failed.",
          };
        }
      }

      const account = accounts.find((a) => a.id === session.accountId);
      if (!account || account.password !== input.currentPassword) {
        return { ok: false, message: "Current password is incorrect." };
      }
      if (input.newPassword.length < 6) {
        return { ok: false, message: "New password must be at least 6 characters." };
      }
      patchAccount(session.accountId, { password: input.newPassword });
      return { ok: true };
    },
    [session, accounts, patchAccount],
  );

  const clearSessionNotice = useCallback(() => setSessionNotice(null), []);

  const canAccessDealerDashboard =
    session.isLoggedIn && session.role === "broker" && session.status === "active";

  const myListingsCount = useMemo(
    () =>
      properties.filter(
        (p) =>
          p.status !== "Rejected" &&
          ownsProperty(p, { userId: session.accountId, email: session.email }),
      ).length,
    [properties, session.accountId, session.email],
  );

  const canPostListing = useMemo(() => {
    if (!session.isLoggedIn || session.status !== "active") return false;
    if (session.role === "broker") return true;
    if (session.role !== "user") return false;
    if (session.listingStatus === "rejected") return false;
    if (!platformSettings.allowUserListings) return false;
    return myListingsCount < platformSettings.maxListingsPerUser;
  }, [session, platformSettings, myListingsCount]);

  // Soft-refresh KYC from API when broker opens app
  useEffect(() => {
    if (!isApiMode || !canAccessDealerDashboard) return;
    apiGetKyc()
      .then((kyc) => {
        setSession((prev) => (prev.isLoggedIn ? { ...prev, kyc } : prev));
      })
      .catch(() => {});
  }, [canAccessDealerDashboard]);

  // Public platform settings (listing caps) — refresh even before login
  useEffect(() => {
    if (!isApiMode) return;
    apiGetPlatformSettings()
      .then(setPlatformSettings)
      .catch(() => {});
  }, []);

  const value = useMemo(
    () => ({
      selectedCity,
      setSelectedCity,
      properties,
      addProperty,
      updateProperty,
      deleteProperty,
      favorites,
      toggleFavorite,
      directoryProfiles,
      updateDirectoryProfile,
      inquiries,
      visits,
      messageThreads,
      messagesByThread,
      submitInquiry,
      markInquiryRead,
      archiveInquiry,
      replyInquiry,
      createMessageThread,
      sendThreadMessage,
      loadThreadMessages,
      bookVisit,
      lastActionError,
      getLastActionError,
      updateVisitStatus,
      rescheduleVisit,
      cancelVisit,
      refreshVisits,
      refreshInquiries,
      refreshMyProperties,
      catalogLoadFailed,
      reloadCatalog,
      mergeProperties,
      fetchDealerAnalytics,
      updatePassword,
      notifPrefs,
      setNotifPrefs,
      isLoggedIn: session.isLoggedIn,
      profile: profileFromSession(session),
      userEmail: session.email,
      userName: session.name,
      userRole: session.role,
      dealerAccess: session.dealerAccess,
      canAccessDealerDashboard,
      isApiMode,
      platformSettings,
      myListingsCount,
      canPostListing,
      signIn,
      signUp,
      signInWithGoogle,
      signOut,
      refreshSessionFromApi,
      updateProfile,
      maintenanceMode: isApiMode && platformSettings.maintenanceMode,
      sessionNotice,
      clearSessionNotice,
      forgotPassword,
      registerAsDealer,
      registerServiceProfile,
      simulateDealerApproval,
      submitKyc,
      hasCompletedOnboarding,
      setHasCompletedOnboarding,
      onboardingStep,
      setOnboardingStep,
      isHydrating,
      authStatus,
      authError,
      retryAuthCheck,
      preferredRole,
      setPreferredRole,
    }),
    [
      lastActionError,
      getLastActionError,
      rescheduleVisit,
      cancelVisit,
      refreshVisits,
      refreshInquiries,
      refreshMyProperties,
      catalogLoadFailed,
      reloadCatalog,
      mergeProperties,
      signInWithGoogle,
      sessionNotice,
      clearSessionNotice,
      selectedCity,
      setSelectedCity,
      properties,
      addProperty,
      updateProperty,
      deleteProperty,
      favorites,
      toggleFavorite,
      directoryProfiles,
      updateDirectoryProfile,
      inquiries,
      visits,
      messageThreads,
      messagesByThread,
      submitInquiry,
      markInquiryRead,
      archiveInquiry,
      replyInquiry,
      createMessageThread,
      sendThreadMessage,
      loadThreadMessages,
      bookVisit,
      updateVisitStatus,
      fetchDealerAnalytics,
      updatePassword,
      notifPrefs,
      setNotifPrefs,
      session,
      canAccessDealerDashboard,
      platformSettings,
      myListingsCount,
      canPostListing,
      signIn,
      signUp,
      signOut,
      refreshSessionFromApi,
      updateProfile,
      forgotPassword,
      registerAsDealer,
      registerServiceProfile,
      simulateDealerApproval,
      submitKyc,
      hasCompletedOnboarding,
      setHasCompletedOnboarding,
      onboardingStep,
      setOnboardingStep,
      isHydrating,
      authStatus,
      authError,
      retryAuthCheck,
      preferredRole,
      setPreferredRole,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = React.use(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
};
