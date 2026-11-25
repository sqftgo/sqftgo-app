import { getTokens } from "@/lib/api/auth-token";
import { apiFetch, ApiError } from "@/lib/api/client";
import { mobileAuthConfigured, SUPABASE_KEY, SUPABASE_URL } from "@/lib/api/supabase";
import { nationalDigits, validateMobile } from "@/lib/phone";
import { parseServiceAccess, type ServiceAccess } from "@/lib/service-access";
import type { AuthLoginResponse } from "@/lib/api/services/auth";
import { setTokens } from "@/lib/api/auth-token";
import { userFacingError } from "@/lib/errors";

export type AccountGate = {
  phone?: string;
  countryCode?: string | null;
  mobileVerified: boolean;
  mobileVerifiedAt?: string | null;
  authProvider?: string | null;
  serviceAccess: ServiceAccess;
};

export type OtpSendResult =
  | { ok: true; expiresAt?: string; resendAfterSeconds: number; channel?: string }
  | { ok: false; message: string; code?: string; resendAfterSeconds?: number };

export type OtpVerifyResult =
  | { ok: true; phone: string; countryCode: string }
  | { ok: false; message: string; code?: string };

export type RegisterOtpVerifyResult =
  | { ok: true; claimToken: string; phone: string; countryCode: string }
  | { ok: false; message: string; code?: string };

type GatePayload = {
  phone?: string | null;
  countryCode?: string | null;
  mobileVerified?: boolean;
  mobileVerifiedAt?: string | null;
  authProvider?: string | null;
  serviceAccess?: string;
};

function decodeJwt(token: string): Record<string, unknown> | null {
  try {
    const part = token.split(".")[1];
    if (!part) return null;
    const padded = part.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(part.length / 4) * 4, "=");
    const binary = globalThis.atob(padded);
    return JSON.parse(binary) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function authProviderFromToken(token: string | null | undefined): string | null {
  if (!token) return null;
  const payload = decodeJwt(token);
  const meta = payload?.app_metadata;
  if (meta && typeof meta === "object" && meta !== null && "provider" in meta) {
    const provider = (meta as { provider?: unknown }).provider;
    if (typeof provider === "string" && provider) return provider;
  }
  return null;
}

function unavailable(message: string): { ok: false; message: string; code: string } {
  return { ok: false, code: "unavailable", message };
}

async function authHeader(): Promise<string | null> {
  const { accessToken } = await getTokens();
  return accessToken ? `Bearer ${accessToken}` : null;
}

export async function apiAccountGate(): Promise<AccountGate | null> {
  if (!mobileAuthConfigured) return null;
  const authorization = await authHeader();
  if (!authorization) return null;
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/my_account_gate`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      apikey: SUPABASE_KEY,
      Authorization: authorization,
    },
    body: "{}",
  });
  if (!res.ok) return null;
  const payload = (await res.json()) as GatePayload | null;
  if (!payload || typeof payload !== "object") return null;
  return {
    phone: payload.phone ?? undefined,
    countryCode: payload.countryCode ?? null,
    mobileVerified: Boolean(payload.mobileVerified),
    mobileVerifiedAt: payload.mobileVerifiedAt ?? null,
    authProvider: payload.authProvider ?? null,
    serviceAccess: parseServiceAccess(payload.serviceAccess),
  };
}

async function otpFunction(body: Record<string, unknown>): Promise<Response> {
  const authorization = await authHeader();
  if (!authorization) throw new Error("Sign in again to verify your mobile number.");
  return fetch(`${SUPABASE_URL}/functions/v1/mobile-otp`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      apikey: SUPABASE_KEY,
      Authorization: authorization,
    },
    body: JSON.stringify(body),
  });
}

/** Post-login WhatsApp OTP (authenticated edge function). */
export async function apiSendMobileOtp(input: {
  countryCode: string;
  mobileNumber: string;
}): Promise<OtpSendResult> {
  if (!mobileAuthConfigured) {
    return unavailable("Mobile verification isn't configured for this build.");
  }
  const problem = validateMobile(input.countryCode, input.mobileNumber);
  if (problem) return { ok: false, code: "invalid_number", message: problem };
  const res = await otpFunction({
    action: "send",
    purpose: "verify",
    countryCode: input.countryCode,
    mobileNumber: nationalDigits(input.countryCode, input.mobileNumber),
  });
  const payload = (await res.json().catch(() => null)) as OtpSendResult | null;
  if (!payload || typeof payload !== "object" || !("ok" in payload)) {
    return { ok: false, message: "Couldn't send a code. Try again." };
  }
  return payload;
}

export async function apiVerifyMobileOtp(code: string): Promise<OtpVerifyResult> {
  if (!mobileAuthConfigured) {
    return unavailable("Mobile verification isn't configured for this build.");
  }
  const res = await otpFunction({ action: "verify", purpose: "verify", code });
  const payload = (await res.json().catch(() => null)) as OtpVerifyResult | null;
  if (!payload || typeof payload !== "object" || !("ok" in payload)) {
    return { ok: false, message: "Couldn't verify that code. Try again." };
  }
  return payload;
}

/** Unauthenticated register/login OTP via BFF (MSG91 on the server). */
export async function apiSendAuthMobileOtp(input: {
  purpose: "register" | "login";
  countryCode: string;
  mobileNumber: string;
}): Promise<OtpSendResult> {
  const problem = validateMobile(input.countryCode, input.mobileNumber);
  if (problem) return { ok: false, code: "invalid_number", message: problem };
  try {
    return await apiFetch<OtpSendResult>("/api/auth/mobile/otp/send", {
      method: "POST",
      public: true,
      body: {
        purpose: input.purpose,
        countryCode: countryDigitsSafe(input.countryCode),
        mobileNumber: nationalDigits(input.countryCode, input.mobileNumber),
      },
    });
  } catch (e) {
    return mapApiError(e);
  }
}

export async function apiVerifyRegisterMobileOtp(input: {
  countryCode: string;
  mobileNumber: string;
  code: string;
}): Promise<RegisterOtpVerifyResult> {
  const problem = validateMobile(input.countryCode, input.mobileNumber);
  if (problem) return { ok: false, code: "invalid_number", message: problem };
  try {
    const payload = await apiFetch<{
      ok: boolean;
      claimToken?: string;
      phone?: string;
      countryCode?: string;
      message?: string;
      code?: string;
    }>("/api/auth/mobile/otp/verify", {
      method: "POST",
      public: true,
      body: {
        purpose: "register",
        countryCode: countryDigitsSafe(input.countryCode),
        mobileNumber: nationalDigits(input.countryCode, input.mobileNumber),
        code: input.code.trim(),
      },
    });
    if (!payload.ok || !payload.claimToken || !payload.phone || !payload.countryCode) {
      return {
        ok: false,
        code: payload.code,
        message: payload.message ?? "Couldn't verify that code. Try again.",
      };
    }
    return {
      ok: true,
      claimToken: payload.claimToken,
      phone: payload.phone,
      countryCode: payload.countryCode,
    };
  } catch (e) {
    return mapApiError(e);
  }
}

export async function apiMobileLogin(input: {
  countryCode: string;
  mobileNumber: string;
  code: string;
}): Promise<AuthLoginResponse> {
  const problem = validateMobile(input.countryCode, input.mobileNumber);
  if (problem) throw new Error(problem);
  const res = await apiFetch<AuthLoginResponse>("/api/auth/mobile/login", {
    method: "POST",
    public: true,
    body: {
      countryCode: countryDigitsSafe(input.countryCode),
      mobileNumber: nationalDigits(input.countryCode, input.mobileNumber),
      code: input.code.trim(),
    },
  });
  if (res.accessToken) {
    await setTokens({
      accessToken: res.accessToken,
      refreshToken: res.refreshToken ?? null,
      expiresAt: res.expiresAt ?? null,
    });
  }
  return res;
}

function countryDigitsSafe(countryCode: string): string {
  return countryCode.replace(/\D/g, "") || "91";
}

function mapApiError(e: unknown): { ok: false; message: string; code?: string; resendAfterSeconds?: number } {
  if (e instanceof ApiError) {
    const body = e.body as { message?: string; error?: string; code?: string; resendAfterSeconds?: number } | null;
    return {
      ok: false,
      code: body?.code,
      message: userFacingError(e, "Request failed."),
      resendAfterSeconds: body?.resendAfterSeconds,
    };
  }
  return {
    ok: false,
    message: userFacingError(e, "Request failed."),
  };
}
