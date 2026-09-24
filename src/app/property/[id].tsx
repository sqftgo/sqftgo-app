import React, { useState } from "react";
import { Linking, Pressable, Share, StyleSheet, Text, TextInput, View } from "react-native";
import { useLocalSearchParams, useRouter, Stack, type Href } from "expo-router";
import Animated, { useAnimatedScrollHandler, useSharedValue } from "react-native-reanimated";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { AgentRow } from "@/components/property/AgentRow";
import { CostEmiSection } from "@/components/property/CostEmiSection";
import { formatIndianCurrency, isRentalPurpose } from "@/components/property/format";
import { KeyFacts } from "@/components/property/KeyFacts";
import { LocationSection } from "@/components/property/LocationSection";
import { OverviewList } from "@/components/property/OverviewList";
import { PropertyGallery, SHEET_OVERLAP } from "@/components/property/PropertyGallery";
import { PropertySection } from "@/components/property/PropertySection";
import { PropertySummary } from "@/components/property/PropertySummary";
import { PropertyTopBar } from "@/components/property/PropertyTopBar";
import { ReraSection } from "@/components/property/ReraSection";
import { ReviewsSection } from "@/components/property/ReviewsSection";
import { StickyCta } from "@/components/property/StickyCta";
import { appAlert } from "@/components/ui/app-alert";
import { Bath, Bed, Compass, Maximize2 } from "@/components/ui/icons";
import { ModalSheet, ModalSheetHeader } from "@/components/ui/modal-sheet";
import { useApp } from "@/context/AppContext";
import { colors, radius, spacing, type } from "@/theme/tokens";

const FALLBACK_GALLERY = [
  "https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80",
];

const FOOTER_HEIGHT = 76;

export default function PropertyDetailsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const {
    properties,
    favorites,
    toggleFavorite,
    directoryProfiles,
    submitInquiry,
    bookVisit,
    userRole,
    userEmail,
    userName,
    profile,
  } = useApp();

  const property = properties.find((p) => p.id === id);

  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((e) => {
    scrollY.value = e.contentOffset.y;
  });

  const [isDescExpanded, setIsDescExpanded] = useState(false);
  const [showInquiry, setShowInquiry] = useState(false);
  const [showVisit, setShowVisit] = useState(false);
  const [inquiryName, setInquiryName] = useState(userName || "");
  const [inquiryMessage, setInquiryMessage] = useState("");
  const [inquiryPhone, setInquiryPhone] = useState(profile?.phone ?? "");
  const [visitDate, setVisitDate] = useState("");
  const [visitTime, setVisitTime] = useState("11:00 AM");
  const [visitPhone, setVisitPhone] = useState(profile?.phone ?? "");

  if (!property) {
    return (
      <SafeAreaView style={styles.errorArea}>
        <Stack.Screen options={{ headerShown: false }} />
        <Text style={styles.errorText}>Property not found.</Text>
        <Pressable onPress={() => router.back()} style={styles.errorBackBtn}>
          <Text style={styles.errorBackBtnText}>Go Back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const isFav = favorites.includes(property.id);
  const rental = isRentalPurpose(property.purpose);

  // Combine property images with fallback gallery to ensure at least 4 pictures
  const galleryImages = [...property.images];
  while (galleryImages.length < 4) {
    galleryImages.push(FALLBACK_GALLERY[galleryImages.length % FALLBACK_GALLERY.length]);
  }

  const handleCall = () => {
    Linking.openURL(`tel:${property.ownerPhone}`).catch(() => {
      appAlert("Error", "Unable to open phone dialer.");
    });
  };

  const handleWhatsApp = () => {
    const message = `Namaste, I'm interested in your property: "${property.title}" in ${property.locality}, ${property.city}.`;
    Linking.openURL(`whatsapp://send?phone=${property.ownerPhone}&text=${encodeURIComponent(message)}`).catch(() => {
      Linking.openURL(`https://wa.me/${property.ownerPhone}?text=${encodeURIComponent(message)}`).catch(() => {
        appAlert("Error", "Unable to open WhatsApp.");
      });
    });
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out this property: "${property.title}" in ${property.locality}, ${property.city} for ${formatIndianCurrency(property.price)} ${
          rental ? "/ month" : ""
        }`,
      });
    } catch (error) {
      console.log("Error sharing:", error);
    }
  };

  const handleRentOrBuy = () => {
    appAlert(
      rental ? "Rent Property" : "Buy Property",
      `Would you like to connect with ${property.ownerName} regarding "${property.title}"?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Contact Owner", onPress: handleWhatsApp },
      ],
    );
  };

  const handleSubmitInquiry = async () => {
    if (!inquiryName.trim()) {
      appAlert("Name required", "Enter your name for the inquiry.");
      return;
    }
    if (!inquiryMessage.trim()) {
      appAlert("Message required", "Tell the dealer what you are looking for.");
      return;
    }
    const created = await submitInquiry({
      propertyId: property.id,
      name: inquiryName.trim(),
      email: userEmail,
      phone: inquiryPhone.trim() || undefined,
      message: inquiryMessage,
    });
    if (!created) {
      appAlert("Error", "Could not submit inquiry. Listing must be Active.");
      return;
    }
    setShowInquiry(false);
    setInquiryMessage("");
    appAlert("Inquiry sent", "The dealer will see this in their leads inbox.", [
      { text: "View my inquiries", onPress: () => router.push("/my-inquiries" as Href) },
      { text: "OK" },
    ]);
  };

  const handleBookVisit = async () => {
    if (!visitDate.trim()) {
      appAlert("Date required", "Enter a visit date (YYYY-MM-DD).");
      return;
    }
    const created = await bookVisit({
      propertyId: property.id,
      visitDate: visitDate.trim(),
      visitTime: visitTime.trim() || "11:00 AM",
      phone: visitPhone.trim() || undefined,
    });
    if (!created) {
      appAlert("Error", "Could not book visit. Sign in as a buyer on an Active listing.");
      return;
    }
    setShowVisit(false);
    appAlert("Visit requested", "Status: Pending Approval. The dealer will confirm.", [
      { text: "My visits", onPress: () => router.push("/my-visits" as Href) },
      { text: "OK" },
    ]);
  };

  const matchedBroker = directoryProfiles.find(
    (p) => p.ownerName.toLowerCase() === property.ownerName.toLowerCase(),
  );
  const openBrokerProfile = () =>
    router.push({
      pathname: "/broker/[id]",
      params: { id: matchedBroker?.id || property.ownerName },
    });
  const agentAvatar =
    matchedBroker?.avatarUrl ||
    (matchedBroker?.id === "dir-dealer-1"
      ? "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=150&h=150&q=80"
      : matchedBroker?.id === "dir-dealer-2"
        ? "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80"
        : matchedBroker?.id === "dir-dealer-3"
          ? "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80"
          : "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&h=150&q=80");

  // Listing specs, with derived fallbacks for older listings missing a field
  const idSeed = parseInt(property.id.replace(/\D/g, ""), 10) || 0;
  const bhkLabel = property.bhk ? `${property.bhk} BHK` : "3 BHK";
  const bathrooms = property.bathrooms ?? (property.bhk ? Math.max(1, property.bhk - 1) : 2);
  const buildYear = property.yearBuilt ?? 2018 + (idSeed % 7);
  const facing = ["East", "North-East", "North", "West"][idSeed % 4];
  const vaastuScore = ["95% Vaastu Compliant", "100% Vaastu Compliant", "Yes (Vaastu Clear)", "North Entrance (Vaastu Approved)"][idSeed % 4];
  const waterSupply = property.type === "Villa" || property.type === "Home" ? "24/7 Corp + Borewell" : "24/7 Corporation Water";
  const parkingInfo = property.parking
    ? `${property.parking} Covered`
    : property.amenities.includes("Parking")
      ? "1 Covered Parking"
      : "Open Parking Space";

  const priceLabel = formatIndianCurrency(property.price);
  const canBook = userRole === "user" && property.status === "Active";

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <Stack.Screen options={{ headerShown: false }} />

      <Animated.ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: FOOTER_HEIGHT + insets.bottom + spacing.lg }}
      >
        <PropertyGallery images={galleryImages} />

        <View style={styles.sheet}>
          <PropertySummary property={property} />

          <KeyFacts
            facts={[
              { icon: Bed, value: bhkLabel, label: "Config" },
              { icon: Bath, value: String(bathrooms), label: "Baths" },
              { icon: Maximize2, value: property.size.toLocaleString("en-IN"), label: "Sq.ft" },
              { icon: Compass, value: facing, label: "Facing" },
            ]}
          />

          <AgentRow
            name={property.ownerName}
            firm={matchedBroker ? matchedBroker.firmName : "Real Estate Consultant"}
            meta={`${matchedBroker?.experience || "8+ Years Experience"} · ★ ${matchedBroker?.rating || "4.9"} (${matchedBroker?.reviewsCount || "128"})`}
            avatarUrl={agentAvatar}
            onPress={openBrokerProfile}
            onCall={handleCall}
            onChat={handleWhatsApp}
          />

          <PropertySection title="Overview">
            <OverviewList
              items={[
                { label: "Property type", value: property.type },
                { label: "Status", value: rental ? "For Rent" : "For Sale" },
                { label: "Furnishing", value: property.furnished },
                { label: "Build year", value: String(buildYear) },
                { label: "Parking", value: parkingInfo },
                { label: "Water supply", value: waterSupply },
                { label: "Facing", value: `${facing} Facing` },
                { label: "Vaastu", value: vaastuScore },
              ]}
            />
          </PropertySection>

          <PropertySection title="About this property">
            <Text
              style={{ ...type.body, lineHeight: 22, color: colors.inkSecondary }}
              numberOfLines={isDescExpanded ? undefined : 4}
            >
              {property.description}
            </Text>
            <Pressable onPress={() => setIsDescExpanded(!isDescExpanded)} hitSlop={8}>
              <Text style={{ ...type.label, fontWeight: "600", color: colors.accent }}>
                {isDescExpanded ? "Show less" : "Read more"}
              </Text>
            </Pressable>
          </PropertySection>

          <LocationSection property={property} />

          <CostEmiSection property={property} />

          {property.reraId ? <ReraSection reraId={property.reraId} /> : null}

          <ReviewsSection />
        </View>
      </Animated.ScrollView>

      <PropertyTopBar
        scrollY={scrollY}
        title={property.title}
        isFavorite={isFav}
        onBack={() => router.back()}
        onShare={handleShare}
        onToggleFavorite={() => toggleFavorite(property.id)}
      />

      {canBook ? (
        <StickyCta
          price={priceLabel}
          period={rental ? "per month" : undefined}
          primaryLabel="Book visit"
          onPrimary={() => setShowVisit(true)}
          secondaryLabel="Inquire"
          onSecondary={() => setShowInquiry(true)}
        />
      ) : (
        <StickyCta
          price={priceLabel}
          period={rental ? "per month" : undefined}
          primaryLabel={rental ? "Rent now" : "Buy now"}
          onPrimary={handleRentOrBuy}
        />
      )}

      <ModalSheet
        visible={showInquiry}
        onClose={() => setShowInquiry(false)}
        avoidKeyboard
        maxHeight="85%"
      >
        <ModalSheetHeader
          title="Submit inquiry"
          onClose={() => setShowInquiry(false)}
        />
        <View style={styles.inquirySheet}>
          <Text style={styles.inquiryHint} numberOfLines={2}>
            {property.title}
          </Text>
          <Text style={styles.inquiryLabel}>Name *</Text>
          <TextInput
            value={inquiryName}
            onChangeText={setInquiryName}
            placeholder="Your name"
            placeholderTextColor={colors.placeholder}
            style={styles.inquiryPhoneInput}
          />
          <Text style={styles.inquiryLabel}>Email (stable for this account)</Text>
          <TextInput
            value={userEmail}
            editable={false}
            style={[styles.inquiryPhoneInput, { opacity: 0.7 }]}
          />
          <Text style={styles.inquiryLabel}>Message *</Text>
          <TextInput
            value={inquiryMessage}
            onChangeText={setInquiryMessage}
            placeholder="I am interested in a site visit this weekend..."
            placeholderTextColor={colors.placeholder}
            multiline
            style={styles.inquiryInput}
          />
          <Text style={styles.inquiryLabel}>Phone (optional)</Text>
          <TextInput
            value={inquiryPhone}
            onChangeText={setInquiryPhone}
            placeholder="+91 ..."
            placeholderTextColor={colors.placeholder}
            keyboardType="phone-pad"
            style={styles.inquiryPhoneInput}
          />
          <Pressable onPress={handleSubmitInquiry} style={styles.inquirySubmit}>
            <Text style={styles.submitText}>Send to dealer</Text>
          </Pressable>
        </View>
      </ModalSheet>

      <ModalSheet
        visible={showVisit}
        onClose={() => setShowVisit(false)}
        avoidKeyboard
        maxHeight="85%"
      >
        <ModalSheetHeader
          title="Book site visit"
          onClose={() => setShowVisit(false)}
        />
        <View style={styles.inquirySheet}>
          <Text style={styles.inquiryHint} numberOfLines={2}>
            {property.title}
          </Text>
          <Text style={styles.inquiryLabel}>Date * (YYYY-MM-DD)</Text>
          <TextInput
            value={visitDate}
            onChangeText={setVisitDate}
            placeholder="2026-08-01"
            placeholderTextColor={colors.placeholder}
            style={styles.inquiryPhoneInput}
          />
          <Text style={styles.inquiryLabel}>Time *</Text>
          <TextInput
            value={visitTime}
            onChangeText={setVisitTime}
            placeholder="11:00 AM"
            placeholderTextColor={colors.placeholder}
            style={styles.inquiryPhoneInput}
          />
          <Text style={styles.inquiryLabel}>Phone</Text>
          <TextInput
            value={visitPhone}
            onChangeText={setVisitPhone}
            placeholder="+91 ..."
            placeholderTextColor={colors.placeholder}
            keyboardType="phone-pad"
            style={styles.inquiryPhoneInput}
          />
          <Pressable onPress={handleBookVisit} style={styles.inquirySubmit}>
            <Text style={styles.submitText}>Request visit</Text>
          </Pressable>
        </View>
      </ModalSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  errorArea: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.bg,
  },
  errorText: {
    ...type.heading,
    color: colors.inkMuted,
  },
  errorBackBtn: {
    marginTop: spacing.lg,
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.sm,
  },
  errorBackBtnText: {
    ...type.emphasis,
    color: colors.onAccent,
  },
  sheet: {
    marginTop: -SHEET_OVERLAP,
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl + 4,
    borderTopRightRadius: radius.xl + 4,
    borderCurve: "continuous",
  },
  inquirySheet: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
    gap: spacing.sm + 2,
  },
  inquiryHint: {
    ...type.caption,
    fontWeight: "600",
    color: colors.inkMuted,
  },
  inquiryLabel: {
    ...type.micro,
    fontWeight: "700",
    color: colors.inkSecondary,
    textTransform: "uppercase",
    marginTop: spacing.xs,
  },
  inquiryInput: {
    ...type.body,
    fontWeight: "500",
    minHeight: 90,
    textAlignVertical: "top",
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    color: colors.ink,
  },
  inquiryPhoneInput: {
    ...type.body,
    fontWeight: "500",
    height: 44,
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    color: colors.ink,
  },
  inquirySubmit: {
    backgroundColor: colors.accent,
    height: 48,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.xs + 2,
  },
  submitText: {
    ...type.emphasis,
    fontSize: 16,
    color: colors.onAccent,
  },
});
