import { useLocalSearchParams, useRouter, type Href } from "expo-router";
import React from "react";
import { Linking, StyleSheet, Text, View } from "react-native";

import { Accordion, Button, Screen } from "@/components/ds";
import { EmptyState } from "@/components/ui/empty-state";
import { FileText, Mail } from "@/components/ui/icons";
import { LEGAL_DOCS, type LegalDocId } from "@/data/legal";
import { colors, radius, spacing, type } from "@/theme/tokens";

export default function LegalDocScreen() {
  const router = useRouter();
  const { doc } = useLocalSearchParams<{ doc: string }>();
  const content = doc && doc in LEGAL_DOCS ? LEGAL_DOCS[doc as LegalDocId] : null;

  if (!content) {
    return (
      <Screen title="Not found">
        <EmptyState icon={FileText} title="Document not found" message="This page doesn't exist." />
      </Screen>
    );
  }

  const other: LegalDocId = doc === "privacy" ? "terms" : "privacy";

  return (
    <Screen title={content.title} subtitle={content.updated}>
      {content.intro ? (
        <View style={styles.notice}>
          <Text style={styles.noticeText}>{content.intro}</Text>
        </View>
      ) : null}

      <Accordion
        items={content.sections.map((section, i) => ({
          key: section.title,
          title: `${i + 1}. ${section.title}`,
          body: (
            <View style={styles.section}>
              {section.paragraphs?.map((p) => (
                <Text key={p.slice(0, 32)} style={styles.body} selectable>
                  {p}
                </Text>
              ))}
              {section.bullets?.length ? (
                <View style={{ gap: spacing.sm }}>
                  {section.bullets.map((b) => (
                    <View key={b} style={styles.bulletRow}>
                      <View style={styles.bullet} />
                      <Text style={[styles.body, { flex: 1 }]} selectable>
                        {b}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : null}
              {section.note ? (
                <View style={styles.notice}>
                  <Text style={styles.noticeText}>{section.note}</Text>
                </View>
              ) : null}
            </View>
          ),
        }))}
      />

      <View style={{ gap: spacing.sm }}>
        <Button
          label={`Email ${content.contactEmail}`}
          icon={Mail}
          variant="secondary"
          onPress={() => void Linking.openURL(`mailto:${content.contactEmail}`)}
          fullWidth
        />
        <Button
          label={`Read ${LEGAL_DOCS[other].title}`}
          variant="tertiary"
          onPress={() => router.replace(`/legal/${other}` as Href)}
          fullWidth
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.md },
  body: { ...type.body, color: colors.inkSecondary },
  bulletRow: { flexDirection: "row", gap: spacing.sm, alignItems: "flex-start" },
  bullet: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.accent, marginTop: 8 },
  notice: {
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radius.md,
    borderCurve: "continuous",
    padding: spacing.lg,
  },
  noticeText: { ...type.label, color: colors.ink },
});
