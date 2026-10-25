import React, { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import {
  Calendar,
  CheckCircle2,
  MapPin,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  type IconComponent,
} from "@/components/ui/icons";
import type { Property } from "@/data/types";
import { colors, radius, shadow, spacing, type } from "@/theme/tokens";

import { isRentalPurpose } from "./format";
import { PropertySection } from "./PropertySection";

type Highlight = { icon: IconComponent; title: string; detail: string };

function buildHighlights(property: Property): Highlight[] {
  const rental = isRentalPurpose(property.purpose);
  const items: Highlight[] = [];

  if (property.locality?.trim()) {
    items.push({
      icon: MapPin,
      title: property.locality.trim(),
      detail: `${property.city}${property.state ? `, ${property.state}` : ""}`,
    });
  }

  if (property.reraApproved) {
    items.push({
      icon: ShieldCheck,
      title: "RERA approved",
      detail: property.reraId?.trim()
        ? `Reg. no. ${property.reraId.trim()}`
        : "Registered project — verify before you pay",
    });
  }

  if (property.amenities.length > 0) {
    items.push({
      icon: CheckCircle2,
      title: `${property.amenities.length} amenities`,
      detail: property.amenities.slice(0, 3).join(" · "),
    });
  }

  if (property.furnished) {
    items.push({
      icon: Sparkles,
      title: property.furnished,
      detail: rental ? "Ready for tenants" : "As listed by the owner",
    });
  }

  if (property.inquiryCount > 0) {
    items.push({
      icon: MessageSquare,
      title:
        property.inquiryCount === 1
          ? "1 buyer inquiry"
          : `${property.inquiryCount} buyer inquiries`,
      detail: "Active interest on this listing",
    });
  }

  return items.slice(0, 4);
}

interface WhyThisListingProps {
  property: Property;
  isOwner: boolean;
  isActive: boolean;
  onBookVisit: () => void;
  onContact: () => void;
}

/** Impactful, listing-backed reasons to act — replaces cost/EMI speculation. */
export function WhyThisListing({
  property,
  isOwner,
  isActive,
  onBookVisit,
  onContact,
}: WhyThisListingProps) {
  const highlights = useMemo(() => buildHighlights(property), [property]);

  if (highlights.length === 0 && (isOwner || !isActive)) return null;

  return (
    <PropertySection title="Why this listing">
      {highlights.length > 0 ? (
        <View style={{ gap: spacing.sm }}>
          {highlights.map((item) => {
            const Icon = item.icon;
            return (
              <View key={item.title} style={styles.row}>
                <View style={styles.iconWrap}>
                  <Icon size={18} color={colors.accent} />
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={styles.rowTitle}>{item.title}</Text>
                  <Text style={styles.rowDetail} numberOfLines={2}>
                    {item.detail}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      ) : null}

      {!isOwner && isActive ? (
        <View style={styles.ctaCard}>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={styles.ctaTitle}>See it in person</Text>
            <Text style={styles.ctaBody}>
              Book a free site visit in {property.locality || property.city} — or message the lister
              with questions first.
            </Text>
          </View>
          <View style={styles.ctaActions}>
            <Pressable
              onPress={onBookVisit}
              accessibilityRole="button"
              accessibilityLabel="Book a site visit"
              style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.9 }]}
            >
              <Calendar size={16} color={colors.onAccent} />
              <Text style={styles.primaryBtnText}>Book visit</Text>
            </Pressable>
            <Pressable
              onPress={onContact}
              accessibilityRole="button"
              accessibilityLabel="Contact lister"
              style={({ pressed }) => [styles.secondaryBtn, pressed && { opacity: 0.9 }]}
            >
              <MessageSquare size={16} color={colors.ink} />
              <Text style={styles.secondaryBtnText}>Contact</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </PropertySection>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderCurve: "continuous",
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    borderCurve: "continuous",
    backgroundColor: colors.accentSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  rowTitle: { ...type.emphasis, color: colors.ink },
  rowDetail: { ...type.caption, color: colors.inkMuted },
  ctaCard: {
    marginTop: spacing.xs,
    padding: spacing.lg,
    gap: spacing.md,
    borderRadius: radius.lg,
    borderCurve: "continuous",
    backgroundColor: colors.primary,
    boxShadow: shadow.raised,
  },
  ctaTitle: { ...type.emphasis, fontSize: 17, color: colors.onPrimary },
  ctaBody: { ...type.caption, color: colors.onPrimaryMuted, lineHeight: 18 },
  ctaActions: { flexDirection: "row", gap: spacing.sm },
  primaryBtn: {
    flex: 1,
    minHeight: 44,
    borderRadius: radius.sm,
    borderCurve: "continuous",
    backgroundColor: colors.accent,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  primaryBtnText: { ...type.emphasis, color: colors.onAccent },
  secondaryBtn: {
    flex: 1,
    minHeight: 44,
    borderRadius: radius.sm,
    borderCurve: "continuous",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  secondaryBtnText: { ...type.emphasis, color: colors.ink },
});
