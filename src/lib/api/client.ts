import { API_BASE_URL } from "@/lib/api/config";
import { clearTokens, getTokens, setTokens } from "@/lib/api/auth-token";

export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(message: string, status: number, body?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }

  get code(): string | undefined {
    const obj = this.body as Record<string, unknown> | null;
    return typeof obj?.code === "string" ? obj.code : undefined;
  }
}

type ApiFetchOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  token?: string | null;
  /** Skip Authorization header */
  public?: boolean;
};

type SessionEvent = "expired" | "suspended";
const sessionListeners = new Set<(event: SessionEvent) => void>();

/** Notified when the stored session can no longer be used (refresh failed or account suspended). */
export function onSessionEvent(listener: (event: SessionEvent) => void): () => void {
  sessionListeners.add(listener);
  return () => {
    sessionListeners.delete(listener);
  };
}

function emitSessionEvent(event: SessionEvent) {
  sessionListeners.forEach((l) => l(event));
}

function buildUrl(path: string): string {
  return path.startsWith("http")
    ? path
    : `${API_BASE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
}

async function parseBody(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

let refreshInFlight: Promise<string | null> | null = null;

/** Exchanges the stored refresh token for a new access token. Single-flight. */
export function refreshAccessToken(): Promise<string | null> {
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = (async () => {
    const { refreshToken } = await getTokens();
    if (!refreshToken || !API_BASE_URL) return null;
    try {
      const res = await fetch(buildUrl("/api/auth/refresh"), {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });
      const parsed = (await parseBody(res)) as Record<string, unknown> | null;
      if (res.status === 403) {
        await clearTokens();
        emitSessionEvent("suspended");
        return null;
      }
      if (!res.ok || typeof parsed?.accessToken !== "string") {
        await clearTokens();
        emitSessionEvent("expired");
        return null;
      }
      await setTokens({
        accessToken: parsed.accessToken,
        refreshToken:
          typeof parsed.refreshToken === "string" ? parsed.refreshToken : refreshToken,
        expiresAt: typeof parsed.expiresAt === "number" ? parsed.expiresAt : null,
      });
      return parsed.accessToken;
    } catch {
      // Network failure: keep tokens so the next request can retry.
      return null;
    }
  })().finally(() => {
    refreshInFlight = null;
  });
  return refreshInFlight;
}

async function resolveAccessToken(): Promise<string | null> {
  const { accessToken, refreshToken, expiresAt } = await getTokens();
  const nowSec = Math.floor(Date.now() / 1000);
  if (accessToken && refreshToken && expiresAt && expiresAt - nowSec < 60) {
    return (await refreshAccessToken()) ?? accessToken;
  }
  return accessToken;
}

export async function apiFetch<T = unknown>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<T> {
  if (!API_BASE_URL) {
    throw new ApiError("API base URL is not configured", 0);
  }

  const { body, token, public: isPublic, headers: initHeaders, ...rest } = options;
  const url = buildUrl(path);

  const send = async (accessToken: string | null) => {
    const headers: Record<string, string> = {
      Accept: "application/json",
      ...(initHeaders as Record<string, string> | undefined),
    };
    if (body !== undefined && !(body instanceof FormData)) {
      headers["Content-Type"] = "application/json";
    }
    if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
    return fetch(url, {
      ...rest,
      headers,
      body:
        body === undefined
          ? undefined
          : body instanceof FormData
            ? body
            : JSON.stringify(body),
    });
  };

  let accessToken = isPublic ? null : (token ?? (await resolveAccessToken()));
  let res: Response;
  try {
    res = await send(accessToken);
  } catch {
    throw new ApiError("You appear to be offline. Check your connection and try again.", 0);
  }

  if (res.status === 401 && accessToken && token == null) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      accessToken = refreshed;
      res = await send(refreshed);
    }
  }

  const parsed = await parseBody(res);

  if (!res.ok) {
    const obj =
      typeof parsed === "object" && parsed !== null
        ? (parsed as Record<string, unknown>)
        : null;
    let message =
      (typeof obj?.error === "string" && obj.error) ||
      (typeof obj?.message === "string" && obj.message) ||
      `Request failed (${res.status})`;

    if (res.status === 429) {
      const retry = res.headers.get("retry-after");
      message = retry
        ? `Too many attempts. Try again in ${retry} seconds.`
        : "Too many attempts. Please wait a moment and try again.";
    }
    if (res.status === 403 && !isPublic && /suspend/i.test(message)) {
      emitSessionEvent("suspended");
    }

    if (__DEV__) {
      console.error(`[API ${res.status}] ${options.method ?? "GET"} ${url}`, parsed);
    }

    throw new ApiError(message, res.status, parsed);
  }

  return parsed as T;
}

/** User-facing message for any thrown value. */
export function errorMessage(e: unknown, fallback = "Something went wrong. Please try again."): string {
  if (e instanceof Error && e.message) return e.message;
  return fallback;
}
