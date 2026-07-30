/**
 * Normalize Next.js BFF response shapes into Expo app types.
 */

import type {
  Inquiry,
  InquiryStatus,
  Message,
  MessageThread,
  SiteVisit,
  VisitStatus,
} from "@/data/types";
import { VISIT_STATUS_LABEL } from "@/lib/status-labels";

/** Web VisitBooking.status → app VisitStatus */
export function mapVisitStatusFromApi(raw: string | undefined): VisitStatus {
  const s = (raw ?? "").toLowerCase();
  if (s.includes("confirm")) return "confirmed";
  if (s.includes("complete")) return "completed";
  if (s.includes("cancel")) return "cancelled";
  return "pending";
}

/** App VisitStatus → web visitUpdateSchema UI label */
export function mapVisitStatusToApi(status: VisitStatus): string {
  return VISIT_STATUS_LABEL[status];
}

type ApiInquiry = {
  id: string;
  propertyId: string;
  propertyTitle?: string;
  name?: string;
  email?: string;
  phone?: string;
  buyerName?: string;
  buyerEmail?: string;
  buyerPhone?: string;
  message: string;
  brokerEmail?: string;
  status: string;
  date?: string;
  createdAt?: string;
};

export function mapInquiryFromApi(raw: ApiInquiry): Inquiry {
  return {
    id: raw.id,
    propertyId: raw.propertyId,
    propertyTitle: raw.propertyTitle ?? "Property",
    buyerName: raw.buyerName ?? raw.name ?? "Buyer",
    buyerEmail: (raw.buyerEmail ?? raw.email ?? "").toLowerCase(),
    buyerPhone: raw.buyerPhone ?? raw.phone,
    message: raw.message,
    brokerEmail: raw.brokerEmail ?? "",
    status: (raw.status as InquiryStatus) || "new",
    createdAt: raw.createdAt ?? raw.date ?? new Date().toISOString(),
  };
}

type ApiVisit = {
  id: string;
  propertyId: string;
  propertyTitle?: string;
  visitorName?: string;
  visitorEmail?: string;
  visitorPhone?: string;
  buyerName?: string;
  buyerEmail?: string;
  buyerPhone?: string;
  brokerEmail?: string;
  brokerName?: string;
  date?: string;
  time?: string;
  visitDate?: string;
  visitTime?: string;
  status: string;
  notes?: string;
  createdAt?: string;
};

export function mapVisitFromApi(raw: ApiVisit): SiteVisit {
  return {
    id: raw.id,
    propertyId: raw.propertyId,
    propertyTitle: raw.propertyTitle ?? "Property",
    buyerName: raw.buyerName ?? raw.visitorName ?? "Visitor",
    buyerEmail: (raw.buyerEmail ?? raw.visitorEmail ?? "").toLowerCase(),
    buyerPhone: raw.buyerPhone ?? raw.visitorPhone,
    brokerEmail: raw.brokerEmail ?? "",
    visitDate: raw.visitDate ?? raw.date ?? "",
    visitTime: raw.visitTime ?? raw.time ?? "",
    status: mapVisitStatusFromApi(raw.status),
    createdAt: raw.createdAt ?? new Date().toISOString(),
    notes: raw.notes,
  };
}

type ApiParticipant = {
  id: string;
  name: string;
  email: string;
  role: "user" | "broker" | "admin";
};

type ApiThread = {
  id: string;
  subject?: string;
  participants?: ApiParticipant[];
  buyerEmail?: string;
  buyerName?: string;
  propertyId?: string;
  propertyTitle?: string;
  lastMessage?: string;
  lastMessageAt?: string;
  unread?: boolean;
  unreadCount?: number;
};

export function mapThreadFromApi(raw: ApiThread): MessageThread {
  const buyer =
    raw.participants?.find((p) => p.role === "user") ??
    raw.participants?.find((p) => p.role !== "broker" && p.role !== "admin");
  return {
    id: raw.id,
    buyerEmail: (raw.buyerEmail ?? buyer?.email ?? "").toLowerCase(),
    buyerName: raw.buyerName ?? buyer?.name,
    propertyId: raw.propertyId,
    propertyTitle: raw.propertyTitle ?? raw.subject,
    lastMessage: raw.lastMessage,
    lastMessageAt: raw.lastMessageAt,
    unreadCount: raw.unreadCount ?? (raw.unread ? 1 : 0),
  };
}

type ApiMessage = {
  id: string;
  threadId: string;
  body: string;
  senderId?: string;
  senderName?: string;
  senderRole?: "user" | "broker";
  senderEmail?: string;
  createdAt: string;
};

export function mapMessageFromApi(
  raw: ApiMessage,
  participants?: ApiParticipant[],
): Message {
  const sender = raw.senderId
    ? participants?.find((p) => p.id === raw.senderId)
    : undefined;
  const role =
    raw.senderRole ??
    (sender?.role === "broker" || sender?.role === "admin" ? "broker" : "user");
  return {
    id: raw.id,
    threadId: raw.threadId,
    body: raw.body,
    senderRole: role,
    senderEmail: raw.senderEmail ?? sender?.email ?? "",
    createdAt: raw.createdAt,
  };
}
