import React, { useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter, type Href } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Inbox, MessageSquare, X } from "lucide-react-native";

import { EmptyState } from "@/components/ui/empty-state";
import { useApp } from "@/context/AppContext";
import type { Inquiry } from "@/data/types";
import { colors, radius, shadow, spacing, type } from "@/theme/tokens";

export default function BrokerInquiriesScreen() {
  const router = useRouter();
  const { inquiries, userEmail, replyInquiry, dismissInquiry } = useApp();
  const [replyTarget, setReplyTarget] = useState<Inquiry | null>(null);
  const [replyText, setReplyText] = useState("");

  const open = useMemo(
    () =>
      inquiries.filter((i) => i.brokerEmail === userEmail && i.status === "open"),
    [inquiries, userEmail],
  );

  const handleReply = () => {
    if (!replyTarget || !replyText.trim()) {
      Alert.alert("Reply required", "Write a short reply before sending.");
      return;
    }
    replyInquiry(replyTarget.id, replyText);
    setReplyTarget(null);
    setReplyText("");
    Alert.alert("Sent", "Your reply was saved. This lead is marked as replied.");
  };

  const handleDismiss = (id: string) => {
    Alert.alert("Dismiss inquiry", "Remove this lead from your open inbox?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Dismiss",
        style: "destructive",
        onPress: () => dismissInquiry(id),
      },
    ]);
  };

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.lg, gap: spacing.xs }}>
        <Text style={{ ...type.title, color: colors.ink }}>Inquiries</Text>
        <Text style={{ ...type.caption, color: colors.inkMuted }}>
          {open.length === 0
            ? "Buyer leads on your active listings"
            : `${open.length} open lead${open.length === 1 ? "" : "s"}`}
        </Text>
      </View>

      <FlatList
        data={open}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: spacing.xl,
          paddingTop: spacing.lg,
          paddingBottom: spacing.xxl,
          gap: spacing.md,
          flexGrow: 1,
        }}
        ListEmptyComponent={
          <EmptyState
            icon={Inbox}
            title="Inbox clear"
            message="When buyers submit an inquiry on your Active listings, they show up here."
            actionLabel="View dashboard"
            onAction={() => router.push("/(tabs)/dashboard" as Href)}
          />
        }
        renderItem={({ item }) => (
          <View
            style={{
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: radius.lg,
              borderCurve: "continuous",
              padding: spacing.md,
              gap: spacing.sm,
              boxShadow: shadow.card,
            }}
          >
            <Text style={{ ...type.emphasis, color: colors.ink }} numberOfLines={2}>
              {item.propertyTitle}
            </Text>
            <Text style={{ ...type.caption, color: colors.inkMuted }}>
              From {item.buyerEmail}
              {item.buyerPhone ? ` · ${item.buyerPhone}` : ""}
            </Text>
            <Text style={{ ...type.body, color: colors.inkSecondary }}>{item.message}</Text>
            <Text style={{ ...type.micro, color: colors.inkMuted }}>
              {new Date(item.createdAt).toLocaleString()}
            </Text>
            <View style={{ flexDirection: "row", gap: spacing.sm, marginTop: spacing.xs }}>
              <Pressable
                onPress={() => {
                  setReplyTarget(item);
                  setReplyText("");
                }}
                style={({ pressed }) => ({
                  flex: 1,
                  height: 42,
                  borderRadius: radius.md,
                  backgroundColor: colors.accent,
                  alignItems: "center",
                  justifyContent: "center",
                  flexDirection: "row",
                  gap: spacing.xs,
                  opacity: pressed ? 0.85 : 1,
                })}
              >
                <MessageSquare size={14} color={colors.onAccent} />
                <Text style={{ ...type.label, color: colors.onAccent }}>Reply</Text>
              </Pressable>
              <Pressable
                onPress={() => handleDismiss(item.id)}
                style={({ pressed }) => ({
                  flex: 1,
                  height: 42,
                  borderRadius: radius.md,
                  backgroundColor: colors.surfaceSubtle,
                  borderWidth: 1,
                  borderColor: colors.border,
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: pressed ? 0.85 : 1,
                })}
              >
                <Text style={{ ...type.label, color: colors.inkMuted }}>Dismiss</Text>
              </Pressable>
            </View>
          </View>
        )}
      />

      <Modal
        visible={!!replyTarget}
        transparent
        animationType="fade"
        onRequestClose={() => setReplyTarget(null)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: colors.overlay,
            justifyContent: "flex-end",
          }}
        >
          <View
            style={{
              backgroundColor: colors.surface,
              borderTopLeftRadius: radius.xl,
              borderTopRightRadius: radius.xl,
              padding: spacing.xl,
              gap: spacing.md,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Text style={{ ...type.heading, color: colors.ink }}>Reply to buyer</Text>
              <Pressable onPress={() => setReplyTarget(null)} hitSlop={8}>
                <X size={20} color={colors.inkMuted} />
              </Pressable>
            </View>
            <Text style={{ ...type.caption, color: colors.inkMuted }} numberOfLines={2}>
              {replyTarget?.propertyTitle}
            </Text>
            <TextInput
              value={replyText}
              onChangeText={setReplyText}
              placeholder="Thanks for your interest — available for a site visit this weekend..."
              placeholderTextColor={colors.inkMuted}
              multiline
              style={{
                minHeight: 100,
                textAlignVertical: "top",
                backgroundColor: colors.surfaceSubtle,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: radius.md,
                padding: spacing.md,
                ...type.body,
                color: colors.ink,
              }}
            />
            <Pressable
              onPress={handleReply}
              style={({ pressed }) => ({
                height: 48,
                borderRadius: radius.md,
                backgroundColor: colors.accent,
                alignItems: "center",
                justifyContent: "center",
                opacity: pressed ? 0.85 : 1,
              })}
            >
              <Text style={{ ...type.emphasis, color: colors.onAccent }}>Send reply</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
