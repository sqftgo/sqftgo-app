import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";

import { apiFetch } from "@/lib/api/client";
import { clearTokens, setTokens } from "@/lib/api/auth-token";
import { API_BASE_URL } from "@/lib/api/config";
import type { AccountStatus, DealerAccessStatus, DealerKyc, ListerStatus, UserRole } from "@/data/types";

export interface AuthMeResponse {
  id: string;
  email: string;
  name: string;
  phone?: string;
  bio?: string;
  city?: string;
  avatarUrl?: string | null;
  role: UserRole | "admin";
  status: AccountStatus;
  dealerAccess?: DealerAccessStatus;
  listingStatus?: ListerStatus;
  listingVerifiedAt?: string | null;
  directoryProfileId?: string;
  kyc?: DealerKyc;
  joinedDate?: string;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
}

export interface AuthLoginResponse extends AuthMeResponse {
  accessToken: string;
}

async function storeSessionTokens(res: AuthMeResponse) {
  if (!res.accessToken) return;
  await setTokens({
    accessToken: res.accessToken,
    refreshToken: res.refreshToken ?? null,
    expiresAt: res.expiresAt ?? null,
  });
}

export async function apiLogin(email: string, password: string): Promise<AuthLoginResponse> {
  const res = await apiFetch<AuthLoginResponse>("/api/auth/login", {
    method: "POST",
    body: { email, password },
    public: true,
  });
  await storeSessionTokens(res);
  return res;
}

export async function apiSignup(input: {
  email: string;
  password: string;
  name: string;
  /** Matches web: dealer signup promotes profile.role to broker via BFF. */
  intent?: "user" | "dealer";
}): Promise<AuthLoginResponse | { status: "confirm_email"; email: string; message: string }> {
  const res = await apiFetch<
    AuthLoginResponse | { status: "confirm_email"; email: string; message: string }
  >("/api/auth/signup", {
    method: "POST",
    body: {
      email: input.email,
      password: input.password,
      name: input.name,
      intent: input.intent === "dealer" ? "dealer" : "user",
    },
    public: true,
  });
  if ("status" in res && res.status === "confirm_email") {
    return res;
  }
  await storeSessionTokens(res as AuthLoginResponse);
  return res as AuthLoginResponse;
}

export async function apiMe(): Promise<AuthMeResponse> {
  return apiFetch<AuthMeResponse>("/api/auth/me");
}

export async function apiLogout(): Promise<void> {
  try {
    await apiFetch("/api/auth/logout", { method: "POST" });
  } finally {
    await clearTokens();
  }
}

export async function apiUpdatePassword(input: {
  currentPassword: string;
  newPassword: string;
}): Promise<void> {
  await apiFetch("/api/auth/update-password", {
    method: "POST",
    body: { currentPassword: input.currentPassword, password: input.newPassword },
  });
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

export type GoogleSignInResult =
  | { ok: true; me: AuthMeResponse }
  | { ok: false; cancelled?: boolean; message: string };

/**
 * Google OAuth via the web BFF: the browser completes Supabase OAuth on the web origin,
 * then `/auth/mobile/complete` redirects back to the app with tokens in the URL fragment.
 */
export async function apiGoogleSignIn(): Promise<GoogleSignInResult> {
  if (!API_BASE_URL) return { ok: false, message: "Google sign-in isn't available in offline preview." };
  const returnUrl = Linking.createURL("auth/callback");
  const startUrl = `${API_BASE_URL}/auth/mobile?redirect=${encodeURIComponent(returnUrl)}`;

  const result = await WebBrowser.openAuthSessionAsync(startUrl, returnUrl);
  if (result.type !== "success") {
    return { ok: false, cancelled: true, message: "Google sign-in was cancelled." };
  }

  const [, fragment = ""] = result.url.split("#");
  const [, query = ""] = result.url.split("#")[0].split("?");
  const hash = new URLSearchParams(fragment);
  const search = new URLSearchParams(query);
  const error = search.get("error") || hash.get("error");
  const accessToken = hash.get("access_token");
  if (error || !accessToken) {
    return { ok: false, message: "Google sign-in could not be completed. Please try again." };
  }
  const expiresAt = Number(hash.get("expires_at"));
  await setTokens({
    accessToken,
    refreshToken: hash.get("refresh_token"),
    expiresAt: Number.isFinite(expiresAt) ? expiresAt : null,
  });
  try {
    const me = await apiMe();
    return { ok: true, me };
  } catch (e) {
    await clearTokens();
    return {
      ok: false,
      message: e instanceof Error ? e.message : "Could not load your account.",
    };
  }
}
