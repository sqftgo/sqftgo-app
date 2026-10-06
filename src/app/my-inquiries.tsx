import { Image } from "expo-image";
import { useRouter, type Href } from "expo-router";
import React, { useMemo, useState } from "react";
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";

import { Screen } from "@/components/ds/Screen";
import { EmptyState } from "@/components/ui/empty-state";
import { ChevronRight, Home, Lock, MapPin, MessageSquare } from "@/components/ui/icons";
import { useApp } from "@/context/AppContext";
import { colors, radius, spacing, type } from "@/theme/tokens";

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function MyInquiriesScreen() {
  const router = useRouter();
  const { isLoggedIn, inquiries, properties, userEmail, refreshInquiries } = useApp();
  const [refreshing, setRefreshing] = useState(false);

  const propertyById = useMemo(() => new Map(properties.map((p) => [p.id, p])), [properties]);

  const mine = useMemo(
    () =>
      inquiries
        .filter((i) => i.buyerEmail.toLowerCase() === userEmail.toLowerCase())
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [inquiries, userEmail],
  );

  if (!isLoggedIn) {
    return (
      <Screen title="My inquiries">
        <EmptyState
          icon={Lock}
          title="Sign in required"
          message="Sign in to see the inquiries you've sent to dealers."
          actionLabel="Sign in"
          onAction={() => router.push({ pathname: "/auth", params: { mode: "sign-in" } } as unknown as Href)}
        />
      </Screen>
    );
  }

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshInquiries();
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <Screen title="My inquiries" scroll={false}>
      <FlatList
        data={mine}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
        ListHeaderComponent={
          mine.length > 0 ? (
            <Text style={styles.intro}>
              Messages you sent as a buyer. Dealers reply by phone, email or WhatsApp. Inquiries on your own listings
              are in{" "}
              <Text style={styles.link} onPress={() => router.push("/my-listings" as Href)}>
                My listings
              </Text>
              .
            </Text>
          ) : null
        }
        ListEmptyComponent={
          <EmptyState
            icon={MessageSquare}
            title="No inquiries yet"
            message="Browse listings and message the owner when you find a home you like."
            actionLabel="Browse homes"
            onAction={() => router.push("/(tabs)/explore" as Href)}
          />
        }
        renderItem={({ item }) => {
          const p = propertyById.get(item.propertyId);
          const place = [p?.locality, p?.city].filter(Boolean).join(", ");
          return (
            <Pressable
              onPress={() => router.push({ pathname: "/property/[id]", params: { id: item.propertyId } })}
              accessibilityRole="button"
              accessibilityLabel={`Inquiry about ${p?.title ?? item.propertyTitle}`}
              style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}
            >
              <View style={styles.head}>
                <View style={styles.thumb}>
                  {p?.images[0] ? (
                    <Image source={{ uri: p.images[0] }} style={StyleSheet.absoluteFill} contentFit="cover" />
                  ) : (
                    <Home size={20} color={colors.inkMuted} />
                  )}
                </View>
                <View style={{ flex: 1, gap: spacing.xxs }}>
                  <Text style={styles.title} numberOfLines={2}>
                    {p?.title ?? item.propertyTitle ?? "Property listing"}
                  </Text>
                  {place ? (
                    <View style={styles.placeRow}>
                      <MapPin size={12} color={colors.inkMuted} />
                      <Text style={styles.meta} numberOfLines={1}>
                        {place}
                      </Text>
                    </View>
                  ) : null}
                  <Text style={styles.meta}>{formatDate(item.createdAt)}</Text>
                </View>
                <ChevronRight size={18} color={colors.inkMuted} />
              </View>
              <View style={styles.quote}>
                <Text style={styles.body} numberOfLines={4}>
                  {item.message}
                </Text>
              </View>
            </Pressable>
          );
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing["4xl"], gap: spacing.md, flexGrow: 1 },
  intro: { ...type.caption, color: colors.inkMuted, marginBottom: spacing.xs },
  link: { color: colors.accent, fontFamily: "Inter_600SemiBold" },
  card: {
    padding: spacing.md,
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderCurve: "continuous",
    borderWidth: 1,
    borderColor: colors.border,
  },
  head: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
    borderCurve: "continuous",
    backgroundColor: colors.surfaceSubtle,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  title: { ...type.emphasis, color: colors.ink },
  placeRow: { flexDirection: "row", alignItems: "center", gap: spacing.xxs },
  meta: { ...type.caption, color: colors.inkMuted, flexShrink: 1 },
  quote: { backgroundColor: colors.surfaceSubtle, borderRadius: radius.md, padding: spacing.md },
  body: { ...type.body, color: colors.inkSecondary },
});
