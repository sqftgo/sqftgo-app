import { Tabs } from "expo-router";
import React from "react";

import { AppTabBar, type TabDef } from "@/components/navigation/AppTabBar";
import { Briefcase, Home, Search, User } from "@/components/ui/icons";
import { colors } from "@/theme/tokens";

const BUYER_TABS: TabDef[] = [
  { name: "index", label: "Home", Icon: Home },
  { name: "explore", label: "Explore", Icon: Search },
  { name: "services", label: "Services", Icon: Briefcase },
  { name: "profile", label: "Profile", Icon: User },
];

export default function TabLayout() {
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
