import { getTokens } from "@/lib/api/auth-token";
import { mobileAuthConfigured, SUPABASE_KEY, SUPABASE_URL } from "@/lib/api/supabase";
import type { ServiceBookingStatus } from "@/lib/api/services/services";

export type BookingEvent = {
  id: string;
  kind: string;
  fromStatus?: string | null;
  toStatus?: string | null;
  note?: string | null;
  proposedAt?: string | null;
  createdAt: string;
  actorId?: string | null;
};

export type ProviderBooking = {
  id: string;
  directoryProfileId: string;
  userId: string;
  providerUserId?: string | null;
  preferredAt: string;
  proposedAt?: string | null;
  message?: string | null;
  contactPhone: string;
  status: ServiceBookingStatus;
  ownerNotes?: string | null;
  rejectionReason?: string | null;
  cancellationReason?: string | null;
  locationAddress?: string | null;
  serviceName?: string | null;
  providerServiceId?: string | null;
  amountInr?: number | string | null;
  paymentStatus?: "not_applicable" | "unpaid" | "paid" | null;
  respondedAt?: string | null;
  createdAt: string;
  updatedAt?: string | null;
  firmName?: string | null;
  city?: string | null;
  category?: string | null;
  customerName?: string | null;
  customerEmail?: string | null;
  customerPhone?: string | null;
  customerCountryCode?: string | null;
  events?: BookingEvent[];
};

export type BookingMetrics = {
  total: number;
  pending: number;
  confirmed: number;
  inProgress: number;
  completed: number;
  cancelled: number;
  rejected: number;
  rescheduleRequested: number;
  rescheduleProposed: number;
  customers: number;
  completedValue: number;
  paymentsCollected: boolean;
  upcoming: number;
};

export type ProviderServiceItem = {
  id: string;
  directoryProfileId: string;
  name: string;
  description: string;
  priceInr: number | null;
  durationMinutes: number;
  active: boolean;
};

export type DayHours = { closed: boolean; open: string; close: string };

export type WeekHours = {
  mon: DayHours;
  tue: DayHours;
  wed: DayHours;
  thu: DayHours;
  fri: DayHours;
  sat: DayHours;
  sun: DayHours;
  slotMinutes?: number;
};

export type AvailabilityBlock = {
  id: string;
  startsAt: string;
  endsAt: string;
  reason: string;
};

export type ProviderSchedule = {
  hours: WeekHours | null;
  blocks: AvailabilityBlock[];
  upcoming: { id: string; preferredAt: string; status: ServiceBookingStatus; serviceName?: string | null }[];
};

export type BookingAction =
  | "accept"
  | "reject"
  | "propose_reschedule"
  | "accept_reschedule"
  | "decline_reschedule"
  | "request_reschedule"
  | "cancel"
  | "start"
  | "complete";

const EMPTY_METRICS: BookingMetrics = {
  total: 0,
  pending: 0,
  confirmed: 0,
  inProgress: 0,
  completed: 0,
  cancelled: 0,
  rejected: 0,
  rescheduleRequested: 0,
  rescheduleProposed: 0,
  customers: 0,
  completedValue: 0,
  paymentsCollected: false,
  upcoming: 0,
};

async function rpc<T>(name: string, body: Record<string, unknown> = {}): Promise<T> {
  if (!mobileAuthConfigured) {
    throw new Error("Connect SqftGo to manage live bookings.");
  }
  const { accessToken } = await getTokens();
  if (!accessToken) throw new Error("Sign in required");
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${name}`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let payload: unknown = null;
  if (text) {
    try {
      payload = JSON.parse(text) as unknown;
    } catch {
      payload = null;
    }
  }
  if (!res.ok) {
    const message =
      payload && typeof payload === "object" && payload !== null && "message" in payload
        ? String((payload as { message: unknown }).message)
        : "Request failed";
    throw new Error(message);
  }
  return payload as T;
}

function asBookings(value: unknown): ProviderBooking[] {
  return Array.isArray(value) ? (value as ProviderBooking[]) : [];
}

export async function createServiceBooking(input: {
  directoryProfileId: string;
  preferredAt: string;
  contactPhone: string;
  message?: string;
  serviceId?: string | null;
  location?: string | null;
}): Promise<ProviderBooking> {
  const booking = await rpc<ProviderBooking | null>("create_service_booking", {
    p_directory_profile_id: input.directoryProfileId,
    p_preferred_at: input.preferredAt,
    p_contact_phone: input.contactPhone,
    p_message: input.message ?? "",
    p_service_id: input.serviceId ?? null,
    p_location: input.location ?? null,
  });
  if (!booking?.id) throw new Error("Booking was not created");
  return booking;
}

export async function applyBookingAction(
  bookingId: string,
  action: BookingAction,
  note?: string | null,
  when?: string | null,
): Promise<ProviderBooking> {
  const booking = await rpc<ProviderBooking | null>("apply_service_booking_action", {
    p_booking_id: bookingId,
    p_action: action,
    p_note: note ?? null,
    p_when: when ?? null,
  });
  if (!booking?.id) throw new Error("Booking was not updated");
  return booking;
}

export async function listServiceBookings(scope: "provider" | "customer"): Promise<ProviderBooking[]> {
  return asBookings(await rpc("list_my_service_bookings", { p_scope: scope }));
}

export async function getServiceBooking(bookingId: string): Promise<ProviderBooking | null> {
  return rpc<ProviderBooking | null>("get_service_booking", { p_booking_id: bookingId });
}

export async function providerBookingMetrics(): Promise<BookingMetrics> {
  const metrics = await rpc<BookingMetrics | null>("provider_booking_metrics");
  return metrics ?? EMPTY_METRICS;
}

export async function listProviderServices(directoryProfileId?: string | null): Promise<ProviderServiceItem[]> {
  const rows = await rpc<ProviderServiceItem[] | null>("list_provider_services", {
    p_directory_profile_id: directoryProfileId ?? null,
  });
  return Array.isArray(rows) ? rows : [];
}

export async function saveProviderService(input: {
  id?: string | null;
  name: string;
  description: string;
  priceInr: number | null;
  durationMinutes: number;
  active: boolean;
}): Promise<ProviderServiceItem[]> {
  const rows = await rpc<ProviderServiceItem[] | null>("save_provider_service", {
    p_id: input.id ?? null,
    p_name: input.name,
    p_description: input.description,
    p_price_inr: input.priceInr,
    p_duration_minutes: input.durationMinutes,
    p_active: input.active,
  });
  return Array.isArray(rows) ? rows : [];
}

export async function saveProviderHours(hours: WeekHours): Promise<WeekHours> {
  return rpc<WeekHours>("save_provider_hours", { p_hours: hours });
}

export async function providerSchedule(): Promise<ProviderSchedule | null> {
  return rpc<ProviderSchedule | null>("provider_schedule");
}

export async function addAvailabilityBlock(input: {
  startsAt: string;
  endsAt: string;
  reason?: string;
}): Promise<ProviderSchedule | null> {
  return rpc<ProviderSchedule | null>("add_availability_block", {
    p_starts_at: input.startsAt,
    p_ends_at: input.endsAt,
    p_reason: input.reason ?? "",
  });
}

export async function removeAvailabilityBlock(id: string): Promise<ProviderSchedule | null> {
  return rpc<ProviderSchedule | null>("remove_availability_block", { p_id: id });
}

export const WEEK_DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;

export const DAY_LABEL: Record<(typeof WEEK_DAYS)[number], string> = {
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
  sun: "Sunday",
};

export function defaultWeekHours(): WeekHours {
  const open: DayHours = { closed: false, open: "09:00", close: "18:00" };
  return {
    mon: { ...open },
    tue: { ...open },
    wed: { ...open },
    thu: { ...open },
    fri: { ...open },
    sat: { ...open },
    sun: { closed: true, open: "09:00", close: "18:00" },
    slotMinutes: 60,
  };
}
