import { Redirect, Tabs, type Href } from "expo-router";
import React from "react";

import { AppTabBar, type TabDef } from "@/components/navigation/AppTabBar";
import { Briefcase, Heart, Home, Search, User } from "@/components/ui/icons";
import { useApp } from "@/context/AppContext";
import { colors } from "@/theme/tokens";

const BUYER_TABS: TabDef[] = [
  { name: "index", label: "Home", Icon: Home },
  { name: "explore", label: "Explore", Icon: Search },
  { name: "services", label: "Services", Icon: Briefcase },
  { name: "saved", label: "Saved", Icon: Heart },
  { name: "profile", label: "Profile", Icon: User },
];

export default function TabLayout() {
  const { userRole } = useApp();

  if (userRole === "broker") {
    return <Redirect href={"/(dealer)" as Href} />;
  }

  return (
    <Tabs
      initialRouteName="index"
      tabBar={(props) => <AppTabBar {...props} tabs={BUYER_TABS} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.bg } }}
    >
      {BUYER_TABS.map((tab) => (
        <Tabs.Screen key={tab.name} name={tab.name} options={{ title: tab.label }} />
      ))}
    </Tabs>
  );
}
