import React from "react";
import { Pressable, Text, View } from "react-native";
import { BlurView } from "expo-blur";
import Animated, {
  type SharedValue,
  interpolate,
  useAnimatedStyle,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ChevronLeft, Heart, Share2, type IconComponent } from "@/components/ui/icons";
import { colors, radius, spacing, type } from "@/theme/tokens";

import { GALLERY_HEIGHT } from "./PropertyGallery";

const BAR_HEIGHT = 56;

interface PropertyTopBarProps {
  scrollY: SharedValue<number>;
  title: string;
  isFavorite: boolean;
  onBack: () => void;
  onShare: () => void;
  onToggleFavorite: () => void;
}

function FloatingButton({
  icon: Icon,
  label,
  onPress,
  active,
}: {
  icon: IconComponent;
  label: string;
  onPress: () => void;
  active?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={4}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => ({
        width: 40,
        height: 40,
        borderRadius: radius.full,
        boxShadow: "0 2px 8px rgba(15, 30, 54, 0.18)",
        transform: [{ scale: pressed ? 0.94 : 1 }],
      })}
    >
      <BlurView
        intensity={60}
        tint="light"
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          borderRadius: radius.full,
          overflow: "hidden",
          borderWidth: 1,
          borderColor: "rgba(255, 255, 255, 0.7)",
          backgroundColor: "rgba(255, 255, 255, 0.72)",
        }}
      >
        <Icon
          size={20}
          color={active ? colors.accent : colors.ink}
          fill={active ? colors.accent : "transparent"}
          strokeWidth={1.9}
        />
      </BlurView>
    </Pressable>
  );
}

/** Floating over the gallery; fades to a solid bar with the title once the gallery scrolls away. */
export function PropertyTopBar({
  scrollY,
  title,
  isFavorite,
  onBack,
  onShare,
  onToggleFavorite,
}: PropertyTopBarProps) {
  const insets = useSafeAreaInsets();
  const fadeStart = GALLERY_HEIGHT - insets.top - BAR_HEIGHT * 2;
  const fadeEnd = GALLERY_HEIGHT - insets.top - BAR_HEIGHT;

  const backgroundStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [fadeStart, fadeEnd], [0, 1], "clamp"),
  }));

  const titleStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [fadeEnd - 20, fadeEnd + 20], [0, 1], "clamp"),
  }));

  return (
    <View
      pointerEvents="box-none"
      style={{ position: "absolute", top: 0, left: 0, right: 0, paddingTop: insets.top }}
    >
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: colors.surface,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          },
          backgroundStyle,
        ]}
      />
      <View
        style={{
          height: BAR_HEIGHT,
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.md,
          paddingHorizontal: spacing.lg,
        }}
      >
        <FloatingButton icon={ChevronLeft} label="Go back" onPress={onBack} />
        <Animated.View style={[{ flex: 1 }, titleStyle]}>
          <Text style={{ ...type.emphasis, fontSize: 15, color: colors.ink }} numberOfLines={1}>
            {title}
          </Text>
        </Animated.View>
        <FloatingButton icon={Share2} label="Share property" onPress={onShare} />
        <FloatingButton
          icon={Heart}
          label={isFavorite ? "Remove from saved" : "Save property"}
          onPress={onToggleFavorite}
          active={isFavorite}
        />
      </View>
    </View>
  );
}
