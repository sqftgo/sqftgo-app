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
import { useLocalSearchParams, useRouter, type Href } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Inbox, MessageSquare, Plus, X } from "lucide-react-native";

import { EmptyState } from "@/components/ui/empty-state";
import { useApp } from "@/context/AppContext";
import type { Inquiry, InquiryStatus, MessageThread } from "@/data/types";
import { ownedPropertyIds, ownsInquiry } from "@/lib/ownership";
import { INQUIRY_STATUS_LABEL } from "@/lib/status-labels";
import { colors, radius, shadow, spacing, type } from "@/theme/tokens";

type MainTab = "inquiries" | "messages";
type InboxFilter = "inbox" | "archived";

const STATUS_STYLE: Record<InquiryStatus, { bg: string; color: string }> = {
  new: { bg: colors.infoSoft, color: colors.info },
  read: { bg: colors.successSoft, color: colors.success },
  archived: { bg: colors.surfaceSubtle, color: colors.inkMuted },
};

export default function CommunicationsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ tab?: string }>();
  const {
    inquiries,
    userEmail,
    profile,
    properties,
    canAccessDealerDashboard,
    replyInquiry,
    archiveInquiry,
    markInquiryRead,
    messageThreads,
    createMessageThread,
    sendThreadMessage,
    messagesByThread,
    loadThreadMessages,
  } = useApp();

  const [mainTab, setMainTab] = useState<MainTab>(
    params.tab === "messages" ? "messages" : "inquiries",
  );
  const [filter, setFilter] = useState<InboxFilter>("inbox");
  const [replyTarget, setReplyTarget] = useState<Inquiry | null>(null);
  const [replyText, setReplyText] = useState("");
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeEmail, setComposeEmail] = useState("");
  const [composeBody, setComposeBody] = useState("");
  const [activeThread, setActiveThread] = useState<MessageThread | null>(null);
  const [threadReply, setThreadReply] = useState("");

  const ownedIds = useMemo(
    () => ownedPropertyIds(properties, { userId: profile?.id, email: userEmail }),
    [properties, profile?.id, userEmail],
  );

  const mine = useMemo(
    () =>
      inquiries.filter((i) =>
        ownsInquiry(i, { email: userEmail, ownedPropertyIds: ownedIds }),
      ),
    [inquiries, userEmail, ownedIds],
  );

  const list = useMemo(() => {
    if (filter === "archived") return mine.filter((i) => i.status === "archived");
    return mine.filter((i) => i.status === "new" || i.status === "read");
  }, [mine, filter]);

  if (!canAccessDealerDashboard) {
    return (
      <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.bg }}>
        <EmptyState
          icon={Inbox}
          title="Dealer access required"
          message="Communications unlock when your role is broker."
          actionLabel="Check dealer status"
          onAction={() => router.push("/dealer-pending" as Href)}
        />
      </SafeAreaView>
    );
  }

  const handleReply = () => {
    if (!replyTarget || !replyText.trim()) {
      Alert.alert("Reply required", "Write a short reply before sending.");
      return;
    }
    replyInquiry(replyTarget.id, replyText);
    setReplyTarget(null);
    setReplyText("");
    Alert.alert("Sent", "Reply saved and lead marked as read.");
  };

  const handleCompose = async () => {
    if (!composeEmail.trim() || !composeBody.trim()) {
      Alert.alert("Missing fields", "Buyer email and message are required.");
      return;
    }
    const thread = await createMessageThread({
      buyerEmail: composeEmail.trim(),
      body: composeBody.trim(),
    });
    if (!thread) {
      Alert.alert("Could not send", "Try again.");
      return;
    }
    setComposeOpen(false);
    setComposeEmail("");
    setComposeBody("");
    setActiveThread(thread);
    await loadThreadMessages(thread.id);
  };

  const handleThreadSend = async () => {
    if (!activeThread || !threadReply.trim()) return;
    await sendThreadMessage(activeThread.id, threadReply.trim());
    setThreadReply("");
  };

  const openThread = async (thread: MessageThread) => {
    setActiveThread(thread);
    await loadThreadMessages(thread.id);
  };

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.lg, gap: spacing.xs }}>
        <Text style={{ ...type.title, color: colors.ink }}>Communications</Text>
        <Text style={{ ...type.caption, color: colors.inkMuted }}>
          Inquiries and message threads with buyers
        </Text>
      </View>

      <View
        style={{
          flexDirection: "row",
          marginHorizontal: spacing.xl,
          marginTop: spacing.md,
          backgroundColor: colors.surfaceSubtle,
          borderRadius: radius.md,
          padding: spacing.xs,
        }}
      >
        {(
          [
            { id: "inquiries", label: "Inquiries" },
            { id: "messages", label: "Messages" },
          ] as const
        ).map((tab) => {
          const active = mainTab === tab.id;
          return (
            <Pressable
              key={tab.id}
              onPress={() => setMainTab(tab.id)}
              style={{
                flex: 1,
                paddingVertical: spacing.sm,
                borderRadius: radius.sm,
                backgroundColor: active ? colors.surface : "transparent",
                alignItems: "center",
              }}
            >
              <Text style={{ ...type.label, color: active ? colors.ink : colors.inkMuted }}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {mainTab === "inquiries" ? (
        <>
          <View
            style={{
              flexDirection: "row",
              marginHorizontal: spacing.xl,
              marginTop: spacing.md,
              gap: spacing.sm,
            }}
          >
            {(
              [
                { id: "inbox", label: "Inbox" },
                { id: "archived", label: "Archived" },
              ] as const
            ).map((tab) => {
              const active = filter === tab.id;
              return (
                <Pressable
                  key={tab.id}
                  onPress={() => setFilter(tab.id)}
                  style={{
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.sm,
                    borderRadius: radius.full,
                    backgroundColor: active ? colors.ink : colors.surface,
                    borderWidth: 1,
                    borderColor: active ? colors.ink : colors.border,
                  }}
                >
                  <Text
                    style={{
                      ...type.caption,
                      fontWeight: "700",
                      color: active ? colors.onAccent : colors.inkSecondary,
                    }}
                  >
                    {tab.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <FlatList
            data={list}
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
                title={filter === "archived" ? "No archived leads" : "Inbox clear"}
                message="When buyers inquire on your Active listings, they show up here."
              />
            }
            renderItem={({ item }) => {
              const tone = STATUS_STYLE[item.status];
              return (
                <Pressable
                  onPress={() => {
                    if (item.status === "new") markInquiryRead(item.id);
                  }}
                  style={{
                    backgroundColor: colors.surface,
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: radius.lg,
                    padding: spacing.md,
                    gap: spacing.sm,
                    boxShadow: shadow.card,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: spacing.sm,
                    }}
                  >
                    <Text style={{ ...type.emphasis, color: colors.ink, flex: 1 }} numberOfLines={2}>
                      {item.propertyTitle}
                    </Text>
                    <View
                      style={{
                        backgroundColor: tone.bg,
                        paddingHorizontal: spacing.sm,
                        paddingVertical: 2,
                        borderRadius: radius.full,
                      }}
                    >
                      <Text style={{ ...type.micro, color: tone.color, fontWeight: "700" }}>
                        {INQUIRY_STATUS_LABEL[item.status]}
                      </Text>
                    </View>
                  </View>
                  <Text style={{ ...type.caption, color: colors.inkMuted }}>
                    {item.buyerName} · {item.buyerEmail}
                  </Text>
                  <Text style={{ ...type.body, color: colors.inkSecondary }}>{item.message}</Text>
                  {item.replyMessage ? (
                    <Text style={{ ...type.caption, color: colors.success }}>
                      You: {item.replyMessage}
                    </Text>
                  ) : null}
                  {filter === "inbox" ? (
                    <View style={{ flexDirection: "row", gap: spacing.sm, marginTop: spacing.xs }}>
                      <Pressable
                        onPress={() => {
                          setReplyTarget(item);
                          setReplyText("");
                        }}
                        style={{
                          flex: 1,
                          height: 42,
                          borderRadius: radius.md,
                          backgroundColor: colors.accent,
                          alignItems: "center",
                          justifyContent: "center",
                          flexDirection: "row",
                          gap: spacing.xs,
                        }}
                      >
                        <MessageSquare size={14} color={colors.onAccent} />
                        <Text style={{ ...type.label, color: colors.onAccent }}>Reply</Text>
                      </Pressable>
                      <Pressable
                        onPress={() =>
                          Alert.alert("Archive inquiry", "Move this lead to archived?", [
                            { text: "Cancel", style: "cancel" },
                            { text: "Archive", onPress: () => archiveInquiry(item.id) },
                          ])
                        }
                        style={{
                          flex: 1,
                          height: 42,
                          borderRadius: radius.md,
                          backgroundColor: colors.surfaceSubtle,
                          borderWidth: 1,
                          borderColor: colors.border,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Text style={{ ...type.label, color: colors.inkMuted }}>Archive</Text>
                      </Pressable>
                    </View>
                  ) : null}
                </Pressable>
              );
            }}
          />
        </>
      ) : (
        <>
          <View
            style={{
              paddingHorizontal: spacing.xl,
              paddingTop: spacing.md,
              flexDirection: "row",
              justifyContent: "flex-end",
            }}
          >
            <Pressable
              onPress={() => setComposeOpen(true)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                backgroundColor: colors.accent,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm,
                borderRadius: radius.full,
              }}
            >
              <Plus size={14} color={colors.onAccent} />
              <Text style={{ ...type.caption, color: colors.onAccent, fontWeight: "700" }}>
                Compose
              </Text>
            </Pressable>
          </View>
          <FlatList
            data={messageThreads}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{
              paddingHorizontal: spacing.xl,
              paddingTop: spacing.md,
              paddingBottom: spacing.xxl,
              gap: spacing.md,
              flexGrow: 1,
            }}
            ListEmptyComponent={
              <EmptyState
                icon={MessageSquare}
                title="No threads yet"
                message="Reply to an inquiry or compose a message by buyer email."
                actionLabel="Compose"
                onAction={() => setComposeOpen(true)}
              />
            }
            renderItem={({ item }) => (
              <Pressable
                onPress={() => void openThread(item)}
                style={{
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: radius.lg,
                  padding: spacing.md,
                  gap: 4,
                  boxShadow: shadow.card,
                }}
              >
                <Text style={{ ...type.emphasis, color: colors.ink }}>
                  {item.buyerName || item.buyerEmail}
                </Text>
                <Text style={{ ...type.caption, color: colors.inkMuted }} numberOfLines={1}>
                  {item.propertyTitle || item.buyerEmail}
                </Text>
                {item.lastMessage ? (
                  <Text style={{ ...type.body, color: colors.inkSecondary }} numberOfLines={2}>
                    {item.lastMessage}
                  </Text>
                ) : null}
              </Pressable>
            )}
          />
        </>
      )}

      <Modal visible={!!replyTarget} transparent animationType="fade" onRequestClose={() => setReplyTarget(null)}>
        <View style={{ flex: 1, backgroundColor: colors.overlay, justifyContent: "flex-end" }}>
          <View
            style={{
              backgroundColor: colors.surface,
              borderTopLeftRadius: radius.xl,
              borderTopRightRadius: radius.xl,
              padding: spacing.xl,
              gap: spacing.md,
            }}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={{ ...type.heading, color: colors.ink }}>Reply to buyer</Text>
              <Pressable onPress={() => setReplyTarget(null)}>
                <X size={20} color={colors.inkMuted} />
              </Pressable>
            </View>
            <TextInput
              value={replyText}
              onChangeText={setReplyText}
              placeholder="Write your reply…"
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
              style={{
                height: 48,
                borderRadius: radius.md,
                backgroundColor: colors.accent,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ ...type.emphasis, color: colors.onAccent }}>Send reply</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal visible={composeOpen} transparent animationType="fade" onRequestClose={() => setComposeOpen(false)}>
        <View style={{ flex: 1, backgroundColor: colors.overlay, justifyContent: "flex-end" }}>
          <View
            style={{
              backgroundColor: colors.surface,
              borderTopLeftRadius: radius.xl,
              borderTopRightRadius: radius.xl,
              padding: spacing.xl,
              gap: spacing.md,
            }}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={{ ...type.heading, color: colors.ink }}>New message</Text>
              <Pressable onPress={() => setComposeOpen(false)}>
                <X size={20} color={colors.inkMuted} />
              </Pressable>
            </View>
            <TextInput
              value={composeEmail}
              onChangeText={setComposeEmail}
              placeholder="Buyer email"
              autoCapitalize="none"
              keyboardType="email-address"
              placeholderTextColor={colors.inkMuted}
              style={{
                backgroundColor: colors.surfaceSubtle,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: radius.md,
                padding: spacing.md,
                ...type.body,
                color: colors.ink,
              }}
            />
            <TextInput
              value={composeBody}
              onChangeText={setComposeBody}
              placeholder="Message"
              multiline
              placeholderTextColor={colors.inkMuted}
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
              onPress={() => void handleCompose()}
              style={{
                height: 48,
                borderRadius: radius.md,
                backgroundColor: colors.accent,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ ...type.emphasis, color: colors.onAccent }}>Send</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal
        visible={!!activeThread}
        transparent
        animationType="slide"
        onRequestClose={() => setActiveThread(null)}
      >
        <View style={{ flex: 1, backgroundColor: colors.bg }}>
          <SafeAreaView edges={["top", "bottom"]} style={{ flex: 1 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingHorizontal: spacing.xl,
                paddingVertical: spacing.md,
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
              }}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ ...type.heading, color: colors.ink }} numberOfLines={1}>
                  {activeThread?.buyerName || activeThread?.buyerEmail}
                </Text>
                <Text style={{ ...type.caption, color: colors.inkMuted }} numberOfLines={1}>
                  {activeThread?.buyerEmail}
                </Text>
              </View>
              <Pressable onPress={() => setActiveThread(null)}>
                <X size={22} color={colors.ink} />
              </Pressable>
            </View>
            <FlatList
              data={activeThread ? messagesByThread[activeThread.id] ?? [] : []}
              keyExtractor={(m) => m.id}
              contentContainerStyle={{ padding: spacing.xl, gap: spacing.sm }}
              renderItem={({ item }) => (
                <View
                  style={{
                    alignSelf: item.senderRole === "broker" ? "flex-end" : "flex-start",
                    maxWidth: "80%",
                    backgroundColor:
                      item.senderRole === "broker" ? colors.accentSoft : colors.surfaceSubtle,
                    padding: spacing.md,
                    borderRadius: radius.lg,
                  }}
                >
                  <Text style={{ ...type.body, color: colors.ink }}>{item.body}</Text>
                  <Text style={{ ...type.micro, color: colors.inkMuted, marginTop: 4 }}>
                    {new Date(item.createdAt).toLocaleString()}
                  </Text>
                </View>
              )}
            />
            <View
              style={{
                flexDirection: "row",
                gap: spacing.sm,
                padding: spacing.lg,
                borderTopWidth: 1,
                borderTopColor: colors.border,
              }}
            >
              <TextInput
                value={threadReply}
                onChangeText={setThreadReply}
                placeholder="Type a message…"
                placeholderTextColor={colors.inkMuted}
                style={{
                  flex: 1,
                  backgroundColor: colors.surfaceSubtle,
                  borderRadius: radius.md,
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.sm,
                  ...type.body,
                  color: colors.ink,
                }}
              />
              <Pressable
                onPress={() => void handleThreadSend()}
                style={{
                  backgroundColor: colors.accent,
                  borderRadius: radius.md,
                  paddingHorizontal: spacing.lg,
                  justifyContent: "center",
                }}
              >
                <Text style={{ ...type.label, color: colors.onAccent }}>Send</Text>
              </Pressable>
            </View>
          </SafeAreaView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
