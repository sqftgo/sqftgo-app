/** Formats a rupee amount using Indian conventions (Lakh / Crore). */
export function formatIndianPrice(amount: number): string {
  if (amount >= 10000000) {
    const crore = amount / 10000000;
    return `₹${crore % 1 === 0 ? crore.toFixed(0) : crore.toFixed(2)} Cr`;
  }
  if (amount >= 100000) {
    const lakh = amount / 100000;
    return `₹${lakh % 1 === 0 ? lakh.toFixed(0) : lakh.toFixed(1)} L`;
  }
  return `₹${amount.toLocaleString("en-IN")}`;
}

/** Price with a "/mo" suffix for rentals and leases. */
export function formatPriceWithPeriod(amount: number, purpose: string): string {
  const base = formatIndianPrice(amount);
  return purpose === "rent" || purpose === "lease" ? `${base}/mo` : base;
}

export function formatSize(sqft: number): string {
  return `${sqft.toLocaleString("en-IN")} sqft`;
}

/** Human label for a listing's transaction type. */
export function purposeLabel(purpose: string): string {
  switch (purpose) {
    case "rent":
      return "For Rent";
    case "lease":
      return "For Lease";
    default:
      return "For Sale";
  }
}

export function greetingForHour(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

/** Derives a display name from an email address. */
export function displayNameFromEmail(email: string): string {
  if (!email) return "Guest";
  return email
    .split("@")[0]
    .replace(/[._-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function initialsFromName(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
