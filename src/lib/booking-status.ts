import type { BadgeTone } from "@/components/ds";
import type { ServiceBookingStatus } from "@/lib/api/services/services";

export const BOOKING_STATUS_META: Record<
  ServiceBookingStatus,
  { label: string; tone: BadgeTone }
> = {
  pending: { label: "Pending", tone: "warning" },
  confirmed: { label: "Confirmed", tone: "success" },
  in_progress: { label: "In progress", tone: "info" },
  completed: { label: "Completed", tone: "success" },
  cancelled: { label: "Cancelled", tone: "danger" },
  rejected: { label: "Rejected", tone: "danger" },
  reschedule_requested: { label: "Reschedule requested", tone: "warning" },
  reschedule_proposed: { label: "Reschedule proposed", tone: "info" },
};

export function bookingStatusMeta(status: string): { label: string; tone: BadgeTone } {
  if (status in BOOKING_STATUS_META) return BOOKING_STATUS_META[status as ServiceBookingStatus];
  return { label: status, tone: "neutral" };
}

export function formatBookingWhen(iso: string | null | undefined): string {
  if (!iso) return "Not set";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatInr(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "Not priced";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function shortBookingId(id: string): string {
  return id.slice(0, 8).toUpperCase();
}
