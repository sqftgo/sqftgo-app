import type { InquiryStatus, PropertyStatus, VisitStatus } from "@/data/types";

export const VISIT_STATUS_LABEL: Record<VisitStatus, string> = {
  pending: "Pending Approval",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const INQUIRY_STATUS_LABEL: Record<InquiryStatus, string> = {
  new: "New",
  read: "Read",
  archived: "Archived",
};

export const PROPERTY_STATUS_LABEL: Record<PropertyStatus, string> = {
  Draft: "Draft",
  "Pending Review": "Pending Review",
  Active: "Active",
  Sold: "Sold",
  Rented: "Rented",
  Rejected: "Rejected",
};

export const KYC_STATUS_LABEL = {
  draft: "Draft",
  pending: "Pending review",
  approved: "Approved",
  rejected: "Rejected",
} as const;
