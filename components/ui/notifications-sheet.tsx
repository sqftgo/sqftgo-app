import React, { useState } from "react";
import { FlatList, Modal, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BellOff, X } from "lucide-react-native";

import { seedNotifications, type AppNotification } from "@/data/notifications";
import { colors, radius, shadow, spacing, type } from "@/theme/tokens";

/** Owns notification state; pass the result into NotificationsSheet. */
export function useNotifications() {
  const [notifications, setNotifications] = useState<AppNotification[]>(seedNotifications);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markRead = (id: string) =>
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));

  const markAllRead = () => setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

  return { notifications, unreadCount, markRead, markAllRead };
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
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: colors.overlay, justifyContent: "flex-end" }}>
        <Pressable style={{ flex: 1 }} onPress={onClose} accessibilityLabel="Dismiss notifications" />

        <View
          style={{
            backgroundColor: colors.bg,
            borderTopLeftRadius: radius.xl + 4,
            borderTopRightRadius: radius.xl + 4,
            borderCurve: "continuous",
            maxHeight: "75%",
            paddingBottom: insets.bottom + spacing.md,
            boxShadow: shadow.raised,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: spacing.xl,
              paddingTop: spacing.xl,
              paddingBottom: spacing.lg,
            }}
          >
            <Text style={{ ...type.title, color: colors.ink }}>Notifications</Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.lg }}>
              {unreadCount > 0 && (
                <Pressable onPress={onMarkAllRead} hitSlop={8} accessibilityRole="button">
                  <Text style={{ ...type.label, color: colors.accent }}>Mark all read</Text>
                </Pressable>
              )}
              <Pressable
                onPress={onClose}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Close notifications"
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: radius.full,
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.border,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <X size={16} color={colors.inkSecondary} />
              </Pressable>
            </View>
          </View>

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
                  onPress={() => onMarkRead(item.id)}
                  accessibilityRole="button"
                  accessibilityLabel={item.title}
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
                </Pressable>
              )}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}
