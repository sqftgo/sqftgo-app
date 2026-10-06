import { useQuery } from "@tanstack/react-query";
import * as WebBrowser from "expo-web-browser";
import { Stack, useLocalSearchParams, useRouter, type Href } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, Share, StyleSheet, Text, View } from "react-native";
import Animated, { useAnimatedScrollHandler, useSharedValue } from "react-native-reanimated";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { Button, ErrorState, Sheet, SheetHeader, Skeleton, useRequireAuth } from "@/components/ds";
import { AgentRow } from "@/components/property/AgentRow";
import { callOwner, ContactSheet, whatsappOwner } from "@/components/property/ContactSheet";
import { CostEmiSection } from "@/components/property/CostEmiSection";
import { formatIndianCurrency, isRentalPurpose } from "@/components/property/format";
import { KeyFacts, type KeyFact } from "@/components/property/KeyFacts";
import { LocationSection } from "@/components/property/LocationSection";
import { OverviewList } from "@/components/property/OverviewList";
import { GALLERY_HEIGHT, PropertyGallery, SHEET_OVERLAP } from "@/components/property/PropertyGallery";
import { PropertySection } from "@/components/property/PropertySection";
import { PropertySummary } from "@/components/property/PropertySummary";
import { PropertyTopBar } from "@/components/property/PropertyTopBar";
import { ReraSection } from "@/components/property/ReraSection";
import { StickyCta } from "@/components/property/StickyCta";
import { VisitSheet } from "@/components/property/VisitSheet";
import { CheckCircle2, ChevronLeft, Bath, Bed, Maximize2, Sparkles, Eye } from "@/components/ui/icons";
import { PropertyCard } from "@/components/ui/property-card";
import { useApp } from "@/context/AppContext";
import { apiGetProperty } from "@/lib/api/services/properties";
import { ownsProperty } from "@/lib/ownership";
import { colors, radius, spacing, type } from "@/theme/tokens";

const FOOTER_HEIGHT = 76;
const AMENITY_PREVIEW = 6;

function DetailSkeleton() {
  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <Skeleton height={GALLERY_HEIGHT} rounded={0} />
      <View style={{ padding: spacing.xl, gap: spacing.md }}>
        <Skeleton width={120} height={22} />
        <Skeleton width="70%" height={30} />
        <Skeleton width="90%" height={20} />
        <Skeleton height={72} style={{ marginTop: spacing.md }} />
        <Skeleton height={140} />
      </View>
    </View>
  );
}

export default function PropertyDetailsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const requireAuth = useRequireAuth();
  const {
    properties,
    favorites,
    toggleFavorite,
    directoryProfiles,
    mergeProperties,
    profile,
    userEmail,
    isApiMode,
  } = useApp();

  const local = properties.find((p) => p.id === id);
  const remote = useQuery({
    queryKey: ["property", id],
    queryFn: () => apiGetProperty(id),
    enabled: isApiMode && Boolean(id),
  });

  useEffect(() => {
    if (remote.data) mergeProperties([remote.data]);
  }, [remote.data, mergeProperties]);

  const property = local ?? remote.data;

  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((e) => {
    scrollY.value = e.contentOffset.y;
  });

  const [descExpanded, setDescExpanded] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [visitOpen, setVisitOpen] = useState(false);
  const [amenitiesOpen, setAmenitiesOpen] = useState(false);

  const similar = useMemo(() => {
    if (!property) return [];
    return properties
      .filter(
        (p) =>
          p.id !== property.id &&
          p.status === "Active" &&
          p.city === property.city &&
          (p.type === property.type || p.purpose === property.purpose),
      )
      .slice(0, 8);
  }, [properties, property]);

  const back = () => (router.canGoBack() ? router.back() : router.replace("/" as Href));

  if (!property) {
    if (isApiMode && remote.isLoading) {
      return (
        <>
          <Stack.Screen options={{ headerShown: false }} />
          <DetailSkeleton />
        </>
      );
    }
    const notFound = remote.error && "status" in (remote.error as object) && (remote.error as { status?: number }).status === 404;
    return (
      <SafeAreaView style={styles.fallback}>
        <Stack.Screen options={{ headerShown: false }} />
        <Pressable onPress={back} hitSlop={10} accessibilityRole="button" accessibilityLabel="Go back" style={styles.fallbackBack}>
          <ChevronLeft size={22} color={colors.ink} />
        </Pressable>
        <ErrorState
          title={notFound || !isApiMode ? "Listing not available" : "Couldn't load listing"}
          message={
            notFound || !isApiMode
              ? "This property may have been sold, rented out or removed."
              : "Check your connection and try again."
          }
          onRetry={notFound || !isApiMode ? undefined : () => void remote.refetch()}
        />
        <Button label="Browse homes" variant="tertiary" onPress={() => router.replace("/(tabs)/explore" as Href)} />
      </SafeAreaView>
    );
  }

  const rental = isRentalPurpose(property.purpose);
  const isFav = favorites.includes(property.id);
  const isOwner = ownsProperty(property, { userId: profile?.id, email: userEmail });
  const isActive = property.status === "Active";
  const hasPhone = Boolean(property.ownerPhone?.trim());

  const broker =
    directoryProfiles.find(
      (d) =>
        (property.brokerId && (d.userId === property.brokerId || d.id === property.brokerId)) ||
        (property.ownerId && d.userId === property.ownerId),
    ) ?? undefined;

  const facts: KeyFact[] = [
    property.bhk ? { icon: Bed, value: `${property.bhk} BHK`, label: "Config" } : null,
    property.bathrooms ? { icon: Bath, value: String(property.bathrooms), label: "Baths" } : null,
    property.size ? { icon: Maximize2, value: property.size.toLocaleString("en-IN"), label: "Sq.ft" } : null,
    property.furnished ? { icon: Sparkles, value: property.furnished, label: "Furnishing" } : null,
  ].filter((f): f is KeyFact => f !== null);

  const overview = [
    { label: "Property type", value: property.type },
    { label: "Listed for", value: rental ? (property.purpose === "lease" ? "Lease" : "Rent") : "Sale" },
    property.furnished ? { label: "Furnishing", value: property.furnished } : null,
    property.yearBuilt ? { label: "Built in", value: String(property.yearBuilt) } : null,
    property.parking ? { label: "Parking", value: `${property.parking} covered` } : null,
  ].filter((x): x is { label: string; value: string } => x !== null);

  const share = async () => {
    try {
      await Share.share({
        message: `${property.title} in ${property.locality}, ${property.city} — ${formatIndianCurrency(property.price)}${rental ? " / month" : ""}`,
      });
    } catch {
      // user dismissed
    }
  };

  const toggleSave = () => {
    if (requireAuth("Sign in to save homes and see them on all your devices.")) toggleFavorite(property.id);
  };

  const priceLabel = formatIndianCurrency(property.price);
  const period = rental ? "per month" : undefined;

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <Stack.Screen options={{ headerShown: false }} />

      <Animated.ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: FOOTER_HEIGHT + insets.bottom + spacing.lg }}
      >
        <PropertyGallery images={property.images} />

        <View style={styles.sheet}>
          {!isActive ? (
            <View style={styles.statusBanner}>
              <Text style={styles.statusText}>
                {isOwner
                  ? `This listing is ${property.status.toLowerCase()} and not visible to buyers.`
                  : "This listing isn't accepting inquiries right now."}
              </Text>
            </View>
          ) : null}

          <PropertySummary property={property} />

          {facts.length > 0 ? <KeyFacts facts={facts} /> : null}

          <AgentRow
            name={broker?.ownerName || property.ownerName}
            firm={broker?.firmName}
            meta={broker?.experience ? `${broker.experience} experience` : undefined}
            avatarUrl={broker?.avatarUrl}
            onPress={broker ? () => router.push({ pathname: "/broker/[id]", params: { id: broker.id } }) : undefined}
            onCall={hasPhone && !isOwner ? () => callOwner(property.ownerPhone) : undefined}
            onChat={hasPhone && !isOwner ? () => whatsappOwner(property.ownerPhone, property) : undefined}
          />

          <PropertySection title="Overview">
            <OverviewList items={overview} />
          </PropertySection>

          {property.description ? (
            <PropertySection title="About this property">
              <Text style={styles.desc} numberOfLines={descExpanded ? undefined : 3} selectable>
                {property.description}
              </Text>
              {property.description.length > 140 ? (
                <Pressable onPress={() => setDescExpanded((v) => !v)} hitSlop={8} accessibilityRole="button">
                  <Text style={styles.link}>{descExpanded ? "Show less" : "Read more"}</Text>
                </Pressable>
              ) : null}
            </PropertySection>
          ) : null}

          {property.amenities.length > 0 ? (
            <PropertySection title="Amenities">
              <AmenityGrid items={property.amenities.slice(0, AMENITY_PREVIEW)} />
              {property.amenities.length > AMENITY_PREVIEW ? (
                <Pressable onPress={() => setAmenitiesOpen(true)} hitSlop={8} accessibilityRole="button">
                  <Text style={styles.link}>See all {property.amenities.length} amenities</Text>
                </Pressable>
              ) : null}
            </PropertySection>
          ) : null}

          {property.videoUrl ? (
            <PropertySection title="Video tour">
              <Button
                label="Watch video tour"
                icon={Eye}
                variant="secondary"
                onPress={() => void WebBrowser.openBrowserAsync(property.videoUrl!)}
                fullWidth
              />
            </PropertySection>
          ) : null}

          <LocationSection property={property} />

          <CostEmiSection property={property} />

          <ReraSection
            reraId={property.reraApproved || property.reraId ? property.reraId : undefined}
            checks={property.verificationChecks}
            verifiedDate={property.verifiedDate}
          />
        </View>

        {similar.length > 0 ? (
          <View style={{ gap: spacing.md, paddingTop: spacing.md }}>
            <Text style={[styles.sectionTitle, { paddingHorizontal: spacing.xl }]}>Similar in {property.city}</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: spacing.md, paddingHorizontal: spacing.xl }}
            >
              {similar.map((p) => (
                <PropertyCard key={p.id} property={p} variant="compact" />
              ))}
            </ScrollView>
          </View>
        ) : null}
      </Animated.ScrollView>

      <PropertyTopBar
        scrollY={scrollY}
        title={property.title}
        isFavorite={isFav}
        onBack={back}
        onShare={share}
        onToggleFavorite={toggleSave}
      />

      {isOwner ? (
        <StickyCta
          price={priceLabel}
          period={period}
          primaryLabel="Edit listing"
          onPrimary={() => router.push({ pathname: "/edit-property/[id]", params: { id: property.id } })}
        />
      ) : isActive ? (
        <StickyCta
          price={priceLabel}
          period={period}
          primaryLabel="Book visit"
          onPrimary={() => setVisitOpen(true)}
          secondaryLabel="Contact"
          onSecondary={() => setContactOpen(true)}
        />
      ) : null}

      <ContactSheet
        property={property}
        visible={contactOpen}
        onClose={() => setContactOpen(false)}
        onViewInquiries={() => router.push("/my-inquiries" as Href)}
      />
      <VisitSheet
        property={property}
        visible={visitOpen}
        onClose={() => setVisitOpen(false)}
        onViewVisits={() => router.push("/my-visits" as Href)}
      />
      <Sheet visible={amenitiesOpen} onClose={() => setAmenitiesOpen(false)}>
        <SheetHeader title="Amenities" subtitle={`${property.amenities.length} listed`} onClose={() => setAmenitiesOpen(false)} />
        <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.xl, paddingBottom: spacing.xl }}>
          <AmenityGrid items={property.amenities} />
        </ScrollView>
      </Sheet>
    </View>
  );
}

function AmenityGrid({ items }: { items: string[] }) {
  return (
    <View style={styles.amenities}>
      {items.map((a) => (
        <View key={a} style={styles.amenity}>
          <CheckCircle2 size={16} color={colors.success} />
          <Text style={styles.amenityText}>{a}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: { flex: 1, backgroundColor: colors.bg, justifyContent: "center", alignItems: "center", gap: spacing.md },
  fallbackBack: { position: "absolute", top: spacing["4xl"], left: spacing.lg, padding: spacing.sm },
  sheet: {
    marginTop: -SHEET_OVERLAP,
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl + 4,
    borderTopRightRadius: radius.xl + 4,
    borderCurve: "continuous",
  },
  statusBanner: {
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderRadius: radius.md,
    borderCurve: "continuous",
    backgroundColor: colors.warningSoft,
    borderWidth: 1,
    borderColor: colors.warningBorder,
  },
  statusText: { ...type.label, color: colors.ink },
  desc: { ...type.body, color: colors.inkSecondary },
  link: { ...type.label, fontFamily: "Inter_600SemiBold", fontWeight: "600", color: colors.accent },
  amenities: { flexDirection: "row", flexWrap: "wrap", rowGap: spacing.md },
  amenity: { width: "50%", flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingRight: spacing.sm },
  amenityText: { ...type.body, color: colors.ink, flexShrink: 1 },
  sectionTitle: { ...type.heading, color: colors.ink },
});
