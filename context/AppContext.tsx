import React, { createContext, useCallback, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { seedProperties } from "@/data/properties";
import { seedDirectoryProfiles } from "@/data/directory";
import type { DirectoryProfile, Inquiry, Property, UserRole } from "@/data/types";

export type { Property, DirectoryProfile, Inquiry } from "@/data/types";

const STORAGE_KEYS = {
  onboarding: "hasCompletedOnboarding",
  favorites: "favorites",
  city: "selectedCity",
  session: "session",
  preferredRole: "preferredRole",
  properties: "properties",
  inquiries: "inquiries",
} as const;

interface Session {
  isLoggedIn: boolean;
  email: string;
  role: UserRole | null;
}

const GUEST_SESSION: Session = { isLoggedIn: false, email: "", role: null };

/** Demo broker owns all seed inventory so inquiries land in one inbox. */
const seedWithBroker: Property[] = seedProperties.map((p) => ({
  ...p,
  brokerEmail: p.brokerEmail ?? "broker@svrepl.com",
}));

type PropertyInput = Omit<
  Property,
  "id" | "inquiryCount" | "status" | "ownerName" | "ownerPhone" | "brokerEmail"
> & {
  status?: Property["status"];
  ownerPhone?: string;
};

interface AppContextType {
  selectedCity: string;
  setSelectedCity: (city: string) => void;
  properties: Property[];
  addProperty: (property: PropertyInput) => Property;
  favorites: string[];
  toggleFavorite: (id: string) => void;
  directoryProfiles: DirectoryProfile[];
  inquiries: Inquiry[];
  submitInquiry: (input: {
    propertyId: string;
    message: string;
    buyerPhone?: string;
  }) => Inquiry | null;
  replyInquiry: (id: string, replyMessage: string) => void;
  dismissInquiry: (id: string) => void;
  isLoggedIn: boolean;
  userEmail: string;
  userRole: UserRole | null;
  signIn: (email: string, role?: UserRole) => void;
  signOut: () => void;
  hasCompletedOnboarding: boolean | undefined;
  setHasCompletedOnboarding: (val: boolean) => void;
  preferredRole: UserRole;
  setPreferredRole: (role: UserRole) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

/** Known demo emails map to the correct role regardless of onboarding pick. */
function resolveRole(email: string, preferred: UserRole = "user"): UserRole {
  const lower = email.trim().toLowerCase();
  if (lower === "broker@svrepl.com" || lower === "dealer@svrepl.com") return "broker";
  if (lower === "buyer@svrepl.com" || lower === "tenant@svrepl.com") return "user";
  return preferred;
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedCity, setSelectedCityState] = useState("Udaipur");
  const [properties, setProperties] = useState<Property[]>(seedWithBroker);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [directoryProfiles] = useState<DirectoryProfile[]>(seedDirectoryProfiles);
  const [session, setSession] = useState<Session>(GUEST_SESSION);
  const [preferredRole, setPreferredRoleState] = useState<UserRole>("user");
  const [hasCompletedOnboarding, setHasCompletedOnboardingState] = useState<boolean | undefined>(
    undefined,
  );

  const persistProperties = useCallback((next: Property[]) => {
    AsyncStorage.setItem(STORAGE_KEYS.properties, JSON.stringify(next)).catch(() => {});
  }, []);

  const persistInquiries = useCallback((next: Inquiry[]) => {
    AsyncStorage.setItem(STORAGE_KEYS.inquiries, JSON.stringify(next)).catch(() => {});
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const [
          onboarding,
          storedFavorites,
          storedCity,
          storedSession,
          storedRole,
          storedProperties,
          storedInquiries,
        ] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.onboarding),
          AsyncStorage.getItem(STORAGE_KEYS.favorites),
          AsyncStorage.getItem(STORAGE_KEYS.city),
          AsyncStorage.getItem(STORAGE_KEYS.session),
          AsyncStorage.getItem(STORAGE_KEYS.preferredRole),
          AsyncStorage.getItem(STORAGE_KEYS.properties),
          AsyncStorage.getItem(STORAGE_KEYS.inquiries),
        ]);
        if (storedFavorites) setFavorites(JSON.parse(storedFavorites));
        if (storedCity) setSelectedCityState(storedCity);
        if (storedSession) {
          const parsed: Session = JSON.parse(storedSession);
          if ((parsed?.role as string) === "admin") {
            parsed.role = "user";
          }
          setSession(parsed);
        }
        if (storedRole === "user" || storedRole === "broker") {
          setPreferredRoleState(storedRole);
        }
        if (storedProperties) {
          const parsed: Property[] = JSON.parse(storedProperties);
          if (Array.isArray(parsed) && parsed.length > 0) {
            // Drop admin-era pending queue items so public feed stays clean.
            setProperties(
              parsed
                .filter((p) => p.id !== "prop-pending-demo")
                .map((p) =>
                  p.status === "Pending Review" ? { ...p, status: "Active" as const } : p,
                ),
            );
          }
        }
        if (storedInquiries) {
          const parsed: Inquiry[] = JSON.parse(storedInquiries);
          if (Array.isArray(parsed)) setInquiries(parsed);
        }
        setHasCompletedOnboardingState(onboarding === "true");
      } catch {
        setHasCompletedOnboardingState(false);
      }
    })();
  }, []);

  const setPreferredRole = useCallback((role: UserRole) => {
    setPreferredRoleState(role);
    AsyncStorage.setItem(STORAGE_KEYS.preferredRole, role).catch(() => {});
  }, []);

  const setHasCompletedOnboarding = useCallback((val: boolean) => {
    setHasCompletedOnboardingState(val);
    AsyncStorage.setItem(STORAGE_KEYS.onboarding, String(val)).catch(() => {});
  }, []);

  const setSelectedCity = useCallback((city: string) => {
    setSelectedCityState(city);
    AsyncStorage.setItem(STORAGE_KEYS.city, city).catch(() => {});
  }, []);

  const toggleFavorite = useCallback((id: string) => {
    setFavorites((prev) => {
      const next = prev.includes(id) ? prev.filter((favId) => favId !== id) : [...prev, id];
      AsyncStorage.setItem(STORAGE_KEYS.favorites, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const signIn = useCallback((email: string, role: UserRole = "user") => {
    const resolved = resolveRole(email, role);
    const next: Session = { isLoggedIn: true, email: email.trim(), role: resolved };
    setSession(next);
    AsyncStorage.setItem(STORAGE_KEYS.session, JSON.stringify(next)).catch(() => {});
  }, []);

  const signOut = useCallback(() => {
    setSession(GUEST_SESSION);
    AsyncStorage.removeItem(STORAGE_KEYS.session).catch(() => {});
  }, []);

  const addProperty = useCallback(
    (prop: PropertyInput) => {
      const status = prop.status ?? "Active";
      const newProperty: Property = {
        ...prop,
        id: `prop-${Date.now()}`,
        inquiryCount: 0,
        status,
        ownerName: session.email ? session.email.split("@")[0] : "App User",
        ownerPhone: prop.ownerPhone ?? "+91 98765 00000",
        brokerEmail: session.email || "broker@svrepl.com",
      };
      setProperties((prev) => {
        const next = [newProperty, ...prev];
        persistProperties(next);
        return next;
      });
      return newProperty;
    },
    [session.email, persistProperties],
  );

  const submitInquiry = useCallback(
    (input: { propertyId: string; message: string; buyerPhone?: string }) => {
      const property = properties.find((p) => p.id === input.propertyId);
      if (!property || !session.email) return null;

      const inquiry: Inquiry = {
        id: `inq-${Date.now()}`,
        propertyId: property.id,
        propertyTitle: property.title,
        buyerEmail: session.email,
        buyerPhone: input.buyerPhone,
        message: input.message.trim(),
        brokerEmail: property.brokerEmail ?? "broker@svrepl.com",
        status: "open",
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
    [properties, session.email, persistInquiries, persistProperties],
  );

  const replyInquiry = useCallback(
    (id: string, replyMessage: string) => {
      setInquiries((prev) => {
        const next = prev.map((inq) =>
          inq.id === id
            ? { ...inq, status: "replied" as const, replyMessage: replyMessage.trim() }
            : inq,
        );
        persistInquiries(next);
        return next;
      });
    },
    [persistInquiries],
  );

  const dismissInquiry = useCallback(
    (id: string) => {
      setInquiries((prev) => {
        const next = prev.map((inq) =>
          inq.id === id ? { ...inq, status: "dismissed" as const } : inq,
        );
        persistInquiries(next);
        return next;
      });
    },
    [persistInquiries],
  );

  const value = useMemo(
    () => ({
      selectedCity,
      setSelectedCity,
      properties,
      addProperty,
      favorites,
      toggleFavorite,
      directoryProfiles,
      inquiries,
      submitInquiry,
      replyInquiry,
      dismissInquiry,
      isLoggedIn: session.isLoggedIn,
      userEmail: session.email,
      userRole: session.role,
      signIn,
      signOut,
      hasCompletedOnboarding,
      setHasCompletedOnboarding,
      preferredRole,
      setPreferredRole,
    }),
    [
      selectedCity,
      setSelectedCity,
      properties,
      addProperty,
      favorites,
      toggleFavorite,
      directoryProfiles,
      inquiries,
      submitInquiry,
      replyInquiry,
      dismissInquiry,
      session,
      signIn,
      signOut,
      hasCompletedOnboarding,
      setHasCompletedOnboarding,
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
