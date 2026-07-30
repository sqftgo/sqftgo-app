import { apiFetch } from "@/lib/api/client";
import { mapMessageFromApi, mapThreadFromApi } from "@/lib/api/mappers";
import type { Message, MessageThread } from "@/data/types";

interface ListResponse<T> {
  items: T[];
}

type ThreadDetail = Parameters<typeof mapThreadFromApi>[0] & {
  messages?: Parameters<typeof mapMessageFromApi>[0][];
  participants?: Parameters<typeof mapMessageFromApi>[1];
};

export async function apiListThreads(): Promise<MessageThread[]> {
  const res = await apiFetch<ListResponse<unknown> | unknown[]>(
    "/api/messages/threads",
  );
  const items = Array.isArray(res) ? res : res.items ?? [];
  return items.map((row) => mapThreadFromApi(row as Parameters<typeof mapThreadFromApi>[0]));
}

export async function apiListThreadMessages(threadId: string): Promise<Message[]> {
  const res = await apiFetch<ThreadDetail | ListResponse<unknown> | unknown[]>(
    `/api/messages/threads/${threadId}`,
  );

  if (res && typeof res === "object" && "messages" in res && Array.isArray(res.messages)) {
    const detail = res as ThreadDetail;
    return detail.messages!.map((m) => mapMessageFromApi(m, detail.participants));
  }

  const items = Array.isArray(res) ? res : (res as ListResponse<unknown>).items ?? [];
  return items.map((row) =>
    mapMessageFromApi(row as Parameters<typeof mapMessageFromApi>[0]),
  );
}

export async function apiCreateThread(input: {
  participantEmail: string;
  subject: string;
  body: string;
  propertyId?: string;
}): Promise<MessageThread> {
  const raw = await apiFetch<Parameters<typeof mapThreadFromApi>[0]>(
    "/api/messages/threads",
    {
      method: "POST",
      body: {
        subject: input.subject,
        participantEmail: input.participantEmail.trim().toLowerCase(),
        body: input.body,
        propertyId: input.propertyId,
        kind: "direct",
      },
    },
  );
  return mapThreadFromApi(raw);
}

export async function apiSendMessage(
  threadId: string,
  body: string,
): Promise<Message> {
  const raw = await apiFetch<Parameters<typeof mapMessageFromApi>[0]>(
    `/api/messages/threads/${threadId}/messages`,
    { method: "POST", body: { body } },
  );
  return mapMessageFromApi(raw);
}
