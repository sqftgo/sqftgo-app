import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter, type Href } from "expo-router";
import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

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
import { Calendar, Lock, Store } from "@/components/ui/icons";
import { useApp } from "@/context/AppContext";
import { useMyServiceProfile } from "@/hooks/use-my-service-profile";
import { isApiMode } from "@/lib/api/config";
import { serviceProviderDenial } from "@/lib/service-access";
import { userFacingError } from "@/lib/errors";
import { apiGetMyServiceVerification, apiSubmitServiceVerification } from "@/lib/api/services/services";
import { colors, radius, spacing, type } from "@/theme/tokens";

type Tab = "bookings" | "profile" | "verification";

const VERIFICATION: Record<string, { label: string; tone: BadgeTone }> = {
  approved: { label: "Verified", tone: "success" },
  verified: { label: "Verified", tone: "success" },
  pending: { label: "In review", tone: "warning" },
  rejected: { label: "Not approved", tone: "danger" },
};

export default function ManageServiceScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { updateDirectoryProfile, isLoggedIn, serviceAccess } = useApp();
  const mine = useMyServiceProfile();
  const profile = mine.profile;
  const [tab, setTab] = useState<Tab>("bookings");

  const verificationQuery = useQuery({
    queryKey: ["service-verification", "mine"],
    queryFn: apiGetMyServiceVerification,
    enabled: isApiMode && isLoggedIn && Boolean(profile?.id),
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

  const submitVerification = useMutation({
    mutationFn: () =>
      apiSubmitServiceVerification({ businessRegistrationId: regId.trim() || null, ownerNotes: notes.trim() }),
    onSuccess: (v) => {
      queryClient.setQueryData(["service-verification", "mine"], v);
      setNotes("");
      toast("Sent for review");
    },
    onError: (e) => appAlert("Couldn't submit", userFacingError(e, "Try again.")),
  });

  if (!isLoggedIn) {
    return (
      <Screen title="Your service profile" fallbackHref="/(tabs)/services">
        <EmptyState
          icon={Lock}
          title="Sign in required"
          message="Sign in to manage bookings, details and verification."
          actionLabel="Sign in"
          onAction={() =>
            router.push({ pathname: "/auth", params: { mode: "sign-in" } } as unknown as Href)
          }
        />
      </Screen>
    );
  }

  if (
    serviceAccess === "pending" ||
    serviceAccess === "rejected" ||
    serviceAccess === "inactive" ||
    serviceAccess === "suspended"
  ) {
    return (
      <Screen title="Service dashboard" fallbackHref="/(tabs)/services">
        <EmptyState
          icon={Lock}
          title="Dashboard unavailable"
          message={serviceProviderDenial(serviceAccess)}
        />
      </Screen>
    );
  }

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

  const vStatus = verification?.status ?? profile.verificationStatus ?? "unverified";
  const vMeta = VERIFICATION[vStatus] ?? { label: "Not verified", tone: "neutral" as BadgeTone };

  return (
    <Screen
      title={profile.firmName}
      subtitle={`${profile.category} · ${profile.city}`}
      fallbackHref="/(tabs)/services"
      refreshing={verificationQuery.isRefetching}
      onRefresh={() => {
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
          { value: "bookings", label: "Bookings" },
          { value: "profile", label: "Details" },
          { value: "verification", label: "Verification" },
        ]}
        value={tab}
        onChange={setTab}
      />

      {tab === "bookings" ? (
        <EmptyState
          icon={Calendar}
          title="Bookings live on your dashboard"
          message="Accept, reject, reschedule and complete requests from the service dashboard. Those actions are checked against your real booking records."
          actionLabel={serviceAccess === "approved" ? "Open dashboard" : undefined}
          onAction={serviceAccess === "approved" ? () => router.push("/services/dashboard" as Href) : undefined}
        />
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
