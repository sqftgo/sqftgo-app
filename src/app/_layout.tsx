import { useEffect } from "react";
import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import "@/global.css";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { View } from "react-native";

import { useFonts, Fredoka_600SemiBold } from "@expo-google-fonts/fredoka";
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { AppProvider, useApp } from "@/context/AppContext";
import { colors } from "@/theme/tokens";
import { AuthLoadingScreen } from "@/components/ui/auth-loading";
import { AuthErrorScreen } from "@/components/ui/auth-error";
import { AppAlertProvider } from "@/components/ui/app-alert";

// Keep native splash screen visible until initial hydration & routing check finishes
SplashScreen.preventAutoHideAsync().catch(() => {});

export const unstable_settings = {
  anchor: "(tabs)",
};

function RootLayoutNav() {
  const colorScheme = useColorScheme();
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
  } = useApp();

  useEffect(() => {
    if (!isHydrating && hasCompletedOnboarding !== undefined && fontsLoaded) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [isHydrating, hasCompletedOnboarding, fontsLoaded]);

  // While hydration or font loading is active, keep splash screen background visible
  if (isHydrating || hasCompletedOnboarding === undefined || !fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: colors.bg }} />;
  }

  // Network failure / unexpected error during initial auth check
  if (authStatus === "error") {
    return <AuthErrorScreen message={authError || undefined} onRetry={retryAuthCheck} />;
  }

  // Returning user session loading state (if checking background token/session)
  if (authStatus === "checking") {
    return <AuthLoadingScreen />;
  }

  const navTheme =
    colorScheme === "dark"
      ? DarkTheme
      : {
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

  return (
    <ThemeProvider value={navTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        {/* First-time users: onboarding only. Once completed, the guard
            flips and the router replaces the stack — no back navigation. */}
        <Stack.Protected guard={!hasCompletedOnboarding}>
          <Stack.Screen name="onboarding" />
        </Stack.Protected>

        {/* Returning but signed-out users land on auth. */}
        <Stack.Protected guard={hasCompletedOnboarding && !isLoggedIn}>
          <Stack.Screen name="auth/index" />
        </Stack.Protected>

        {/* The app itself is only reachable with a session. Signing out
            anywhere drops the user back to auth automatically. */}
        <Stack.Protected guard={hasCompletedOnboarding && isLoggedIn}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="(dealer)" />
          <Stack.Screen name="services" />
          <Stack.Screen name="services/[category]" />
          <Stack.Screen name="saved" />
          <Stack.Screen name="property/[id]" />
          <Stack.Screen name="broker/[id]" />
          <Stack.Screen name="post-property" options={{ presentation: "modal" }} />
          <Stack.Screen name="edit-property/[id]" />
          <Stack.Screen name="analytics" />
          <Stack.Screen name="subscription" />
          <Stack.Screen name="dealer-settings" />
          <Stack.Screen name="dealer-register" />
          <Stack.Screen name="dealer-pending" />
          <Stack.Screen name="dealer-kyc" />
          <Stack.Screen name="my-visits" />
          <Stack.Screen name="my-inquiries" />
          <Stack.Screen name="my-listings" />
          <Stack.Screen name="my-service-bookings" />
          <Stack.Screen name="projects" />
          <Stack.Screen name="project/[id]" />
          <Stack.Screen name="dealer-projects" />
          <Stack.Screen name="post-project" options={{ presentation: "modal" }} />
          <Stack.Screen name="edit-project/[id]" />
          <Stack.Screen name="destinations" />
          <Stack.Screen name="destinations/[slug]" />
          <Stack.Screen name="manage-visits" />
          <Stack.Screen
            name="modal"
            options={{ presentation: "modal", headerShown: true, title: "Modal" }}
          />
        </Stack.Protected>
      </Stack>
      <StatusBar style="dark" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppAlertProvider>
          <AppProvider>
            <RootLayoutNav />
          </AppProvider>
        </AppAlertProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

