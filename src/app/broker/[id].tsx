import React, { useMemo, useState } from "react";
import {
  Linking,
  Modal,
  Pressable,
  ScrollView,
  Share,
  Text,
  TextInput,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";

import {
  Building2,
  ChevronLeft,
  FileCheck,
  MapPin,
  MessageSquare,
  Phone,
  Share2,
  ShieldCheck,
  Sparkles,
} from "@/components/ui/icons";
import { appAlert } from "@/components/ui/app-alert";
import { PropertyCard } from "@/components/ui/property-card";
import { useApp } from "@/context/AppContext";
import { initialsFromName } from "@/lib/format";
import { isApiMode } from "@/lib/api/config";
import { apiCreateServiceBooking } from "@/lib/api/services/services";
import { colors, radius, shadow, spacing, type } from "@/theme/tokens";

export default function BrokerDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { directoryProfiles, properties, profile } = useApp();
  const [bookOpen, setBookOpen] = useState(false);
  const [bookPhone, setBookPhone] = useState(profile?.phone ?? "");
  const [bookMessage, setBookMessage] = useState("");
  const [bookBusy, setBookBusy] = useState(false);

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

  const handleBookService = async () => {
    if (!broker || !isApiMode) {
      appAlert("API required", "Service booking needs live API mode.");
      return;
    }
    if (!bookPhone.trim()) {
      appAlert("Phone required", "Add a contact number for the partner.");
      return;
    }
    setBookBusy(true);
    try {
      const preferredAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      await apiCreateServiceBooking(broker.id, {
        preferredAt,
        contactPhone: bookPhone.trim(),
        message: bookMessage.trim() || undefined,
      });
      setBookOpen(false);
      appAlert("Booking sent", "Track it under My service bookings.", [
        { text: "View bookings", onPress: () => router.push("/my-service-bookings") },
        { text: "OK" },
      ]);
    } catch (e) {
      appAlert("Could not book", e instanceof Error ? e.message : "Try again.");
    } finally {
      setBookBusy(false);
    }
  };

  const handleCall = () => {
    if (!broker?.mobile) return;
    Linking.openURL(`tel:${broker.mobile.replace(/\s/g, "")}`).catch(() => {
      appAlert("Unable to call", "Calling is not supported on this device.");
    });
  };

  const handleWhatsApp = () => {
    if (!broker?.mobile) return;
    const cleanNumber = broker.mobile.replace(/[^0-9]/g, "");
    const url = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(
      `Hello ${broker.ownerName}, I found your verified profile on SqftGo and would like to inquire about properties.`
    )}`;
    Linking.openURL(url).catch(() => {
      appAlert("Unable to open WhatsApp", "Please make sure WhatsApp is installed.");
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
        message: `Check out ${broker.ownerName}'s verified Real Estate profile on SqftGo: ${broker.firmName} (${broker.category}). ${broker.reraId ? `RERA: ${broker.reraId}. ` : ""}Contact: ${broker.mobile}`,
      });
    } catch (e) {
      console.error(e);
    }
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
  const exp = broker.experience || "5+ Years";
  const listingsCount = brokerProperties.length > 0 ? brokerProperties.length : (broker.listingsCount || 0);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Floating Header */}
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

        <Pressable
          onPress={handleShare}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Share profile"
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

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="never"
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Banner Cover */}
        <View style={{ height: 140, backgroundColor: colors.primary }}>
          {broker.coverUrl ? (
            <Image
              source={{ uri: broker.coverUrl }}
              style={{ width: "100%", height: "100%" }}
              contentFit="cover"
            />
          ) : null}
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

        {/* Profile Card */}
        <View
          style={{
            marginHorizontal: spacing.lg,
            marginTop: -40,
            backgroundColor: colors.surface,
            borderRadius: radius.lg,
            borderCurve: "continuous",
            borderWidth: 1,
            borderColor: colors.border,
            padding: spacing.lg,
            gap: spacing.md,
            boxShadow: shadow.raised,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "flex-start", gap: spacing.md }}>
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: radius.lg,
                borderCurve: "continuous",
                backgroundColor: colors.primary,
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 2.5,
                borderColor: colors.surface,
                boxShadow: shadow.card,
                overflow: "hidden",
              }}
            >
              {broker.avatarUrl ? (
                <Image
                  source={{ uri: broker.avatarUrl }}
                  style={{ width: "100%", height: "100%" }}
                  contentFit="cover"
                />
              ) : (
                <Text style={{ ...type.title, color: colors.onPrimary, fontSize: 22 }}>
                  {initials}
                </Text>
              )}
            </View>

            <View style={{ flex: 1, gap: 2 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                <Text style={{ ...type.heading, color: colors.ink, fontSize: 18 }}>
                  {broker.ownerName}
                </Text>
                <ShieldCheck size={17} color={colors.success} strokeWidth={2.5} />
              </View>

              <Text style={{ ...type.emphasis, color: colors.inkSecondary, fontSize: 14 }}>
                {broker.firmName}
              </Text>

              <Text style={{ ...type.caption, color: colors.accent, fontWeight: "600" }}>
                {broker.category}
              </Text>
            </View>
          </View>

          {/* Location & RERA */}
          <View style={{ gap: spacing.xs, paddingTop: spacing.xs, borderTopWidth: 1, borderTopColor: colors.border }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
              <MapPin size={13} color={colors.inkMuted} />
              <Text style={{ ...type.caption, color: colors.inkSecondary }}>
                {broker.address ? `${broker.address}, ` : ""}{broker.city}
              </Text>
            </View>

            {broker.reraId ? (
              <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
                <FileCheck size={13} color={colors.success} />
                <Text style={{ ...type.caption, color: colors.inkSecondary, fontFamily: "monospace" }}>
                  RERA: <Text style={{ fontWeight: "600", color: colors.ink }}>{broker.reraId}</Text>
                </Text>
              </View>
            ) : null}
          </View>

          {/* Quick Metrics */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: colors.surfaceSubtle,
              borderRadius: radius.md,
              paddingVertical: spacing.sm + 2,
              paddingHorizontal: spacing.md,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <View style={{ flex: 1, alignItems: "center", gap: 1 }}>
              <Text style={{ ...type.emphasis, color: colors.ink, fontSize: 15 }}>{exp}</Text>
              <Text style={{ ...type.micro, color: colors.inkMuted, textTransform: "uppercase" }}>
                Experience
              </Text>
            </View>

            <View style={{ width: 1, height: 22, backgroundColor: colors.border }} />

            <View style={{ flex: 1, alignItems: "center", gap: 1 }}>
              <Text style={{ ...type.emphasis, color: colors.ink, fontSize: 15 }}>
                {listingsCount > 0 ? `${listingsCount}` : "—"}
              </Text>
              <Text style={{ ...type.micro, color: colors.inkMuted, textTransform: "uppercase" }}>
                Listings
              </Text>
            </View>

            {broker.reraId ? (
              <>
                <View style={{ width: 1, height: 22, backgroundColor: colors.border }} />
                <View style={{ flex: 1, alignItems: "center", gap: 1 }}>
                  <Text style={{ ...type.emphasis, color: colors.success, fontSize: 15 }}>
                    Verified
                  </Text>
                  <Text style={{ ...type.micro, color: colors.inkMuted, textTransform: "uppercase" }}>
                    RERA
                  </Text>
                </View>
              </>
            ) : null}
          </View>
        </View>

        {/* Content */}
        <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.lg, gap: spacing.md }}>
          {/* About */}
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
              About
            </Text>
            <Text style={{ ...type.body, color: colors.inkSecondary, lineHeight: 22, fontSize: 14 }}>
              {broker.description ||
                `Verified real estate professional operating across ${broker.city}, specializing in residential & commercial advisory, title deed verification, and end-to-end property assistance.`}
            </Text>
          </View>

          {/* Specialties */}
          {broker.specialties && broker.specialties.length > 0 && (
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
                Specialties
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.xs, marginTop: 2 }}>
                {broker.specialties.map((s) => (
                  <View
                    key={s}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 4,
                      backgroundColor: colors.accentSoft,
                      paddingHorizontal: spacing.md,
                      paddingVertical: 5,
                      borderRadius: radius.sm,
                      borderWidth: 1,
                      borderColor: colors.accentBorder,
                    }}
                  >
                    <Sparkles size={12} color={colors.accent} />
                    <Text style={{ ...type.caption, color: colors.accent, fontWeight: "700" }}>
                      {s}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Properties */}
          <View style={{ gap: spacing.sm, marginTop: spacing.xs }}>
            <Text style={{ ...type.heading, color: colors.ink, fontSize: 16 }}>
              Properties ({brokerProperties.length})
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
                <Building2 size={32} color={colors.inkMuted} />
                <Text style={{ ...type.emphasis, color: colors.ink }}>No Listed Properties</Text>
                <Text style={{ ...type.caption, color: colors.inkMuted, textAlign: "center" }}>
                  Contact the broker directly for available listings and off-market opportunities.
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
        </View>
      </ScrollView>

      {/* Sticky Bottom Bar: Call + WhatsApp */}
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
            Call
          </Text>
        </Pressable>

        <Pressable
          onPress={handleWhatsApp}
          accessibilityRole="button"
          accessibilityLabel="WhatsApp broker"
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
            WhatsApp
          </Text>
        </Pressable>
      </View>

      {isApiMode ? (
        <Pressable
          onPress={() => setBookOpen(true)}
          style={{
            position: "absolute",
            right: spacing.lg,
            bottom: (insets.bottom || spacing.md) + 64,
            backgroundColor: colors.primary,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm,
            borderRadius: radius.md,
            boxShadow: shadow.raised,
          }}
        >
          <Text style={{ ...type.micro, fontWeight: "800", color: colors.onAccent }}>
            Book service
          </Text>
        </Pressable>
      ) : null}

      <Modal visible={bookOpen} animationType="slide" transparent onRequestClose={() => setBookOpen(false)}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" }}>
          <View
            style={{
              backgroundColor: colors.surface,
              borderTopLeftRadius: radius.xl,
              borderTopRightRadius: radius.xl,
              padding: spacing.xl,
              gap: spacing.md,
              paddingBottom: insets.bottom + spacing.lg,
            }}
          >
            <Text style={{ ...type.heading, color: colors.ink }}>Book this partner</Text>
            <Text style={{ ...type.caption, color: colors.inkMuted }}>
              Preferred slot defaults to tomorrow — the partner will confirm.
            </Text>
            <TextInput
              value={bookPhone}
              onChangeText={setBookPhone}
              placeholder="Your phone"
              placeholderTextColor={colors.inkMuted}
              keyboardType="phone-pad"
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: radius.md,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm,
                ...type.body,
                color: colors.ink,
              }}
            />
            <TextInput
              value={bookMessage}
              onChangeText={setBookMessage}
              placeholder="Message (optional)"
              placeholderTextColor={colors.inkMuted}
              multiline
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: radius.md,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm,
                minHeight: 80,
                textAlignVertical: "top",
                ...type.body,
                color: colors.ink,
              }}
            />
            <Pressable
              disabled={bookBusy}
              onPress={handleBookService}
              style={{
                height: 48,
                borderRadius: radius.md,
                backgroundColor: colors.accent,
                alignItems: "center",
                justifyContent: "center",
                opacity: bookBusy ? 0.6 : 1,
              }}
            >
              <Text style={{ ...type.emphasis, color: colors.onAccent }}>
                {bookBusy ? "Sending…" : "Send booking request"}
              </Text>
            </Pressable>
            <Pressable onPress={() => setBookOpen(false)}>
              <Text style={{ ...type.label, color: colors.inkMuted, textAlign: "center" }}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}
