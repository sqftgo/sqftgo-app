import { useRouter, type Href } from "expo-router";
import React from "react";

import { useProviderBlock } from "@/components/provider-block";
import { ListRow, ListSection, Screen } from "@/components/ds";
import { Calendar, Lock, Store, User } from "@/components/ui/icons";

export default function ProviderSettingsScreen() {
  const router = useRouter();
  const blocked = useProviderBlock("Settings");
  if (blocked) return blocked;
  const open = (href: string) => router.push(href as Href);

  return (
    <Screen title="Settings" subtitle="Account and business preferences" fallbackHref={"/services/dashboard" as Href}>
      <ListSection title="Business">
        <ListRow icon={Store} title="Business profile" subtitle="Name, description, contact and verification" onPress={() => open("/services/manage")} />
        <ListRow icon={Calendar} title="Working hours" subtitle="Days, hours and blocked dates" onPress={() => open("/services/availability")} />
        <ListRow icon={Store} title="Services and prices" subtitle="What customers can request" onPress={() => open("/services/catalog")} />
      </ListSection>
      <ListSection title="Account">
        <ListRow icon={User} title="Profile" subtitle="Name and verified mobile" onPress={() => open("/settings/profile")} />
        <ListRow icon={Lock} title="Password" subtitle="Change the password for this account" onPress={() => open("/settings/password")} />
      </ListSection>
    </Screen>
  );
}
