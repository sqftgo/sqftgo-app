import { Redirect, Tabs, type Href } from "expo-router";
import React, { useMemo } from "react";

import { AppTabBar, type TabDef } from "@/components/navigation/AppTabBar";
import { BarChart3, Building2, Inbox, LayoutDashboard, User } from "@/components/ui/icons";
import { useApp } from "@/context/AppContext";
import { ownedPropertyIds, ownsInquiry } from "@/lib/ownership";
import { colors } from "@/theme/tokens";

const DEALER_TABS: TabDef[] = [
  { name: "index", label: "Dashboard", Icon: LayoutDashboard },
  { name: "properties", label: "Listings", Icon: Building2 },
  { name: "inquiries", label: "Inbox", Icon: Inbox },
  { name: "analytics", label: "Analytics", Icon: BarChart3 },
  { name: "profile", label: "Profile", Icon: User },
];

export default function DealerLayout() {
  const { userRole, inquiries, properties, userEmail, profile } = useApp();

  const tabs = useMemo(() => {
    const ownedIds = ownedPropertyIds(properties, { userId: profile?.id, email: userEmail });
    const newCount = inquiries.filter(
      (i) =>
        ownsInquiry(i, { email: userEmail, ownedPropertyIds: ownedIds }) &&
        (i.status === "new" || !i.status),
    ).length;
    return DEALER_TABS.map((t) => (t.name === "inquiries" ? { ...t, badge: newCount } : t));
  }, [inquiries, properties, userEmail, profile?.id]);

  if (userRole !== "broker") {
    return <Redirect href={"/(tabs)" as Href} />;
  }

  return (
    <Tabs
      initialRouteName="index"
      tabBar={(props) => <AppTabBar {...props} tabs={tabs} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.bg } }}
    >
      {DEALER_TABS.map((tab) => (
        <Tabs.Screen key={tab.name} name={tab.name} options={{ title: tab.label }} />
      ))}
    </Tabs>
  );
}
