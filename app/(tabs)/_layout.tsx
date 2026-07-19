import { Tabs } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Pressable,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { Bookmark, Briefcase, Grid, Home, User } from "lucide-react-native";

import { colors, type } from "@/theme/tokens";

interface CustomTabBarProps {
  state: any;
  descriptors: any;
  navigation: any;
}

const TABS = [
  { name: "index", label: "Home", Icon: Home },
  { name: "explore", label: "Explore", Icon: Grid },
  { name: "services", label: "Services", Icon: Briefcase },
  { name: "favorites", label: "Saved", Icon: Bookmark },
  { name: "profile", label: "Profile", Icon: User },
];

function CustomTabBar({ state, navigation }: CustomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();

  const activeRouteName = state.routes[state.index]?.name;
  const activeIdx = TABS.findIndex((t) => t.name === activeRouteName);
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

  const TAB_WIDTH = screenWidth / TABS.length;

  const indicatorTranslateX = indicatorAnim.interpolate({
    inputRange: TABS.map((_, i) => i),
    outputRange: TABS.map((_, i) => i * TAB_WIDTH),
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

      {TABS.map((tab, idx) => {
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
            <tab.Icon
              size={22}
              color={isActive ? colors.accent : colors.inkMuted}
              strokeWidth={isActive ? 2.5 : 1.8}
            />
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

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="explore" />
      <Tabs.Screen name="services" />
      <Tabs.Screen name="favorites" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
