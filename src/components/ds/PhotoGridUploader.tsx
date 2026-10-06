import { Image } from "expo-image";
import React, { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import { appAlert } from "@/components/ui/app-alert";
import { NavArrowLeft, Plus, X } from "@/components/ui/icons";
import { pickAndUploadPropertyImages } from "@/lib/media-upload";
import { colors, radius, spacing, type } from "@/theme/tokens";

/**
 * Multi-photo grid: first photo is the cover. Tap "move earlier" to reorder, × to remove.
 * Matches web limit of 30 images per listing.
 */
export function PhotoGridUploader({
  images,
  onChange,
  max = 30,
  error,
}: {
  images: string[];
  onChange: (next: string[]) => void;
  max?: number;
  error?: string | null;
}) {
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const remaining = max - images.length;

  const add = async () => {
    if (remaining <= 0) {
      appAlert("Photo limit reached", `A listing can have up to ${max} photos.`);
      return;
    }
    const urls = await pickAndUploadPropertyImages(remaining, (done, total) =>
      setProgress({ done, total }),
    );
    setProgress(null);
    if (urls.length) onChange([...images, ...urls].slice(0, max));
  };

  const remove = (i: number) => onChange(images.filter((_, idx) => idx !== i));
  const moveEarlier = (i: number) => {
    if (i === 0) return;
    const next = [...images];
    [next[i - 1], next[i]] = [next[i], next[i - 1]];
    onChange(next);
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.headerRow}>
        <Text style={styles.label}>Photos</Text>
        <Text style={styles.count}>
          {images.length}/{max}
        </Text>
      </View>
      <View style={styles.grid}>
        {images.map((uri, i) => (
          <View key={`${uri}-${i}`} style={styles.tile}>
            <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" />
            {i === 0 ? (
              <View style={styles.cover}>
                <Text style={styles.coverText}>Cover</Text>
              </View>
            ) : (
              <Pressable
                onPress={() => moveEarlier(i)}
                style={[styles.tileBtn, styles.tileBtnLeft]}
                accessibilityRole="button"
                accessibilityLabel={`Move photo ${i + 1} earlier`}
                hitSlop={6}
              >
                <NavArrowLeft size={14} color="#fff" />
              </Pressable>
            )}
            <Pressable
              onPress={() => remove(i)}
              style={[styles.tileBtn, styles.tileBtnRight]}
              accessibilityRole="button"
              accessibilityLabel={`Remove photo ${i + 1}`}
              hitSlop={6}
            >
              <X size={14} color="#fff" />
            </Pressable>
          </View>
        ))}
        {remaining > 0 ? (
          <Pressable
            onPress={add}
            disabled={Boolean(progress)}
            style={[styles.tile, styles.addTile, error ? { borderColor: colors.danger } : null]}
            accessibilityRole="button"
            accessibilityLabel="Add photos"
          >
            {progress ? (
              <>
                <ActivityIndicator color={colors.accent} />
                <Text style={styles.addText}>
                  {progress.done}/{progress.total}
                </Text>
              </>
            ) : (
              <>
                <Plus size={22} color={colors.accent} />
                <Text style={styles.addText}>Add</Text>
              </>
            )}
          </Pressable>
        ) : null}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : (
        <Text style={styles.hint}>The first photo is the cover. Clear, bright photos get more inquiries.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  headerRow: { flexDirection: "row", justifyContent: "space-between" },
  label: { ...type.label, color: colors.inkSecondary },
  count: { ...type.caption, color: colors.inkMuted },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  tile: {
    width: "31.5%",
    aspectRatio: 1,
    borderRadius: radius.md,
    borderCurve: "continuous",
    overflow: "hidden",
    backgroundColor: colors.surfaceSubtle,
  },
  addTile: {
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: colors.accentBorder,
    backgroundColor: colors.accentSoft,
  },
  addText: { ...type.label, color: colors.accent },
  cover: {
    position: "absolute",
    left: spacing.xs,
    bottom: spacing.xs,
    backgroundColor: colors.overlay,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  coverText: { ...type.micro, color: "#fff" },
  tileBtn: {
    position: "absolute",
    top: spacing.xs,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.overlay,
    alignItems: "center",
    justifyContent: "center",
  },
  tileBtnLeft: { left: spacing.xs },
  tileBtnRight: { right: spacing.xs },
  hint: { ...type.caption, color: colors.inkMuted },
  error: { ...type.caption, color: colors.danger },
});
