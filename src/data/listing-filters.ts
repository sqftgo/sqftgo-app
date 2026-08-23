export type ListingFilterKind =
  | "purpose"
  | "city"
  | "locality"
  | "type"
  | "bhk"
  | "furnishing"
  | "price"
  | "size"
  | "amenities"
  | "rera"
  | "featured"
  | "text"
  | "toggle"
  | "multi";

export type ListingFilterOption = {
  label: string;
  value: string;
};

export type ListingFilter = {
  id: string;
  key: string;
  label: string;
  kind: ListingFilterKind;
  propertyField?: string;
  catalog?: "cities" | "categories" | "amenities";
  options: ListingFilterOption[];
  active: boolean;
  system: boolean;
  sortOrder: number;
};
