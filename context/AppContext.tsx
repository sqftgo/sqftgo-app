import React, { createContext, useCallback, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { seedProperties } from "@/data/properties";
import { seedDirectoryProfiles } from "@/data/directory";
import type { DirectoryProfile, Property, UserRole } from "@/data/types";

export type { Property, DirectoryProfile } from "@/data/types";

const STORAGE_KEYS = {
  onboarding: "hasCompletedOnboarding",
  favorites: "favorites",
  city: "selectedCity",
  session: "session",
  preferredRole: "preferredRole",
} as const;

interface Session {
  isLoggedIn: boolean;
  email: string;
  role: UserRole | null;
}

const GUEST_SESSION: Session = { isLoggedIn: false, email: "", role: null };

interface AppContextType {
  selectedCity: string;
  setSelectedCity: (city: string) => void;
  properties: Property[];
  addProperty: (
    property: Omit<Property, "id" | "inquiryCount" | "status" | "ownerName" | "ownerPhone">,
  ) => void;
  favorites: string[];
  toggleFavorite: (id: string) => void;
  directoryProfiles: DirectoryProfile[];
  isLoggedIn: boolean;
  userEmail: string;
  userRole: UserRole | null;
  signIn: (email: string, role?: UserRole) => void;
  signOut: () => void;
  hasCompletedOnboarding: boolean | undefined;
  setHasCompletedOnboarding: (val: boolean) => void;
  /** Role picked during onboarding, used to pre-configure the auth flow. */
  preferredRole: UserRole;
  setPreferredRole: (role: UserRole) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedCity, setSelectedCityState] = useState("Udaipur");
  const [properties, setProperties] = useState<Property[]>(seedProperties);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [directoryProfiles] = useState<DirectoryProfile[]>(seedDirectoryProfiles);
  const [session, setSession] = useState<Session>(GUEST_SESSION);
  const [preferredRole, setPreferredRoleState] = useState<UserRole>("user");
  const [hasCompletedOnboarding, setHasCompletedOnboardingState] = useState<boolean | undefined>(
    undefined,
  );

  useEffect(() => {
    (async () => {
      try {
        const [onboarding, storedFavorites, storedCity, storedSession, storedRole] =
          await Promise.all([
            AsyncStorage.getItem(STORAGE_KEYS.onboarding),
            AsyncStorage.getItem(STORAGE_KEYS.favorites),
            AsyncStorage.getItem(STORAGE_KEYS.city),
            AsyncStorage.getItem(STORAGE_KEYS.session),
            AsyncStorage.getItem(STORAGE_KEYS.preferredRole),
          ]);
        if (storedFavorites) setFavorites(JSON.parse(storedFavorites));
        if (storedCity) setSelectedCityState(storedCity);
        if (storedSession) setSession(JSON.parse(storedSession));
        if (storedRole === "user" || storedRole === "broker") setPreferredRoleState(storedRole);
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
    const next: Session = { isLoggedIn: true, email, role };
    setSession(next);
    AsyncStorage.setItem(STORAGE_KEYS.session, JSON.stringify(next)).catch(() => {});
  }, []);

  const signOut = useCallback(() => {
    setSession(GUEST_SESSION);
    AsyncStorage.removeItem(STORAGE_KEYS.session).catch(() => {});
  }, []);

  const addProperty = useCallback(
    (prop: Omit<Property, "id" | "inquiryCount" | "status" | "ownerName" | "ownerPhone">) => {
      const newProperty: Property = {
        ...prop,
        id: `prop-${Date.now()}`,
        inquiryCount: 0,
        status: "Active",
        ownerName: "App User",
        ownerPhone: "+91 98765 00000",
      };
      setProperties((prev) => [newProperty, ...prev]);
    },
    [],
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
