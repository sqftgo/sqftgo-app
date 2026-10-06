import { useLocalSearchParams } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  Button,
  Chip,
  ChatThread,
  Composer,
  SegmentedControl,
  StatusBadge,
  SwipeRow,
  TextField,
  type BadgeTone,
} from "@/components/ds";
import { appAlert } from "@/components/ui/app-alert";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Archive,
  Inbox,
  MessageSquare,
  Phone,
  Plus,
} from "@/components/ui/icons";
import {
  ModalSheet,
  ModalSheetCloseButton,
  ModalSheetHeader,
} from "@/components/ui/modal-sheet";
import { ScreenNavbar } from "@/components/ui/screen-navbar";
import { useApp } from "@/context/AppContext";
import type { Inquiry, InquiryStatus, MessageThread } from "@/data/types";
import { formatRelativeTime, initialsFromName } from "@/lib/format";
import { ownedPropertyIds, ownsInquiry } from "@/lib/ownership";
import { INQUIRY_STATUS_LABEL } from "@/lib/status-labels";
import { colors, radius, shadow, spacing, type } from "@/theme/tokens";

type MainTab = "leads" | "messages";
type LeadFilter = "inbox" | "archived";

const INQUIRY_TONE: Record<InquiryStatus, BadgeTone> = {
  new: "accent",
  read: "neutral",
  archived: "neutral",
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function DealerInquiriesScreen() {
  const params = useLocalSearchParams<{ tab?: string }>();
  const {
    inquiries,
    userEmail,
    profile,
    properties,
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
    params.tab === "messages" ? "messages" : "leads",
  );
  const [filter, setFilter] = useState<LeadFilter>("inbox");
  const [replyTarget, setReplyTarget] = useState<Inquiry | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replyBusy, setReplyBusy] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeEmail, setComposeEmail] = useState("");
  const [composeBody, setComposeBody] = useState("");
  const [composeBusy, setComposeBusy] = useState(false);
  const [activeThread, setActiveThread] = useState<MessageThread | null>(null);

  const ownedIds = useMemo(
    () =>
      ownedPropertyIds(properties, { userId: profile?.id, email: userEmail }),
    [properties, profile?.id, userEmail],
  );
  const mine = useMemo(
    () =>
      inquiries.filter((i) =>
        ownsInquiry(i, { email: userEmail, ownedPropertyIds: ownedIds }),
      ),
    [inquiries, userEmail, ownedIds],
  );
  const leads = useMemo(
    () =>
      mine.filter((i) =>
        filter === "archived"
          ? i.status === "archived"
          : i.status !== "archived",
      ),
    [mine, filter],
  );
  const newCount = mine.filter((i) => i.status === "new").length;
  const unreadThreads = messageThreads.filter(
    (t) => (t.unreadCount ?? 0) > 0,
  ).length;

  const handleReply = async () => {
    if (!replyTarget || !replyText.trim()) return;
    setReplyBusy(true);
    const result = await replyInquiry(replyTarget.id, replyText.trim());
    setReplyBusy(false);
    if (!result.ok) {
      appAlert(
        "Couldn't send reply",
        result.message ?? "Check your connection and try again.",
      );
      return;
    }
    setReplyTarget(null);
    setReplyText("");
    setMainTab("messages");
  };

  const composeEmailError =
    composeEmail.trim() && !EMAIL_RE.test(composeEmail.trim())
      ? "Enter a valid email"
      : null;

  const handleCompose = async () => {
    if (!EMAIL_RE.test(composeEmail.trim()) || !composeBody.trim()) return;
    setComposeBusy(true);
    const thread = await createMessageThread({
      buyerEmail: composeEmail.trim(),
      body: composeBody.trim(),
    });
    setComposeBusy(false);
    if (!thread) {
      appAlert(
        "Couldn't send message",
        "Check the email address and your connection, then try again.",
      );
      return;
    }
    setComposeOpen(false);
    setComposeEmail("");
    setComposeBody("");
    void openThread(thread);
  };

  const handleThreadSend = async (body: string) => {
    if (!activeThread) return false;
    const sent = await sendThreadMessage(activeThread.id, body);
    if (!sent)
      appAlert("Message not sent", "Check your connection and try again.");
    return Boolean(sent);
  };

  const openThread = async (thread: MessageThread) => {
    setActiveThread(thread);
    await loadThreadMessages(thread.id);
  };

  const confirmArchive = (item: Inquiry) =>
    appAlert("Archive this lead?", "You can still find it under Archived.", [
      { text: "Cancel", style: "cancel" },
      { text: "Archive", onPress: () => archiveInquiry(item.id) },
    ]);

  const header = (
    <View style={styles.header}>
      <ScreenNavbar
        title="Inbox"
        actions={
          mainTab === "messages"
            ? [
                {
                  icon: Plus,
                  label: "New message",
                  tone: "accent",
                  onPress: () => setComposeOpen(true),
                },
              ]
            : undefined
        }
      />
      <SegmentedControl<MainTab>
        segments={[
          { value: "leads", label: "Leads", count: newCount || undefined },
          {
            value: "messages",
            label: "Messages",
            count: unreadThreads || undefined,
          },
        ]}
        value={mainTab}
        onChange={setMainTab}
      />
      {mainTab === "leads" ? (
        <View style={styles.filters}>
          <Chip
            label="Inbox"
            selected={filter === "inbox"}
            onPress={() => setFilter("inbox")}
          />
          <Chip
            label="Archived"
            selected={filter === "archived"}
            onPress={() => setFilter("archived")}
          />
        </View>
      ) : null}
    </View>
  );

  return (
    <SafeAreaView edges={["top"]} style={styles.root}>
      {header}
      {mainTab === "leads" ? (
        <FlatList
          data={leads}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <EmptyState
              icon={Inbox}
              title={
                filter === "archived" ? "No archived leads" : "No leads yet"
              }
              message={
                filter === "archived"
                  ? "Leads you archive are kept here."
                  : "When buyers ask about your active listings, their messages land here."
              }
            />
          }
          renderItem={({ item }) => (
            <SwipeRow
              actions={
                filter === "inbox"
                  ? [
                      {
                        label: "Archive",
                        icon: Archive,
                        onPress: () => confirmArchive(item),
                      },
                    ]
                  : []
              }
            >
              <Pressable
                onPress={() => {
                  if (item.status === "new") markInquiryRead(item.id);
                }}
                accessibilityHint={
                  item.status === "new" ? "Marks this lead as read" : undefined
                }
                style={[styles.card, item.status === "new" && styles.cardNew]}
              >
                <View style={styles.cardTop}>
                  <Text style={styles.cardTitle} numberOfLines={1}>
                    {item.buyerName || item.buyerEmail}
                  </Text>
                  <StatusBadge
                    label={INQUIRY_STATUS_LABEL[item.status]}
                    tone={INQUIRY_TONE[item.status]}
                  />
                </View>
                <Text style={styles.meta} numberOfLines={1}>
                  {item.propertyTitle}
                  {item.createdAt
                    ? ` · ${formatRelativeTime(item.createdAt)}`
                    : ""}
                </Text>
                <Text style={styles.body} numberOfLines={4}>
                  {item.message}
                </Text>
                {item.replyMessage ? (
                  <Text style={styles.reply} numberOfLines={2}>
                    You replied: {item.replyMessage}
                  </Text>
                ) : null}
                {filter === "inbox" ? (
                  <View style={styles.actions}>
                    <Button
                      label="Reply"
                      icon={MessageSquare}
                      size="sm"
                      onPress={() => {
                        setReplyTarget(item);
                        setReplyText("");
                      }}
                    />
                    {item.buyerPhone ? (
                      <Button
                        label="Call"
                        icon={Phone}
                        size="sm"
                        variant="secondary"
                        onPress={() =>
                          void Linking.openURL(`tel:${item.buyerPhone}`)
                        }
                      />
                    ) : null}
                    <View style={{ flex: 1 }} />
                    <Button
                      label="Archive"
                      size="sm"
                      variant="tertiary"
                      onPress={() => confirmArchive(item)}
                    />
                  </View>
                ) : null}
              </Pressable>
            </SwipeRow>
          )}
        />
      ) : (
        <FlatList
          data={messageThreads}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <EmptyState
              icon={MessageSquare}
              title="No conversations yet"
              message="Reply to a lead, or start a conversation with a buyer's email."
              actionLabel="New message"
              onAction={() => setComposeOpen(true)}
            />
          }
          renderItem={({ item }) => {
            const name = item.buyerName || item.buyerEmail;
            const unread = (item.unreadCount ?? 0) > 0;
            return (
              <Pressable
                onPress={() => void openThread(item)}
                accessibilityRole="button"
                accessibilityLabel={`Conversation with ${name}${unread ? ", unread" : ""}`}
                style={({ pressed }) => [
                  styles.threadRow,
                  pressed && { opacity: 0.85 },
                ]}
              >
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {initialsFromName(name) || "?"}
                  </Text>
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <View style={styles.cardTop}>
                    <Text
                      style={[
                        styles.cardTitle,
                        unread && { fontFamily: "Inter_700Bold" },
                      ]}
                      numberOfLines={1}
                    >
                      {name}
                    </Text>
                    {item.lastMessageAt ? (
                      <Text style={styles.time}>
                        {formatRelativeTime(item.lastMessageAt)}
                      </Text>
                    ) : null}
                  </View>
                  {item.propertyTitle ? (
                    <Text style={styles.meta} numberOfLines={1}>
                      {item.propertyTitle}
                    </Text>
                  ) : null}
                  {item.lastMessage ? (
                    <Text
                      style={[styles.body, unread && { color: colors.ink }]}
                      numberOfLines={2}
                    >
                      {item.lastMessage}
                    </Text>
                  ) : null}
                </View>
                {unread ? (
                  <View style={styles.unreadDot} accessibilityElementsHidden />
                ) : null}
              </Pressable>
            );
          }}
        />
      )}

      <ModalSheet
        visible={!!replyTarget}
        onClose={() => setReplyTarget(null)}
        avoidKeyboard
        maxHeight="80%"
      >
        <ModalSheetHeader
          title={`Reply to ${replyTarget?.buyerName || "buyer"}`}
          subtitle={replyTarget?.propertyTitle}
          onClose={() => setReplyTarget(null)}
        />
        <View style={styles.sheetBody}>
          {replyTarget ? (
            <Text style={styles.quote} numberOfLines={3}>
              “{replyTarget.message}”
            </Text>
          ) : null}
          <TextField
            value={replyText}
            onChangeText={setReplyText}
            placeholder="Write your reply"
            multiline
            autoFocus
            hint="The buyer sees this in their messages, and the conversation moves to Messages."
          />
          <Button
            label="Send reply"
            onPress={() => void handleReply()}
            loading={replyBusy}
            disabled={!replyText.trim()}
            fullWidth
          />
        </View>
      </ModalSheet>

      <ModalSheet
        visible={composeOpen}
        onClose={() => setComposeOpen(false)}
        avoidKeyboard
        maxHeight="85%"
      >
        <ModalSheetHeader
          title="New message"
          onClose={() => setComposeOpen(false)}
        />
        <View style={styles.sheetBody}>
          <TextField
            label="Buyer email"
            value={composeEmail}
            onChangeText={setComposeEmail}
            placeholder="name@example.com"
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            error={composeEmailError}
          />
          <TextField
            label="Message"
            value={composeBody}
            onChangeText={setComposeBody}
            placeholder="Write your message"
            multiline
          />
          <Button
            label="Send"
            onPress={() => void handleCompose()}
            loading={composeBusy}
            disabled={
              !EMAIL_RE.test(composeEmail.trim()) || !composeBody.trim()
            }
            fullWidth
          />
        </View>
      </ModalSheet>

      <Modal
        visible={!!activeThread}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setActiveThread(null)}
      >
        <SafeAreaView edges={["top", "bottom"]} style={styles.root}>
          <View style={styles.threadHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.threadTitle} numberOfLines={1}>
                {activeThread?.buyerName || activeThread?.buyerEmail}
              </Text>
              <Text style={styles.meta} numberOfLines={1}>
                {activeThread?.propertyTitle || activeThread?.buyerEmail}
              </Text>
            </View>
            <ModalSheetCloseButton onClose={() => setActiveThread(null)} />
          </View>
          <KeyboardAvoidingView
            behavior={process.env.EXPO_OS === "ios" ? "padding" : undefined}
            style={{ flex: 1 }}
          >
            <ChatThread
              messages={
                activeThread ? (messagesByThread[activeThread.id] ?? []) : []
              }
              mine="broker"
            />
            <Composer onSend={handleThreadSend} placeholder="Reply to buyer" />
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    paddingBottom: spacing.md,
  },
  filters: { flexDirection: "row", gap: spacing.sm },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing["3xl"],
    gap: spacing.md,
    flexGrow: 1,
  },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderCurve: "continuous",
    padding: spacing.lg,
    gap: spacing.xs,
    boxShadow: shadow.card,
  },
  cardNew: { borderColor: colors.accentBorder },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  cardTitle: { ...type.emphasis, color: colors.ink, flex: 1 },
  meta: { ...type.caption, color: colors.inkMuted },
  body: { ...type.body, color: colors.inkSecondary, marginTop: spacing.xs },
  reply: { ...type.caption, color: colors.success, marginTop: spacing.xs },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  threadRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderCurve: "continuous",
    padding: spacing.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    ...type.label,
    fontFamily: "Inter_600SemiBold",
    fontWeight: "600",
    color: colors.primary,
  },
  time: { ...type.caption, color: colors.inkMuted },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.accent,
    marginTop: spacing.sm,
  },
  sheetBody: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  quote: { ...type.body, color: colors.inkSecondary, fontStyle: "italic" },
  threadHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  threadTitle: { ...type.heading, color: colors.ink },
});
