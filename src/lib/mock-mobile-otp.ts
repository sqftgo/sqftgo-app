import { nationalDigits, sameMobile, validateMobile } from "@/lib/phone";

type Challenge = {
  accountId: string;
  countryCode: string;
  national: string;
  code: string;
  expiresAt: number;
  attempts: number;
  sentAt: number;
};

type AccountPhone = {
  id: string;
  countryCode?: string | null;
  phone?: string | null;
  mobileVerified?: boolean;
};

const challenges: Challenge[] = [];
const sends: { accountId: string; at: number }[] = [];

function randomCode() {
  return String(Math.floor(Math.random() * 1_000_000)).padStart(6, "0");
}

export function mockSendMobileOtp(
  accountId: string,
  countryCode: string,
  mobileNumber: string,
  accounts: AccountPhone[],
):
  | { ok: true; expiresAt: string; resendAfterSeconds: number; previewCode: string }
  | { ok: false; message: string; code?: string; resendAfterSeconds?: number } {
  const problem = validateMobile(countryCode, mobileNumber);
  if (problem) return { ok: false, code: "invalid_number", message: problem };
  const national = nationalDigits(countryCode, mobileNumber);
  const taken = accounts.some(
    (account) =>
      account.id !== accountId &&
      account.mobileVerified &&
      sameMobile(account, { countryCode, phone: national }),
  );
  if (taken) {
    return {
      ok: false,
      code: "duplicate",
      message: "This mobile number is already used by another account.",
    };
  }

  const now = Date.now();
  const recentSends = sends.filter((item) => item.accountId === accountId && now - item.at < 60 * 60 * 1000);
  if (recentSends.length >= 5) {
    return {
      ok: false,
      code: "rate_limited",
      message: "Too many codes were requested. Try again in an hour.",
    };
  }
  const last = [...sends].reverse().find((item) => item.accountId === accountId);
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
    if (challenges[i].accountId === accountId) challenges.splice(i, 1);
  }
  challenges.push({
    accountId,
    countryCode,
    national,
    code,
    expiresAt: now + 5 * 60 * 1000,
    attempts: 0,
    sentAt: now,
  });
  sends.push({ accountId, at: now });
  return {
    ok: true,
    expiresAt: new Date(now + 5 * 60 * 1000).toISOString(),
    resendAfterSeconds: 30,
    previewCode: code,
  };
}

export function mockVerifyMobileOtp(
  accountId: string,
  code: string,
  accounts: AccountPhone[],
):
  | { ok: true; phone: string; countryCode: string }
  | { ok: false; message: string; code?: string } {
  const challenge = [...challenges].reverse().find((item) => item.accountId === accountId);
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
  const taken = accounts.some(
    (account) =>
      account.id !== accountId &&
      account.mobileVerified &&
      sameMobile(account, { countryCode: challenge.countryCode, phone: challenge.national }),
  );
  if (taken) {
    return {
      ok: false,
      code: "duplicate",
      message: "This mobile number is already used by another account.",
    };
  }
  challenge.expiresAt = 0;
  return { ok: true, phone: challenge.national, countryCode: challenge.countryCode };
}
