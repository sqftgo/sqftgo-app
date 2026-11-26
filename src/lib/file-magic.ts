/**
 * Verify upload payloads by magic bytes (not client-declared MIME).
 * Defense-in-depth before calling the BFF upload APIs.
 */

export type AllowedImageMime = "image/jpeg" | "image/png" | "image/webp" | "image/gif";
export type AllowedKycMime = "image/jpeg" | "image/png" | "image/webp" | "application/pdf";

function startsWith(bytes: Uint8Array, sig: number[]): boolean {
  if (bytes.length < sig.length) return false;
  for (let i = 0; i < sig.length; i++) {
    if (bytes[i] !== sig[i]) return false;
  }
  return true;
}

export function detectAllowedImageMime(bytes: Uint8Array): AllowedImageMime | null {
  if (bytes.length < 12) return null;
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return "image/jpeg";
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "image/png";
  if (
    startsWith(bytes, [0x47, 0x49, 0x46, 0x38, 0x37, 0x61]) ||
    startsWith(bytes, [0x47, 0x49, 0x46, 0x38, 0x39, 0x61])
  ) {
    return "image/gif";
  }
  if (
    startsWith(bytes, [0x52, 0x49, 0x46, 0x46]) &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return "image/webp";
  }
  return null;
}

export function detectAllowedKycMime(bytes: Uint8Array): AllowedKycMime | null {
  const image = detectAllowedImageMime(bytes);
  if (image && image !== "image/gif") return image;
  if (startsWith(bytes, [0x25, 0x50, 0x44, 0x46])) return "application/pdf";
  return null;
}

export async function readUriMagicBytes(uri: string, maxBytes = 32): Promise<Uint8Array> {
  const res = await fetch(uri);
  const buf = await res.arrayBuffer();
  return new Uint8Array(buf.slice(0, maxBytes));
}

export function extForMime(mime: string): string {
  switch (mime) {
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/gif":
      return "gif";
    case "application/pdf":
      return "pdf";
    default:
      return "jpg";
  }
}
