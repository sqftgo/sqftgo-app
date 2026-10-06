import { useEffect } from "react";
import { DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
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
  anchor: "(tabs)",
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
  const [fontsLoaded] = useFonts({
    Fredoka_600SemiBold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const {
    hasCompletedOnboarding,
    isLoggedIn,
    isHydrating,
    authStatus,
    authError,
    retryAuthCheck,
    maintenanceMode,
    platformSettings,
    sessionNotice,
    clearSessionNotice,
  } = useApp();

  useEffect(() => {
    if (!isHydrating && hasCompletedOnboarding !== undefined && fontsLoaded) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [isHydrating, hasCompletedOnboarding, fontsLoaded]);

  useEffect(() => {
    if (!sessionNotice) return;
    appAlert("Signed out", sessionNotice);
    clearSessionNotice();
  }, [sessionNotice, clearSessionNotice]);

  if (isHydrating || hasCompletedOnboarding === undefined || !fontsLoaded) {
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
          <Stack.Protected guard={!hasCompletedOnboarding}>
            <Stack.Screen name="onboarding" />
          </Stack.Protected>

          {/* Public marketplace: guests browse listings, dealers and services. */}
          <Stack.Protected guard={Boolean(hasCompletedOnboarding)}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="property/[id]" />
            <Stack.Screen name="broker/[id]" />
            <Stack.Screen name="brokers" />
            <Stack.Screen name="service/[id]" />
            <Stack.Screen name="projects" />
            <Stack.Screen name="project/[id]" />
            <Stack.Screen name="destinations" />
            <Stack.Screen name="destinations/[slug]" />
            <Stack.Screen name="help" />
            <Stack.Screen name="legal/[doc]" />
            <Stack.Screen name="auth/callback" />
          </Stack.Protected>

          {/* Signing in closes this modal and returns to where the guest was. */}
          <Stack.Protected guard={Boolean(hasCompletedOnboarding) && !isLoggedIn}>
            <Stack.Screen name="auth/index" options={{ presentation: "modal" }} />
          </Stack.Protected>

          {/* Account screens. Signing out anywhere drops these from the stack. */}
          <Stack.Protected guard={Boolean(hasCompletedOnboarding) && isLoggedIn}>
            <Stack.Screen name="(dealer)" />
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
