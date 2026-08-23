import { apiFetch } from "@/lib/api/client";
import { setAccessToken } from "@/lib/api/auth-token";
import type { AccountStatus, DealerAccessStatus, DealerKyc, ListerStatus, UserRole } from "@/data/types";

export interface AuthMeResponse {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: UserRole | "admin";
  status: AccountStatus;
  dealerAccess?: DealerAccessStatus;
  listingStatus?: ListerStatus;
  listingVerifiedAt?: string | null;
  directoryProfileId?: string;
  kyc?: DealerKyc;
  joinedDate?: string;
  accessToken?: string;
}

export interface AuthLoginResponse extends AuthMeResponse {
  accessToken: string;
}

export async function apiLogin(email: string, password: string): Promise<AuthLoginResponse> {
  const res = await apiFetch<AuthLoginResponse>("/api/auth/login", {
    method: "POST",
    body: { email, password },
    public: true,
  });
  if (res.accessToken) await setAccessToken(res.accessToken);
  return res;
}

export async function apiSignup(input: {
  email: string;
  password: string;
  name: string;
}): Promise<AuthLoginResponse> {
  const res = await apiFetch<AuthLoginResponse>("/api/auth/signup", {
    method: "POST",
    body: input,
    public: true,
  });
  if (res.accessToken) await setAccessToken(res.accessToken);
  return res;
}

export async function apiMe(): Promise<AuthMeResponse> {
  return apiFetch<AuthMeResponse>("/api/auth/me");
}

export async function apiLogout(): Promise<void> {
  try {
    await apiFetch("/api/auth/logout", { method: "POST" });
  } finally {
    await setAccessToken(null);
  }
}

export async function apiUpdatePassword(input: {
  currentPassword: string;
  newPassword: string;
}): Promise<void> {
  await apiFetch("/api/auth/update-password", { method: "POST", body: input });
}

export async function apiForgotPassword(email: string): Promise<void> {
  await apiFetch("/api/auth/forgot-password", {
    method: "POST",
    body: { email: email.trim().toLowerCase() },
    public: true,
  });
}

export async function apiUpdateMe(body: {
  name?: string;
  phone?: string;
  bio?: string;
  city?: string;
  avatarUrl?: string | null;
}): Promise<AuthMeResponse> {
  return apiFetch<AuthMeResponse>("/api/auth/me", { method: "PATCH", body });
}
