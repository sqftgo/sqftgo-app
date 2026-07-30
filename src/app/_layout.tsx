import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import "@/global.css";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { View } from "react-native";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { AppProvider, useApp } from "@/context/AppContext";
import { colors } from "@/theme/tokens";

export const unstable_settings = {
  anchor: "(tabs)",
};

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { hasCompletedOnboarding, isLoggedIn } = useApp();

  // Persisted state is still loading; hold on the canvas color to avoid
  // flashing the wrong screen before redirecting.
  if (hasCompletedOnboarding === undefined) {
    return <View style={{ flex: 1, backgroundColor: colors.bg }} />;
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
          <Stack.Screen name="auth" />
        </Stack.Protected>

        {/* The app itself is only reachable with a session. Signing out
            anywhere drops the user back to auth automatically. */}
        <Stack.Protected guard={hasCompletedOnboarding && isLoggedIn}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="property/[id]" />
          <Stack.Screen name="post-property" options={{ presentation: "modal" }} />
          <Stack.Screen name="edit-property/[id]" />
          <Stack.Screen name="analytics" />
          <Stack.Screen name="subscription" />
          <Stack.Screen name="dealer-settings" />
          <Stack.Screen name="dealer-register" />
          <Stack.Screen name="dealer-pending" />
          <Stack.Screen name="dealer-kyc" />
          <Stack.Screen name="my-visits" />
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
    <SafeAreaProvider>
      <AppProvider>
        <RootLayoutNav />
      </AppProvider>
    </SafeAreaProvider>
  );
}
