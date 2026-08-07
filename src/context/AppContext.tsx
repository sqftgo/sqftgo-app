/**
 * Local workflow mirror of SqftGo BFF auth + role gates.
 * Signup always creates role `user`. Dealer dashboard requires `broker`.
 * Never PATCH role from the client — promotion is a web-admin side effect.
 *
 * When EXPO_PUBLIC_API_URL is set, auth + mutations use Next /api/* with Bearer.
 * Otherwise AsyncStorage mock stays online for offline demos.
 */

import React, { createContext, useCallback, useEffect, useMemo, useState } from "react";
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
  Message,
  MessageThread,
  Property,
  SiteVisit,
  UserProfile,
  UserRole,
  VisitStatus,
} from "@/data/types";
import { isApiMode } from "@/lib/api/config";
import { setAccessToken } from "@/lib/api/auth-token";
import {
  apiForgotPassword,
  apiLogin,
  apiLogout,
  apiMe,
  apiSignup,
  apiUpdateMe,
  apiUpdatePassword,
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
import { apiCreateVisit, apiListVisits, apiPatchVisit } from "@/lib/api/services/visits";
import { ownsProperty } from "@/lib/ownership";

export type { Property, DirectoryProfile, Inquiry, SiteVisit, UserProfile } from "@/data/types";

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
  directoryProfileId?: string;
  kyc?: DealerKyc;
  joinedDate: string;
  accessToken?: string;
}

const GUEST_SESSION: Session = {
  isLoggedIn: false,
  accountId: "",
  email: "",
  name: "",
  role: null,
  status: "active",
  dealerAccess: "none",
  joinedDate: "",
};

/** Demo accounts — password SunValley26 for walkthroughs. */
export const DEMO_ACCOUNTS: StoredAccount[] = [
  {
    id: "acc-buyer",
    email: "buyer@svrepl.com",
    password: "SunValley26",
    name: "Riya Sharma",
    phone: "+91 98765 43210",
    role: "user",
    status: "active",
    dealerAccess: "none",
    joinedDate: "2025-01-12T00:00:00.000Z",
  },
  {
    id: "acc-broker",
    email: "broker@svrepl.com",
    password: "SunValley26",
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
    email: "pending@svrepl.com",
    password: "SunValley26",
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
    email: "admin@svrepl.com",
    password: "SunValley26",
    name: "Admin",
    role: "admin",
    status: "active",
    dealerAccess: "none",
    joinedDate: "2024-01-01T00:00:00.000Z",
  },
];

const seedWithBroker: Property[] = seedProperties.map((p) => ({
  ...p,
  brokerEmail: p.brokerEmail ?? "broker@svrepl.com",
  ownerEmail: p.brokerEmail ?? "broker@svrepl.com",
  ownerId: "acc-broker",
}));

const PENDING_DIRECTORY: DirectoryProfile = {
  id: "dir-pending",
  firmName: "Patel Realty Advisors",
  ownerName: "Neha Patel",
  category: "Agent & Broker",
  city: "Udaipur",
  address: "Near Fateh Sagar, Udaipur",
  email: "pending@svrepl.com",
  website: "https://patelrealty.example",
  mobile: "+91 99000 11122",
  description: "Awaiting dealer access approval from SqftGo web admin.",
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
  replyInquiry: (id: string, replyMessage: string) => void;
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
  }) => Promise<SiteVisit | null> | SiteVisit | null;
  updateVisitStatus: (id: string, status: VisitStatus) => void;
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
  signIn: (email: string, password: string) => Promise<AuthResult> | AuthResult;
  signUp: (input: {
    email: string;
    password: string;
    name: string;
  }) => Promise<AuthResult> | AuthResult;
  signOut: () => void;
  refreshSessionFromApi: () => Promise<void>;
  updateProfile: (patch: {
    name?: string;
    phone?: string;
    bio?: string;
    city?: string;
  }) => Promise<void> | void;
  forgotPassword: (email: string) => Promise<{ ok: boolean; message?: string }>;
  registerAsDealer: (input: Omit<DirectoryProfile, "id" | "userId" | "listingsCount">) => Promise<{
    ok: boolean;
    message?: string;
  }>;
  /** Demo-only stand-in for web admin role promotion — mock mode only */
  simulateDealerApproval: () => void;
  submitKyc: (input: {
    panNumber: string;
    aadhaarLast4: string;
    dealerNotes?: string;
  }) => Promise<void> | void;
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
    directoryProfileId: account.directoryProfileId,
    kyc: account.kyc,
    joinedDate: account.joinedDate,
  };
}

function sessionFromApiUser(
  user: {
    id: string;
    email: string;
    name: string;
    phone?: string;
    role: UserRole | "admin";
    status: AccountStatus;
    dealerAccess?: DealerAccessStatus;
    directoryProfileId?: string;
    kyc?: DealerKyc;
    joinedDate?: string;
    accessToken?: string;
  },
  token?: string,
): Session {
  if (user.role === "admin") return { ...GUEST_SESSION };
  return {
    isLoggedIn: true,
    accountId: user.id,
    email: user.email,
    name: user.name,
    phone: user.phone,
    role: user.role,
    status: user.status,
    dealerAccess: dealerAccessFromRole(user.role, user.dealerAccess),
    directoryProfileId: user.directoryProfileId,
    kyc: user.kyc,
    joinedDate: user.joinedDate ?? new Date().toISOString(),
    accessToken: token ?? user.accessToken,
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
    directoryProfileId: session.directoryProfileId,
    kyc: session.kyc,
  };
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedCity, setSelectedCityState] = useState("Udaipur");
  const [properties, setProperties] = useState<Property[]>(seedWithBroker);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [visits, setVisits] = useState<SiteVisit[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [messageThreads, setMessageThreads] = useState<MessageThread[]>([]);
  const [messagesByThread, setMessagesByThread] = useState<Record<string, Message[]>>({});
  const [directoryProfiles, setDirectoryProfiles] = useState<DirectoryProfile[]>([
    ...seedDirectoryProfiles.map((d, i) =>
      i === 0 ? { ...d, userId: "acc-broker" } : d,
    ),
    PENDING_DIRECTORY,
  ]);
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
      const [publicList, mine, dirsPublic, dirsMine, inqs, vs, threads, favIds] =
        await Promise.all([
          apiListProperties({ status: "Active", limit: 100 }).catch(() => [] as Property[]),
          role === "broker"
            ? apiListMyProperties().catch(() => [] as Property[])
            : Promise.resolve([] as Property[]),
          apiListDealers(false).catch(() => [] as DirectoryProfile[]),
          role === "broker" || role === "user"
            ? apiListDealers(true).catch(() => [] as DirectoryProfile[])
            : Promise.resolve([] as DirectoryProfile[]),
          apiListInquiries().catch(() => [] as Inquiry[]),
          apiListVisits().catch(() => [] as SiteVisit[]),
          apiListThreads().catch(() => [] as MessageThread[]),
          apiListFavorites().catch(() => [] as string[]),
        ]);

      const byId = new Map<string, Property>();
      for (const p of publicList) byId.set(p.id, p);
      for (const p of mine) byId.set(p.id, p);
      const merged = [...byId.values()];
      if (merged.length) setProperties(merged);

      const dirs = [...dirsMine, ...dirsPublic];
      if (dirs.length) {
        setDirectoryProfiles((prev) => {
          const ids = new Set(dirs.map((d) => d.id));
          return [...dirs, ...prev.filter((p) => !ids.has(p.id))];
        });
      }

      const titleById = new Map(merged.map((p) => [p.id, p.title]));
      setInquiries(
        inqs.map((inq) => ({
          ...inq,
          propertyTitle: inq.propertyTitle || titleById.get(inq.propertyId) || "Property",
          status: normalizeInquiryStatus(inq.status as string),
        })),
      );
      setVisits(
        vs.map((v) => ({
          ...v,
          propertyTitle: v.propertyTitle || titleById.get(v.propertyId) || "Property",
        })),
      );
      setMessageThreads(threads);
      if (favIds.length) {
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

      if (storedDirectory) {
        const parsed: DirectoryProfile[] = JSON.parse(storedDirectory);
        if (Array.isArray(parsed) && parsed.length > 0) setDirectoryProfiles(parsed);
      }

      if (storedMessages) {
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
          joinedDate?: string;
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
            directoryProfileId: parsed.directoryProfileId,
            kyc: parsed.kyc,
            joinedDate: parsed.joinedDate ?? "",
            accessToken: parsed.accessToken,
          };
          activeSession = nextSession;
          setSession(nextSession);
          if (isApiMode && parsed.accessToken) {
            await setAccessToken(parsed.accessToken);
            try {
              const me = await apiMe();
              if (me.role === "admin") {
                activeSession = GUEST_SESSION;
                setSession(GUEST_SESSION);
                await setAccessToken(null);
              } else {
                const refreshed = sessionFromApiUser(me, parsed.accessToken);
                activeSession = refreshed;
                setSession(refreshed);
                await hydrateFromApi(refreshed.role);
              }
            } catch {
              // keep restored session
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
      if (isApiMode) {
        const hasSession = activeSession.isLoggedIn && Boolean(activeSession.accessToken);
        if (!hasSession) {
          const [publicList, dirs] = await Promise.all([
            apiListProperties({ status: "Active", limit: 100 }).catch(() => [] as Property[]),
            apiListDealers(false).catch(() => [] as DirectoryProfile[]),
          ]);
          if (publicList.length) setProperties(publicList);
          if (dirs.length) {
            setDirectoryProfiles((prev) => {
              const ids = new Set(dirs.map((d) => d.id));
              return [...dirs, ...prev.filter((p) => !ids.has(p.id))];
            });
          }
        }
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

  const signIn = useCallback(
    async (email: string, password: string): Promise<AuthResult> => {
      if (isApiMode) {
        try {
          const res = await apiLogin(email.trim().toLowerCase(), password);
          if (res.role === "admin") {
            await setAccessToken(null);
            return {
              ok: false,
              code: "admin_unsupported",
              message: "Admin accounts use the web admin. Sign in with a buyer or dealer account.",
            };
          }
          if (res.status === "suspended") {
            await setAccessToken(null);
            return {
              ok: false,
              code: "suspended",
              message: "This account is suspended. Contact support.",
            };
          }
          const next = sessionFromApiUser(res, res.accessToken);
          persistSession(next);
          await hydrateFromApi(next.role);
          return {
            ok: true,
            role: res.role,
            dealerAccess: dealerAccessFromRole(res.role, res.dealerAccess),
          };
        } catch (e) {
          return {
            ok: false,
            code: "network",
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
          message: "Admin accounts use the web admin. Sign in with a buyer or dealer account.",
        };
      }
      persistSession(sessionFromAccount(account));
      return {
        ok: true,
        role: account.role,
        dealerAccess: dealerAccessFromRole(account.role, account.dealerAccess),
      };
    },
    [accounts, persistSession, hydrateFromApi],
  );

  const signUp = useCallback(
    async (input: {
      email: string;
      password: string;
      name: string;
    }): Promise<AuthResult> => {
      if (isApiMode) {
        try {
          const res = await apiSignup({
            email: input.email.trim().toLowerCase(),
            password: input.password,
            name: input.name.trim(),
          });
          if (res.role === "admin") {
            await setAccessToken(null);
            return {
              ok: false,
              code: "admin_unsupported",
              message: "Admin accounts are not supported in the app.",
            };
          }
          const next = sessionFromApiUser(res, res.accessToken);
          persistSession(next);
          await hydrateFromApi(next.role);
          return {
            ok: true,
            role: res.role === "broker" ? "broker" : "user",
            dealerAccess: dealerAccessFromRole(res.role, res.dealerAccess),
          };
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
      const account: StoredAccount = {
        id: `acc-${Date.now()}`,
        email,
        password: input.password,
        name: input.name.trim() || email.split("@")[0],
        role: "user",
        status: "active",
        dealerAccess: "none",
        joinedDate: new Date().toISOString(),
      };
      const nextAccounts = [...accounts, account];
      setAccounts(nextAccounts);
      persistAccounts(nextAccounts);
      persistSession(sessionFromAccount(account));
      return { ok: true, role: "user", dealerAccess: "none" };
    },
    [accounts, persistAccounts, persistSession, hydrateFromApi],
  );

  const signOut = useCallback(() => {
    if (isApiMode) {
      apiLogout().catch(() => {});
    }
    setAccessToken(null);
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
      persistSession(sessionFromApiUser(me, session.accessToken));
      await hydrateFromApi(me.role === "broker" ? "broker" : "user");
    } catch {
      // keep current session
    }
  }, [session, persistSession, hydrateFromApi, signOut]);

  const updateProfile = useCallback(
    async (patch: { name?: string; phone?: string; bio?: string; city?: string }) => {
      if (!session.isLoggedIn) return;
      if (isApiMode) {
        try {
          const me = await apiUpdateMe({
            name: patch.name?.trim(),
            phone: patch.phone?.trim(),
            bio: patch.bio?.trim(),
            city: patch.city?.trim(),
          });
          persistSession(sessionFromApiUser(me, session.accessToken));
          return;
        } catch {
          // fall through to local session patch
        }
      }
      const next: Session = {
        ...session,
        name: patch.name?.trim() || session.name,
        phone: patch.phone !== undefined ? patch.phone.trim() : session.phone,
      };
      persistSession(next);
      if (!isApiMode) {
        patchAccount(session.accountId, {
          name: next.name,
          phone: next.phone,
        });
      }
    },
    [session, persistSession, patchAccount],
  );

  const forgotPassword = useCallback(async (email: string) => {
    if (!isApiMode) {
      return {
        ok: false,
        message: "Password reset requires API mode (set EXPO_PUBLIC_API_URL).",
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
    async (input: { panNumber: string; aadhaarLast4: string; dealerNotes?: string }) => {
      if (!session.isLoggedIn) return;

      if (isApiMode) {
        try {
          const kyc = await apiPutKyc({
            panNumber: input.panNumber.trim().toUpperCase(),
            aadhaarLast4: input.aadhaarLast4.trim(),
            dealerNotes: input.dealerNotes?.trim(),
            status: "pending",
          });
          persistSession({ ...session, kyc });
        } catch {
          // fall through to local pending mirror on soft failure
          const kyc: DealerKyc = {
            status: "pending",
            panNumber: input.panNumber.trim().toUpperCase(),
            aadhaarLast4: input.aadhaarLast4.trim(),
            dealerNotes: input.dealerNotes?.trim(),
            submittedAt: new Date().toISOString(),
          };
          persistSession({ ...session, kyc });
        }
        return;
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
    },
    [session, persistSession, patchAccount],
  );

  const addProperty = useCallback(
    async (prop: PropertyInput) => {
      if (session.role !== "broker" || session.status !== "active") return null;
      const status =
        prop.status === "Draft" || prop.status === "Pending Review"
          ? prop.status
          : "Pending Review";

      if (isApiMode) {
        try {
          const created = await apiCreateProperty({
            ...prop,
            status,
            featured: false,
          });
          setProperties((prev) => [created, ...prev.filter((p) => p.id !== created.id)]);
          return created;
        } catch {
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
    [session, persistProperties],
  );

  const updateProperty = useCallback(
    async (id: string, patch: Partial<Property>) => {
      if (session.role !== "broker" || session.status !== "active") return null;
      const existing = properties.find((p) => p.id === id);
      if (
        !existing ||
        !ownsProperty(existing, { userId: session.accountId, email: session.email })
      ) {
        return null;
      }

      // Brokers cannot self-activate or feature
      const safePatch = { ...patch };
      delete safePatch.featured;
      if (safePatch.status === "Active") {
        delete safePatch.status;
      }

      if (isApiMode) {
        try {
          const updated = await apiUpdateProperty(id, safePatch);
          setProperties((prev) => prev.map((p) => (p.id === id ? { ...p, ...updated } : p)));
          return updated;
        } catch {
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
    [session, properties, persistProperties],
  );

  const deleteProperty = useCallback(
    async (id: string) => {
      if (session.role !== "broker" || session.status !== "active") return false;
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
      if (!property || property.status !== "Active") return null;

      if (isApiMode) {
        try {
          const phone = input.phone?.trim() || session.phone || "0000000000";
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
          setInquiries((prev) => [enriched, ...prev.filter((i) => i.id !== enriched.id)]);
          setProperties((prev) =>
            prev.map((p) =>
              p.id === property.id ? { ...p, inquiryCount: (p.inquiryCount ?? 0) + 1 } : p,
            ),
          );
          return enriched;
        } catch {
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
        brokerEmail: property.brokerEmail ?? "broker@svrepl.com",
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
    [properties, persistInquiries, persistProperties, session.phone],
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
    (id: string, replyMessage: string) => {
      const trimmed = replyMessage.trim();
      if (isApiMode) {
        apiPatchInquiry(id, { status: "read", replyMessage: trimmed }).catch(() => {});
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

      // Also ensure a message thread exists in mock
      const inq = inquiries.find((i) => i.id === id);
      if (inq && !isApiMode) {
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
    },
    [
      persistInquiries,
      inquiries,
      messageThreads,
      messagesByThread,
      persistMessages,
      session.email,
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
    }) => {
      const property = properties.find((p) => p.id === input.propertyId);
      if (!property || property.status !== "Active" || !session.isLoggedIn) return null;

      if (isApiMode) {
        try {
          const visit = await apiCreateVisit(property.id, {
            name: session.name || "Visitor",
            email: session.email,
            phone: input.phone?.trim() || session.phone || "0000000000",
            date: input.visitDate,
            time: input.visitTime,
            notes: input.notes?.trim(),
          });
          const enriched = {
            ...visit,
            propertyTitle: visit.propertyTitle || property.title,
            brokerEmail: visit.brokerEmail || property.brokerEmail || "",
          };
          setVisits((prev) => [enriched, ...prev.filter((v) => v.id !== enriched.id)]);
          return enriched;
        } catch {
          return null;
        }
      }

      const visit: SiteVisit = {
        id: `visit-${Date.now()}`,
        propertyId: property.id,
        propertyTitle: property.title,
        buyerName: session.name,
        buyerEmail: session.email,
        buyerPhone: input.phone?.trim() || session.phone,
        brokerEmail: property.brokerEmail ?? "broker@svrepl.com",
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
    [properties, session, persistVisits],
  );

  const updateVisitStatus = useCallback(
    (id: string, status: VisitStatus) => {
      if (session.role !== "broker") return;
      if (isApiMode) {
        apiPatchVisit(id, { status }).catch(() => {});
      }
      setVisits((prev) => {
        const next = prev.map((v) => (v.id === id ? { ...v, status } : v));
        persistVisits(next);
        return next;
      });
    },
    [session.role, persistVisits],
  );

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

  const canAccessDealerDashboard =
    session.isLoggedIn && session.role === "broker" && session.status === "active";

  // Soft-refresh KYC from API when broker opens app
  useEffect(() => {
    if (!isApiMode || !canAccessDealerDashboard) return;
    apiGetKyc()
      .then((kyc) => {
        setSession((prev) => (prev.isLoggedIn ? { ...prev, kyc } : prev));
      })
      .catch(() => {});
  }, [canAccessDealerDashboard]);

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
      updateVisitStatus,
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
      signIn,
      signUp,
      signOut,
      refreshSessionFromApi,
      updateProfile,
      forgotPassword,
      registerAsDealer,
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
      signIn,
      signUp,
      signOut,
      refreshSessionFromApi,
      updateProfile,
      forgotPassword,
      registerAsDealer,
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
