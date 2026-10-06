import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter, type Href } from "expo-router";
import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { Button, EmptyState, ErrorState, ListRow, ListSection, PropertyCardSkeleton, Screen } from "@/components/ds";
import { WeddingEnquirySheet, type WeddingItem } from "@/components/destinations/WeddingEnquirySheet";
import { Building2, MapPin, Sparkles, Users } from "@/components/ui/icons";
import { PropertyCard } from "@/components/ui/property-card";
import { useApp } from "@/context/AppContext";
import { getDestinationBySlug } from "@/data/destinations";
import { weddingCatalogFor } from "@/data/wedding-venues";
import { isApiMode } from "@/lib/api/config";
import { apiListProperties } from "@/lib/api/services/properties";
import { colors, radius, spacing, type } from "@/theme/tokens";

export default function DestinationDetailScreen() {
  const router = useRouter();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { properties, setSelectedCity, mergeProperties } = useApp();
  const destination = useMemo(() => (slug ? getDestinationBySlug(slug) : undefined), [slug]);
  const [enquiry, setEnquiry] = useState<WeddingItem | null>(null);
  const [aboutOpen, setAboutOpen] = useState(false);

  const live = useQuery({
    queryKey: ["properties", "destination", destination?.name],
    queryFn: async () => {
      const items = await apiListProperties({ city: destination!.name, status: "Active", limit: 20 });
      mergeProperties(items);
      return items;
    },
    enabled: isApiMode && Boolean(destination),
  });

  if (!destination) {
    return (
      <Screen title="Destination" fallbackHref={"/destinations" as Href}>
        <EmptyState
          icon={MapPin}
          title="Destination not found"
          message="Pick another city from the destinations list."
          actionLabel="All destinations"
          onAction={() => router.replace("/destinations" as Href)}
        />
      </Screen>
    );
  }

  const listings = isApiMode
    ? (live.data ?? [])
    : properties.filter(
        (p) => p.status === "Active" && p.city.trim().toLowerCase() === destination.name.toLowerCase(),
      );
  const wedding = weddingCatalogFor(destination.name);

  const exploreCity = () => {
    setSelectedCity(destination.name);
    router.push({ pathname: "/(tabs)/explore", params: { city: destination.name } } as Href);
  };

  return (
    <Screen title={destination.name} subtitle={destination.title} fallbackHref={"/destinations" as Href}>
      <Image source={{ uri: destination.image }} style={styles.hero} contentFit="cover" transition={200} />
      <View style={{ gap: spacing.xs }}>
        <Text style={styles.body} numberOfLines={aboutOpen ? undefined : 3}>
          {destination.desc}
        </Text>
        {destination.desc.length > 160 ? (
          <Pressable onPress={() => setAboutOpen((v) => !v)} hitSlop={8} accessibilityRole="button">
            <Text style={styles.link}>{aboutOpen ? "Show less" : "Read more"}</Text>
          </Pressable>
        ) : null}
      </View>

      <ListSection title="Market snapshot">
        <ListRow title="Vibe" value={destination.vibe} />
        <ListRow title="Investment index" value={destination.investmentIndex} />
        <ListRow title="Typical prices" value={destination.averagePrice} />
        <ListRow title="Top localities" subtitle={destination.topLocalities.join(", ")} />
      </ListSection>

      {wedding.venues.length > 0 ? (
        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <Sparkles size={18} color={colors.accent} />
            <Text style={styles.sectionTitle}>Wedding venues</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.rail}
            contentContainerStyle={styles.railContent}
          >
            {wedding.venues.map((v) => (
              <Pressable
                key={v.id}
                onPress={() => setEnquiry({ kind: "venue", item: v })}
                accessibilityRole="button"
                accessibilityLabel={`${v.name}, ${v.type}. Send enquiry`}
                style={({ pressed }) => [styles.venue, pressed && styles.pressed]}
              >
                {v.image ? <Image source={{ uri: v.image }} style={styles.venueImage} contentFit="cover" /> : null}
                <View style={styles.venueBody}>
                  <Text style={styles.venueType}>{v.type}</Text>
                  <Text style={styles.venueName} numberOfLines={1}>
                    {v.name}
                  </Text>
                  <View style={styles.metaRow}>
                    <Users size={13} color={colors.inkMuted} />
                    <Text style={styles.meta} numberOfLines={1}>
                      {v.capacity}
                    </Text>
                  </View>
                  <Text style={styles.price}>{v.pricePerEvent}</Text>
                  <Text style={styles.link}>Send enquiry</Text>
                </View>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      ) : null}

      {wedding.properties.length > 0 ? (
        <ListSection title="Unique wedding properties">
          {wedding.properties.map((p) => (
            <ListRow
              key={p.id}
              title={p.title}
              subtitle={`${p.propertyType} · ${p.location}`}
              value={p.price}
              onPress={() => setEnquiry({ kind: "property", item: p })}
            />
          ))}
        </ListSection>
      ) : null}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Homes for sale and rent</Text>
        {isApiMode && live.isLoading ? (
          <PropertyCardSkeleton />
        ) : isApiMode && live.isError ? (
          <ErrorState onRetry={() => void live.refetch()} />
        ) : listings.length === 0 ? (
          <EmptyState icon={Building2} title="No live listings yet" message={`Nothing is listed in ${destination.name} right now.`} />
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.rail}
            contentContainerStyle={styles.railContent}
          >
            {listings.slice(0, 10).map((p) => (
              <PropertyCard key={p.id} property={p} variant="compact" />
            ))}
          </ScrollView>
        )}
        <Button label={`Explore all homes in ${destination.name}`} variant="secondary" onPress={exploreCity} />
      </View>

      <WeddingEnquirySheet target={enquiry} destination={destination.name} onClose={() => setEnquiry(null)} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { width: "100%", height: 200, borderRadius: radius.lg },
  body: { ...type.body, color: colors.inkSecondary },
  section: { gap: spacing.md },
  sectionHead: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  sectionTitle: { ...type.heading, color: colors.ink },
  rail: { marginHorizontal: -spacing.lg },
  railContent: { paddingHorizontal: spacing.lg, gap: spacing.md },
  venue: {
    width: 240,
    borderRadius: radius.lg,
    overflow: "hidden",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pressed: { opacity: 0.85 },
  venueImage: { width: "100%", height: 130 },
  venueBody: { padding: spacing.md, gap: spacing.xxs },
  venueType: { ...type.caption, color: colors.accent },
  venueName: { ...type.emphasis, color: colors.ink },
  metaRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  meta: { ...type.caption, color: colors.inkMuted, flex: 1 },
  price: { ...type.label, color: colors.ink, marginTop: spacing.xs },
  link: { ...type.label, color: colors.accent, marginTop: spacing.xs },
});
