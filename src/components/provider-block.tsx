import { useRouter, type Href } from "expo-router";
import React from "react";

import { EmptyState, Screen } from "@/components/ds";
import { Lock } from "@/components/ui/icons";
import { useApp } from "@/context/AppContext";
import { mobileAuthConfigured } from "@/lib/api/supabase";
import { serviceProviderDenial } from "@/lib/service-access";

/** Returns a full screen when this account cannot open live provider records. */
export function useProviderBlock(title: string): React.ReactElement | null {
  const router = useRouter();
  const { isLoggedIn, serviceAccess } = useApp();
  if (!isLoggedIn) {
    return (
      <Screen title={title} fallbackHref="/(tabs)/services">
        <EmptyState
          icon={Lock}
          title="Sign in required"
          message="Sign in with an approved service provider account to open this dashboard."
          actionLabel="Sign in"
          onAction={() => router.push({ pathname: "/auth", params: { mode: "sign-in" } } as unknown as Href)}
        />
      </Screen>
    );
  }
  if (serviceAccess !== "approved") {
    return (
      <Screen title={title} fallbackHref="/(tabs)/services">
        <EmptyState icon={Lock} title="Dashboard unavailable" message={serviceProviderDenial(serviceAccess)} />
      </Screen>
    );
  }
  if (!mobileAuthConfigured) {
    return (
      <Screen title={title} fallbackHref="/(tabs)/services">
        <EmptyState
          icon={Lock}
          title="Bookings need a connection"
          message="Live booking records sync from SqftGo. This screen stays empty until that connection is configured."
        />
      </Screen>
    );
  }
  return null;
}
