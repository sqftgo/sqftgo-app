import React, { useMemo, useState } from "react";
import {
  FlatList,
  Image,
  Linking,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ChevronLeft,
  Compass,
  CreditCard,
  DocStar,
  Droplet,
  EditPencil,
  MapPin,
  MessageSquare,
  Phone,
  Search,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Train,
  Building2,
} from "@/components/ui/icons";

import { appAlert } from "@/components/ui/app-alert";
import { useApp } from "@/context/AppContext";
import { REAL_ESTATE_SERVICES, type ServiceProvider } from "@/data/services";
import { initialsFromName } from "@/lib/format";
import { colors, radius, shadow, spacing, type } from "@/theme/tokens";

const SERVICE_ICONS: Record<string, any> = {
  Compass,
  ShoppingBag,
  Train,
  Sparkles,
  Droplet,
  Settings,
  DocStar,
  CreditCard,
  Building2,
  EditPencil,
};

export default function ServiceCategoryDetailScreen() {
  const router = useRouter();
  const { category: categorySlug } = useLocalSearchParams<{ category?: string }>();
  const { selectedCity } = useApp();

  const [query, setQuery] = useState("");

  const currentCategory = useMemo(() => {
    return (
      REAL_ESTATE_SERVICES.find(
        (c) => c.slug === categorySlug || c.id === categorySlug,
      ) || REAL_ESTATE_SERVICES[0]
    );
  }, [categorySlug]);

  const IconComponent = SERVICE_ICONS[currentCategory.iconName] || Compass;

  const filteredProviders = useMemo(() => {
    const q = query.trim().toLowerCase();
    return currentCategory.providers.filter((p) => {
      if (q === "") return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.firmName.toLowerCase().includes(q) ||
        p.specialties.some((s) => s.toLowerCase().includes(q)) ||
        p.city.toLowerCase().includes(q)
      );
    });
  }, [currentCategory, query]);

  const handleCall = (provider: ServiceProvider) => {
    if (!provider.mobile) return;
    Linking.openURL(`tel:${provider.mobile.replace(/\s/g, "")}`).catch(() => {
      appAlert("Unable to call", "Calling is not supported on this device.");
    });
  };

  const handleWhatsApp = (provider: ServiceProvider) => {
    if (!provider.mobile) return;
    const cleanNumber = provider.mobile.replace(/[^0-9]/g, "");
    const url = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(
      `Hello ${provider.name}, I am contacting you regarding your ${currentCategory.title} services on SqftGo in ${selectedCity}.`,
    )}`;
    Linking.openURL(url).catch(() => {
      appAlert("Unable to open WhatsApp", "Please make sure WhatsApp is installed.");
    });
  };

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Header */}
      <View
        style={{
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
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
            alignItems: "center",
            justifyContent: "center",
            boxShadow: shadow.card,
            opacity: pressed ? 0.75 : 1,
          })}
        >
          <ChevronLeft size={20} color={colors.ink} />
        </Pressable>

        <View style={{ flex: 1, alignItems: "center", paddingHorizontal: spacing.sm }}>
          <Text style={{ ...type.emphasis, color: colors.ink, fontSize: 16 }} numberOfLines={1}>
            {currentCategory.title}
          </Text>
        </View>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 4,
            backgroundColor: colors.surfaceSubtle,
            paddingHorizontal: spacing.sm + 2,
            paddingVertical: 6,
            borderRadius: radius.md,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <MapPin size={12} color={colors.accent} />
          <Text style={{ ...type.micro, color: colors.ink, fontWeight: "600" }}>
            {selectedCity}
          </Text>
        </View>
      </View>

      <FlatList
        data={filteredProviders}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: spacing.lg,
          paddingBottom: spacing["3xl"],
          gap: spacing.md,
        }}
        ListHeaderComponent={
          <View style={{ gap: spacing.md, marginBottom: spacing.xs, paddingTop: spacing.xs }}>
            {/* Compact Category Header */}
            <View
              style={{
                backgroundColor: colors.primary,
                borderRadius: radius.lg,
                borderCurve: "continuous",
                padding: spacing.lg,
                flexDirection: "row",
                alignItems: "center",
                gap: spacing.md,
                boxShadow: shadow.raised,
              }}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: radius.md,
                  backgroundColor: "rgba(255,255,255,0.12)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <IconComponent size={24} color={colors.onPrimary} strokeWidth={2.2} />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={{ ...type.heading, color: colors.onPrimary, fontSize: 17 }}>
                  {currentCategory.title}
                </Text>
                <Text style={{ ...type.caption, color: "rgba(255,255,255,0.75)" }}>
                  {currentCategory.subtitle}
                </Text>
              </View>
            </View>

            {/* Provider Search */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: colors.surface,
                borderRadius: radius.md,
                borderCurve: "continuous",
                borderWidth: 1,
                borderColor: colors.border,
                paddingHorizontal: spacing.md,
                height: 44,
                gap: spacing.sm,
                boxShadow: shadow.card,
              }}
            >
              <Search size={16} color={colors.inkMuted} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder={`Search providers...`}
                placeholderTextColor={colors.inkMuted}
                style={{
                  flex: 1,
                  ...type.body,
                  fontSize: 14,
                  color: colors.ink,
                  padding: 0,
                }}
              />
            </View>

            <Text style={{ ...type.caption, color: colors.inkMuted }}>
              {filteredProviders.length} Verified Provider{filteredProviders.length === 1 ? "" : "s"}
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const initials = initialsFromName(item.name || item.firmName);
          return (
            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: radius.lg,
                borderCurve: "continuous",
                borderWidth: 1,
                borderColor: colors.border,
                padding: spacing.lg,
                gap: spacing.md,
                boxShadow: shadow.card,
              }}
            >
              {/* Provider Info Row */}
              <View style={{ flexDirection: "row", gap: spacing.md }}>
                <View
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: radius.lg,
                    backgroundColor: colors.primary,
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  {item.avatarUrl ? (
                    <Image
                      source={{ uri: item.avatarUrl }}
                      style={{ width: "100%", height: "100%" }}
                      resizeMode="cover"
                    />
                  ) : (
                    <Text style={{ ...type.heading, color: colors.onPrimary, fontSize: 16 }}>
                      {initials}
                    </Text>
                  )}
                </View>

                <View style={{ flex: 1, gap: 2 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                    <Text style={{ ...type.emphasis, color: colors.ink, fontSize: 15 }} numberOfLines={1}>
                      {item.firmName}
                    </Text>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 3,
                        backgroundColor: "rgba(245, 158, 11, 0.12)",
                        paddingHorizontal: 6,
                        paddingVertical: 2,
                        borderRadius: radius.sm,
                      }}
                    >
                      <Star size={11} color="#D97706" fill="#D97706" />
                      <Text style={{ ...type.micro, color: "#B45309", fontWeight: "700" }}>
                        {item.rating}
                      </Text>
                    </View>
                  </View>

                  <Text style={{ ...type.caption, color: colors.inkSecondary }}>
                    {item.name} · <Text style={{ color: colors.accent }}>{item.experience}</Text>
                  </Text>

                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 1 }}>
                    <MapPin size={11} color={colors.inkMuted} />
                    <Text style={{ ...type.micro, color: colors.inkMuted }}>
                      {item.city} · <Text style={{ color: colors.ink, fontWeight: "600" }}>{item.pricingStarts}</Text>
                    </Text>
                  </View>
                </View>
              </View>

              {/* Badges & Specialties */}
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                {item.badges.map((b) => (
                  <View
                    key={b}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 3,
                      backgroundColor: colors.successSoft,
                      paddingHorizontal: 8,
                      paddingVertical: 2,
                      borderRadius: radius.sm,
                    }}
                  >
                    <ShieldCheck size={11} color={colors.success} />
                    <Text style={{ ...type.micro, color: colors.success, fontWeight: "700" }}>
                      {b}
                    </Text>
                  </View>
                ))}
                {item.specialties.slice(0, 2).map((s) => (
                  <View
                    key={s}
                    style={{
                      backgroundColor: colors.surfaceSubtle,
                      paddingHorizontal: 8,
                      paddingVertical: 2,
                      borderRadius: radius.sm,
                    }}
                  >
                    <Text style={{ ...type.micro, color: colors.inkMuted }}>{s}</Text>
                  </View>
                ))}
              </View>

              {/* Action Buttons: Call & WhatsApp */}
              <View style={{ flexDirection: "row", gap: spacing.sm, paddingTop: spacing.xs }}>
                <Pressable
                  onPress={() => handleCall(item)}
                  style={({ pressed }) => ({
                    flex: 1,
                    height: 40,
                    borderRadius: radius.md,
                    borderWidth: 1,
                    borderColor: colors.borderStrong,
                    backgroundColor: pressed ? colors.surfaceSubtle : colors.surface,
                    alignItems: "center",
                    justifyContent: "center",
                    flexDirection: "row",
                    gap: 6,
                  })}
                >
                  <Phone size={14} color={colors.ink} />
                  <Text style={{ ...type.caption, color: colors.ink, fontWeight: "700" }}>
                    Call
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => handleWhatsApp(item)}
                  style={({ pressed }) => ({
                    flex: 1.2,
                    height: 40,
                    borderRadius: radius.md,
                    backgroundColor: colors.accent,
                    alignItems: "center",
                    justifyContent: "center",
                    flexDirection: "row",
                    gap: 6,
                    boxShadow: shadow.button,
                    opacity: pressed ? 0.85 : 1,
                  })}
                >
                  <MessageSquare size={14} color={colors.onAccent} />
                  <Text style={{ ...type.caption, color: colors.onAccent, fontWeight: "700" }}>
                    WhatsApp
                  </Text>
                </Pressable>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: radius.lg,
              borderWidth: 1,
              borderColor: colors.border,
              padding: spacing.xl,
              alignItems: "center",
              gap: spacing.sm,
            }}
          >
            <Compass size={32} color={colors.inkMuted} />
            <Text style={{ ...type.emphasis, color: colors.ink }}>No providers found</Text>
            <Text style={{ ...type.caption, color: colors.inkMuted, textAlign: "center" }}>
              Try clearing your search to see all available providers.
            </Text>
            <Pressable
              onPress={() => setQuery("")}
              style={{
                marginTop: spacing.xs,
                paddingHorizontal: spacing.lg,
                paddingVertical: spacing.sm,
                backgroundColor: colors.accentSoft,
                borderRadius: radius.md,
              }}
            >
              <Text style={{ ...type.label, color: colors.accent, fontWeight: "600" }}>
                Clear Search
              </Text>
            </Pressable>
          </View>
        }
      />
    </SafeAreaView>
  );
}
