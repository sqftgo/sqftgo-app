import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { BellOff, ChevronRight } from "@/components/ui/icons";

import { ModalSheet, ModalSheetHeader } from "@/components/ui/modal-sheet";
import { useApp } from "@/context/AppContext";
import { seedNotifications, type AppNotification } from "@/data/notifications";
import { isApiMode } from "@/lib/api/config";
import {
  apiListNotifications,
  apiMarkAllNotificationsRead,
  apiMarkNotificationRead,
} from "@/lib/api/services/notifications";
import { colors, radius, spacing, type } from "@/theme/tokens";

const NOTIFICATIONS_KEY = ["notifications"] as const;

/** Owns notification state; pass the result into NotificationsSheet. */
export function useNotifications() {
  const { isLoggedIn } = useApp();
  const queryClient = useQueryClient();
  const [local, setLocal] = useState<AppNotification[]>(seedNotifications);

  const query = useQuery({
    queryKey: NOTIFICATIONS_KEY,
    queryFn: apiListNotifications,
    enabled: isApiMode && isLoggedIn,
    refetchInterval: 2 * 60_000,
  });

  const notifications = isApiMode ? (isLoggedIn ? (query.data ?? []) : []) : local;
  const unreadCount = notifications.filter((n) => !n.read).length;

  const update = (fn: (list: AppNotification[]) => AppNotification[]) => {
    if (isApiMode) queryClient.setQueryData<AppNotification[]>(NOTIFICATIONS_KEY, (prev) => fn(prev ?? []));
    else setLocal(fn);
  };

  const markRead = (id: string) => {
    if (notifications.find((n) => n.id === id)?.read) return;
    update((list) => list.map((n) => (n.id === id ? { ...n, read: true } : n)));
    if (isApiMode) {
      apiMarkNotificationRead(id).catch(() => void queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY }));
    }
  };

  const markAllRead = () => {
    update((list) => list.map((n) => ({ ...n, read: true })));
    if (isApiMode) {
      apiMarkAllNotificationsRead().catch(() => void queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY }));
    }
  };

  return { notifications, unreadCount, markRead, markAllRead, refresh: () => void query.refetch() };
}

interface NotificationsSheetProps {
  visible: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  unreadCount: number;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
}

export function NotificationsSheet({
  visible,
  onClose,
  notifications,
  unreadCount,
  onMarkRead,
  onMarkAllRead,
}: NotificationsSheetProps) {
  const router = useRouter();
  const open = (item: AppNotification) => {
    onMarkRead(item.id);
    if (!item.href) return;
    onClose();
    router.push(item.href);
  };

  const markAllAction = unreadCount > 0 ? (
    <Pressable onPress={onMarkAllRead} hitSlop={8} accessibilityRole="button">
      <Text style={{ ...type.label, color: colors.accent }}>Mark all read</Text>
    </Pressable>
  ) : undefined;

  return (
    <ModalSheet visible={visible} onClose={onClose} maxHeight="75%">
      <ModalSheetHeader
        title="Notifications"
        rightAction={markAllAction}
        onClose={onClose}
      />

      {notifications.length === 0 ? (
        <View style={{ alignItems: "center", padding: spacing.xxl, gap: spacing.md }}>
          <BellOff size={28} color={colors.inkMuted} />
          <Text style={{ ...type.body, color: colors.inkMuted }}>You are all caught up.</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: spacing.xl,
            paddingBottom: spacing.xl,
            gap: spacing.md,
          }}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => open(item)}
              accessibilityRole="button"
              accessibilityLabel={item.title}
              accessibilityHint={item.href ? "Opens the related screen" : undefined}
              style={({ pressed }) => ({
                flexDirection: "row",
                gap: spacing.md,
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: radius.lg,
                borderCurve: "continuous",
                padding: spacing.lg,
                opacity: pressed ? 0.8 : 1,
              })}
            >
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: radius.full,
                  marginTop: 6,
                  backgroundColor: item.read ? colors.border : colors.accent,
                }}
              />
              <View style={{ flex: 1, gap: spacing.xs }}>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: spacing.sm,
                  }}
                >
                  <Text
                    numberOfLines={1}
                    style={{ ...type.emphasis, color: colors.ink, flex: 1 }}
                  >
                    {item.title}
                  </Text>
                  <Text style={{ ...type.caption, color: colors.inkMuted }}>{item.time}</Text>
                </View>
                <Text style={{ ...type.caption, color: colors.inkSecondary }}>
                  {item.message}
                </Text>
              </View>
              {item.href ? <ChevronRight size={16} color={colors.inkMuted} style={{ alignSelf: "center" }} /> : null}
            </Pressable>
          )}
        />
      )}
    </ModalSheet>
  );
}
