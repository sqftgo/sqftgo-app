import { ApiError } from "@/lib/api/client";

/**
 * Map thrown errors to short, user-safe copy.
 * Never surfaces stack traces or raw HTML.
 */
export function userFacingError(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    if (error.status === 0) {
      return "Unable to reach the server. Check your connection and try again.";
    }
    if (error.status === 401) {
      return "Your session expired. Sign in again to continue.";
    }
    if (error.status === 403) {
      return "You do not have permission to do that.";
    }
    if (error.status === 404) {
      return "That item was not found. It may have been removed.";
    }
    if (error.status === 409) {
      return error.message?.trim() || "This conflicts with existing data. Refresh and try again.";
    }
    if (error.status === 422 || error.status === 400) {
      return error.message?.trim() || "Some details look invalid. Check the form and try again.";
    }
    if (error.status >= 500) {
      return "Something went wrong on our side. Please try again in a moment.";
    }
    if (error.message?.trim()) return sanitizeMessage(error.message);
  }

  if (error instanceof TypeError && /network|fetch|failed/i.test(error.message)) {
    return "Network error. Check your connection and try again.";
  }

  if (error instanceof Error && error.message.trim()) {
    return sanitizeMessage(error.message);
  }

  return fallback;
}

function sanitizeMessage(raw: string): string {
  const trimmed = raw.trim().replace(/\s+/g, " ");
  if (trimmed.length > 220) return `${trimmed.slice(0, 217)}…`;
  // Avoid leaking HTML / JSON blobs
  if (/^[{\[]/.test(trimmed) || /<\/?[a-z][\s\S]*>/i.test(trimmed)) {
    return "Request failed. Please try again.";
  }
  return trimmed;
}

export type ActionResult<T = void> =
  | (T extends void ? { ok: true } : { ok: true; data: T })
  | { ok: false; message: string };
