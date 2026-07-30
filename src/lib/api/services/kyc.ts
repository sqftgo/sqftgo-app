import { apiFetch } from "@/lib/api/client";
import type { DealerKyc, KycDocument, KycDocumentType } from "@/data/types";

export async function apiGetKyc(): Promise<DealerKyc> {
  return apiFetch<DealerKyc>("/api/dealer/kyc");
}

export async function apiPutKyc(body: {
  panNumber: string;
  aadhaarLast4: string;
  dealerNotes?: string;
  status?: "draft" | "pending";
}): Promise<DealerKyc> {
  return apiFetch<DealerKyc>("/api/dealer/kyc", { method: "PUT", body });
}

export async function apiUploadKycDocument(input: {
  type: KycDocumentType;
  uri: string;
  fileName: string;
  mimeType: string;
}): Promise<KycDocument> {
  const form = new FormData();
  form.append("type", input.type);
  form.append("file", {
    uri: input.uri,
    name: input.fileName,
    type: input.mimeType,
  } as unknown as Blob);
  return apiFetch<KycDocument>("/api/dealer/kyc/documents", {
    method: "POST",
    body: form,
  });
}
