import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter, type Href } from "expo-router";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { useProviderBlock } from "@/components/provider-block";
import { Button, EmptyState, ErrorState, ListSkeleton, Screen } from "@/components/ds";
import { Bell } from "@/components/ui/icons";
import { isApiMode } from "@/lib/api/config";
import { apiListNotifications, apiMarkNotificationRead } from "@/lib/api/services/notifications";
import { colors, radius, spacing, type } from "@/theme/tokens";

export default function ProviderNotificationsScreen() {
  const router = useRouter();
  const blocked = useProviderBlock("Notifications");
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["notifications"],
    queryFn: apiListNotifications,
    enabled: blocked == null && isApiMode,
  });

  if (blocked) return blocked;

  const items = isApiMode ? (query.data ?? []) : [];

  return (
    <Screen
      title="Notifications"
      subtitle="Updates stored for this account"
      fallbackHref={"/services/dashboard" as Href}
      refreshing={query.isRefetching}
      onRefresh={isApiMode ? () => void query.refetch() : undefined}
    >
      {!isApiMode ? (
        <EmptyState icon={Bell} title="Notifications need a connection" message="Booking updates are delivered from SqftGo servers." />
      ) : query.isLoading ? (
        <ListSkeleton rows={4} />
      ) : query.isError ? (
        <ErrorState onRetry={() => void query.refetch()} />
      ) : items.length === 0 ? (
        <EmptyState icon={Bell} title="No notifications yet" message="Accepting, rejecting and completing a booking notifies the other person." />
      ) : (
        items.map((item) => (
          <View key={item.id} style={styles.card}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.body}>{item.message}</Text>
            <Text style={styles.meta}>{item.time}{item.read ? "" : " · Unread"}</Text>
            {item.href ? (
              <Button
                label="Open"
                variant="secondary"
                onPress={() => {
                  if (!item.read) {
                    void apiMarkNotificationRead(item.id).finally(() => {
                      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
                    });
                  }
                  router.push(item.href!);
                }}
              />
            ) : null}
          </View>
        ))
      )}
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
  title: { ...type.emphasis, color: colors.ink },
  body: { ...type.body, color: colors.inkSecondary },
  meta: { ...type.caption, color: colors.inkMuted },
});
