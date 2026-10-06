import { formatIndianPrice } from "@/lib/format";

/** Lakh / Crore with the unit spelled out, used on the property detail screen. */
export function formatIndianCurrency(num: number): string {
  return formatIndianPrice(num, { long: true });
}

export function isRentalPurpose(purpose: string): boolean {
  return purpose === "rent" || purpose === "lease";
}
