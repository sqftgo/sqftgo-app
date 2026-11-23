import { nationalDigits, sameMobile, validateMobile } from "@/lib/phone";

type AuthChallenge = {
  purpose: "register" | "login";
  countryCode: string;
  national: string;
  code: string;
  expiresAt: number;
  attempts: number;
  sentAt: number;
  accountId?: string;
};

type AccountPhone = {
  id: string;
  countryCode?: string | null;
  phone?: string | null;
  mobileVerified?: boolean;
};

const challenges: AuthChallenge[] = [];
const sends: { key: string; at: number }[] = [];

function randomCode() {
  return String(Math.floor(Math.random() * 1_000_000)).padStart(6, "0");
}

function keyFor(purpose: string, country: string, national: string) {
  return `${purpose}:${country}:${national}`;
}

export function mockSendAuthMobileOtp(
  purpose: "register" | "login",
  countryCode: string,
  mobileNumber: string,
  accounts: AccountPhone[],
):
  | { ok: true; expiresAt: string; resendAfterSeconds: number; previewCode: string }
  | { ok: false; message: string; code?: string; resendAfterSeconds?: number } {
  const problem = validateMobile(countryCode, mobileNumber);
  if (problem) return { ok: false, code: "invalid_number", message: problem };
  const national = nationalDigits(countryCode, mobileNumber);

  if (purpose === "register") {
    const taken = accounts.some(
      (account) =>
        account.mobileVerified && sameMobile(account, { countryCode, phone: national }),
    );
    if (taken) {
      return {
        ok: false,
        code: "duplicate",
        message: "This mobile number is already registered. Sign in with mobile instead.",
      };
    }
  } else {
    const match = accounts.find(
      (account) =>
        account.mobileVerified && sameMobile(account, { countryCode, phone: national }),
    );
    if (!match) {
      return {
        ok: false,
        code: "not_found",
        message: "No verified account found for this mobile number.",
      };
    }
  }

  const now = Date.now();
  const bucket = keyFor(purpose, countryCode, national);
  const recentSends = sends.filter((item) => item.key === bucket && now - item.at < 60 * 60 * 1000);
  if (recentSends.length >= 5) {
    return {
      ok: false,
      code: "rate_limited",
      message: "Too many codes were requested. Try again in an hour.",
    };
  }
  const last = [...sends].reverse().find((item) => item.key === bucket);
  if (last && now - last.at < 30_000) {
    const resendAfterSeconds = Math.ceil((30_000 - (now - last.at)) / 1000);
    return {
      ok: false,
      code: "cooldown",
      message: "Wait a moment before requesting another code.",
      resendAfterSeconds,
    };
  }

  const code = randomCode();
  for (let i = challenges.length - 1; i >= 0; i -= 1) {
    if (
      challenges[i].purpose === purpose &&
      challenges[i].countryCode === countryCode &&
      challenges[i].national === national
    ) {
      challenges.splice(i, 1);
    }
  }
  const matchAccount =
    purpose === "login"
      ? accounts.find(
          (account) =>
            account.mobileVerified && sameMobile(account, { countryCode, phone: national }),
        )
      : undefined;
  challenges.push({
    purpose,
    countryCode,
    national,
    code,
    expiresAt: now + 5 * 60 * 1000,
    attempts: 0,
    sentAt: now,
    accountId: matchAccount?.id,
  });
  sends.push({ key: bucket, at: now });
  return {
    ok: true,
    expiresAt: new Date(now + 5 * 60 * 1000).toISOString(),
    resendAfterSeconds: 30,
    previewCode: code,
  };
}

export function mockVerifyRegisterMobileOtp(
  countryCode: string,
  mobileNumber: string,
  code: string,
):
  | { ok: true; claimToken: string; phone: string; countryCode: string }
  | { ok: false; message: string; code?: string } {
  const national = nationalDigits(countryCode, mobileNumber);
  const challenge = [...challenges]
    .reverse()
    .find(
      (item) =>
        item.purpose === "register" &&
        item.countryCode === countryDigits(countryCode) &&
        item.national === national,
    );
  if (!challenge) return { ok: false, code: "expired", message: "Request a new code." };
  if (Date.now() > challenge.expiresAt) {
    return { ok: false, code: "expired", message: "That code has expired. Request a new one." };
  }
  if (challenge.attempts >= 5) {
    return { ok: false, code: "locked", message: "Too many attempts. Request a new code." };
  }
  if (code.trim() !== challenge.code) {
    challenge.attempts += 1;
    return {
      ok: false,
      code: "invalid_code",
      message:
        challenge.attempts >= 5
          ? "Too many attempts. Request a new code."
          : "That code doesn't match.",
    };
  }
  challenge.expiresAt = 0;
  return {
    ok: true,
    claimToken: `mock-claim-${challenge.national}-${Date.now()}`,
    phone: challenge.national,
    countryCode: challenge.countryCode,
  };
}

export function mockLoginMobileOtp(
  countryCode: string,
  mobileNumber: string,
  code: string,
  accounts: AccountPhone[],
):
  | { ok: true; accountId: string; phone: string; countryCode: string }
  | { ok: false; message: string; code?: string } {
  const national = nationalDigits(countryCode, mobileNumber);
  const challenge = [...challenges]
    .reverse()
    .find(
      (item) =>
        item.purpose === "login" &&
        item.countryCode === countryDigits(countryCode) &&
        item.national === national,
    );
  if (!challenge) return { ok: false, code: "expired", message: "Request a new code." };
  if (Date.now() > challenge.expiresAt) {
    return { ok: false, code: "expired", message: "That code has expired. Request a new one." };
  }
  if (challenge.attempts >= 5) {
    return { ok: false, code: "locked", message: "Too many attempts. Request a new code." };
  }
  if (code.trim() !== challenge.code) {
    challenge.attempts += 1;
    return {
      ok: false,
      code: "invalid_code",
      message:
        challenge.attempts >= 5
          ? "Too many attempts. Request a new code."
          : "That code doesn't match.",
    };
  }
  const account =
    accounts.find((item) => item.id === challenge.accountId) ||
    accounts.find(
      (item) =>
        item.mobileVerified && sameMobile(item, { countryCode, phone: national }),
    );
  if (!account) {
    return {
      ok: false,
      code: "not_found",
      message: "No verified account found for this mobile number.",
    };
  }
  challenge.expiresAt = 0;
  return { ok: true, accountId: account.id, phone: challenge.national, countryCode: challenge.countryCode };
}

function countryDigits(countryCode: string) {
  return countryCode.replace(/\D/g, "") || "91";
}
