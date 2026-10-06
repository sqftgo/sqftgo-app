import { appAlert } from "@/components/ui/app-alert";
import * as ImagePicker from "expo-image-picker";

import { isApiMode } from "@/lib/api/config";
import { apiUploadPropertyImage, apiUploadAvatar } from "@/lib/api/services/uploads";
import { apiUploadKycDocument } from "@/lib/api/services/kyc";
import type { KycDocumentType } from "@/data/types";

async function ensureLibraryPermission(): Promise<boolean> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== "granted") {
    appAlert("Permission needed", "Allow photo library access to upload images.");
    return false;
  }
  return true;
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

  const asset = result.assets[0];
  const fileName = asset.fileName ?? `property-${Date.now()}.jpg`;
  const mimeType = asset.mimeType ?? "image/jpeg";
  try {
    const { url } = await apiUploadPropertyImage({
      uri: asset.uri,
      fileName,
      mimeType,
    });
    return url;
  } catch (e) {
    appAlert("Upload failed", e instanceof Error ? e.message : "Could not upload image.");
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
      const { url } = await apiUploadPropertyImage({
        uri: asset.uri,
        fileName: asset.fileName ?? `property-${Date.now()}-${i}.jpg`,
        mimeType: asset.mimeType ?? "image/jpeg",
      });
      urls.push(url);
    } catch {
      failed += 1;
    }
    onProgress?.(i + 1, assets.length);
  }
  if (failed) {
    appAlert(
      "Some photos didn't upload",
      `${failed} of ${assets.length} photos failed. Try adding them again.`,
    );
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

  const asset = result.assets[0];
  try {
    const { url } = await apiUploadAvatar({
      uri: asset.uri,
      fileName: asset.fileName ?? `avatar-${Date.now()}.jpg`,
      mimeType: asset.mimeType ?? "image/jpeg",
    });
    return url;
  } catch (e) {
    appAlert("Upload failed", e instanceof Error ? e.message : "Could not upload photo.");
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

  const asset = result.assets[0];
  try {
    await apiUploadKycDocument({
      type,
      uri: asset.uri,
      fileName: asset.fileName ?? `${type}-${Date.now()}.jpg`,
      mimeType: asset.mimeType ?? "image/jpeg",
    });
    return true;
  } catch (e) {
    appAlert("Upload failed", e instanceof Error ? e.message : "Could not upload document.");
    return false;
  }
}
