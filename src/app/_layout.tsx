import { useEffect, useRef } from "react";
import { DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, type Href } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Platform, View } from "react-native";

import { useFonts, Fredoka_600SemiBold } from "@expo-google-fonts/fredoka";
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";

import { AuthGateProvider } from "@/components/ds/AuthGate";
import { ToastProvider } from "@/components/ds/Toast";
import { AppAlertProvider, appAlert } from "@/components/ui/app-alert";
import { AuthErrorScreen } from "@/components/ui/auth-error";
import { AuthLoadingScreen } from "@/components/ui/auth-loading";
import { MaintenanceScreen } from "@/components/ui/maintenance-screen";
import { AppProvider, useApp } from "@/context/AppContext";
import { queryClient } from "@/lib/query-client";
import { colors } from "@/theme/tokens";

SplashScreen.preventAutoHideAsync().catch(() => {});

export const unstable_settings = {
  /**
   * Initial route while the stack mounts. Onboarding self-skips when
   * hasCompletedOnboarding or a restored session is present.
   */
  anchor: "onboarding",
};

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.bg,
    card: colors.surface,
    primary: colors.accent,
    text: colors.ink,
    border: colors.border,
  },
};

function RootLayoutNav() {
  const router = useRouter();
  const wasLoggedInRef = useRef(false);
  const [fontsLoaded] = useFonts({
    Fredoka_600SemiBold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const {
    isLoggedIn,
    userRole,
    isHydrating,
    authStatus,
    authError,
    retryAuthCheck,
    maintenanceMode,
    platformSettings,
    sessionNotice,
    clearSessionNotice,
  } = useApp();

  const isDealer = isLoggedIn && userRole === "broker";
  const isBuyer = isLoggedIn && userRole !== "broker";

  useEffect(() => {
    if (!isHydrating && fontsLoaded) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [isHydrating, fontsLoaded]);

  // Explicit fallback: when the session ends, leave protected routes for sign-in.
  useEffect(() => {
    if (isHydrating) return;
    if (wasLoggedInRef.current && !isLoggedIn) {
      router.replace({ pathname: "/auth", params: { mode: "sign-in" } } as unknown as Href);
    }
    wasLoggedInRef.current = isLoggedIn;
  }, [isHydrating, isLoggedIn, router]);

  useEffect(() => {
    if (!sessionNotice) return;
    appAlert("Signed out", sessionNotice);
    clearSessionNotice();
  }, [sessionNotice, clearSessionNotice]);

  if (isHydrating || !fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: colors.bg }} />;
  }

  if (authStatus === "error") {
    return <AuthErrorScreen message={authError || undefined} onRetry={retryAuthCheck} />;
  }

  if (authStatus === "checking") {
    return <AuthLoadingScreen />;
  }

  if (maintenanceMode) {
    return <MaintenanceScreen supportEmail={platformSettings.supportEmail} onRetry={retryAuthCheck} />;
  }

  return (
    <ThemeProvider value={navTheme}>
      <AuthGateProvider>
        <Stack
          screenOptions={{
            headerShown: false,
            animation: Platform.OS === "android" ? "slide_from_right" : "default",
            contentStyle: { backgroundColor: colors.bg },
          }}
        >
          {/*
            Always registered. On logout, Protected removes the app shell and Expo
            falls back to the first available screen / anchor — these must not be
            dynamic routes (e.g. legal/[doc]) or guest-only Protected screens.
          */}
          <Stack.Screen name="onboarding" />
          <Stack.Screen name="auth/index" />
          <Stack.Screen name="auth/callback" />
          <Stack.Screen name="legal/[doc]" />
          <Stack.Screen name="help" />

          {/* Role-split shells avoid (tabs)↔(dealer) Redirect races on logout. */}
          <Stack.Protected guard={isBuyer}>
            <Stack.Screen name="(tabs)" />
          </Stack.Protected>

          <Stack.Protected guard={isDealer}>
            <Stack.Screen name="(dealer)" />
          </Stack.Protected>

          {/* Signed-in marketplace + account surfaces. */}
          <Stack.Protected guard={isLoggedIn}>
            <Stack.Screen name="property/[id]" />
            <Stack.Screen name="broker/[id]" />
            <Stack.Screen name="brokers" />
            <Stack.Screen name="service/[id]" />
            <Stack.Screen name="projects" />
            <Stack.Screen name="project/[id]" />
            <Stack.Screen name="destinations" />
            <Stack.Screen name="destinations/[slug]" />
            <Stack.Screen name="post-property" options={{ presentation: "fullScreenModal" }} />
            <Stack.Screen name="edit-property/[id]" />
            <Stack.Screen name="subscription" />
            <Stack.Screen name="dealer-settings" />
            <Stack.Screen name="dealer-register" />
            <Stack.Screen name="dealer-pending" />
            <Stack.Screen name="dealer-kyc" />
            <Stack.Screen name="my-visits" />
            <Stack.Screen name="my-inquiries" />
            <Stack.Screen name="my-listings" />
            <Stack.Screen name="my-service-bookings" />
            <Stack.Screen name="dealer-projects" />
            <Stack.Screen name="post-project" options={{ presentation: "fullScreenModal" }} />
            <Stack.Screen name="edit-project/[id]" />
            <Stack.Screen name="manage-visits" />
            <Stack.Screen name="settings/index" />
            <Stack.Screen name="settings/profile" />
            <Stack.Screen name="settings/password" />
            <Stack.Screen name="services/register" />
            <Stack.Screen name="services/manage" />
          </Stack.Protected>
        </Stack>
      </AuthGateProvider>
      <StatusBar style="dark" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AppAlertProvider>
            <ToastProvider>
              <AppProvider>
                <RootLayoutNav />
              </AppProvider>
            </ToastProvider>
          </AppAlertProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
