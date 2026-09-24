/** Lakh / Crore formatting used across the property detail screen. */
export function formatIndianCurrency(num: number): string {
  if (num >= 10000000) {
    return `₹${(num / 10000000).toFixed(2)} Crore`;
  }
  if (num >= 100000) {
    return `₹${(num / 100000).toFixed(1)} Lakh`;
  }
  return `₹${Math.round(num).toLocaleString("en-IN")}`;
}

export function isRentalPurpose(purpose: string): boolean {
  return purpose === "rent" || purpose === "lease";
}
