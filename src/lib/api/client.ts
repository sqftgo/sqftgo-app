import { API_BASE_URL } from "@/lib/api/config";
import { getAccessToken, setAccessToken } from "@/lib/api/auth-token";

export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(message: string, status: number, body?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

type ApiFetchOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  token?: string | null;
  /** Skip Authorization header */
  public?: boolean;
};

export async function apiFetch<T = unknown>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<T> {
  if (!API_BASE_URL) {
    throw new ApiError("API base URL is not configured", 0);
  }

  const { body, token, public: isPublic, headers: initHeaders, ...rest } = options;
  const accessToken = isPublic ? null : (token ?? (await getAccessToken()));

  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(initHeaders as Record<string, string> | undefined),
  };

  if (body !== undefined && !(body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  const url = path.startsWith("http") ? path : `${API_BASE_URL}${path.startsWith("/") ? "" : "/"}${path}`;

  const res = await fetch(url, {
    ...rest,
    headers,
    body:
      body === undefined
        ? undefined
        : body instanceof FormData
          ? body
          : JSON.stringify(body),
  });

  if (res.status === 401) {
    await setAccessToken(null);
  }

  const text = await res.text();
  let parsed: unknown = null;
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = text;
    }
  }

  if (!res.ok) {
    const message =
      typeof parsed === "object" &&
      parsed !== null &&
      "message" in parsed &&
      typeof (parsed as { message: unknown }).message === "string"
        ? (parsed as { message: string }).message
        : `Request failed (${res.status})`;
    throw new ApiError(message, res.status, parsed);
  }

  return parsed as T;
}
