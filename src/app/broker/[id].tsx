import React, { useMemo, useState } from "react";
import {
  Dimensions,
  FlatList,
  Linking,
  Pressable,
  ScrollView,
  Share,
  Text,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";

import {
  Building,
  Building2,
  Calendar,
  CheckCircle,
  ChevronLeft,
  Compass,
  DocStar,
  FileCheck,
  Heart,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Share2,
  ShieldCheck,
  Sparkles,
  Star,
  User,
  Users,
} from "@/components/ui/icons";
import { appAlert } from "@/components/ui/app-alert";
import { PropertyCard } from "@/components/ui/property-card";
import { ModalSheet, ModalSheetHeader } from "@/components/ui/modal-sheet";
import { useApp } from "@/context/AppContext";
import type { DirectoryProfile, Property } from "@/data/types";
import { formatIndianPrice, initialsFromName } from "@/lib/format";
import { colors, radius, shadow, spacing, type } from "@/theme/tokens";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Mock client testimonials for LinkedIn-style social proof
const CLIENT_REVIEWS = [
  {
    id: "rev-1",
    author: "Aditya Singhania",
    role: "Luxury Homebuyer (Purchased 4 BHK Haveli)",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
    rating: 5,
    date: "2 weeks ago",
    content:
      "Outstanding professionalism! Rajesh ensured 100% legal clarity on property title deeds, handled the entire RERA transfer smoothly, and closed our deal under 10 days.",
    verified: true,
  },
  {
    id: "rev-2",
    author: "Pooja Deshmukh",
    role: "NRI Investor, Singapore",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=150&q=80",
    rating: 5,
    date: "1 month ago",
    content:
      "As an NRI, trusting someone with high-value real estate is daunting. The transparency, video tours, and prompt communication made our residential acquisition seamless.",
    verified: true,
  },
  {
    id: "rev-3",
    author: "Dr. Arvind Joshi",
    role: "Commercial Clinic Leasee",
    avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&q=80",
    rating: 5,
    date: "3 months ago",
    content:
      "Found an ideal commercial prime road spot in record time. Zero hidden brokerage surprises. Highly recommended for any serious real estate requirement.",
    verified: true,
  },
];

export default function BrokerDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { directoryProfiles, properties, userRole, submitInquiry, userName, userEmail } = useApp();

  const [activeTab, setActiveTab] = useState<"about" | "listings" | "reviews" | "credentials">("about");
  const [inquiryModalVisible, setInquiryModalVisible] = useState(false);
  const [inquiryMsg, setInquiryMsg] = useState("Hi, I am interested in exploring property options through your brokerage.");
  const [inquirySent, setInquirySent] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Find the target broker / expert profile
  const broker = useMemo(() => {
    if (!id) return directoryProfiles[0];
    return (
      directoryProfiles.find((d) => d.id === id) ||
      directoryProfiles.find((d) => d.ownerName.toLowerCase() === id.toLowerCase()) ||
      directoryProfiles[0]
    );
  }, [id, directoryProfiles]);

  // Find properties represented by this broker/owner
  const brokerProperties = useMemo(() => {
    if (!broker) return [];
    return properties.filter((p) => {
      if (p.ownerName && broker.ownerName && p.ownerName.toLowerCase() === broker.ownerName.toLowerCase()) return true;
      if (p.brokerEmail && broker.email && p.brokerEmail.toLowerCase() === broker.email.toLowerCase()) return true;
      if (p.city && broker.city && p.city.toLowerCase() === broker.city.toLowerCase()) return true;
      return false;
    });
  }, [properties, broker]);

  const handleCall = () => {
    if (!broker?.mobile) return;
    Linking.openURL(`tel:${broker.mobile.replace(/\s/g, "")}`).catch(() => {
      appAlert("Unable to call", "Calling is not supported on this device.");
    });
  };

  const handleEmail = () => {
    if (!broker?.email) return;
    Linking.openURL(
      `mailto:${broker.email}?subject=${encodeURIComponent(`Client Consultation Request: ${broker.firmName}`)}`
    ).catch(() => {
      appAlert("Unable to email", "No email client configured.");
    });
  };

  const handleShare = async () => {
    if (!broker) return;
    try {
      if (process.env.EXPO_OS === "ios") {
        Haptics.selectionAsync();
      }
      await Share.share({
        title: `${broker.ownerName} - ${broker.firmName}`,
        message: `Check out ${broker.ownerName}'s verified Real Estate profile on SqftGo: ${broker.headline || broker.category}. RERA: ${broker.reraId || "Verified"}. Contact: ${broker.mobile}`,
      });
    } catch (e) {
      console.error(e);
    }
  };

  const toggleSave = () => {
    setIsSaved(!isSaved);
    if (process.env.EXPO_OS === "ios") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleSendInquiry = async () => {
    if (!broker) return;
    setInquirySent(true);
    if (brokerProperties.length > 0) {
      await submitInquiry({
        propertyId: brokerProperties[0].id,
        name: userName || "Interested Buyer",
        email: userEmail || "buyer@example.com",
        message: inquiryMsg,
      });
    }
    setTimeout(() => {
      setInquiryModalVisible(false);
      setInquirySent(false);
      appAlert("Inquiry Sent", `Your consultation message has been transmitted directly to ${broker.ownerName}.`);
    }, 900);
  };

  if (!broker) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ ...type.body, color: colors.inkMuted }}>Broker profile not found.</Text>
        <Pressable onPress={() => router.back()} style={{ marginTop: spacing.md }}>
          <Text style={{ ...type.label, color: colors.accent }}>Go Back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const initials = initialsFromName(broker.ownerName || broker.firmName);
  const rating = broker.rating || 4.9;
  const reviewsCount = broker.reviewsCount || 128;
  const exp = broker.experience || "8+ Years";
  const listingsCount = brokerProperties.length > 0 ? brokerProperties.length : (broker.listingsCount || 12);
  const headline = broker.headline || `Principal Real Estate Advisor & ${broker.category} Specialist`;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Floating Top Navigation Bar */}
      <View
        style={{
          position: "absolute",
          top: insets.top,
          left: 0,
          right: 0,
          zIndex: 100,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.sm,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={({ pressed }) => ({
            width: 40,
            height: 40,
            borderRadius: radius.md,
            backgroundColor: "rgba(15, 30, 54, 0.75)",
            alignItems: "center",
            justifyContent: "center",
            opacity: pressed ? 0.8 : 1,
            boxShadow: shadow.raised,
          })}
        >
          <ChevronLeft size={22} color="#FFFFFF" />
        </Pressable>

        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
          <Pressable
            onPress={toggleSave}
            hitSlop={8}
            style={({ pressed }) => ({
              width: 40,
              height: 40,
              borderRadius: radius.md,
              backgroundColor: "rgba(15, 30, 54, 0.75)",
              alignItems: "center",
              justifyContent: "center",
              opacity: pressed ? 0.8 : 1,
              boxShadow: shadow.raised,
            })}
          >
            <Heart size={18} color={isSaved ? colors.accent : "#FFFFFF"} fill={isSaved ? colors.accent : "transparent"} />
          </Pressable>

          <Pressable
            onPress={handleShare}
            hitSlop={8}
            style={({ pressed }) => ({
              width: 40,
              height: 40,
              borderRadius: radius.md,
              backgroundColor: "rgba(15, 30, 54, 0.75)",
              alignItems: "center",
              justifyContent: "center",
              opacity: pressed ? 0.8 : 1,
              boxShadow: shadow.raised,
            })}
          >
            <Share2 size={18} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="never"
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* Cover / Profile Banner */}
        <View style={{ position: "relative", height: 160, backgroundColor: colors.primary }}>
          {broker.coverUrl ? (
            <Image
              source={{ uri: broker.coverUrl }}
              style={{ width: "100%", height: "100%" }}
              resizeMode="cover"
            />
          ) : (
            <View style={{ flex: 1, backgroundColor: colors.primary }} />
          )}
          <View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(15, 30, 54, 0.35)",
            }}
          />
        </View>

        {/* Profile Card Overlay */}
        <View
          style={{
            marginHorizontal: spacing.lg,
            marginTop: -50,
            backgroundColor: colors.surface,
            borderRadius: radius.lg,
            borderWidth: 1,
            borderColor: colors.border,
            padding: spacing.lg,
            gap: spacing.md,
            boxShadow: shadow.raised,
          }}
        >
          {/* Avatar + Verified Status */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "flex-end",
            }}
          >
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: radius.lg,
                backgroundColor: colors.primary,
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 3,
                borderColor: colors.surface,
                boxShadow: shadow.raised,
                overflow: "hidden",
              }}
            >
              {broker.avatarUrl ? (
                <Image
                  source={{ uri: broker.avatarUrl }}
                  style={{ width: "100%", height: "100%" }}
                  resizeMode="cover"
                />
              ) : (
                <Text style={{ ...type.title, color: colors.onPrimary, fontSize: 26 }}>
                  {initials}
                </Text>
              )}
            </View>

            {/* Quick Status Pill */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 5,
                backgroundColor: colors.successSoft,
                paddingHorizontal: spacing.md,
                paddingVertical: 5,
                borderRadius: radius.md,
                borderWidth: 1,
                borderColor: "rgba(14, 159, 110, 0.2)",
              }}
            >
              <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: colors.success }} />
              <Text style={{ ...type.micro, color: colors.success, fontWeight: "700" }}>
                Active & Taking Inquiries
              </Text>
            </View>
          </View>

          {/* Name & Headline */}
          <View style={{ gap: 4 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs, flexWrap: "wrap" }}>
              <Text style={{ ...type.title, color: colors.ink, fontSize: 21 }}>
                {broker.ownerName}
              </Text>
              <ShieldCheck size={18} color={colors.success} strokeWidth={2.5} />
            </View>

            <Text style={{ ...type.caption, color: colors.inkSecondary, fontWeight: "600", fontSize: 13, lineHeight: 18 }}>
              {headline}
            </Text>

            <Text style={{ ...type.body, color: colors.accent, fontWeight: "700", fontSize: 14 }}>
              {broker.firmName}
            </Text>
          </View>

          {/* Location, RERA & Contact Specs */}
          <View style={{ gap: 6, paddingTop: 4, borderTopWidth: 1, borderTopColor: colors.border }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
              <MapPin size={14} color={colors.inkMuted} />
              <Text style={{ ...type.caption, color: colors.inkSecondary }}>
                {broker.address ? `${broker.address}, ` : ""}{broker.city}
              </Text>
            </View>

            {broker.reraId ? (
              <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
                <FileCheck size={14} color={colors.success} />
                <Text style={{ ...type.caption, color: colors.inkSecondary, fontFamily: "monospace" }}>
                  RERA: <Text style={{ fontWeight: "700", color: colors.ink }}>{broker.reraId}</Text>
                </Text>
              </View>
            ) : null}

            {broker.languages && broker.languages.length > 0 ? (
              <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
                <Compass size={14} color={colors.inkMuted} />
                <Text style={{ ...type.caption, color: colors.inkMuted }}>
                  Speaks: <Text style={{ color: colors.inkSecondary }}>{broker.languages.join(", ")}</Text>
                </Text>
              </View>
            ) : null}
          </View>

          {/* Key Metrics / Credential Counters */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: colors.surfaceSubtle,
              borderRadius: radius.md,
              paddingVertical: spacing.md,
              paddingHorizontal: spacing.sm,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <View style={{ flex: 1, alignItems: "center", gap: 2 }}>
              <Text style={{ ...type.emphasis, color: colors.ink, fontSize: 16 }}>{exp}</Text>
              <Text style={{ ...type.micro, color: colors.inkMuted, textTransform: "uppercase" }}>
                Experience
              </Text>
            </View>

            <View style={{ width: 1, height: 28, backgroundColor: colors.border }} />

            <View style={{ flex: 1, alignItems: "center", gap: 2 }}>
              <Text style={{ ...type.emphasis, color: colors.ink, fontSize: 16 }}>{listingsCount}</Text>
              <Text style={{ ...type.micro, color: colors.inkMuted, textTransform: "uppercase" }}>
                Listings
              </Text>
            </View>

            <View style={{ width: 1, height: 28, backgroundColor: colors.border }} />

            <View style={{ flex: 1.2, alignItems: "center", gap: 2 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                <Star size={14} color="#F59E0B" fill="#F59E0B" />
                <Text style={{ ...type.emphasis, color: colors.ink, fontSize: 16 }}>{rating}</Text>
              </View>
              <Text style={{ ...type.micro, color: colors.inkMuted, textTransform: "uppercase" }}>
                ({reviewsCount} Reviews)
              </Text>
            </View>
          </View>
        </View>

        {/* 3. LINKEDIN-STYLE NAVIGATION TABS */}
        <View style={{ marginTop: spacing.lg, paddingHorizontal: spacing.lg }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: spacing.sm }}
          >
            {[
              { id: "about", label: "About & Vision" },
              { id: "listings", label: `Portfolio (${listingsCount})` },
              { id: "credentials", label: "Licenses & Badges" },
              { id: "reviews", label: `Client Reviews (${reviewsCount})` },
            ].map((tab) => {
              const sel = activeTab === tab.id;
              return (
                <Pressable
                  key={tab.id}
                  onPress={() => {
                    setActiveTab(tab.id as any);
                    if (process.env.EXPO_OS === "ios") Haptics.selectionAsync();
                  }}
                  style={{
                    paddingHorizontal: spacing.md + 2,
                    paddingVertical: spacing.sm + 1,
                    borderRadius: radius.md,
                    backgroundColor: sel ? colors.primary : colors.surface,
                    borderWidth: 1,
                    borderColor: sel ? colors.primary : colors.border,
                    boxShadow: shadow.card,
                  }}
                >
                  <Text
                    style={{
                      ...type.caption,
                      fontWeight: sel ? "700" : "600",
                      color: sel ? colors.onPrimary : colors.inkSecondary,
                    }}
                  >
                    {tab.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* ========================================================================= */}
        {/* TAB 1: ABOUT & SUMMARY                                                    */}
        {/* ========================================================================= */}
        {activeTab === "about" && (
          <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md, gap: spacing.md }}>
            {/* Executive Bio Card */}
            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: radius.md,
                borderWidth: 1,
                borderColor: colors.border,
                padding: spacing.lg,
                gap: spacing.sm,
                boxShadow: shadow.card,
              }}
            >
              <Text style={{ ...type.emphasis, color: colors.ink, fontSize: 16 }}>
                About {broker.ownerName}
              </Text>
              <Text style={{ ...type.body, color: colors.inkSecondary, lineHeight: 22, fontSize: 14 }}>
                {broker.description ||
                  `Dedicated real estate professional with over ${exp} of proven track record navigating prime residential developments, luxury farmhouses, and commercial spaces across ${broker.city}. Specializing in clean property title transfers and RERA-regulated transparent transactions.`}
              </Text>
            </View>

            {/* Specialties & Domain Knowledge */}
            {broker.specialties && broker.specialties.length > 0 ? (
              <View
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: radius.md,
                  borderWidth: 1,
                  borderColor: colors.border,
                  padding: spacing.lg,
                  gap: spacing.sm,
                  boxShadow: shadow.card,
                }}
              >
                <Text style={{ ...type.emphasis, color: colors.ink, fontSize: 16 }}>
                  Specialties & Expertise
                </Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: 4 }}>
                  {broker.specialties.map((s) => (
                    <View
                      key={s}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 5,
                        backgroundColor: colors.accentSoft,
                        paddingHorizontal: spacing.md,
                        paddingVertical: 6,
                        borderRadius: radius.sm,
                        borderWidth: 1,
                        borderColor: colors.accentBorder,
                      }}
                    >
                      <Sparkles size={13} color={colors.accent} />
                      <Text style={{ ...type.caption, color: colors.accent, fontWeight: "700" }}>
                        {s}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}

            {/* Firm & Team Information */}
            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: radius.md,
                borderWidth: 1,
                borderColor: colors.border,
                padding: spacing.lg,
                gap: spacing.sm,
                boxShadow: shadow.card,
              }}
            >
              <Text style={{ ...type.emphasis, color: colors.ink, fontSize: 16 }}>
                Firm Details
              </Text>

              <View style={{ gap: spacing.sm, marginTop: 4 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text style={{ ...type.caption, color: colors.inkMuted }}>Firm Name</Text>
                  <Text style={{ ...type.caption, color: colors.ink, fontWeight: "700" }}>
                    {broker.firmName}
                  </Text>
                </View>

                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text style={{ ...type.caption, color: colors.inkMuted }}>Operational Category</Text>
                  <Text style={{ ...type.caption, color: colors.ink, fontWeight: "700" }}>
                    {broker.category}
                  </Text>
                </View>

                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text style={{ ...type.caption, color: colors.inkMuted }}>Head Office</Text>
                  <Text style={{ ...type.caption, color: colors.ink, fontWeight: "700" }}>
                    {broker.address || broker.city}
                  </Text>
                </View>

                {broker.website ? (
                  <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <Text style={{ ...type.caption, color: colors.inkMuted }}>Official Website</Text>
                    <Pressable
                      onPress={() => {
                        const url = broker.website.startsWith("http") ? broker.website : `https://${broker.website}`;
                        Linking.openURL(url);
                      }}
                    >
                      <Text style={{ ...type.caption, color: colors.accent, fontWeight: "700" }}>
                        {broker.website}
                      </Text>
                    </Pressable>
                  </View>
                ) : null}
              </View>
            </View>
          </View>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: LISTINGS / PORTFOLIO                                               */}
        {/* ========================================================================= */}
        {activeTab === "listings" && (
          <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md, gap: spacing.md }}>
            <Text style={{ ...type.heading, color: colors.ink, fontSize: 16 }}>
              Represented Properties in {broker.city}
            </Text>

            {brokerProperties.length === 0 ? (
              <View
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: radius.md,
                  borderWidth: 1,
                  borderColor: colors.border,
                  padding: spacing.xl,
                  alignItems: "center",
                  gap: spacing.sm,
                }}
              >
                <Building2 size={36} color={colors.inkMuted} />
                <Text style={{ ...type.emphasis, color: colors.ink }}>No Active Public Listings</Text>
                <Text style={{ ...type.caption, color: colors.inkMuted, textAlign: "center" }}>
                  {broker.ownerName} has confidential private listings available upon direct consultation.
                </Text>
              </View>
            ) : (
              <View style={{ gap: spacing.md }}>
                {brokerProperties.map((p) => (
                  <PropertyCard key={p.id} property={p} variant="full" />
                ))}
              </View>
            )}
          </View>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: LICENSES & CREDENTIALS                                             */}
        {/* ========================================================================= */}
        {activeTab === "credentials" && (
          <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md, gap: spacing.md }}>
            {/* RERA Certificate Banner */}
            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: radius.md,
                borderWidth: 1,
                borderColor: colors.border,
                padding: spacing.lg,
                gap: spacing.md,
                boxShadow: shadow.card,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: radius.md,
                    backgroundColor: colors.successSoft,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <ShieldCheck size={26} color={colors.success} />
                </View>

                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={{ ...type.emphasis, color: colors.ink, fontSize: 16 }}>
                    State RERA Verified Registration
                  </Text>
                  <Text style={{ ...type.caption, color: colors.inkMuted }}>
                    Real Estate Regulatory Authority Certified
                  </Text>
                </View>
              </View>

              <View
                style={{
                  backgroundColor: colors.surfaceSubtle,
                  borderRadius: radius.sm,
                  padding: spacing.md,
                  gap: spacing.xs,
                }}
              >
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text style={{ ...type.caption, color: colors.inkMuted }}>Certificate ID</Text>
                  <Text style={{ ...type.caption, color: colors.ink, fontWeight: "700", fontFamily: "monospace" }}>
                    {broker.reraId || "RJ/A/NCR/2021/0492"}
                  </Text>
                </View>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text style={{ ...type.caption, color: colors.inkMuted }}>Verification Status</Text>
                  <Text style={{ ...type.caption, color: colors.success, fontWeight: "700" }}>
                    Active & Compliant
                  </Text>
                </View>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text style={{ ...type.caption, color: colors.inkMuted }}>Authorized Jurisdiction</Text>
                  <Text style={{ ...type.caption, color: colors.ink, fontWeight: "700" }}>
                    {broker.city} & State Urban Authority
                  </Text>
                </View>
              </View>
            </View>

            {/* Professional Badges */}
            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: radius.md,
                borderWidth: 1,
                borderColor: colors.border,
                padding: spacing.lg,
                gap: spacing.md,
                boxShadow: shadow.card,
              }}
            >
              <Text style={{ ...type.emphasis, color: colors.ink, fontSize: 16 }}>
                Platform Recognitions
              </Text>

              <View style={{ gap: spacing.md }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
                  <DocStar size={22} color={colors.accent} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ ...type.label, color: colors.ink, fontWeight: "700" }}>
                      Top 1% Rated Broker {broker.city}
                    </Text>
                    <Text style={{ ...type.micro, color: colors.inkMuted }}>
                      Over 98% positive client satisfaction on closing title deeds
                    </Text>
                  </View>
                </View>

                <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
                  <FileCheck size={22} color={colors.info} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ ...type.label, color: colors.ink, fontWeight: "700" }}>
                      Clear Title Guarantee Partner
                    </Text>
                    <Text style={{ ...type.micro, color: colors.inkMuted }}>
                      All listings undergo stringent revenue record and 30-year search checks
                    </Text>
                  </View>
                </View>

                <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
                  <ShieldCheck size={22} color={colors.success} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ ...type.label, color: colors.ink, fontWeight: "700" }}>
                      Identity & KYC Verified
                    </Text>
                    <Text style={{ ...type.micro, color: colors.inkMuted }}>
                      Government ID, firm registration and bank credentials confirmed
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: CLIENT REVIEWS & ENDORSEMENTS                                      */}
        {/* ========================================================================= */}
        {activeTab === "reviews" && (
          <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md, gap: spacing.md }}>
            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: radius.md,
                borderWidth: 1,
                borderColor: colors.border,
                padding: spacing.lg,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                boxShadow: shadow.card,
              }}
            >
              <View style={{ gap: 2 }}>
                <Text style={{ ...type.title, color: colors.ink, fontSize: 26 }}>{rating} / 5.0</Text>
                <Text style={{ ...type.caption, color: colors.inkMuted }}>
                  Based on {reviewsCount} verified transactions
                </Text>
              </View>
              <View style={{ flexDirection: "row", gap: 3 }}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} size={18} color="#F59E0B" fill="#F59E0B" />
                ))}
              </View>
            </View>

            {CLIENT_REVIEWS.map((rev) => (
              <View
                key={rev.id}
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: radius.md,
                  borderWidth: 1,
                  borderColor: colors.border,
                  padding: spacing.lg,
                  gap: spacing.sm,
                  boxShadow: shadow.card,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
                  <Image
                    source={{ uri: rev.avatar }}
                    style={{ width: 42, height: 42, borderRadius: radius.full }}
                    contentFit="cover"
                  />
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                      <Text style={{ ...type.emphasis, color: colors.ink }}>{rev.author}</Text>
                      {rev.verified && <CheckCircle size={13} color={colors.success} />}
                    </View>
                    <Text style={{ ...type.micro, color: colors.inkMuted }}>{rev.role}</Text>
                  </View>
                  <Text style={{ ...type.micro, color: colors.inkMuted }}>{rev.date}</Text>
                </View>

                <View style={{ flexDirection: "row", gap: 2 }}>
                  {[...Array(rev.rating)].map((_, idx) => (
                    <Star key={idx} size={12} color="#F59E0B" fill="#F59E0B" />
                  ))}
                </View>

                <Text style={{ ...type.body, color: colors.inkSecondary, fontSize: 13, lineHeight: 19 }}>
                  "{rev.content}"
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* ========================================================================= */}
      {/* STICKY BOTTOM ACTION TOOLBAR                                              */}
      {/* ========================================================================= */}
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: colors.surface,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.md,
          paddingBottom: insets.bottom > 0 ? insets.bottom : spacing.md,
          flexDirection: "row",
          gap: spacing.sm,
          boxShadow: shadow.raised,
        }}
      >
        <Pressable
          onPress={handleCall}
          accessibilityRole="button"
          accessibilityLabel="Call broker"
          style={({ pressed }) => ({
            flex: 1,
            height: 48,
            borderRadius: radius.md,
            borderWidth: 1,
            borderColor: colors.borderStrong,
            backgroundColor: pressed ? colors.surfaceSubtle : colors.surface,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: spacing.xs + 2,
          })}
        >
          <Phone size={17} color={colors.ink} />
          <Text style={{ ...type.label, color: colors.ink, fontWeight: "700" }}>
            Call Broker
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setInquiryModalVisible(true)}
          accessibilityRole="button"
          accessibilityLabel="Send inquiry or message"
          style={({ pressed }) => ({
            flex: 1.3,
            height: 48,
            borderRadius: radius.md,
            backgroundColor: colors.accent,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: spacing.xs + 2,
            boxShadow: shadow.button,
            opacity: pressed ? 0.88 : 1,
          })}
        >
          <MessageSquare size={17} color={colors.onAccent} />
          <Text style={{ ...type.label, color: colors.onAccent, fontWeight: "700" }}>
            Inquire & Connect
          </Text>
        </Pressable>
      </View>

      {/* ========================================================================= */}
      {/* INQUIRY MODAL SHEET                                                       */}
      {/* ========================================================================= */}
      <ModalSheet
        visible={inquiryModalVisible}
        onClose={() => setInquiryModalVisible(false)}
        avoidKeyboard
      >
        <ModalSheetHeader
          title={`Connect with ${broker.ownerName}`}
          subtitle={broker.firmName}
          onClose={() => setInquiryModalVisible(false)}
        />
        <View style={{ padding: spacing.xl, gap: spacing.md }}>
          <Text style={{ ...type.label, color: colors.inkMuted }}>Your Message / Requirement</Text>
          <View
            style={{
              backgroundColor: colors.surfaceSubtle,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: radius.md,
              padding: spacing.md,
            }}
          >
            <Text style={{ ...type.body, color: colors.ink, minHeight: 70 }}>{inquiryMsg}</Text>
          </View>

          <Pressable
            disabled={inquirySent}
            onPress={handleSendInquiry}
            style={({ pressed }) => ({
              height: 48,
              borderRadius: radius.md,
              backgroundColor: colors.primary,
              alignItems: "center",
              justifyContent: "center",
              marginTop: spacing.sm,
              opacity: pressed || inquirySent ? 0.8 : 1,
            })}
          >
            <Text style={{ ...type.emphasis, color: colors.onPrimary }}>
              {inquirySent ? "Sending inquiry..." : "Send Consultation Request"}
            </Text>
          </Pressable>
        </View>
      </ModalSheet>
    </View>
  );
}
