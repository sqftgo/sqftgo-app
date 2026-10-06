import { useRouter, type Href } from "expo-router";
import React from "react";

import { Screen } from "@/components/ds/Screen";
import { EmptyState } from "@/components/ui/empty-state";
import { SearchX } from "@/components/ui/icons";

export default function NotFoundScreen() {
  const router = useRouter();
  return (
    <Screen title="Not found">
      <EmptyState
        icon={SearchX}
        title="This page doesn't exist"
        message="The link may be broken or the listing may have been removed."
        actionLabel="Go to home"
        onAction={() => router.replace("/" as Href)}
      />
    </Screen>
  );
}
