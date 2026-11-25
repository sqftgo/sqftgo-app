import { toast } from "@/components/ds/Toast";
import { GENERIC_SERVER_ERROR, userFacingError } from "@/lib/errors";

export type HandleClientErrorOptions = {
  /** Fallback when error has no usable message */
  fallback?: string;
  /** Optional short title shown above the sanitized message */
  title?: string;
  /** Skip toast (still returns sanitized string) */
  silent?: boolean;
};

/**
 * Central client error handler: sanitize → error toast (top banner).
 * Use in catch / mutation onError instead of appAlert for failures.
 * Keep appAlert for confirmations and permission prompts only.
 */
export function handleClientError(
  err: unknown,
  options: HandleClientErrorOptions = {},
): string {
  const message = userFacingError(err, options.fallback || GENERIC_SERVER_ERROR);

  if (!options.silent) {
    const text =
      options.title && options.title !== message
        ? `${options.title}\n${message}`
        : options.title || message;
    toast(text, "error");
  }

  return message;
}

/** Success toast from one place (optional convenience). */
export function notifySuccess(message: string) {
  toast(message, "success");
}

export function notifyInfo(message: string) {
  toast(message, "info");
}
