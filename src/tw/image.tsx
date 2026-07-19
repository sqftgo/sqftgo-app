import { useCssElement } from "react-native-css";
import React from "react";
import { StyleSheet } from "react-native";
import Animated from "react-native-reanimated";
import { Image as ExpoImage } from "expo-image";

const AnimatedExpoImage = Animated.createAnimatedComponent(ExpoImage);

function CSSImage(props: React.ComponentProps<typeof AnimatedExpoImage> & { resizeMode?: string }) {
  // Strip legacy resizeMode from props so expo-image never sees it.
  const { resizeMode: resizeModeProp, contentFit, contentPosition, style, source, ...rest } =
    props;

  // @ts-expect-error: Remap objectFit / legacy resizeMode style to contentFit
  const { objectFit, objectPosition, resizeMode: resizeModeStyle, ...flatStyle } =
    StyleSheet.flatten(style) || {};

  return (
    <AnimatedExpoImage
      {...rest}
      contentFit={contentFit ?? objectFit ?? resizeModeProp ?? resizeModeStyle}
      contentPosition={contentPosition ?? objectPosition}
      source={typeof source === "string" ? { uri: source } : source}
      // @ts-expect-error: Style is remapped above
      style={flatStyle}
    />
  );
}

export const Image = (
  props: React.ComponentProps<typeof CSSImage> & { className?: string }
) => {
  return useCssElement(CSSImage as any, props as any, { className: "style" }) as any;
};

Image.displayName = "CSS(Image)";
