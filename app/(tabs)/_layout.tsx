import { Tabs } from 'expo-router';
import React, { useRef, useEffect } from 'react';
import {
  StyleSheet,
  Pressable,
  View,
  Text,
  Platform,
  Animated,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Home, Bookmark, User, Grid } from 'lucide-react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface CustomTabBarProps {
  state: any;
  descriptors: any;
  navigation: any;
}

const TABS = [
  { name: 'index',     label: 'Home',    Icon: Home },
  { name: 'explore',   label: 'Explore', Icon: Grid },
  { name: 'favorites', label: 'Saved',   Icon: Bookmark },
  { name: 'profile',   label: 'Profile', Icon: User },
];

function CustomTabBar({ state, navigation }: CustomTabBarProps) {
  const insets = useSafeAreaInsets();

  // Map state.routes to our 4-tab layout (excluding hidden 'post' tab)
  const activeRouteName = state.routes[state.index]?.name;

  // Active tab index in our TABS array
  const activeIdx = TABS.findIndex((t) => t.name === activeRouteName);
  const safeActiveIdx = activeIdx === -1 ? 0 : activeIdx;

  // Animated value for the sliding bubble
  const bubbleAnim = useRef(new Animated.Value(safeActiveIdx)).current;

  useEffect(() => {
    Animated.spring(bubbleAnim, {
      toValue: safeActiveIdx,
      useNativeDriver: true,
      tension: 60,
      friction: 10,
    }).start();
    // bubbleAnim is a stable ref — intentionally omitted
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safeActiveIdx]);

  // BAR dimensions
  const BAR_PADDING_H = 12;
  const BAR_WIDTH = SCREEN_WIDTH - 40; // floating pill narrower than screen
  const TAB_WIDTH = (BAR_WIDTH - BAR_PADDING_H * 2) / TABS.length;

  const bubbleTranslateX = bubbleAnim.interpolate({
    inputRange: TABS.map((_, i) => i),
    outputRange: TABS.map((_, i) => i * TAB_WIDTH),
  });

  const handlePress = (routeName: string, routeKey?: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (routeKey) {
      const event = navigation.emit({
        type: 'tabPress',
        target: routeKey,
        canPreventDefault: true,
      });
      if (event.defaultPrevented) return;
    }
    navigation.navigate(routeName);
  };

  return (
    <View
      style={[
        styles.outerContainer,
        { paddingBottom: insets.bottom + 10, bottom: 0 },
      ]}
      pointerEvents="box-none"
    >
      <View style={styles.pill}>
        {/* Animated sliding bubble */}
        <Animated.View
          style={[
            styles.activeBubble,
            {
              width: TAB_WIDTH,
              transform: [{ translateX: bubbleTranslateX }],
            },
          ]}
        />

        {TABS.map((tab, idx) => {
          const route = state.routes.find((r: any) => r.name === tab.name);
          const isActive = safeActiveIdx === idx;

          return (
            <Pressable
              key={tab.name}
              onPress={() => handlePress(tab.name, route?.key)}
              style={[styles.tabItem, { width: TAB_WIDTH }]}
              android_ripple={null}
            >
              <tab.Icon
                size={20}
                color={isActive ? '#FFFFFF' : '#94A3B8'}
                strokeWidth={isActive ? 2.5 : 1.8}
              />
              {isActive && (
                <Text style={styles.activeLabel}>{tab.label}</Text>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="explore" />
      <Tabs.Screen name="post" />
      <Tabs.Screen name="favorites" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    // No background — fully floating
  },
  pill: {
    width: SCREEN_WIDTH - 40,
    height: 62,
    backgroundColor: '#0F1E36', // Brand Slate Blue
    borderRadius: 31,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    position: 'relative',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#0F1E36',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.35,
        shadowRadius: 20,
      },
      android: {
        elevation: 18,
      },
    }),
  },
  activeBubble: {
    position: 'absolute',
    left: 12,
    top: 8,
    bottom: 8,
    borderRadius: 22,
    backgroundColor: '#E05A36', // Warm Orange active state
    zIndex: 0,
  },
  tabItem: {
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
    zIndex: 1,
  },
  activeLabel: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
});
