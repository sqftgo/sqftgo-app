import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter, type Href } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Building2, MapPin } from "@/components/ui/icons";

import { EmptyState } from "@/components/ui/empty-state";
import { PropertyCard } from "@/components/ui/property-card";
import { getDestinationBySlug } from "@/data/destinations";
import { useApp } from "@/context/AppContext";
import { isApiMode } from "@/lib/api/config";
import { apiListProperties } from "@/lib/api/services/properties";
import type { Property } from "@/data/types";
import { colors, radius, spacing, type } from "@/theme/tokens";

export default function DestinationDetailScreen() {
  const router = useRouter();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { properties: localProperties, setSelectedCity } = useApp();
  const destination = useMemo(
    () => (slug ? getDestinationBySlug(slug) : undefined),
    [slug],
  );

  const [live, setLive] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!destination) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      if (isApiMode) {
        setLive(await apiListProperties({ city: destination.name, status: "Active", limit: 40 }));
      } else {
        setLive(
          localProperties.filter(
            (p) =>
              p.status === "Active" &&
              p.city.trim().toLowerCase() === destination.name.toLowerCase(),
          ),
        );
      }
    } catch {
      setLive([]);
    } finally {
      setLoading(false);
    }
  }, [destination, localProperties]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!destination) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
        <EmptyState
          icon={MapPin}
          title="Destination not found"
          message="Pick another city from the hub."
          actionLabel="Destinations"
          onAction={() => router.replace("/destinations" as Href)}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xxl }}>
        <Image source={{ uri: destination.image }} style={{ width: "100%", height: 200 }} />
        <View style={{ padding: spacing.xl, gap: spacing.md }}>
          <Pressable onPress={() => router.back()}>
            <Text style={{ ...type.label, color: colors.accent }}>← Back</Text>
          </Pressable>
          <Text style={{ ...type.title, color: colors.ink }}>{destination.name}</Text>
          <Text style={{ ...type.caption, color: colors.accent }}>{destination.title}</Text>
          <Text style={{ ...type.body, color: colors.inkSecondary, lineHeight: 22 }}>
            {destination.desc}
          </Text>

          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: radius.lg,
              borderWidth: 1,
              borderColor: colors.border,
              padding: spacing.md,
              gap: spacing.xs,
            }}
          >
            <Text style={{ ...type.label, color: colors.inkMuted }}>MARKET SNAPSHOT</Text>
            <Text style={{ ...type.body, color: colors.ink }}>
              Vibe: {destination.vibe}
            </Text>
            <Text style={{ ...type.body, color: colors.ink }}>
              Investment index: {destination.investmentIndex}
            </Text>
            <Text style={{ ...type.body, color: colors.ink }}>
              Typical prices: {destination.averagePrice}
            </Text>
            <Text style={{ ...type.body, color: colors.ink }}>
              Top localities: {destination.topLocalities.join(", ")}
            </Text>
          </View>

          <Pressable
            onPress={() => {
              setSelectedCity(destination.name);
              router.push({
                pathname: "/(tabs)/explore",
                params: { city: destination.name },
              } as Href);
            }}
            style={{
              height: 48,
              borderRadius: radius.md,
              backgroundColor: colors.accent,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ ...type.emphasis, color: colors.onAccent }}>
              Explore listings in {destination.name}
            </Text>
          </Pressable>

          <Text style={{ ...type.heading, color: colors.ink, marginTop: spacing.sm }}>
            Live listings
          </Text>
          {loading ? (
            <ActivityIndicator color={colors.accent} />
          ) : live.length === 0 ? (
            <EmptyState
              icon={Building2}
              title="No active listings"
              message={`Nothing live in ${destination.name} right now.`}
            />
          ) : (
            <FlatList
              data={live}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              contentContainerStyle={{ gap: spacing.md }}
              renderItem={({ item }) => <PropertyCard property={item} />}
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
