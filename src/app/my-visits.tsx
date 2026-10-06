import { Image } from "expo-image";
import { useRouter, type Href } from "expo-router";
import React, { useMemo, useState } from "react";
import { FlatList, Linking, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/ds/Button";
import { DateSlotPicker, isSlotPast, toIsoDate } from "@/components/ds/DateSlotPicker";
import { Screen } from "@/components/ds/Screen";
import { SegmentedControl } from "@/components/ds/SegmentedControl";
import { StatusBadge } from "@/components/ds/StatusBadge";
import { toast } from "@/components/ds/Toast";
import { appAlert } from "@/components/ui/app-alert";
import { EmptyState } from "@/components/ui/empty-state";
import { Calendar, Clock, Home, Phone } from "@/components/ui/icons";
import { ModalSheet, ModalSheetHeader } from "@/components/ui/modal-sheet";
import { useApp } from "@/context/AppContext";
import type { SiteVisit } from "@/data/types";
import { VISIT_STATUS_LABEL } from "@/lib/status-labels";
import { colors, radius, spacing, type } from "@/theme/tokens";

type Tab = "upcoming" | "past";

function isUpcoming(v: SiteVisit, today: string): boolean {
  if (v.status === "cancelled" || v.status === "completed") return false;
  return v.visitDate >= today;
}

function formatVisitDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return new Date(y, m - 1, d).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
}

export default function MyVisitsScreen() {
  const router = useRouter();
  const { visits, userEmail, properties, rescheduleVisit, cancelVisit, refreshVisits } = useApp();
  const [tab, setTab] = useState<Tab>("upcoming");
  const [refreshing, setRefreshing] = useState(false);
  const [editing, setEditing] = useState<SiteVisit | null>(null);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [busy, setBusy] = useState(false);

  const propertyById = useMemo(() => new Map(properties.map((p) => [p.id, p])), [properties]);
  const today = toIsoDate(new Date());

  const mine = useMemo(
    () => visits.filter((v) => v.buyerEmail.toLowerCase() === userEmail.toLowerCase()),
    [visits, userEmail],
  );
  const upcoming = useMemo(
    () => mine.filter((v) => isUpcoming(v, today)).sort((a, b) => a.visitDate.localeCompare(b.visitDate)),
    [mine, today],
  );
  const past = useMemo(
    () => mine.filter((v) => !isUpcoming(v, today)).sort((a, b) => b.visitDate.localeCompare(a.visitDate)),
    [mine, today],
  );
  const list = tab === "upcoming" ? upcoming : past;

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshVisits();
    } finally {
      setRefreshing(false);
    }
  };

  const openReschedule = (v: SiteVisit) => {
    setEditing(v);
    setDate(v.visitDate >= today ? v.visitDate : "");
    setTime(v.visitDate >= today ? v.visitTime : "");
  };

  const saveReschedule = async () => {
    if (!editing) return;
    if (!date || !time) {
      appAlert("Pick a slot", "Choose a date and time for your visit.");
      return;
    }
    if (isSlotPast(date, time)) {
      appAlert("Slot has passed", "Choose a later time.");
      return;
    }
    setBusy(true);
    const result = await rescheduleVisit(editing.id, { date, time });
    setBusy(false);
    if (!result.ok) {
      appAlert("Couldn't reschedule", result.message);
      return;
    }
    setEditing(null);
    toast("Visit rescheduled");
  };

  const confirmCancel = (v: SiteVisit) => {
    appAlert("Cancel this visit?", `${v.propertyTitle} on ${formatVisitDate(v.visitDate)} at ${v.visitTime}.`, [
      { text: "Keep visit", style: "cancel" },
      {
        text: "Cancel visit",
        style: "destructive",
        onPress: async () => {
          const result = await cancelVisit(v.id);
          if (!result.ok) appAlert("Couldn't cancel", result.message);
          else toast("Visit cancelled");
        },
      },
    ]);
  };

  return (
    <Screen title="My visits" scroll={false}>
      <View style={styles.segment}>
        <SegmentedControl<Tab>
          segments={[
            { value: "upcoming", label: "Upcoming", count: upcoming.length },
            { value: "past", label: "Past", count: past.length },
          ]}
          value={tab}
          onChange={setTab}
        />
      </View>
      <FlatList
        data={list}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
        ListEmptyComponent={
          <EmptyState
            icon={Calendar}
            title={tab === "upcoming" ? "No upcoming visits" : "No past visits"}
            message={
              tab === "upcoming"
                ? "Book a visit from any active listing and it will show up here."
                : "Completed and cancelled visits appear here."
            }
            actionLabel={tab === "upcoming" ? "Browse homes" : undefined}
            onAction={tab === "upcoming" ? () => router.push("/(tabs)/explore" as Href) : undefined}
          />
        }
        renderItem={({ item }) => {
          const p = propertyById.get(item.propertyId);
          const canChange = tab === "upcoming";
          return (
            <View style={styles.card}>
              <Pressable
                onPress={() => router.push({ pathname: "/property/[id]", params: { id: item.propertyId } })}
                accessibilityRole="button"
                style={styles.head}
              >
                <View style={styles.thumb}>
                  {p?.images[0] ? (
                    <Image source={{ uri: p.images[0] }} style={StyleSheet.absoluteFill} contentFit="cover" />
                  ) : (
                    <Home size={20} color={colors.inkMuted} />
                  )}
                </View>
                <View style={{ flex: 1, gap: spacing.xxs }}>
                  <Text style={styles.title} numberOfLines={2}>
                    {p?.title ?? item.propertyTitle}
                  </Text>
                  {p ? (
                    <Text style={styles.meta} numberOfLines={1}>
                      {p.locality}, {p.city}
                    </Text>
                  ) : null}
                </View>
                <StatusBadge label={VISIT_STATUS_LABEL[item.status]} />
              </Pressable>

              <View style={styles.when}>
                <View style={styles.whenItem}>
                  <Calendar size={16} color={colors.inkSecondary} />
                  <Text style={styles.whenText}>{formatVisitDate(item.visitDate)}</Text>
                </View>
                <View style={styles.whenItem}>
                  <Clock size={16} color={colors.inkSecondary} />
                  <Text style={styles.whenText}>{item.visitTime}</Text>
                </View>
              </View>

              {canChange ? (
                <View style={styles.actions}>
                  {p?.ownerPhone ? (
                    <Button
                      label="Call"
                      icon={Phone}
                      variant="tertiary"
                      onPress={() => void Linking.openURL(`tel:${p.ownerPhone.replace(/\s/g, "")}`)}
                    />
                  ) : null}
                  <View style={{ flex: 1 }} />
                  <Button label="Cancel" variant="tertiary" onPress={() => confirmCancel(item)} />
                  <Button label="Reschedule" variant="secondary" onPress={() => openReschedule(item)} />
                </View>
              ) : null}
            </View>
          );
        }}
      />

      <ModalSheet visible={editing !== null} onClose={() => setEditing(null)} maxHeight="85%">
        <ModalSheetHeader
          title="Reschedule visit"
          subtitle={editing?.propertyTitle}
          onClose={() => setEditing(null)}
        />
        <View style={styles.sheetBody}>
          <DateSlotPicker
            date={date}
            time={time}
            onChangeDate={(d) => {
              setDate(d);
              if (time && isSlotPast(d, time)) setTime("");
            }}
            onChangeTime={setTime}
          />
          <Button label="Save new time" onPress={saveReschedule} loading={busy} disabled={!date || !time} fullWidth />
        </View>
      </ModalSheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  segment: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing["4xl"], gap: spacing.md, flexGrow: 1 },
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
  meta: { ...type.caption, color: colors.inkMuted },
  when: {
    flexDirection: "row",
    gap: spacing.xl,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSubtle,
  },
  whenItem: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  whenText: { ...type.label, color: colors.ink },
  actions: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  sheetBody: { paddingHorizontal: spacing.xl, paddingBottom: spacing.lg, gap: spacing.xl },
});
