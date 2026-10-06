import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter, type Href } from "expo-router";
import React, { useEffect, useState } from "react";
import { Linking, StyleSheet, Text, View } from "react-native";

import {
  Button,
  EmptyState,
  ErrorState,
  ListSkeleton,
  Screen,
  SegmentedControl,
  StatusBadge,
  TextField,
  toast,
  type BadgeTone,
} from "@/components/ds";
import { appAlert } from "@/components/ui/app-alert";
import { Calendar, Phone, Store } from "@/components/ui/icons";
import { useApp } from "@/context/AppContext";
import { useMyServiceProfile } from "@/hooks/use-my-service-profile";
import { isApiMode } from "@/lib/api/config";
import {
  apiGetMyServiceVerification,
  apiListOwnerServiceBookings,
  apiSubmitServiceVerification,
  apiUpdateServiceBooking,
  type ServiceBooking,
  type ServiceBookingStatus,
} from "@/lib/api/services/services";
import { colors, radius, spacing, type } from "@/theme/tokens";

type Tab = "bookings" | "profile" | "verification";

const BOOKING_LABEL: Record<ServiceBookingStatus, string> = {
  pending: "New request",
  confirmed: "Confirmed",
  cancelled: "Declined",
  completed: "Completed",
};

const VERIFICATION: Record<string, { label: string; tone: BadgeTone }> = {
  approved: { label: "Verified", tone: "success" },
  verified: { label: "Verified", tone: "success" },
  pending: { label: "In review", tone: "warning" },
  rejected: { label: "Not approved", tone: "danger" },
};

function formatWhen(iso: string) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleString("en-IN", { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
}

export default function ManageServiceScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { updateDirectoryProfile } = useApp();
  const mine = useMyServiceProfile();
  const profile = mine.profile;
  const [tab, setTab] = useState<Tab>("bookings");

  const bookingsQuery = useQuery({
    queryKey: ["service-bookings", "owner", profile?.id],
    queryFn: () => apiListOwnerServiceBookings(profile!.id),
    enabled: isApiMode && Boolean(profile?.id),
  });
  const verificationQuery = useQuery({
    queryKey: ["service-verification", "mine"],
    queryFn: apiGetMyServiceVerification,
    enabled: isApiMode && Boolean(profile?.id),
  });
  const verification = verificationQuery.data;

  const [details, setDetails] = useState({ description: "", address: "", mobile: "", website: "", offerings: "" });
  const [regId, setRegId] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setDetails({
      description: profile.description ?? "",
      address: profile.address ?? "",
      mobile: profile.mobile ?? "",
      website: profile.website ?? "",
      offerings: (profile.servicesOffered ?? []).join(", "),
    });
  }, [profile]);
  useEffect(() => {
    if (verification?.businessRegistrationId) setRegId(verification.businessRegistrationId);
  }, [verification?.businessRegistrationId]);

  const updateBooking = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ServiceBookingStatus }) =>
      apiUpdateServiceBooking(id, { status }),
    onSuccess: (updated) => {
      queryClient.setQueryData<ServiceBooking[]>(["service-bookings", "owner", profile?.id], (prev) =>
        prev?.map((b) => (b.id === updated.id ? updated : b)),
      );
      toast(`Booking ${BOOKING_LABEL[updated.status].toLowerCase()}`);
    },
    onError: (e) => appAlert("Couldn't update booking", e instanceof Error ? e.message : "Try again."),
  });

  const submitVerification = useMutation({
    mutationFn: () =>
      apiSubmitServiceVerification({ businessRegistrationId: regId.trim() || null, ownerNotes: notes.trim() }),
    onSuccess: (v) => {
      queryClient.setQueryData(["service-verification", "mine"], v);
      setNotes("");
      toast("Sent for review");
    },
    onError: (e) => appAlert("Couldn't submit", e instanceof Error ? e.message : "Try again."),
  });

  if (mine.isLoading) {
    return (
      <Screen title="Your service profile" fallbackHref="/(tabs)/services">
        <ListSkeleton rows={5} />
      </Screen>
    );
  }

  if (!profile) {
    return (
      <Screen title="Your service profile" fallbackHref="/(tabs)/services">
        {mine.isError ? (
          <ErrorState onRetry={mine.refetch} />
        ) : (
          <EmptyState
            icon={Store}
            title="No service profile yet"
            message="List your business to receive booking requests from people in your city."
            actionLabel="List your business"
            onAction={() => router.replace("/services/register" as Href)}
          />
        )}
      </Screen>
    );
  }

  const saveDetails = async () => {
    setSaving(true);
    const result = await updateDirectoryProfile(profile.id, {
      description: details.description.trim(),
      address: details.address.trim(),
      mobile: details.mobile.trim(),
      website: details.website.trim(),
      servicesOffered: details.offerings
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    });
    setSaving(false);
    if (!result.ok) {
      appAlert("Couldn't save", result.message ?? "Try again.");
      return;
    }
    void queryClient.invalidateQueries({ queryKey: ["dealers", "mine"] });
    void queryClient.invalidateQueries({ queryKey: ["dealer", profile.id] });
    toast("Profile saved");
  };

  const bookings = bookingsQuery.data ?? [];
  const pendingCount = bookings.filter((b) => b.status === "pending").length;
  const vStatus = verification?.status ?? profile.verificationStatus ?? "unverified";
  const vMeta = VERIFICATION[vStatus] ?? { label: "Not verified", tone: "neutral" as BadgeTone };

  return (
    <Screen
      title={profile.firmName}
      subtitle={`${profile.category} · ${profile.city}`}
      fallbackHref="/(tabs)/services"
      refreshing={bookingsQuery.isRefetching}
      onRefresh={() => {
        void bookingsQuery.refetch();
        void verificationQuery.refetch();
        mine.refetch();
      }}
    >
      <View style={styles.headerRow}>
        <StatusBadge label={vMeta.label} tone={vMeta.tone} />
        <Button
          label="View public profile"
          variant="tertiary"
          onPress={() => router.push({ pathname: "/service/[id]", params: { id: profile.id } })}
        />
      </View>

      <SegmentedControl
        segments={[
          { value: "bookings", label: "Bookings", count: pendingCount || undefined },
          { value: "profile", label: "Details" },
          { value: "verification", label: "Verification" },
        ]}
        value={tab}
        onChange={setTab}
      />

      {tab === "bookings" ? (
        !isApiMode ? (
          <EmptyState icon={Calendar} title="Bookings need a connection" message="Booking requests sync from SqftGo servers." />
        ) : bookingsQuery.isLoading ? (
          <ListSkeleton rows={3} />
        ) : bookingsQuery.isError ? (
          <ErrorState onRetry={() => void bookingsQuery.refetch()} />
        ) : bookings.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title="No booking requests yet"
            message="When someone books a visit from your profile, it shows up here."
          />
        ) : (
          <View style={styles.list}>
            {bookings.map((b) => {
              const busy = updateBooking.isPending && updateBooking.variables?.id === b.id;
              return (
                <View key={b.id} style={styles.card}>
                  <View style={styles.cardTop}>
                    <Text style={styles.when}>{formatWhen(b.preferredAt)}</Text>
                    <StatusBadge label={BOOKING_LABEL[b.status]} />
                  </View>
                  {b.message ? <Text style={styles.body}>{b.message}</Text> : null}
                  <Button
                    label={b.contactPhone}
                    icon={Phone}
                    variant="tertiary"
                    onPress={() => void Linking.openURL(`tel:${b.contactPhone.replace(/\s/g, "")}`)}
                  />
                  {b.status === "pending" ? (
                    <View style={styles.actions}>
                      <Button
                        label="Decline"
                        variant="secondary"
                        disabled={busy}
                        onPress={() => updateBooking.mutate({ id: b.id, status: "cancelled" })}
                        style={styles.flex}
                      />
                      <Button
                        label="Confirm"
                        loading={busy}
                        onPress={() => updateBooking.mutate({ id: b.id, status: "confirmed" })}
                        style={styles.flex}
                      />
                    </View>
                  ) : b.status === "confirmed" ? (
                    <Button
                      label="Mark completed"
                      variant="secondary"
                      loading={busy}
                      onPress={() => updateBooking.mutate({ id: b.id, status: "completed" })}
                    />
                  ) : null}
                </View>
              );
            })}
          </View>
        )
      ) : null}

      {tab === "profile" ? (
        <View style={styles.list}>
          <TextField
            label="About your work"
            multiline
            maxLength={5000}
            value={details.description}
            onChangeText={(v) => setDetails((d) => ({ ...d, description: v }))}
          />
          <TextField label="Address" value={details.address} onChangeText={(v) => setDetails((d) => ({ ...d, address: v }))} />
          <TextField
            label="Mobile"
            keyboardType="phone-pad"
            value={details.mobile}
            onChangeText={(v) => setDetails((d) => ({ ...d, mobile: v }))}
          />
          <TextField
            label="Website"
            autoCapitalize="none"
            keyboardType="url"
            value={details.website}
            onChangeText={(v) => setDetails((d) => ({ ...d, website: v }))}
          />
          <TextField
            label="Services offered"
            hint="Separate with commas"
            value={details.offerings}
            onChangeText={(v) => setDetails((d) => ({ ...d, offerings: v }))}
          />
          <Button label="Save details" size="lg" loading={saving} onPress={() => void saveDetails()} />
        </View>
      ) : null}

      {tab === "verification" ? (
        <View style={styles.list}>
          <Text style={styles.body}>
            {vStatus === "approved" || vStatus === "verified"
              ? "Your business is verified. The badge shows on your public profile."
              : vStatus === "pending"
                ? "Our team is reviewing your details. Your profile stays visible meanwhile."
                : "Add your registration details to earn the verified badge."}
          </Text>
          {verification?.rejectionReason ? (
            <View style={styles.warn}>
              <Text style={styles.body}>Not approved: {verification.rejectionReason}</Text>
            </View>
          ) : null}
          {isApiMode ? (
            <>
              <TextField
                label="Business registration or GST ID"
                autoCapitalize="characters"
                value={regId}
                onChangeText={setRegId}
              />
              <TextField label="Notes for our team" multiline value={notes} onChangeText={setNotes} />
              <Button
                label={vStatus === "approved" ? "Verified" : "Submit for verification"}
                size="lg"
                disabled={vStatus === "approved"}
                loading={submitVerification.isPending}
                onPress={() => submitVerification.mutate()}
              />
            </>
          ) : null}
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  list: { gap: spacing.md },
  card: {
    gap: spacing.sm,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm },
  when: { ...type.emphasis, color: colors.ink, flex: 1 },
  body: { ...type.body, color: colors.inkSecondary },
  actions: { flexDirection: "row", gap: spacing.sm },
  flex: { flex: 1 },
  warn: {
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.warningSoft,
    borderWidth: 1,
    borderColor: colors.warningBorder,
  },
});
