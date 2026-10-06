import { type Href } from "expo-router";
import React, { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { Button, EmptyState, ListRow, ListSection, Screen, StatusBadge, TextField, toast, useBack } from "@/components/ds";
import { appAlert } from "@/components/ui/app-alert";
import { CheckCircle, FileCheck, ShieldCheck } from "@/components/ui/icons";
import { usePlatform, useSession } from "@/hooks/domain";
import type { KycDocumentType } from "@/data/types";
import { pickAndUploadKycDocument } from "@/lib/media-upload";
import { KYC_STATUS_LABEL } from "@/lib/status-labels";
import { colors, radius, spacing, type } from "@/theme/tokens";

const DOC_TYPES: { type: KycDocumentType; label: string }[] = [
  { type: "pan_card", label: "PAN card" },
  { type: "aadhaar", label: "Aadhaar" },
  { type: "rera_certificate", label: "RERA certificate" },
];

const PAN_RE = /^[A-Z]{5}[0-9]{4}[A-Z]$/i;

export default function DealerKycScreen() {
  const back = useBack("/(dealer)" as Href);
  const { profile, submitKyc, dealerAccess, userRole } = useSession();
  const { isApiMode } = usePlatform();
  const existing = profile?.kyc;

  const [panNumber, setPanNumber] = useState(existing?.panNumber ?? "");
  const [aadhaarLast4, setAadhaarLast4] = useState(existing?.aadhaarLast4 ?? "");
  const [dealerNotes, setDealerNotes] = useState(existing?.dealerNotes ?? "");
  const [uploadedDocs, setUploadedDocs] = useState<KycDocumentType[]>([]);
  const [uploadingDoc, setUploadingDoc] = useState<KycDocumentType | null>(null);
  const [errors, setErrors] = useState<{ pan?: string; aadhaar?: string }>({});
  const [submitting, setSubmitting] = useState(false);

  const isDealer = dealerAccess === "pending" || userRole === "broker";
  const canSubmit = isDealer && (!existing || existing.status === "draft" || existing.status === "rejected");

  const upload = async (doc: KycDocumentType) => {
    setUploadingDoc(doc);
    const ok = await pickAndUploadKycDocument(doc);
    setUploadingDoc(null);
    if (ok) {
      setUploadedDocs((prev) => (prev.includes(doc) ? prev : [...prev, doc]));
      toast("Document uploaded");
    }
  };

  const submit = async () => {
    const e: typeof errors = {};
    if (!PAN_RE.test(panNumber.trim())) e.pan = "Enter a valid PAN, e.g. ABCDE1234F.";
    if (!/^\d{4}$/.test(aadhaarLast4.trim())) e.aadhaar = "Enter only the last 4 digits.";
    setErrors(e);
    if (Object.keys(e).length) return;

    setSubmitting(true);
    const result = await submitKyc({
      panNumber: panNumber.trim(),
      aadhaarLast4: aadhaarLast4.trim(),
      dealerNotes: dealerNotes.trim() || undefined,
    });
    setSubmitting(false);
    if (!result.ok) {
      appAlert("Couldn't submit KYC", result.message);
      return;
    }
    toast("KYC sent for review");
    back();
  };

  if (!isDealer) {
    return (
      <Screen title="Dealer KYC" fallbackHref={"/(tabs)/profile" as Href}>
        <EmptyState
          icon={ShieldCheck}
          title="Register as a dealer first"
          message="KYC is part of dealer registration. Apply as a dealer, then verify your identity here."
        />
      </Screen>
    );
  }

  return (
    <Screen
      title="Dealer KYC"
      subtitle="Verify your identity to unlock dealer tools"
      fallbackHref={"/(dealer)" as Href}
      footer={
        canSubmit ? (
          <Button label="Submit for review" size="lg" fullWidth loading={submitting} onPress={() => void submit()} />
        ) : undefined
      }
    >
      {existing ? (
        <View style={[styles.status, existing.status === "rejected" && styles.statusWarn]}>
          <StatusBadge label={KYC_STATUS_LABEL[existing.status]} />
          {existing.rejectionReason ? (
            <Text style={styles.body}>Not approved: {existing.rejectionReason}. Update your details and resubmit.</Text>
          ) : existing.status === "pending" ? (
            <Text style={styles.body}>Our team is reviewing your documents. We&apos;ll notify you once it&apos;s done.</Text>
          ) : existing.status === "approved" ? (
            <Text style={styles.body}>Your identity is verified.</Text>
          ) : null}
          {existing.submittedAt ? (
            <Text style={styles.meta}>
              Submitted {new Date(existing.submittedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
            </Text>
          ) : null}
        </View>
      ) : (
        <Text style={styles.body}>
          Share your PAN and Aadhaar details with supporting documents. Our team reviews them, usually within 2 working days.
        </Text>
      )}

      {canSubmit ? (
        <>
          <View style={styles.fields}>
            <TextField
              label="PAN number"
              required
              autoCapitalize="characters"
              maxLength={10}
              placeholder="ABCDE1234F"
              value={panNumber}
              onChangeText={(v) => {
                setPanNumber(v);
                setErrors((x) => ({ ...x, pan: undefined }));
              }}
              error={errors.pan}
            />
            <TextField
              label="Aadhaar, last 4 digits"
              required
              keyboardType="number-pad"
              maxLength={4}
              placeholder="1234"
              value={aadhaarLast4}
              onChangeText={(v) => {
                setAadhaarLast4(v);
                setErrors((x) => ({ ...x, aadhaar: undefined }));
              }}
              error={errors.aadhaar}
            />
            <TextField
              label="Notes for our team"
              multiline
              placeholder="Optional"
              value={dealerNotes}
              onChangeText={setDealerNotes}
            />
          </View>

          {isApiMode ? (
            <ListSection title="Documents" footer="Clear photos of the original documents. JPG or PNG.">
              {DOC_TYPES.map((doc) => {
                const done = uploadedDocs.includes(doc.type);
                return (
                  <ListRow
                    key={doc.type}
                    icon={done ? CheckCircle : FileCheck}
                    iconTint={done ? colors.success : undefined}
                    title={doc.label}
                    value={uploadingDoc === doc.type ? "Uploading…" : done ? "Uploaded" : "Add"}
                    disabled={uploadingDoc !== null}
                    onPress={() => void upload(doc.type)}
                  />
                );
              })}
            </ListSection>
          ) : (
            <Text style={styles.meta}>Document upload needs a connection to SqftGo servers.</Text>
          )}
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  status: { gap: spacing.sm, padding: spacing.lg, borderRadius: radius.lg, backgroundColor: colors.surfaceSubtle, alignItems: "flex-start" },
  statusWarn: { backgroundColor: colors.warningSoft, borderWidth: 1, borderColor: colors.warningBorder },
  body: { ...type.body, color: colors.inkSecondary },
  meta: { ...type.caption, color: colors.inkMuted },
  fields: { gap: spacing.lg },
});
