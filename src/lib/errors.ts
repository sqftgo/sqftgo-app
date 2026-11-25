/** Safe copy for unexpected server failures — never include DB/provider text. */
export const GENERIC_SERVER_ERROR = "Something went wrong. Please try again.";

/** Duck-type ApiError without importing client (avoids circular deps). */
function getApiError(
  error: unknown,
): { message: string; status: number } | null {
  if (
    error instanceof Error &&
    "status" in error &&
    typeof (error as { status?: unknown }).status === "number"
  ) {
    return {
      message: error.message,
      status: (error as { status: number }).status,
    };
  }
  return null;
}

const GENERIC_BY_STATUS: Record<number, string> = {
  0: "Unable to reach the server. Check your connection and try again.",
  401: "Your session expired. Sign in again to continue.",
  403: "You do not have permission to do that.",
  404: "That item was not found. It may have been removed.",
  408: "Request timed out. Please try again.",
  409: "This conflicts with existing data. Refresh and try again.",
  429: "Too many attempts. Please wait a moment and try again.",
  502: "A payment or upstream service failed. Please try again.",
  503: "Service temporarily unavailable. Please try again shortly.",
};

/** Heuristic: Supabase / Postgres / stack dumps that must never reach the UI. */
export function looksLikeInternalError(message: string): boolean {
  const m = message.trim();
  if (!m) return true;
  if (m.length > 220) return true;
  return /PGRST|Postgrest|postgres|SQLSTATE|violates\s+(unique|foreign|check|not-null)|permission denied|row-level security|RLS|relation ['"]?\w+|column ['"]?\w+|duplicate key|jwt|stack trace|ECONNREFUSED|ENOTFOUND|ETIMEDOUT|supabase\.co|razorpay\.com|at\s+\S+\s+\(|node_modules|TypeError:|ReferenceError:/i.test(
    m,
  );
}

/**
 * Map any handler message to a user-safe string.
 * 5xx always generic. 4xx keep intentional UX copy unless they look internal.
 */
export function toPublicErrorMessage(message: string, status = 400): string {
  if (status === 0 || status >= 500) {
    return GENERIC_BY_STATUS[status] || GENERIC_SERVER_ERROR;
  }
  if (looksLikeInternalError(message)) {
    return GENERIC_BY_STATUS[status] || "Unable to complete that request.";
  }
  return (
    message.trim() ||
    GENERIC_BY_STATUS[status] ||
    "Unable to complete that request."
  );
}

/**
 * Map thrown errors to short, user-safe copy.
 * Never surfaces stack traces or raw HTML.
 */
export function userFacingError(
  error: unknown,
  fallback: string = GENERIC_SERVER_ERROR,
): string {
  const api = getApiError(error);
  if (api) {
    if (api.status === 0) return GENERIC_BY_STATUS[0];
    if (api.status === 401) return GENERIC_BY_STATUS[401];
    if (api.status === 403) return GENERIC_BY_STATUS[403];
    if (api.status === 404) return GENERIC_BY_STATUS[404];
    if (api.status === 429) {
      return toPublicErrorMessage(api.message || GENERIC_BY_STATUS[429], 429);
    }
    if (api.status >= 500) {
      return GENERIC_BY_STATUS[api.status] || GENERIC_SERVER_ERROR;
    }
    if (api.status === 409) {
      return toPublicErrorMessage(
        api.message?.trim() || GENERIC_BY_STATUS[409],
        409,
      );
    }
    if (api.status === 422 || api.status === 400) {
      return toPublicErrorMessage(
        api.message?.trim() ||
          "Some details look invalid. Check the form and try again.",
        api.status,
      );
    }
    if (api.message?.trim()) {
      return toPublicErrorMessage(api.message, api.status);
    }
    return GENERIC_BY_STATUS[api.status] || fallback;
  }

  if (
    error instanceof TypeError &&
    /network|fetch|failed/i.test(error.message)
  ) {
    return GENERIC_BY_STATUS[0];
  }

  if (typeof error === "string" && error.trim()) {
    return toPublicErrorMessage(error, 400);
  }

  if (error instanceof Error && error.message.trim()) {
    return toPublicErrorMessage(error.message, 500);
  }

  return fallback;
}

export type ActionResult<T = void> =
  | (T extends void ? { ok: true } : { ok: true; data: T })
  | { ok: false; message: string };
