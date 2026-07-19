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

export interface PriceBreakdown {
  basePrice: number;
  securityDeposit?: number;
  maintenance: number;
  registrationFees?: number;
  gst?: number;
}

export interface Property {
  id: string;
  title: string;
  /** In rupees; monthly for rent/lease listings */
  price: number;
  type: PropertyType;
  purpose: PropertyPurpose;
  bhk?: number;
  city: string;
  locality: string;
  /** In sq.ft. */
  size: number;
  furnished: Furnishing;
  description: string;
  amenities: string[];
  images: string[];
  ownerName: string;
  ownerPhone: string;
  inquiryCount: number;
  status: "Active" | "Pending Review" | "Sold" | "Rented";
  featured?: boolean;
  reraApproved?: boolean;
  reraId?: string;
  verifiedDate?: string;
  priceBreakdown?: PriceBreakdown;
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
}

export type UserRole = "user" | "broker" | "admin";
