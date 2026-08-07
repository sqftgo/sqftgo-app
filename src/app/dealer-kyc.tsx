import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft } from "@/components/ui/icons";

import { useApp } from "@/context/AppContext";
import { KYC_STATUS_LABEL } from "@/lib/status-labels";
import { pickAndUploadKycDocument } from "@/lib/media-upload";
import type { KycDocumentType } from "@/data/types";
import { colors, radius, shadow, spacing, type } from "@/theme/tokens";

const DOC_TYPES: { type: KycDocumentType; label: string }[] = [
  { type: "pan_card", label: "Upload PAN card" },
  { type: "aadhaar", label: "Upload Aadhaar" },
  { type: "rera_certificate", label: "Upload RERA certificate" },
];

export default function DealerKycScreen() {
  const router = useRouter();
  const { profile, submitKyc, dealerAccess, userRole, isApiMode } = useApp();
  const existing = profile?.kyc;

  const [panNumber, setPanNumber] = useState(existing?.panNumber ?? "");
  const [aadhaarLast4, setAadhaarLast4] = useState(existing?.aadhaarLast4 ?? "");
  const [dealerNotes, setDealerNotes] = useState(existing?.dealerNotes ?? "");
  const [uploadedDocs, setUploadedDocs] = useState<string[]>([]);
  const [uploadingDoc, setUploadingDoc] = useState<KycDocumentType | null>(null);

  const canSubmit =
    (dealerAccess === "pending" || userRole === "broker") &&
    (!existing || existing.status === "draft" || existing.status === "rejected");

  const handleSubmit = () => {
    if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/i.test(panNumber.trim())) {
      Alert.alert("Invalid PAN", "Enter a valid 10-character PAN (e.g. ABCDE1234F).");
      return;
    }
    if (!/^\d{4}$/.test(aadhaarLast4.trim())) {
      Alert.alert("Invalid Aadhaar", "Enter the last 4 digits of Aadhaar only.");
      return;
    }
    void (async () => {
      await submitKyc({
        panNumber: panNumber.trim(),
        aadhaarLast4: aadhaarLast4.trim(),
        dealerNotes: dealerNotes.trim() || undefined,
      });
      Alert.alert(
        "KYC submitted",
        "Status is pending. Web admin reviews documents — this app only shows status.",
        [{ text: "OK", onPress: () => router.back() }],
      );
    })();
  };

  const inputStyle = {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    ...type.body,
    color: colors.ink,
  };

  return (
    <SafeAreaView edges={["top", "bottom"]} style={{ flex: 1, backgroundColor: colors.bg }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.md,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          gap: spacing.sm,
        }}
      >
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <ChevronLeft size={22} color={colors.ink} />
        </Pressable>
        <Text style={{ ...type.heading, color: colors.ink, flex: 1 }}>Dealer KYC</Text>
      </View>

      <KeyboardAvoidingView
        behavior={process.env.EXPO_OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={{ padding: spacing.xl, gap: spacing.md }}>
          <Text style={{ ...type.body, color: colors.inkMuted }}>
            Submit identity documents for review. Approve / reject happens on web admin — Expo
            only shows status.
          </Text>

          {existing ? (
            <View
              style={{
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: radius.lg,
                padding: spacing.md,
                gap: spacing.xs,
                boxShadow: shadow.card,
              }}
            >
              <Text style={{ ...type.label, color: colors.inkMuted }}>CURRENT STATUS</Text>
              <Text style={{ ...type.heading, color: colors.ink }}>
                {KYC_STATUS_LABEL[existing.status]}
              </Text>
              {existing.rejectionReason ? (
                <Text style={{ ...type.caption, color: colors.danger }}>
                  {existing.rejectionReason}
                </Text>
              ) : null}
              {existing.submittedAt ? (
                <Text style={{ ...type.micro, color: colors.inkMuted }}>
                  Submitted {new Date(existing.submittedAt).toLocaleString()}
                </Text>
              ) : null}
            </View>
          ) : null}

          {canSubmit ? (
            <>
              <Text style={{ ...type.label, color: colors.inkMuted }}>PAN NUMBER *</Text>
              <TextInput
                value={panNumber}
                onChangeText={setPanNumber}
                placeholder="ABCDE1234F"
                placeholderTextColor={colors.inkMuted}
                autoCapitalize="characters"
                maxLength={10}
                style={inputStyle}
              />

              <Text style={{ ...type.label, color: colors.inkMuted }}>AADHAAR LAST 4 *</Text>
              <TextInput
                value={aadhaarLast4}
                onChangeText={setAadhaarLast4}
                placeholder="1234"
                placeholderTextColor={colors.inkMuted}
                keyboardType="number-pad"
                maxLength={4}
                style={inputStyle}
              />

              <Text style={{ ...type.label, color: colors.inkMuted }}>NOTES</Text>
              <TextInput
                value={dealerNotes}
                onChangeText={setDealerNotes}
                placeholder="Optional note for reviewers"
                placeholderTextColor={colors.inkMuted}
                multiline
                style={{ ...inputStyle, minHeight: 80, textAlignVertical: "top" as const }}
              />

              <Text style={{ ...type.caption, color: colors.inkMuted }}>
                {isApiMode
                  ? "Upload supporting documents, then submit for web admin review."
                  : "Document upload requires API mode. Form fields are stored locally in mock mode."}
              </Text>

              {isApiMode
                ? DOC_TYPES.map((doc) => (
                    <Pressable
                      key={doc.type}
                      disabled={uploadingDoc !== null}
                      onPress={() => {
                        void (async () => {
                          setUploadingDoc(doc.type);
                          const ok = await pickAndUploadKycDocument(doc.type);
                          setUploadingDoc(null);
                          if (ok) {
                            setUploadedDocs((prev) =>
                              prev.includes(doc.type) ? prev : [...prev, doc.type],
                            );
                            Alert.alert("Uploaded", `${doc.label} uploaded.`);
                          }
                        })();
                      }}
                      style={({ pressed }) => ({
                        height: 44,
                        borderRadius: radius.md,
                        borderWidth: 1,
                        borderColor: colors.border,
                        alignItems: "center",
                        justifyContent: "center",
                        opacity: pressed || uploadingDoc ? 0.7 : 1,
                        backgroundColor: colors.surface,
                      })}
                    >
                      <Text style={{ ...type.label, color: colors.ink }}>
                        {uploadingDoc === doc.type
                          ? "Uploading…"
                          : uploadedDocs.includes(doc.type)
                            ? `✓ ${doc.label}`
                            : doc.label}
                      </Text>
                    </Pressable>
                  ))
                : null}

              <Pressable
                onPress={handleSubmit}
                style={({ pressed }) => ({
                  height: 50,
                  marginTop: spacing.sm,
                  borderRadius: radius.md,
                  backgroundColor: colors.accent,
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: pressed ? 0.85 : 1,
                  boxShadow: shadow.accent,
                })}
              >
                <Text style={{ ...type.emphasis, color: colors.onAccent }}>Submit for review</Text>
              </Pressable>
            </>
          ) : (
            <Text style={{ ...type.body, color: colors.inkMuted }}>
              {dealerAccess === "none" && userRole !== "broker"
                ? "Register as a dealer first, then submit KYC."
                : "KYC is awaiting review or already approved. No further edits in the app."}
            </Text>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
