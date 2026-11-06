/** National number + calling code helpers shared by auth UI and offline OTP checks. */

export type PhoneParts = {
  countryCode: string;
  national: string;
};

export function digitsOnly(value: string | null | undefined): string {
  return (value ?? "").replace(/\D/g, "");
}

export function countryDigits(countryCode: string | null | undefined): string {
  const digits = digitsOnly(countryCode);
  return digits || "91";
}

/** Strip a leading calling code when the stored value still includes it. */
export function nationalDigits(
  countryCode: string | null | undefined,
  raw: string | null | undefined,
): string {
  const cc = countryDigits(countryCode);
  let digits = digitsOnly(raw);
  if (cc === "91" && /^91[6-9][0-9]{9}$/.test(digits)) {
    digits = digits.slice(2);
  } else if (
    cc !== "91" &&
    digits.startsWith(cc) &&
    digits.length - cc.length >= 6 &&
    digits.length - cc.length <= 15
  ) {
    digits = digits.slice(cc.length);
  }
  return digits;
}

export function validateMobile(countryCode: string, raw: string): string | null {
  const country = countryDigits(countryCode);
  const national = nationalDigits(country, raw);
  if (!/^[0-9]{1,4}$/.test(country)) return "Choose a valid country code.";
  if (country === "91") {
    if (!/^[6-9][0-9]{9}$/.test(national)) return "Enter a 10-digit Indian mobile number.";
    return null;
  }
  if (!/^[0-9]{6,15}$/.test(national)) return "Enter a valid mobile number.";
  return null;
}

export function sameMobile(
  a: { countryCode?: string | null; phone?: string | null },
  b: { countryCode?: string | null; phone?: string | null },
): boolean {
  if (!a.phone || !b.phone) return false;
  return (
    countryDigits(a.countryCode) === countryDigits(b.countryCode) &&
    nationalDigits(a.countryCode, a.phone) === nationalDigits(b.countryCode, b.phone)
  );
}

export function formatMobile(
  countryCode: string | null | undefined,
  phone: string | null | undefined,
): string {
  if (!phone?.trim()) return "";
  const country = countryDigits(countryCode);
  const national = nationalDigits(country, phone);
  if (!national) return phone.trim();
  if (country === "91" && national.length === 10) {
    return `+91 ${national.slice(0, 5)} ${national.slice(5)}`;
  }
  return `+${country} ${national}`;
}

export const COUNTRY_CODES: { code: string; label: string }[] = [
  { code: "91", label: "India" },
  { code: "971", label: "UAE" },
  { code: "977", label: "Nepal" },
  { code: "94", label: "Sri Lanka" },
  { code: "880", label: "Bangladesh" },
  { code: "65", label: "Singapore" },
  { code: "61", label: "Australia" },
  { code: "44", label: "United Kingdom" },
  { code: "1", label: "United States" },
];
