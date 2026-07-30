import { apiFetch } from "@/lib/api/client";

async function uploadMultipart(
  path: string,
  fields: Record<string, string>,
  file: { uri: string; fileName: string; mimeType: string },
): Promise<{ url: string }> {
  const form = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    form.append(key, value);
  }
  form.append("file", {
    uri: file.uri,
    name: file.fileName,
    type: file.mimeType,
  } as unknown as Blob);
  return apiFetch<{ url: string }>(path, { method: "POST", body: form });
}

export async function apiUploadPropertyImage(input: {
  uri: string;
  fileName: string;
  mimeType: string;
}): Promise<{ url: string }> {
  return uploadMultipart("/api/uploads/property-image", {}, input);
}

export async function apiUploadAvatar(input: {
  uri: string;
  fileName: string;
  mimeType: string;
}): Promise<{ url: string }> {
  return uploadMultipart("/api/uploads/avatar", {}, input);
}
