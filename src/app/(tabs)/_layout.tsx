import { Tabs } from "expo-router";
import React, { useEffect, useMemo, useRef } from "react";
import {
  Animated,
  Pressable,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import {
  Bookmark,
  Building2,
  Grid,
  Home,
  Inbox,
  LayoutDashboard,
  MessageSquare,
  User,
} from "@/components/ui/icons";

import { useApp } from "@/context/AppContext";
import type { UserRole } from "@/data/types";
import { ownsInquiry, ownedPropertyIds } from "@/lib/ownership";
import { colors, type } from "@/theme/tokens";

interface TabDef {
  name: string;
  label: string;
  Icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number | string }>;
  badge?: number;
}

const USER_TABS: TabDef[] = [
  { name: "index", label: "Home", Icon: Home },
  { name: "explore", label: "Explore", Icon: Grid },
  { name: "favorites", label: "Saved", Icon: Bookmark },
  { name: "my-inquiries", label: "Inquiries", Icon: MessageSquare },
  { name: "profile", label: "Profile", Icon: User },
];

const BROKER_TABS: TabDef[] = [
  { name: "dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { name: "properties", label: "Properties", Icon: Building2 },
  { name: "inquiries", label: "Inbox", Icon: Inbox },
  { name: "explore", label: "Explore", Icon: Grid },
  { name: "profile", label: "Profile", Icon: User },
];

function tabsForRole(role: UserRole | null): TabDef[] {
  if (role === "broker") return BROKER_TABS;
  return USER_TABS;
}

interface CustomTabBarProps {
  state: any;
  descriptors: any;
  navigation: any;
  tabs: TabDef[];
}

function CustomTabBar({ state, navigation, tabs }: CustomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();

  const activeRouteName = state.routes[state.index]?.name;
  const activeIdx = tabs.findIndex((t) => t.name === activeRouteName);
  const safeActiveIdx = activeIdx === -1 ? 0 : activeIdx;

  const indicatorAnim = useRef(new Animated.Value(safeActiveIdx)).current;

  useEffect(() => {
    Animated.spring(indicatorAnim, {
      toValue: safeActiveIdx,
      useNativeDriver: true,
      tension: 70,
      friction: 12,
    }).start();
  }, [safeActiveIdx, indicatorAnim]);

  const TAB_WIDTH = screenWidth / tabs.length;

  const indicatorTranslateX = indicatorAnim.interpolate({
    inputRange: tabs.map((_, i) => i),
    outputRange: tabs.map((_, i) => i * TAB_WIDTH),
  });

  const handlePress = (routeName: string, routeKey?: string) => {
    if (process.env.EXPO_OS === "ios") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (routeKey) {
      const event = navigation.emit({
        type: "tabPress",
        target: routeKey,
        canPreventDefault: true,
      });
      if (event.defaultPrevented) return;
    }
    navigation.navigate(routeName);
  };

  return (
    <View
      style={{
        flexDirection: "row",
        backgroundColor: colors.surface,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        paddingBottom: insets.bottom,
        boxShadow: "0 -4px 16px rgba(15, 30, 54, 0.08)",
      }}
    >
      <Animated.View
        style={{
          position: "absolute",
          top: 0,
          height: 3,
          width: TAB_WIDTH,
          backgroundColor: colors.accent,
          borderBottomLeftRadius: 3,
          borderBottomRightRadius: 3,
          transform: [{ translateX: indicatorTranslateX }],
        }}
      />

      {tabs.map((tab, idx) => {
        const route = state.routes.find((r: any) => r.name === tab.name);
        const isActive = safeActiveIdx === idx;

        return (
          <Pressable
            key={tab.name}
            onPress={() => handlePress(tab.name, route?.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={tab.label}
            style={{
              width: TAB_WIDTH,
              alignItems: "center",
              justifyContent: "center",
              paddingTop: 10,
              paddingBottom: 8,
              gap: 3,
            }}
          >
            <View>
              <tab.Icon
                size={22}
                color={isActive ? colors.accent : colors.inkMuted}
                strokeWidth={isActive ? 2.5 : 1.8}
              />
              {tab.badge && tab.badge > 0 ? (
                <View
                  style={{
                    position: "absolute",
                    top: -4,
                    right: -10,
                    minWidth: 16,
                    height: 16,
                    borderRadius: 8,
                    backgroundColor: colors.accent,
                    alignItems: "center",
                    justifyContent: "center",
                    paddingHorizontal: 3,
                  }}
                >
                  <Text style={{ color: colors.onAccent, fontSize: 10, fontWeight: "800" }}>
                    {tab.badge > 9 ? "9+" : tab.badge}
                  </Text>
                </View>
              ) : null}
            </View>
            <Text
              style={{
                ...type.micro,
                fontWeight: isActive ? "800" : "600",
                color: isActive ? colors.accent : colors.inkMuted,
              }}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const ALL_TAB_NAMES = [
  "index",
  "explore",
  "services",
  "favorites",
  "profile",
  "dashboard",
  "properties",
  "inquiries",
  "my-inquiries",
] as const;

export default function TabLayout() {
  const { userRole, inquiries, properties, userEmail, profile } = useApp();
  const tabs = useMemo(() => {
    const base = tabsForRole(userRole);
    if (userRole !== "broker") return base;
    const ownedIds = ownedPropertyIds(properties, {
      userId: profile?.id,
      email: userEmail,
    });
    const newCount = inquiries.filter(
      (i) =>
        ownsInquiry(i, { email: userEmail, ownedPropertyIds: ownedIds }) &&
        (i.status === "new" || !i.status),
    ).length;
    return base.map((t) => (t.name === "inquiries" ? { ...t, badge: newCount } : t));
  }, [userRole, inquiries, properties, userEmail, profile?.id]);
  const visible = useMemo(() => new Set(tabs.map((t) => t.name)), [tabs]);

  return (
    <Tabs
      initialRouteName={userRole === "broker" ? "dashboard" : "index"}
      tabBar={(props) => <CustomTabBar {...props} tabs={tabs} />}
      screenOptions={{ headerShown: false }}
    >
      {ALL_TAB_NAMES.map((name) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{ href: visible.has(name) ? undefined : null }}
        />
      ))}
    </Tabs>
  );
}
