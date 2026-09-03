import React, { useMemo, useState } from "react";
import {
  FlatList,
  Image,
  Pressable,
  Text,
  View,
} from "react-native";
import { useRouter, type Href } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { MapPin } from "@/components/ui/icons";

import { Chip } from "@/components/ui/chip";
import { ScreenNavbar } from "@/components/ui/screen-navbar";
import { DESTINATION_TAGS, DESTINATIONS } from "@/data/destinations";
import { colors, radius, shadow, spacing, type } from "@/theme/tokens";

export default function DestinationsHubScreen() {
  const router = useRouter();
  const [tag, setTag] = useState<string>("all");

  const list = useMemo(
    () => (tag === "all" ? DESTINATIONS : DESTINATIONS.filter((d) => d.tag === tag)),
    [tag],
  );

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ paddingHorizontal: spacing.lg, gap: spacing.sm }}>
        <Pressable onPress={() => router.back()}>
          <Text style={{ ...type.label, color: colors.accent }}>← Back</Text>
        </Pressable>
        <ScreenNavbar title="Destinations" subtitle="Explore cities across SqftGo markets" />
        <FlatList
          horizontal
          data={["all", ...DESTINATION_TAGS]}
          keyExtractor={(item) => item}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: spacing.xs, paddingBottom: spacing.sm }}
          renderItem={({ item }) => (
            <Chip
              label={item === "all" ? "All regions" : item}
              selected={tag === item}
              onPress={() => setTag(item)}
            />
          )}
        />
      </View>

      <FlatList
        data={list}
        keyExtractor={(item) => item.slug}
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl }}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(`/destinations/${item.slug}` as Href)}
            style={{
              backgroundColor: colors.surface,
              borderRadius: radius.lg,
              borderWidth: 1,
              borderColor: colors.border,
              overflow: "hidden",
              boxShadow: shadow.card,
            }}
          >
            <Image source={{ uri: item.image }} style={{ width: "100%", height: 140 }} />
            <View style={{ padding: spacing.md, gap: 4 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={{ ...type.emphasis, color: colors.ink }}>{item.name}</Text>
                <Text style={{ ...type.micro, color: colors.accent, fontWeight: "700" }}>{item.tag}</Text>
              </View>
              <Text style={{ ...type.caption, color: colors.inkMuted }}>{item.title}</Text>
              <Text style={{ ...type.body, color: colors.inkSecondary }} numberOfLines={2}>
                {item.desc}
              </Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 }}>
                <MapPin size={12} color={colors.inkMuted} />
                <Text style={{ ...type.micro, color: colors.inkMuted }}>{item.vibe}</Text>
              </View>
            </View>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}
