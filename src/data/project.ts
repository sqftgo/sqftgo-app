/** Project types mirrored from SqftGo web BFF. */

export type ProjectStatus =
  | "Draft"
  | "Pending Review"
  | "Active"
  | "Sold"
  | "Rejected";

export type ProjectLifecycle = "Upcoming" | "Under Construction" | "Ready";

export type ProjectOwnershipRole = "Owner" | "Builder" | "Marketing Partner";

export type Project = {
  id: string;
  ownerId: string;
  title: string;
  description: string;
  city: string;
  state?: string;
  country?: string;
  locality: string;
  ownershipRole: ProjectOwnershipRole;
  lifecycle: ProjectLifecycle;
  propertyTypes: string[];
  configurations: string[];
  priceFrom?: number;
  priceTo?: number;
  sizeFrom?: number;
  sizeTo?: number;
  amenities: string[];
  images: string[];
  contactName: string;
  contactPhone: string;
  reraId?: string;
  reraApproved: boolean;
  possessionDate?: string;
  launchDate?: string;
  status: ProjectStatus;
  rejectionReason?: string | null;
  featured: boolean;
  seoTitle?: string;
  seoDescription?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type ProjectInput = Omit<
  Project,
  "id" | "ownerId" | "featured" | "rejectionReason" | "createdAt" | "updatedAt" | "reraApproved"
> & {
  featured?: boolean;
  reraApproved?: boolean;
  status?: ProjectStatus;
};
