import type { Furnishing, Property, PropertyType } from "@/data/types";

/** Same order as the web listing form. */
export const LISTING_TYPES: PropertyType[] = [
  "Apartment",
  "Villa",
  "Home",
  "Office Space",
  "Commercial Space",
  "Shop",
  "Hotel",
  "Industrial Plot",
  "Agricultural Land",
];

export const NON_RESIDENTIAL_TYPES: PropertyType[] = [
  "Office Space",
  "Commercial Space",
  "Shop",
  "Industrial Plot",
  "Agricultural Land",
];

export type ListingPurpose = "buy" | "rent" | "lease";
export const LISTING_PURPOSES: ListingPurpose[] = ["buy", "rent", "lease"];
export const PURPOSE_LABEL: Record<ListingPurpose, string> = {
  buy: "For sale",
  rent: "For rent",
  lease: "For lease",
};

export const FURNISHING_OPTIONS: Furnishing[] = ["Unfurnished", "Semi-Furnished", "Furnished"];

/** Web fallback when the amenity catalog is unavailable. */
export const FALLBACK_AMENITIES = [
  "Swimming Pool",
  "Gym",
  "Garden",
  "Parking",
  "EV Charging",
  "Power Backup",
  "Security",
];

export const LIMITS = {
  images: 30,
  amenities: 50,
  title: 200,
  description: 20000,
  reraId: 80,
  seoTitle: 200,
  seoDescription: 500,
} as const;

export interface ListingDraft {
  title: string;
  type: PropertyType;
  purpose: ListingPurpose;
  description: string;
  city: string;
  state: string;
  locality: string;
  nearbyHospital: string;
  nearbySchool: string;
  nearbyTransportation: string;
  size: string;
  furnished: Furnishing;
  bhk: string;
  bathrooms: string;
  parking: string;
  yearBuilt: string;
  price: string;
  securityDeposit: string;
  maintenance: string;
  amenities: string[];
  images: string[];
  videoUrl: string;
  reraId: string;
  seoTitle: string;
  seoDescription: string;
}

export type DraftField = keyof ListingDraft;
export type DraftErrors = Partial<Record<DraftField, string>>;

const str = (n: number | undefined | null) => (n == null ? "" : String(n));

export function emptyDraft(city: string): ListingDraft {
  return {
    title: "",
    type: "Apartment",
    purpose: "buy",
    description: "",
    city,
    state: "",
    locality: "",
    nearbyHospital: "",
    nearbySchool: "",
    nearbyTransportation: "",
    size: "",
    furnished: "Unfurnished",
    bhk: "",
    bathrooms: "",
    parking: "",
    yearBuilt: "",
    price: "",
    securityDeposit: "",
    maintenance: "",
    amenities: [],
    images: [],
    videoUrl: "",
    reraId: "",
    seoTitle: "",
    seoDescription: "",
  };
}

export function draftFromProperty(p: Property): ListingDraft {
  return {
    title: p.title,
    type: p.type,
    purpose: p.purpose === "sell" ? "buy" : p.purpose,
    description: p.description,
    city: p.city,
    state: p.state ?? "",
    locality: p.locality,
    nearbyHospital: p.nearbyHospital ?? "",
    nearbySchool: p.nearbySchool ?? "",
    nearbyTransportation: p.nearbyTransportation ?? "",
    size: str(p.size),
    furnished: p.furnished,
    bhk: str(p.bhk),
    bathrooms: str(p.bathrooms),
    parking: str(p.parking),
    yearBuilt: str(p.yearBuilt),
    price: str(p.price),
    securityDeposit: str(p.priceBreakdown?.securityDeposit),
    maintenance: p.priceBreakdown?.maintenance ? String(p.priceBreakdown.maintenance) : "",
    amenities: p.amenities ?? [],
    images: p.images ?? [],
    videoUrl: p.videoUrl ?? "",
    reraId: p.reraId ?? "",
    seoTitle: p.seoTitle ?? "",
    seoDescription: p.seoDescription ?? "",
  };
}

const num = (s: string) => Number(s.replace(/,/g, "").trim());
const blank = (s: string) => s.trim() === "";

function intInRange(s: string, min: number, max: number) {
  if (blank(s)) return true;
  const n = num(s);
  return Number.isInteger(n) && n >= min && n <= max;
}

export type ListingStep = "basics" | "location" | "details" | "price" | "media";

/** Mirrors the web zod schema; landmarks are only required when submitting for review. */
export function validateStep(
  step: ListingStep,
  d: ListingDraft,
  opts: { requireLandmarks: boolean },
): DraftErrors {
  const e: DraftErrors = {};
  switch (step) {
    case "basics": {
      const t = d.title.trim().length;
      if (t < 3) e.title = "Add a title of at least 3 characters.";
      else if (t > LIMITS.title) e.title = `Keep the title under ${LIMITS.title} characters.`;
      if (blank(d.description)) e.description = "Describe the property.";
      else if (d.description.length > LIMITS.description) e.description = "Description is too long.";
      break;
    }
    case "location": {
      if (blank(d.city)) e.city = "Choose a city.";
      if (d.locality.trim().length < 2) e.locality = "Enter the locality or area.";
      if (opts.requireLandmarks) {
        if (blank(d.nearbyHospital)) e.nearbyHospital = "Add the nearest hospital.";
        if (blank(d.nearbySchool)) e.nearbySchool = "Add the nearest school.";
        if (blank(d.nearbyTransportation)) e.nearbyTransportation = "Add the nearest bus, metro or station.";
      }
      break;
    }
    case "details": {
      const size = num(d.size);
      if (blank(d.size) || !Number.isFinite(size) || size <= 0) e.size = "Enter the area in sq.ft.";
      if (!intInRange(d.bhk, 0, 50)) e.bhk = "Use a whole number up to 50.";
      if (!intInRange(d.bathrooms, 0, 50)) e.bathrooms = "Use a whole number up to 50.";
      if (!intInRange(d.parking, 0, 100)) e.parking = "Use a whole number up to 100.";
      if (!intInRange(d.yearBuilt, 1800, 2100)) e.yearBuilt = "Enter a year like 2018.";
      break;
    }
    case "price": {
      const price = num(d.price);
      if (blank(d.price) || !Number.isFinite(price) || price <= 0) e.price = "Enter the asking price.";
      if (!blank(d.securityDeposit) && !(num(d.securityDeposit) >= 0)) e.securityDeposit = "Enter an amount.";
      if (!blank(d.maintenance) && !(num(d.maintenance) >= 0)) e.maintenance = "Enter an amount.";
      if (d.reraId.length > LIMITS.reraId) e.reraId = "RERA ID is too long.";
      break;
    }
    case "media": {
      if (d.images.length > LIMITS.images) e.images = `Up to ${LIMITS.images} photos.`;
      if (d.amenities.length > LIMITS.amenities) e.amenities = `Up to ${LIMITS.amenities} amenities.`;
      if (!blank(d.videoUrl) && !/^https?:\/\/\S+$/i.test(d.videoUrl.trim())) {
        e.videoUrl = "Paste a full link starting with https://";
      }
      if (d.seoTitle.length > LIMITS.seoTitle) e.seoTitle = "Keep it under 200 characters.";
      if (d.seoDescription.length > LIMITS.seoDescription) e.seoDescription = "Keep it under 500 characters.";
      break;
    }
  }
  return e;
}

export const LISTING_STEPS: ListingStep[] = ["basics", "location", "details", "price", "media"];

export function validateAll(d: ListingDraft, opts: { requireLandmarks: boolean }): DraftErrors {
  return LISTING_STEPS.reduce<DraftErrors>((acc, s) => ({ ...acc, ...validateStep(s, d, opts) }), {});
}

/** Index of the first step that fails validation, or -1 when the draft is valid. */
export function firstInvalidStep(d: ListingDraft, opts: { requireLandmarks: boolean }): number {
  return LISTING_STEPS.findIndex((s) => Object.keys(validateStep(s, d, opts)).length > 0);
}

const optInt = (s: string) => (blank(s) ? undefined : Math.round(num(s)));

/** Same defaults as the web `toSubmitData`: SEO falls back to title/description, RERA flag follows the ID. */
export function draftToPayload(d: ListingDraft) {
  const price = num(d.price);
  const nonResidential = NON_RESIDENTIAL_TYPES.includes(d.type);
  const deposit = blank(d.securityDeposit) ? undefined : num(d.securityDeposit);
  const maintenance = blank(d.maintenance) ? undefined : num(d.maintenance);
  const reraId = d.reraId.trim();
  const description = d.description.trim();
  return {
    title: d.title.trim(),
    type: d.type,
    purpose: d.purpose,
    description,
    city: d.city,
    state: d.state || undefined,
    country: "India",
    locality: d.locality.trim(),
    nearbyHospital: d.nearbyHospital.trim() || undefined,
    nearbySchool: d.nearbySchool.trim() || undefined,
    nearbyTransportation: d.nearbyTransportation.trim() || undefined,
    size: num(d.size),
    furnished: d.furnished,
    bhk: nonResidential ? undefined : optInt(d.bhk),
    bathrooms: optInt(d.bathrooms),
    parking: optInt(d.parking),
    yearBuilt: optInt(d.yearBuilt),
    price,
    amenities: d.amenities.slice(0, LIMITS.amenities),
    images: d.images.slice(0, LIMITS.images),
    videoUrl: d.videoUrl.trim(),
    reraId: reraId || undefined,
    reraApproved: Boolean(reraId),
    seoTitle: d.seoTitle.trim() || d.title.trim(),
    seoDescription: d.seoDescription.trim() || description.slice(0, 160),
    priceBreakdown:
      deposit != null || maintenance != null
        ? { basePrice: price, securityDeposit: deposit, maintenance: maintenance ?? 0 }
        : undefined,
  } satisfies Partial<Property>;
}
