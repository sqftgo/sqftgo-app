import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Href } from "expo-router";
import React, { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { useProviderBlock } from "@/components/provider-block";
import { Button, EmptyState, ErrorState, ListSkeleton, Screen, StatusBadge, TextField, toast } from "@/components/ds";
import { appAlert } from "@/components/ui/app-alert";
import { Store } from "@/components/ui/icons";
import { listProviderServices, saveProviderService, type ProviderServiceItem } from "@/lib/api/services/provider";
import { formatInr } from "@/lib/booking-status";
import { userFacingError } from "@/lib/errors";
import { colors, radius, spacing, type } from "@/theme/tokens";

const blank = { id: null as string | null, name: "", description: "", price: "", duration: "60", active: true };

export default function ServiceCatalogScreen() {
  const blocked = useProviderBlock("My services");
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["provider-services", "mine"],
    queryFn: () => listProviderServices(null),
    enabled: blocked == null,
  });
  const [form, setForm] = useState(blank);

  const save = useMutation({
    mutationFn: () =>
      saveProviderService({
        id: form.id,
        name: form.name.trim(),
        description: form.description.trim(),
        priceInr: form.price.trim() ? Number(form.price) : null,
        durationMinutes: Number(form.duration) || 60,
        active: form.active,
      }),
    onSuccess: (rows) => {
      queryClient.setQueryData(["provider-services", "mine"], rows);
      setForm(blank);
      toast("Service saved");
    },
    onError: (error) => appAlert("Couldn't save service", userFacingError(error, "Check the name and price.")),
  });

  if (blocked) return blocked;
  if (query.isLoading) {
    return (
      <Screen title="My services" fallbackHref={"/services/dashboard" as Href}>
        <ListSkeleton rows={4} />
      </Screen>
    );
  }
  if (query.isError) {
    return (
      <Screen title="My services" fallbackHref={"/services/dashboard" as Href}>
        <ErrorState onRetry={() => void query.refetch()} />
      </Screen>
    );
  }

  const edit = (item: ProviderServiceItem) =>
    setForm({
      id: item.id,
      name: item.name,
      description: item.description ?? "",
      price: item.priceInr == null ? "" : String(item.priceInr),
      duration: String(item.durationMinutes),
      active: item.active,
    });

  return (
    <Screen
      title="My services"
      subtitle="Price changes apply to new requests. Past bookings keep the amount already stored."
      fallbackHref={"/services/dashboard" as Href}
      refreshing={query.isRefetching}
      onRefresh={() => void query.refetch()}
    >
      {(query.data ?? []).length === 0 ? (
        <EmptyState icon={Store} title="No priced services yet" message="Add the services customers can request. Names already on your profile are copied here the first time you open this screen." />
      ) : (
        (query.data ?? []).map((item) => (
          <View key={item.id} style={styles.card}>
            <View style={styles.top}>
              <Text style={styles.name}>{item.name}</Text>
              <StatusBadge label={item.active ? "Listed" : "Hidden"} tone={item.active ? "success" : "neutral"} />
            </View>
            <Text style={styles.meta}>{formatInr(item.priceInr)} · {item.durationMinutes} min</Text>
            {item.description ? <Text style={styles.body}>{item.description}</Text> : null}
            <Button label="Edit" variant="secondary" onPress={() => edit(item)} />
          </View>
        ))
      )}

      <Text style={styles.heading}>{form.id ? "Edit service" : "Add a service"}</Text>
      <TextField label="Name" value={form.name} onChangeText={(name) => setForm((current) => ({ ...current, name }))} />
      <TextField label="Description" multiline value={form.description} onChangeText={(description) => setForm((current) => ({ ...current, description }))} />
      <TextField label="Price in INR" keyboardType="numeric" value={form.price} onChangeText={(price) => setForm((current) => ({ ...current, price }))} placeholder="Leave blank if you quote later" />
      <TextField label="Duration in minutes" keyboardType="numeric" value={form.duration} onChangeText={(duration) => setForm((current) => ({ ...current, duration }))} />
      <Button label={form.active ? "Visible on profile" : "Hidden from profile"} variant="tertiary" onPress={() => setForm((current) => ({ ...current, active: !current.active }))} />
      <Button label={form.id ? "Save changes" : "Add service"} size="lg" loading={save.isPending} onPress={() => save.mutate()} />
      {form.id ? <Button label="Cancel edit" variant="secondary" onPress={() => setForm(blank)} /> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.xs,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  top: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm },
  name: { ...type.emphasis, color: colors.ink, flex: 1 },
  body: { ...type.body, color: colors.inkSecondary },
  meta: { ...type.caption, color: colors.inkMuted },
  heading: { ...type.heading, color: colors.ink },
});
