import type { PropertyStatus, VisitStatus } from "@/data/types";
import type { BadgeTone } from "@/components/ds/StatusBadge";
import { colors } from "@/theme/tokens";

export type StatusTone = { bg: string; color: string };

/** Badge tones aligned with `StatusBadge.toneForStatus` for visits/bookings. */
export const VISIT_BADGE_TONE: Record<VisitStatus, BadgeTone> = {
  pending: "warning",
  confirmed: "info",
  completed: "success",
  cancelled: "danger",
};

/** Shared semantic colors for status chips (visits, listings, bookings). */
export const VISIT_STATUS_TONE: Record<VisitStatus, StatusTone> = {
  pending: { bg: colors.warningSoft, color: colors.warning },
  confirmed: { bg: colors.infoSoft, color: colors.info },
  completed: { bg: colors.successSoft, color: colors.success },
  cancelled: { bg: colors.dangerSoft, color: colors.danger },
};

export const PROPERTY_STATUS_TONE: Record<PropertyStatus, StatusTone> = {
  Draft: { bg: colors.surfaceSubtle, color: colors.inkMuted },
  "Pending Review": { bg: colors.warningSoft, color: colors.warning },
  Active: { bg: colors.successSoft, color: colors.success },
  Sold: { bg: colors.infoSoft, color: colors.info },
  Rented: { bg: colors.infoSoft, color: colors.info },
  Rejected: { bg: colors.dangerSoft, color: colors.danger },
};

export const BOOKING_STATUS_TONE: Record<"pending" | "confirmed" | "completed" | "cancelled", StatusTone> =
  VISIT_STATUS_TONE;
