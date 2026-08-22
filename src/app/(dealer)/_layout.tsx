import React, { useMemo } from "react";
import {
  Animated,
  Pressable,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { Redirect, type Href } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import {
  ParamListBase,
  TabNavigationState,
} from "@react-navigation/native";
import type { MaterialTopTabBarProps } from "@react-navigation/material-top-tabs";
import {
  createMaterialTopTabNavigator,
  type MaterialTopTabNavigationEventMap,
  type MaterialTopTabNavigationOptions,
} from "@react-navigation/material-top-tabs";
import { withLayoutContext } from "expo-router";
import {
  BarChart3,
  Building2,
  Inbox,
  LayoutDashboard,
  User,
} from "@/components/ui/icons";

import { useApp } from "@/context/AppContext";
import { ownedPropertyIds, ownsInquiry } from "@/lib/ownership";
import { colors, type } from "@/theme/tokens";

interface TabDef {
  name: string;
  label: string;
  Icon: React.ComponentType<{
    size?: number;
    color?: string;
    strokeWidth?: number | string;
  }>;
  badge?: number;
}

const { Navigator } = createMaterialTopTabNavigator();

const SwipeTabs = withLayoutContext<
  MaterialTopTabNavigationOptions,
  typeof Navigator,
  TabNavigationState<ParamListBase>,
  MaterialTopTabNavigationEventMap
>(Navigator, undefined, true);

interface CustomTabBarProps extends MaterialTopTabBarProps {
  tabs: TabDef[];
}

function DealerTabBar({ state, navigation, position, tabs }: CustomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();

  const activeRouteName = state.routes[state.index]?.name;
  const activeIdx = tabs.findIndex((t) => t.name === activeRouteName);
  const safeActiveIdx = activeIdx === -1 ? 0 : activeIdx;

  const TAB_WIDTH = screenWidth / Math.max(tabs.length, 1);

  const swipeTranslateX = position.interpolate({
    inputRange: tabs.map((_, i) => i),
    outputRange: tabs.map((_, i) => i * TAB_WIDTH),
    extrapolate: "clamp",
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
    navigation.navigate(routeName as never);
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
          transform: [{ translateX: swipeTranslateX }],
        }}
      />

      {tabs.map((tab, idx) => {
        const route = state.routes.find((r) => r.name === tab.name);
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
                  <Text
                    style={{
                      color: colors.onAccent,
                      fontSize: 10,
                      fontWeight: "800",
                    }}
                  >
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

const BASE_DEALER_TABS: TabDef[] = [
  { name: "index", label: "Dashboard", Icon: LayoutDashboard },
  { name: "properties", label: "Properties", Icon: Building2 },
  { name: "inquiries", label: "Inbox", Icon: Inbox },
  { name: "analytics", label: "Analytics", Icon: BarChart3 },
  { name: "profile", label: "Profile", Icon: User },
];

export default function DealerLayout() {
  const { userRole, inquiries, properties, userEmail, profile } = useApp();

  // Always compute tabs (hooks must not be called conditionally)
  const tabs = useMemo(() => {
    if (userRole !== "broker") return BASE_DEALER_TABS;
    const ownedIds = ownedPropertyIds(properties, {
      userId: profile?.id,
      email: userEmail,
    });
    const newCount = inquiries.filter(
      (i) =>
        ownsInquiry(i, { email: userEmail, ownedPropertyIds: ownedIds }) &&
        (i.status === "new" || !i.status),
    ).length;
    return BASE_DEALER_TABS.map((t) =>
      t.name === "inquiries" ? { ...t, badge: newCount } : t,
    );
  }, [userRole, inquiries, properties, userEmail, profile?.id]);

  // Non-brokers are redirected back to the user tabs
  if (userRole !== "broker") {
    return <Redirect href={"/(tabs)" as Href} />;
  }

  return (
    <SwipeTabs
      initialRouteName="index"
      tabBarPosition="bottom"
      tabBar={(props) => <DealerTabBar {...props} tabs={tabs} />}
      screenOptions={{
        swipeEnabled: true,
        animationEnabled: true,
        lazy: true,
        sceneStyle: { backgroundColor: colors.bg },
      }}
    >
      {tabs.map((tab) => (
        <SwipeTabs.Screen key={tab.name} name={tab.name} />
      ))}
    </SwipeTabs>
  );
}
