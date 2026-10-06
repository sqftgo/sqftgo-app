import type { Href } from "expo-router";

import { apiFetch } from "@/lib/api/client";
import type { AppNotification } from "@/data/notifications";
import { formatRelativeTime } from "@/lib/format";

type ApiNotification = {
  id: string;
  title: string;
  message: string;
  type?: string;
  read: boolean;
  date: string;
  createdAt?: string;
  forRole?: string;
  entityType?: string;
  entityId?: string;
};

function hrefFor(raw: ApiNotification): Href | undefined {
  const dealer = raw.forRole === "broker";
  switch (raw.entityType) {
    case "message_thread":
    case "property_inquiry":
      return dealer ? "/(dealer)/inquiries" : raw.entityType === "property_inquiry" ? "/my-listings" : "/my-inquiries";
    case "site_visit":
      return dealer ? "/manage-visits" : "/my-visits";
    case "property":
      return raw.entityId ? { pathname: "/edit-property/[id]", params: { id: raw.entityId } } : undefined;
    default:
      return undefined;
  }
}

function mapNotification(raw: ApiNotification): AppNotification {
  const tag =
    raw.type === "success"
      ? "Verified"
      : raw.type === "warning"
        ? "Price Drop"
        : raw.type === "error"
          ? "Callback"
          : "New Match";
  return {
    id: raw.id,
    title: raw.title,
    message: raw.message,
    time: formatRelativeTime(raw.createdAt ?? raw.date) || raw.date,
    read: raw.read,
    tag,
    href: hrefFor(raw),
  };
}

export async function apiListNotifications(): Promise<AppNotification[]> {
  const res = await apiFetch<ApiNotification[] | { items: ApiNotification[] }>(
    "/api/notifications",
  );
  const items = Array.isArray(res) ? res : res.items ?? [];
  return items.map(mapNotification);
}

export async function apiMarkNotificationRead(id: string): Promise<void> {
  await apiFetch(`/api/notifications/${id}`, {
    method: "PATCH",
    body: { read: true },
  });
}

export async function apiMarkAllNotificationsRead(): Promise<void> {
  await apiFetch("/api/notifications/mark-all-read", {
    method: "POST",
    body: {},
  });
}
