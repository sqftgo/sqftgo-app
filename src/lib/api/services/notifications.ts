import { apiFetch } from "@/lib/api/client";
import type { AppNotification } from "@/data/notifications";

type ApiNotification = {
  id: string;
  title: string;
  message: string;
  type?: string;
  read: boolean;
  date: string;
  forRole?: string;
};

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
    time: formatRelative(raw.date),
    read: raw.read,
    tag,
  };
}

function formatRelative(iso: string): string {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return iso;
  const diffMs = Date.now() - t;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) return `${Math.max(1, mins)} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr${hrs === 1 ? "" : "s"} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
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
