import React, { useRef, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { Send } from "@/components/ui/icons";
import type { Message } from "@/data/types";
import { colors, radius, spacing, touchTarget, type } from "@/theme/tokens";

function timeLabel(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const today = new Date().toDateString() === d.toDateString();
  return today
    ? d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })
    : d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }) +
        ", " +
        d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
}

export interface ChatThreadProps {
  messages: Message[];
  /** Messages from this side render on the right. */
  mine: Message["senderRole"];
  loading?: boolean;
  emptyText?: string;
}

/** Chronological message list that keeps the newest message in view. */
export function ChatThread({ messages, mine, loading, emptyText = "No messages yet. Say hello." }: ChatThreadProps) {
  const list = useRef<FlatList<Message>>(null);
  return (
    <FlatList
      ref={list}
      data={messages}
      keyExtractor={(m) => m.id}
      contentContainerStyle={styles.list}
      onContentSizeChange={() => list.current?.scrollToEnd({ animated: false })}
      keyboardDismissMode="interactive"
      ListEmptyComponent={
        <Text style={styles.empty}>{loading ? "Loading messages…" : emptyText}</Text>
      }
      renderItem={({ item }) => {
        const own = item.senderRole === mine;
        return (
          <View style={[styles.bubble, own ? styles.own : styles.theirs]}>
            <Text style={[styles.body, own && { color: colors.onAccent }]} selectable>
              {item.body}
            </Text>
            <Text style={[styles.time, own && { color: "rgba(255,255,255,0.8)" }]}>{timeLabel(item.createdAt)}</Text>
          </View>
        );
      }}
    />
  );
}

export interface ComposerProps {
  onSend: (text: string) => Promise<boolean> | boolean;
  placeholder?: string;
  maxLength?: number;
}

/** Message input pinned under a thread. Keeps the draft if sending fails. */
export function Composer({ onSend, placeholder = "Write a message", maxLength = 4000 }: ComposerProps) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const canSend = text.trim().length > 0 && !sending;

  const send = async () => {
    if (!canSend) return;
    setSending(true);
    const ok = await onSend(text.trim());
    setSending(false);
    if (ok) setText("");
  };

  return (
    <View style={styles.composer}>
      <TextInput
        value={text}
        onChangeText={setText}
        placeholder={placeholder}
        placeholderTextColor={colors.placeholder}
        multiline
        maxLength={maxLength}
        style={styles.input}
        accessibilityLabel="Message"
      />
      <Pressable
        onPress={() => void send()}
        disabled={!canSend}
        accessibilityRole="button"
        accessibilityLabel="Send message"
        accessibilityState={{ disabled: !canSend, busy: sending }}
        style={({ pressed }) => [styles.send, !canSend && { opacity: 0.4 }, pressed && { backgroundColor: colors.accentPressed }]}
      >
        <Send size={18} color={colors.onAccent} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.lg, gap: spacing.sm, flexGrow: 1 },
  empty: { ...type.body, color: colors.inkMuted, textAlign: "center", marginTop: spacing["4xl"] },
  bubble: {
    maxWidth: "82%",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
    borderCurve: "continuous",
    gap: spacing.xxs,
  },
  own: { alignSelf: "flex-end", backgroundColor: colors.accent, borderBottomRightRadius: radius.xs },
  theirs: {
    alignSelf: "flex-start",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderBottomLeftRadius: radius.xs,
  },
  body: { ...type.body, color: colors.ink },
  time: { ...type.micro, color: colors.inkMuted, alignSelf: "flex-end" },
  composer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.bg,
  },
  input: {
    flex: 1,
    minHeight: touchTarget,
    maxHeight: 120,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm + 2,
    paddingBottom: spacing.sm + 2,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    ...type.body,
    color: colors.ink,
  },
  send: {
    width: touchTarget,
    height: touchTarget,
    borderRadius: radius.full,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
});
