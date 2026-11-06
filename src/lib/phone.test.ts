import { formatMobile, nationalDigits, sameMobile, validateMobile } from "./phone.ts";

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

assert(nationalDigits("91", "+91 98765 43210") === "9876543210", "strips country code from formatted numbers");
assert(nationalDigits("91", "9876543210") === "9876543210", "keeps a national number");
assert(nationalDigits("91", "9123456780") === "9123456780", "keeps an Indian number that starts with 91");
assert(nationalDigits("91", "+91 9123456780") === "9123456780", "strips only a real India prefix");
assert(validateMobile("91", "98765 43210") === null, "accepts an Indian mobile");
assert(validateMobile("91", "12345") !== null, "rejects a short Indian mobile");
assert(validateMobile("91", "5876543210") !== null, "rejects an Indian mobile that does not start with 6-9");
assert(formatMobile("91", "9876543210") === "+91 98765 43210", "formats Indian numbers");
assert(
  sameMobile(
    { countryCode: "91", phone: "+91 98765 43210" },
    { countryCode: null, phone: "9876543210" },
  ),
  "treats formatted and national numbers as the same",
);
assert(
  !sameMobile(
    { countryCode: "91", phone: "9876543210" },
    { countryCode: "91", phone: "9876543211" },
  ),
  "distinguishes different numbers",
);

console.log("phone checks passed");
