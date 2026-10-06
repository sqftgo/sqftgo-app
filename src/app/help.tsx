import { useRouter, type Href } from "expo-router";
import React, { useMemo, useState } from "react";
import { Linking, StyleSheet, Text, View } from "react-native";

import { Accordion, ListRow, ListSection, Screen, SegmentedControl } from "@/components/ds";
import { EmptyState } from "@/components/ui/empty-state";
import { FileText, HelpCircle, Mail, Phone, Shield } from "@/components/ui/icons";
import { SearchBar } from "@/components/ui/search-bar";
import { useApp } from "@/context/AppContext";
import { colors, spacing, type } from "@/theme/tokens";

type Category = "all" | "booking" | "verification" | "listings";

interface Faq {
  q: string;
  a: string;
  category: Exclude<Category, "all">;
}

export default function HelpScreen() {
  const router = useRouter();
  const { platformSettings } = useApp();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<Category>("all");

  const faqs = useMemo<Faq[]>(
    () => [
      {
        category: "booking",
        q: "How do I schedule a site visit?",
        a: "Open any active listing and tap Book a visit. Pick a date and time slot. The dealer confirms the visit, and you can track it in My visits.",
      },
      {
        category: "verification",
        q: "What does the RERA badge mean?",
        a: "Listings with a RERA number show the registration from the state Real Estate Regulatory Authority. Always verify RERA details and title documents yourself before signing.",
      },
      {
        category: "listings",
        q: "How do I list my property?",
        a: platformSettings.requireListingApproval
          ? "Tap Post property, add photos, price and location, then submit. The SqftGo team reviews each listing before it goes live."
          : "Tap Post property, add photos, price and location, then publish.",
      },
      {
        category: "booking",
        q: "Can I reschedule or cancel a visit?",
        a: "Yes. Go to Profile → My visits, open the visit and choose Reschedule or Cancel. There are no cancellation fees.",
      },
      {
        category: "verification",
        q: "How are dealers verified?",
        a: "Dealers submit business and identity documents (KYC). The SqftGo team reviews them before the dealer can publish listings.",
      },
      {
        category: "listings",
        q: "Is listing free for individual owners?",
        a: `Yes. Individual owners can list up to ${platformSettings.maxListingsPerUser} properties for free. Dealers can buy a plan to list more.`,
      },
    ],
    [platformSettings.maxListingsPerUser, platformSettings.requireListingApproval],
  );

  const q = query.trim().toLowerCase();
  const filtered = faqs.filter(
    (f) =>
      (category === "all" || f.category === category) &&
      (!q || f.q.toLowerCase().includes(q) || f.a.toLowerCase().includes(q)),
  );

  const phone = platformSettings.supportPhone.trim();
  const email = platformSettings.supportEmail.trim();

  return (
    <Screen title="Help & support">
      <ListSection title="Contact us">
        {email ? (
          <ListRow
            icon={Mail}
            title="Email support"
            subtitle={email}
            onPress={() => void Linking.openURL(`mailto:${email}`)}
          />
        ) : null}
        {phone ? (
          <ListRow
            icon={Phone}
            title="Call support"
            subtitle={phone}
            onPress={() => void Linking.openURL(`tel:${phone.replace(/[^\d+]/g, "")}`)}
          />
        ) : null}
      </ListSection>

      <View style={{ gap: spacing.md }}>
        <Text style={styles.heading} accessibilityRole="header">
          Frequently asked questions
        </Text>
        <SearchBar value={query} onChangeText={setQuery} placeholder="Search questions" />
        <SegmentedControl
          segments={[
            { value: "all", label: "All" },
            { value: "booking", label: "Visits" },
            { value: "verification", label: "Trust" },
            { value: "listings", label: "Listing" },
          ]}
          value={category}
          onChange={setCategory}
        />
        {filtered.length === 0 ? (
          <EmptyState icon={HelpCircle} title="No matching questions" message="Try a different word, or contact support." />
        ) : (
          <Accordion key={category} items={filtered.map((f) => ({ key: f.q, title: f.q, body: f.a }))} />
        )}
      </View>

      <ListSection title="Legal">
        <ListRow icon={Shield} title="Privacy Policy" onPress={() => router.push("/legal/privacy" as Href)} />
        <ListRow icon={FileText} title="Terms of Service" onPress={() => router.push("/legal/terms" as Href)} />
      </ListSection>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heading: { ...type.heading, color: colors.ink },
});
