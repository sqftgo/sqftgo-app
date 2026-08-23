export type PropertyType =
  | "Home"
  | "Villa"
  | "Hotel"
  | "Agricultural Land"
  | "Apartment"
  | "Office Space"
  | "Commercial Space"
  | "Shop"
  | "Industrial Plot";

export type PropertyPurpose = "buy" | "sell" | "rent" | "lease";

export type Furnishing = "Furnished" | "Semi-Furnished" | "Unfurnished";

/** UI labels ↔ DB: draft, pending_review, active, sold, rented, rejected */
export type PropertyStatus =
  | "Draft"
  | "Pending Review"
  | "Active"
  | "Sold"
  | "Rented"
  | "Rejected";

export interface PriceBreakdown {
  basePrice: number;
  securityDeposit?: number;
  maintenance: number;
  registrationFees?: number;
  gst?: number;
}

export interface VerificationChecks {
  titleDeed?: boolean;
  taxClearance?: boolean;
  utilitiesCheck?: boolean;
  physicalVerification?: boolean;
  structuralVetted?: boolean;
}

export interface Property {
  id: string;
  ownerId?: string;
  title: string;
  /** In rupees; monthly for rent/lease listings */
  price: number;
  type: PropertyType;
  purpose: PropertyPurpose;
  bhk?: number;
  bathrooms?: number;
  parking?: number;
  yearBuilt?: number;
  city: string;
  state?: string;
  country?: string;
  locality: string;
  nearbyHospital?: string;
  nearbySchool?: string;
  nearbyTransportation?: string;
  /** In sq.ft. */
  size: number;
  furnished: Furnishing;
  description: string;
  amenities: string[];
  images: string[];
  videoUrl?: string;
  ownerName: string;
  ownerPhone: string;
  ownerEmail?: string;
  inquiryCount: number;
  status: PropertyStatus;
  /** Dealer who owns this listing (inbox routing). */
  brokerEmail?: string;
  brokerId?: string;
  featured?: boolean;
  reraApproved?: boolean;
  reraId?: string;
  verifiedDate?: string;
  verificationChecks?: VerificationChecks;
  priceBreakdown?: PriceBreakdown;
}

/** API inquiry statuses */
export type InquiryStatus = "new" | "read" | "archived";

export interface Inquiry {
  id: string;
  propertyId: string;
  propertyTitle: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone?: string;
  message: string;
  brokerEmail: string;
  status: InquiryStatus;
  createdAt: string;
  /** Local demo reply text (maps to messaging thread on BFF). */
  replyMessage?: string;
}

/** DB: pending → confirmed → completed | cancelled */
export type VisitStatus = "pending" | "confirmed" | "completed" | "cancelled";

export interface SiteVisit {
  id: string;
  propertyId: string;
  propertyTitle: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone?: string;
  brokerEmail: string;
  visitDate: string;
  visitTime: string;
  status: VisitStatus;
  createdAt: string;
  notes?: string;
}

export type DirectoryCategory =
  | "Agent & Broker"
  | "Builder & Developer"
  | "Interior Decorator"
  | "Architect"
  | "Building Contractor"
  | "Property Consultant"
  | "Vastu Consultant"
  | "Home Valuation/Inspection"
  | "Home Shifting/Deep Cleaning";

export interface DirectoryProfile {
  id: string;
  firmName: string;
  ownerName: string;
  category: DirectoryCategory;
  city: string;
  address: string;
  email: string;
  website: string;
  mobile: string;
  description: string;
  reraId?: string;
  experience?: string;
  specialties?: string[];
  teamSize?: number;
  listingsCount?: number;
  /** Professional headline / title for LinkedIn style view */
  headline?: string;
  /** Rating out of 5 */
  rating?: number;
  /** Number of client reviews */
  reviewsCount?: number;
  /** Spoken languages */
  languages?: string[];
  /** Profile avatar image URL */
  avatarUrl?: string;
  /** Cover background image URL */
  coverUrl?: string;
  /** Links card to profiles when claimed */
  userId?: string;
}

export type KycStatus = "draft" | "pending" | "approved" | "rejected";

export type KycDocumentType = "pan_card" | "aadhaar" | "rera_certificate" | "other";

export interface DealerKyc {
  status: KycStatus;
  panNumber?: string;
  aadhaarLast4?: string;
  dealerNotes?: string;
  rejectionReason?: string;
  submittedAt?: string;
  reviewedAt?: string;
}

/** App personas only — admin may appear from API but is unsupported in Expo */
export type UserRole = "user" | "broker";

export type AccountStatus = "active" | "suspended";

/** After directory claim, wait for web admin to promote role → broker */
export type DealerAccessStatus = "none" | "pending" | "approved";

export type ListerStatus = "none" | "pending" | "approved" | "rejected";

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  phone?: string;
  avatar?: string;
  bio?: string;
  city?: string;
  role: UserRole;
  status: AccountStatus;
  joinedDate: string;
  dealerAccess: DealerAccessStatus;
  listingStatus?: ListerStatus;
  listingVerifiedAt?: string | null;
  directoryProfileId?: string;
  kyc?: DealerKyc;
}

export interface MessageThread {
  id: string;
  buyerEmail: string;
  buyerName?: string;
  propertyId?: string;
  propertyTitle?: string;
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount?: number;
}

export interface Message {
  id: string;
  threadId: string;
  body: string;
  senderRole: "user" | "broker";
  senderEmail: string;
  createdAt: string;
}

export interface DealerAnalytics {
  listingsTotal: number;
  listingsActive: number;
  listingsPending: number;
  listingsDraft: number;
  listingsRejected: number;
  inquiriesTotal: number;
  visitsTotal: number;
  visitsPending: number;
  visitsConfirmed: number;
  inventoryValueSum: number;
  cityBreakdown: { city: string; count: number }[];
  monthlyInquiries: { month: string; count: number }[];
  topListings: {
    id: string;
    title: string;
    city: string;
    status: string;
    inquiryCount: number;
  }[];
  listings: {
    id: string;
    title: string;
    type: string;
    city: string;
    status: string;
    inquiryCount: number;
    price: number;
  }[];
}

export interface KycDocument {
  id: string;
  type: KycDocumentType;
  fileName?: string;
  uploadedAt?: string;
}
