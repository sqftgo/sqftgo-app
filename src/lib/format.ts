/** Formats a rupee amount using Indian conventions (Lakh / Crore); `long` spells the unit out. */
export function formatIndianPrice(amount: number, opts: { long?: boolean } = {}): string {
  if (amount >= 10000000) {
    const crore = amount / 10000000;
    return `₹${crore % 1 === 0 ? crore.toFixed(0) : crore.toFixed(2)} ${opts.long ? "Crore" : "Cr"}`;
  }
  if (amount >= 100000) {
    const lakh = amount / 100000;
    return `₹${lakh % 1 === 0 ? lakh.toFixed(0) : lakh.toFixed(1)} ${opts.long ? "Lakh" : "L"}`;
  }
  return `₹${Math.round(amount).toLocaleString("en-IN")}`;
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

/** "5 min ago", "3 hrs ago", "2 days ago"; falls back to a short date after a week. */
export function formatRelativeTime(iso: string): string {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return "";
  const mins = Math.floor((Date.now() - t) / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr${hrs === 1 ? "" : "s"} ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
  return new Date(t).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
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
