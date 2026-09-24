import React, { useState } from "react";
import {
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { Image } from "expo-image";

import { colors, radius, spacing, type } from "@/theme/tokens";

/** Visible part of the gallery below the content sheet's rounded overlap. */
export const GALLERY_HEIGHT = 380;
export const SHEET_OVERLAP = 24;

interface PropertyGalleryProps {
  images: string[];
}

export function PropertyGallery({ images }: PropertyGalleryProps) {
  const { width } = useWindowDimensions();
  const [index, setIndex] = useState(0);

  const handleMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setIndex(Math.round(e.nativeEvent.contentOffset.x / width));
  };

  return (
    <View style={{ height: GALLERY_HEIGHT, backgroundColor: colors.surfaceSubtle }}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleMomentumEnd}
        scrollEventThrottle={16}
      >
        {images.map((uri, i) => (
          <Image
            key={`${uri}-${i}`}
            source={{ uri }}
            style={{ width, height: GALLERY_HEIGHT }}
            contentFit="cover"
            transition={200}
          />
        ))}
      </ScrollView>

      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          right: spacing.lg,
          bottom: SHEET_OVERLAP + spacing.md,
          paddingHorizontal: spacing.sm + 2,
          paddingVertical: 4,
          borderRadius: radius.full,
          backgroundColor: colors.overlay,
        }}
      >
        <Text style={{ ...type.micro, color: colors.onPrimary, fontVariant: ["tabular-nums"] }}>
          {index + 1} / {images.length}
        </Text>
      </View>
    </View>
  );
}
