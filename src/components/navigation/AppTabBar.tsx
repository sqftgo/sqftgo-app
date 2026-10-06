import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import * as Haptics from "expo-haptics";
import React from "react";
import { Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { IconComponent } from "@/components/ui/icons";
import { colors, type } from "@/theme/tokens";

export interface TabDef {
  name: string;
  label: string;
  Icon: IconComponent;
  badge?: number;
}

/** Shared bottom tab bar for buyer and dealer tab sets. */
export function AppTabBar({
  state,
  navigation,
  tabs,
}: Pick<BottomTabBarProps, "state" | "navigation"> & { tabs: TabDef[] }) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const activeName = state.routes[state.index]?.name;
  const tabWidth = width / Math.max(tabs.length, 1);

  const onPress = (name: string, key?: string) => {
    if (Platform.OS === "ios") Haptics.selectionAsync().catch(() => {});
    if (key) {
      const event = navigation.emit({ type: "tabPress", target: key, canPreventDefault: true });
      if (event.defaultPrevented) return;
    }
    navigation.navigate(name as never);
  };

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 6) }]} accessibilityRole="tablist">
      {tabs.map((tab) => {
        const route = state.routes.find((r) => r.name === tab.name);
        const active = activeName === tab.name;
        const tint = active ? colors.accent : colors.inkMuted;
        return (
          <Pressable
            key={tab.name}
            onPress={() => onPress(tab.name, route?.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={tab.badge ? `${tab.label}, ${tab.badge} new` : tab.label}
            style={[styles.tab, { width: tabWidth }]}
          >
            <View>
              <tab.Icon size={24} color={tint} strokeWidth={active ? 2.2 : 1.7} />
              {tab.badge && tab.badge > 0 ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{tab.badge > 9 ? "9+" : tab.badge}</Text>
                </View>
              ) : null}
            </View>
            <Text style={[styles.label, { color: tint }]} numberOfLines={1}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borderStrong,
  },
  tab: { alignItems: "center", justifyContent: "center", paddingTop: 8, paddingBottom: 2, gap: 3, minHeight: 50 },
  label: { ...type.micro, fontSize: 10 },
  badge: {
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
  },
  badgeText: { color: colors.onAccent, fontSize: 10, fontWeight: "700" },
});
