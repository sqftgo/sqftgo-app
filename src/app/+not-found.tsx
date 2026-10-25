import { Redirect, useRouter, type Href } from "expo-router";
import React from "react";

import { Screen } from "@/components/ds/Screen";
import { EmptyState } from "@/components/ui/empty-state";
import { SearchX } from "@/components/ui/icons";
import { useApp } from "@/context/AppContext";

export default function NotFoundScreen() {
  const router = useRouter();
  const { isLoggedIn, userRole } = useApp();

  // Guests stuck here after logout should never stay on not-found.
  if (!isLoggedIn) {
    return <Redirect href={{ pathname: "/auth", params: { mode: "sign-in" } } as unknown as Href} />;
  }

  const home = userRole === "broker" ? ("/(dealer)" as Href) : ("/(tabs)" as Href);

  return (
    <Screen title="Not found">
      <EmptyState
        icon={SearchX}
        title="This page doesn't exist"
        message="The link may be broken or the listing may have been removed."
        actionLabel="Go to home"
        onAction={() => router.replace(home)}
      />
    </Screen>
  );
}
