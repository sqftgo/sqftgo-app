import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter, type Href } from "expo-router";
import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import {
  Button,
  Chip,
  EmptyState,
  ErrorState,
  ListRow,
  ListSection,
  PropertyCardSkeleton,
  Screen,
} from "@/components/ds";
import { WeddingEnquirySheet, type WeddingItem } from "@/components/destinations/WeddingEnquirySheet";
import { Building2, MapPin, Sparkles, Store, Users } from "@/components/ui/icons";
import { PropertyCard } from "@/components/ui/property-card";
import { useApp } from "@/context/AppContext";
import { getDestinationBySlug } from "@/data/destinations";
import { weddingCatalogFor } from "@/data/wedding-venues";
import { isApiMode } from "@/lib/api/config";
import { apiListPropertiesPage } from "@/lib/api/services/properties";
import { isDealerCategory } from "@/lib/is-dealer-category";
import { colors, radius, spacing, type } from "@/theme/tokens";

function openExplore(router: ReturnType<typeof useRouter>, city: string, locality?: string) {
  const params: Record<string, string> = { city };
  if (locality) params.locality = locality;
  router.push({ pathname: "/(tabs)/explore", params } as Href);
}

export default function DestinationDetailScreen() {
  const router = useRouter();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { properties, directoryProfiles, setSelectedCity, mergeProperties } = useApp();
  const destination = useMemo(() => (slug ? getDestinationBySlug(slug) : undefined), [slug]);
  const [enquiry, setEnquiry] = useState<WeddingItem | null>(null);
  const [showWeddings, setShowWeddings] = useState(false);
  const [heroFailed, setHeroFailed] = useState(false);

  const live = useQuery({
    queryKey: ["properties", "destination", destination?.name],
    queryFn: async () => {
      const page = await apiListPropertiesPage({
        city: destination!.name,
        status: "Active",
        limit: 12,
      });
      mergeProperties(page.items);
      return page;
    },
    enabled: isApiMode && Boolean(destination),
  });

  const dealers = useMemo(
    () => {
      if (!destination) return [];
      return directoryProfiles
        .filter(
          (d) =>
            isDealerCategory(d.category) &&
            d.listingActive !== false &&
            d.city.trim().toLowerCase() === destination.name.toLowerCase(),
        )
        .slice(0, 3);
    },
    [directoryProfiles, destination],
  );

  if (!destination) {
    return (
      <Screen title="City" fallbackHref={"/destinations" as Href}>
        <EmptyState
          icon={MapPin}
          title="City not found"
          message="Pick another market from the cities list."
          actionLabel="All cities"
          onAction={() => router.replace("/destinations" as Href)}
        />
      </Screen>
    );
  }

  const listings = isApiMode
    ? (live.data?.items ?? [])
    : properties.filter(
        (p) => p.status === "Active" && p.city.trim().toLowerCase() === destination.name.toLowerCase(),
      );
  const listingTotal = isApiMode ? (live.data?.total ?? listings.length) : listings.length;

  const wedding = weddingCatalogFor(destination.name);
  const hasWeddings = wedding.venues.length > 0 || wedding.properties.length > 0;

  const browseCity = () => {
    setSelectedCity(destination.name);
    openExplore(router, destination.name);
  };

  const browseLocality = (locality: string) => {
    setSelectedCity(destination.name);
    openExplore(router, destination.name, locality);
  };

  const openDealers = () => {
    setSelectedCity(destination.name);
    router.push("/brokers" as Href);
  };

  return (
    <Screen
      title={destination.name}
      subtitle={destination.title}
      fallbackHref={"/destinations" as Href}
      footer={
        <Button
          label={
            listingTotal > 0
              ? `Browse ${listingTotal} home${listingTotal === 1 ? "" : "s"}`
              : `Browse homes in ${destination.name}`
          }
          onPress={browseCity}
          fullWidth
        />
      }
    >
      <View style={styles.heroCard}>
        {heroFailed ? (
          <View style={[styles.heroImage, styles.heroFallback]}>
            <Text style={styles.heroFallbackText}>{destination.name}</Text>
          </View>
        ) : (
          <Image
            source={{ uri: destination.image }}
            style={styles.heroImage}
            contentFit="cover"
            transition={200}
            onError={() => setHeroFailed(true)}
          />
        )}
        <View style={styles.heroBody}>
          <View style={styles.region}>
            <Text style={styles.regionText}>{destination.tag}</Text>
          </View>
          <Text style={styles.heroTitle}>{destination.name}</Text>
          <Text style={styles.heroSubtitle}>{destination.title}</Text>
          <Text style={styles.heroDesc}>{destination.desc}</Text>
          <View style={styles.heroMetaRow}>
            <Text style={styles.heroMeta}>{destination.vibe}</Text>
            {destination.averagePrice ? (
              <>
                <Text style={styles.dot}>·</Text>
                <Text style={styles.heroMeta}>{destination.averagePrice}</Text>
              </>
            ) : null}
          </View>
        </View>
      </View>

      <View style={styles.actions}>
        <Pressable
          onPress={browseCity}
          accessibilityRole="button"
          style={({ pressed }) => [styles.actionPrimary, pressed && { opacity: 0.9 }]}
        >
          <Building2 size={18} color={colors.onAccent} />
          <Text style={styles.actionPrimaryText}>Homes</Text>
        </Pressable>
        <Pressable
          onPress={openDealers}
          accessibilityRole="button"
          style={({ pressed }) => [styles.actionSecondary, pressed && { opacity: 0.9 }]}
        >
          <Store size={18} color={colors.primary} />
          <Text style={styles.actionSecondaryText}>Dealers</Text>
        </Pressable>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Homes for sale & rent</Text>
          <Text style={styles.sectionSub}>
            {isApiMode && live.isLoading
              ? "Loading…"
              : listingTotal > 0
                ? `${listingTotal} active`
                : "None live yet"}
          </Text>
        </View>

        {isApiMode && live.isLoading ? (
          <PropertyCardSkeleton />
        ) : isApiMode && live.isError ? (
          <ErrorState onRetry={() => void live.refetch()} />
        ) : listings.length === 0 ? (
          <EmptyState
            compact
            icon={Building2}
            title={`No listings in ${destination.name}`}
            message="You can still open Explore to search buy, rent and plots."
            actionLabel="Open Explore"
            onAction={browseCity}
          />
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
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Popular localities</Text>
        <Text style={styles.sectionSub}>Tap to search homes in that area</Text>
        <View style={styles.localityWrap}>
          {destination.topLocalities.map((locality) => (
            <Chip key={locality} label={locality} selected={false} onPress={() => browseLocality(locality)} />
          ))}
        </View>
      </View>

      {dealers.length > 0 ? (
        <ListSection title="Dealers here">
          {dealers.map((d) => (
            <ListRow
              key={d.id}
              icon={Store}
              title={d.firmName}
              subtitle={d.ownerName ? `Owner · ${d.ownerName}` : d.category}
              onPress={() => router.push({ pathname: "/broker/[id]", params: { id: d.id } })}
            />
          ))}
          <ListRow title="See all dealers" onPress={openDealers} />
        </ListSection>
      ) : null}

      {hasWeddings ? (
        <View style={styles.section}>
          {!showWeddings ? (
            <ListSection>
              <ListRow
                icon={Sparkles}
                title="Wedding venues"
                subtitle="Indicative enquiries — not SqftGo listings"
                onPress={() => setShowWeddings(true)}
              />
            </ListSection>
          ) : (
            <>
              <View style={styles.sectionHead}>
                <Text style={styles.sectionTitle}>Wedding venues</Text>
                <Pressable onPress={() => setShowWeddings(false)} hitSlop={8} accessibilityRole="button">
                  <Text style={styles.link}>Hide</Text>
                </Pressable>
              </View>
              {wedding.venues.length > 0 ? (
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
                      style={({ pressed }) => [styles.venue, pressed && { opacity: 0.88 }]}
                    >
                      {v.image ? (
                        <Image source={{ uri: v.image }} style={styles.venueImage} contentFit="cover" />
                      ) : null}
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
                        <Text style={styles.link}>Send enquiry</Text>
                      </View>
                    </Pressable>
                  ))}
                </ScrollView>
              ) : null}
              {wedding.properties.length > 0 ? (
                <ListSection title="Wedding estates" footer="Enquiry only — not live listings.">
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
            </>
          )}
        </View>
      ) : null}

      <WeddingEnquirySheet target={enquiry} destination={destination.name} onClose={() => setEnquiry(null)} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderCurve: "continuous",
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  heroImage: { width: "100%", height: 168, backgroundColor: colors.primary },
  heroFallback: { alignItems: "center", justifyContent: "center" },
  heroFallbackText: { ...type.title, color: colors.onPrimary },
  heroBody: { padding: spacing.lg, gap: 4 },
  region: {
    alignSelf: "flex-start",
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.sm,
    borderCurve: "continuous",
    backgroundColor: colors.primarySoft,
    marginBottom: spacing.xs,
  },
  regionText: {
    ...type.micro,
    color: colors.primary,
    fontFamily: "Inter_600SemiBold",
    fontWeight: "600",
  },
  heroTitle: { ...type.title, color: colors.ink },
  heroSubtitle: { ...type.label, color: colors.inkMuted },
  heroDesc: { ...type.body, color: colors.inkSecondary, marginTop: spacing.xs },
  heroMetaRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: spacing.sm, flexWrap: "wrap" },
  heroMeta: { ...type.caption, color: colors.inkMuted },
  dot: { ...type.caption, color: colors.inkMuted },
  actions: { flexDirection: "row", gap: spacing.sm },
  actionPrimary: {
    flex: 1,
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    borderRadius: radius.md,
    borderCurve: "continuous",
    backgroundColor: colors.accent,
  },
  actionPrimaryText: {
    ...type.emphasis,
    color: colors.onAccent,
  },
  actionSecondary: {
    flex: 1,
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    borderRadius: radius.md,
    borderCurve: "continuous",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  actionSecondaryText: {
    ...type.emphasis,
    color: colors.ink,
  },
  section: { gap: spacing.sm },
  sectionHead: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  sectionTitle: { ...type.heading, color: colors.ink },
  sectionSub: { ...type.caption, color: colors.inkMuted },
  localityWrap: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.xs },
  rail: { marginHorizontal: -spacing.lg },
  railContent: { paddingHorizontal: spacing.lg, gap: spacing.md },
  venue: {
    width: 220,
    borderRadius: radius.lg,
    borderCurve: "continuous",
    overflow: "hidden",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  venueImage: { width: "100%", height: 110 },
  venueBody: { padding: spacing.md, gap: 2 },
  venueType: { ...type.caption, color: colors.accent },
  venueName: { ...type.emphasis, color: colors.ink },
  metaRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs, marginTop: 2 },
  meta: { ...type.caption, color: colors.inkMuted, flex: 1 },
  link: { ...type.label, color: colors.accent, marginTop: spacing.xs },
});
