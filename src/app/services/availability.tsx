import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Href } from "expo-router";
import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { useProviderBlock } from "@/components/provider-block";
import { Button, DateTimeField, EmptyState, ErrorState, ListSkeleton, Screen, TextField, toast } from "@/components/ds";
import { appAlert } from "@/components/ui/app-alert";
import { Calendar } from "@/components/ui/icons";
import {
  DAY_LABEL,
  WEEK_DAYS,
  addAvailabilityBlock,
  defaultWeekHours,
  providerSchedule,
  removeAvailabilityBlock,
  saveProviderHours,
  type DayHours,
  type WeekHours,
} from "@/lib/api/services/provider";
import { formatBookingWhen } from "@/lib/booking-status";
import { userFacingError } from "@/lib/errors";
import { colors, radius, spacing, type } from "@/theme/tokens";

function normalizeHours(value: WeekHours | null): WeekHours {
  const next = defaultWeekHours();
  if (!value) return next;
  for (const day of WEEK_DAYS) {
    const item = value[day];
    if (!item || typeof item !== "object") continue;
    next[day] = {
      closed: Boolean(item.closed),
      open: typeof item.open === "string" && item.open ? item.open : next[day].open,
      close: typeof item.close === "string" && item.close ? item.close : next[day].close,
    };
  }
  return next;
}

function nextDayAt(hour: number) {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  date.setHours(hour, 0, 0, 0);
  return date;
}

export default function AvailabilityScreen() {
  const blocked = useProviderBlock("Availability");
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["provider-schedule"],
    queryFn: providerSchedule,
    enabled: blocked == null,
  });
  const [hours, setHours] = useState<WeekHours>(defaultWeekHours);
  const [starts, setStarts] = useState(nextDayAt(9));
  const [ends, setEnds] = useState(nextDayAt(18));
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (!query.data) return;
    setHours(normalizeHours(query.data.hours));
  }, [query.data]);

  const saveHours = useMutation({
    mutationFn: () => saveProviderHours(hours),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["provider-schedule"] });
      toast("Working hours saved");
    },
    onError: (error) => appAlert("Couldn't save hours", userFacingError(error, "Check each open and close time.")),
  });

  const addBlock = useMutation({
    mutationFn: () => addAvailabilityBlock({ startsAt: starts.toISOString(), endsAt: ends.toISOString(), reason }),
    onSuccess: (schedule) => {
      queryClient.setQueryData(["provider-schedule"], schedule);
      setReason("");
      toast("Date blocked");
    },
    onError: (error) => appAlert("Couldn't block that time", userFacingError(error, "Try again.")),
  });

  const removeBlock = useMutation({
    mutationFn: (id: string) => removeAvailabilityBlock(id),
    onSuccess: (schedule) => {
      queryClient.setQueryData(["provider-schedule"], schedule);
      toast("Block removed");
    },
    onError: (error) => appAlert("Couldn't remove the block", userFacingError(error, "Try again.")),
  });

  if (blocked) return blocked;
  if (query.isLoading) {
    return (
      <Screen title="Availability" fallbackHref={"/services/dashboard" as Href}>
        <ListSkeleton rows={6} />
      </Screen>
    );
  }
  if (query.isError) {
    return (
      <Screen title="Availability" fallbackHref={"/services/dashboard" as Href}>
        <ErrorState onRetry={() => void query.refetch()} />
      </Screen>
    );
  }

  const schedule = query.data;
  const setDay = (day: (typeof WEEK_DAYS)[number], patch: Partial<DayHours>) => {
    setHours((current) => ({ ...current, [day]: { ...current[day], ...patch } }));
  };

  return (
    <Screen
      title="Availability"
      subtitle="Hours apply to new confirmations. Existing booking times stay as recorded."
      fallbackHref={"/services/dashboard" as Href}
      refreshing={query.isRefetching}
      onRefresh={() => void query.refetch()}
    >
      {WEEK_DAYS.map((day) => (
        <View key={day} style={styles.day}>
          <Text style={styles.dayName}>{DAY_LABEL[day]}</Text>
          <Button
            label={hours[day].closed ? "Closed" : "Open"}
            variant={hours[day].closed ? "secondary" : "tertiary"}
            onPress={() => setDay(day, { closed: !hours[day].closed })}
          />
          {hours[day].closed ? null : (
            <View style={styles.times}>
              <TextField label="Opens" value={hours[day].open} onChangeText={(open) => setDay(day, { open })} placeholder="09:00" />
              <TextField label="Closes" value={hours[day].close} onChangeText={(close) => setDay(day, { close })} placeholder="18:00" />
            </View>
          )}
        </View>
      ))}
      <Button label="Save working hours" size="lg" loading={saveHours.isPending} onPress={() => saveHours.mutate()} />

      <Text style={styles.heading}>Block a date</Text>
      <DateTimeField label="Starts" value={starts} onChange={setStarts} />
      <DateTimeField label="Ends" value={ends} onChange={setEnds} />
      <TextField label="Reason" value={reason} onChangeText={setReason} placeholder="Holiday or site visit" />
      <Button label="Block this time" variant="secondary" loading={addBlock.isPending} onPress={() => addBlock.mutate()} />

      {(schedule?.blocks.length ?? 0) === 0 ? (
        <EmptyState icon={Calendar} title="No blocked dates" message="Confirmed bookings still cannot overlap each other." />
      ) : (
        schedule?.blocks.map((block) => (
          <View key={block.id} style={styles.card}>
            <Text style={styles.body}>{formatBookingWhen(block.startsAt)} – {formatBookingWhen(block.endsAt)}</Text>
            {block.reason ? <Text style={styles.meta}>{block.reason}</Text> : null}
            <Button label="Remove block" variant="tertiary" loading={removeBlock.isPending && removeBlock.variables === block.id} onPress={() => removeBlock.mutate(block.id)} />
          </View>
        ))
      )}

      <Text style={styles.heading}>Confirmed visits</Text>
      {(schedule?.upcoming.length ?? 0) === 0 ? (
        <Text style={styles.meta}>No upcoming confirmed bookings.</Text>
      ) : (
        schedule?.upcoming.map((item) => (
          <View key={item.id} style={styles.card}>
            <Text style={styles.body}>{item.serviceName || "Visit"}</Text>
            <Text style={styles.meta}>{formatBookingWhen(item.preferredAt)}</Text>
          </View>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  day: {
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  dayName: { ...type.emphasis, color: colors.ink },
  times: { gap: spacing.sm },
  heading: { ...type.heading, color: colors.ink, marginTop: spacing.sm },
  card: {
    gap: spacing.xs,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  body: { ...type.body, color: colors.ink },
  meta: { ...type.caption, color: colors.inkMuted },
});
