import { Image } from "expo-image";
import React, { useRef, useState } from "react";
import {
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Modal,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Home, X } from "@/components/ui/icons";
import { colors, radius, spacing, type } from "@/theme/tokens";

/** Visible part of the gallery below the content sheet's rounded overlap. */
export const GALLERY_HEIGHT = 380;
export const SHEET_OVERLAP = 24;

interface PropertyGalleryProps {
  images: string[];
}

function Counter({ index, total, bottom }: { index: number; total: number; bottom: number }) {
  return (
    <View
      pointerEvents="none"
      style={{
        position: "absolute",
        right: spacing.lg,
        bottom,
        paddingHorizontal: spacing.sm + 2,
        paddingVertical: 4,
        borderRadius: radius.full,
        backgroundColor: colors.overlay,
      }}
    >
      <Text style={{ ...type.micro, color: colors.onPrimary, fontVariant: ["tabular-nums"] }}>
        {index + 1} / {total}
      </Text>
    </View>
  );
}

export function PropertyGallery({ images }: PropertyGalleryProps) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [index, setIndex] = useState(0);
  const [viewer, setViewer] = useState(false);
  const viewerRef = useRef<ScrollView>(null);

  const pageFrom = (e: NativeSyntheticEvent<NativeScrollEvent>) =>
    Math.round(e.nativeEvent.contentOffset.x / width);

  if (images.length === 0) {
    return (
      <View
        style={{
          height: GALLERY_HEIGHT,
          backgroundColor: colors.surfaceSubtle,
          alignItems: "center",
          justifyContent: "center",
          gap: spacing.sm,
          paddingBottom: SHEET_OVERLAP,
        }}
      >
        <Home size={36} color={colors.inkMuted} />
        <Text style={{ ...type.label, color: colors.inkMuted }}>No photos yet</Text>
      </View>
    );
  }

  return (
    <View style={{ height: GALLERY_HEIGHT, backgroundColor: colors.surfaceSubtle }}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => setIndex(pageFrom(e))}
        scrollEventThrottle={16}
      >
        {images.map((uri, i) => (
          <Pressable
            key={`${uri}-${i}`}
            onPress={() => setViewer(true)}
            accessibilityRole="imagebutton"
            accessibilityLabel={`Photo ${i + 1} of ${images.length}. Open full screen`}
          >
            <Image source={{ uri }} style={{ width, height: GALLERY_HEIGHT }} contentFit="cover" transition={200} />
          </Pressable>
        ))}
      </ScrollView>

      <Counter index={index} total={images.length} bottom={SHEET_OVERLAP + spacing.md} />

      <Modal
        visible={viewer}
        animationType="fade"
        presentationStyle="fullScreen"
        onRequestClose={() => setViewer(false)}
        onShow={() => viewerRef.current?.scrollTo({ x: index * width, animated: false })}
        statusBarTranslucent
      >
        <StatusBar barStyle="light-content" />
        <View style={{ flex: 1, backgroundColor: "#000" }}>
          <ScrollView
            ref={viewerRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            contentOffset={{ x: index * width, y: 0 }}
            onMomentumScrollEnd={(e) => setIndex(pageFrom(e))}
          >
            {images.map((uri, i) => (
              <Image key={`v-${uri}-${i}`} source={{ uri }} style={{ width, height }} contentFit="contain" />
            ))}
          </ScrollView>
          <Pressable
            onPress={() => setViewer(false)}
            accessibilityRole="button"
            accessibilityLabel="Close photos"
            hitSlop={10}
            style={{
              position: "absolute",
              top: insets.top + spacing.sm,
              right: spacing.lg,
              width: 40,
              height: 40,
              borderRadius: radius.full,
              backgroundColor: "rgba(255,255,255,0.16)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={20} color="#fff" />
          </Pressable>
          <Counter index={index} total={images.length} bottom={insets.bottom + spacing.lg} />
        </View>
      </Modal>
    </View>
  );
}
