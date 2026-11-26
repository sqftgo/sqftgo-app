import { appAlert } from "@/components/ui/app-alert";
import { handleClientError } from "@/lib/handle-client-error";
import * as ImagePicker from "expo-image-picker";

import { isApiMode } from "@/lib/api/config";
import { apiUploadPropertyImage, apiUploadAvatar } from "@/lib/api/services/uploads";
import { apiUploadKycDocument } from "@/lib/api/services/kyc";
import type { KycDocumentType } from "@/data/types";
import {
  detectAllowedImageMime,
  detectAllowedKycMime,
  extForMime,
  readUriMagicBytes,
} from "@/lib/file-magic";

async function ensureLibraryPermission(): Promise<boolean> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== "granted") {
    appAlert("Permission needed", "Allow photo library access to upload images.");
    return false;
  }
  return true;
}

async function verifiedImageAsset(asset: ImagePicker.ImagePickerAsset): Promise<{
  uri: string;
  fileName: string;
  mimeType: string;
} | null> {
  try {
    const bytes = await readUriMagicBytes(asset.uri);
    const mime = detectAllowedImageMime(bytes);
    if (!mime) {
      handleClientError("Choose a JPEG, PNG, WebP, or GIF image.", {
        title: "Unsupported file",
      });
      return null;
    }
    const base =
      asset.fileName?.replace(/\.[^.]+$/, "")?.replace(/[^a-zA-Z0-9._-]/g, "_") ||
      `upload-${Date.now()}`;
    return {
      uri: asset.uri,
      fileName: `${base}.${extForMime(mime)}`,
      mimeType: mime,
    };
  } catch (e) {
    handleClientError(e, { title: "Couldn't read file", fallback: "Try another photo." });
    return null;
  }
}

async function verifiedKycAsset(asset: ImagePicker.ImagePickerAsset): Promise<{
  uri: string;
  fileName: string;
  mimeType: string;
} | null> {
  try {
    const bytes = await readUriMagicBytes(asset.uri);
    const mime = detectAllowedKycMime(bytes);
    if (!mime) {
      handleClientError("Choose a JPEG, PNG, WebP, or PDF document.", {
        title: "Unsupported file",
      });
      return null;
    }
    const base =
      asset.fileName?.replace(/\.[^.]+$/, "")?.replace(/[^a-zA-Z0-9._-]/g, "_") ||
      `kyc-${Date.now()}`;
    return {
      uri: asset.uri,
      fileName: `${base}.${extForMime(mime)}`,
      mimeType: mime,
    };
  } catch (e) {
    handleClientError(e, { title: "Couldn't read file", fallback: "Try another document." });
    return null;
  }
}

export async function pickAndUploadPropertyImage(): Promise<string | null> {
  if (!isApiMode) {
    appAlert("API mode required", "Image upload needs EXPO_PUBLIC_API_URL.");
    return null;
  }
  if (!(await ensureLibraryPermission())) return null;

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    quality: 0.85,
  });
  if (result.canceled || !result.assets[0]) return null;

  const verified = await verifiedImageAsset(result.assets[0]);
  if (!verified) return null;

  try {
    const { url } = await apiUploadPropertyImage(verified);
    return url;
  } catch (e) {
    handleClientError(e, { title: "Upload failed", fallback: "Could not upload image." });
    return null;
  }
}

/** Multi-select up to `limit` photos and upload them sequentially; returns uploaded URLs. */
export async function pickAndUploadPropertyImages(
  limit: number,
  onProgress?: (done: number, total: number) => void,
): Promise<string[]> {
  if (limit <= 0) return [];
  if (!isApiMode) {
    appAlert("API mode required", "Image upload needs EXPO_PUBLIC_API_URL.");
    return [];
  }
  if (!(await ensureLibraryPermission())) return [];

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    quality: 0.85,
    allowsMultipleSelection: true,
    selectionLimit: limit,
    orderedSelection: true,
  });
  if (result.canceled || !result.assets.length) return [];

  const assets = result.assets.slice(0, limit);
  const urls: string[] = [];
  let failed = 0;
  onProgress?.(0, assets.length);
  for (const [i, asset] of assets.entries()) {
    try {
      const verified = await verifiedImageAsset(asset);
      if (!verified) {
        failed += 1;
      } else {
        const { url } = await apiUploadPropertyImage({
          ...verified,
          fileName: verified.fileName.replace(/(\.[^.]+)$/, `-${i}$1`),
        });
        urls.push(url);
      }
    } catch {
      failed += 1;
    }
    onProgress?.(i + 1, assets.length);
  }
  if (failed) {
    handleClientError(`${failed} of ${assets.length} photos failed. Try adding them again.`, {
      title: "Some photos didn't upload",
    });
  }
  return urls;
}

export async function pickAndUploadAvatar(): Promise<string | null> {
  if (!isApiMode) {
    appAlert("API mode required", "Photo upload needs EXPO_PUBLIC_API_URL.");
    return null;
  }
  if (!(await ensureLibraryPermission())) return null;

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    quality: 0.85,
    allowsEditing: true,
    aspect: [1, 1],
  });
  if (result.canceled || !result.assets[0]) return null;

  const verified = await verifiedImageAsset(result.assets[0]);
  if (!verified) return null;

  try {
    const { url } = await apiUploadAvatar(verified);
    return url;
  } catch (e) {
    handleClientError(e, { title: "Upload failed", fallback: "Could not upload photo." });
    return null;
  }
}

export async function pickAndUploadKycDocument(
  type: KycDocumentType,
): Promise<boolean> {
  if (!isApiMode) {
    appAlert("API mode required", "KYC document upload needs EXPO_PUBLIC_API_URL.");
    return false;
  }
  if (!(await ensureLibraryPermission())) return false;

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    quality: 0.9,
  });
  if (result.canceled || !result.assets[0]) return false;

  const verified = await verifiedKycAsset(result.assets[0]);
  if (!verified) return false;

  try {
    await apiUploadKycDocument({
      type,
      ...verified,
    });
    return true;
  } catch (e) {
    handleClientError(e, { title: "Upload failed", fallback: "Could not upload document." });
    return false;
  }
}
