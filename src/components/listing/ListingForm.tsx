import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import {
  Button,
  ChipGroup,
  CityField,
  ListRow,
  ListSection,
  MultiChipGroup,
  PhotoGridUploader,
  Screen,
  SegmentedControl,
  Stepper,
  TextField,
} from "@/components/ds";
import { ChevronRight } from "@/components/ui/icons";
import { useAmenities } from "@/hooks/use-amenities";
import type { PropertyStatus } from "@/data/types";
import { formatPriceWithPeriod } from "@/lib/format";
import { colors, spacing, touchTarget, type } from "@/theme/tokens";

import {
  FURNISHING_OPTIONS,
  LIMITS,
  LISTING_PURPOSES,
  LISTING_STEPS,
  LISTING_TYPES,
  NON_RESIDENTIAL_TYPES,
  PURPOSE_LABEL,
  draftToPayload,
  firstInvalidStep,
  validateAll,
  validateStep,
  type DraftErrors,
  type ListingDraft,
  type ListingStep,
} from "./listing-draft";

export type ListingPayload = ReturnType<typeof draftToPayload>;
/** `undefined` keeps the current status (owner edits of live listings). */
export type ListingSaveStatus = "Draft" | "Pending Review" | undefined;

const STEP_LABEL: Record<ListingStep | "review", string> = {
  basics: "Basics",
  location: "Location",
  details: "Details",
  price: "Price",
  media: "Photos & extras",
  review: "Review",
};
const WIZARD: (ListingStep | "review")[] = [...LISTING_STEPS, "review"];

type Action = { label: string; status: ListingSaveStatus; primary?: boolean };

/** Actions per current status, matching what the web lets owners do. */
function editActions(status: PropertyStatus): Action[] {
  if (status === "Draft") {
    return [
      { label: "Save draft", status: "Draft" },
      { label: "Submit for review", status: "Pending Review", primary: true },
    ];
  }
  if (status === "Rejected") {
    return [
      { label: "Save", status: undefined },
      { label: "Resubmit for review", status: "Pending Review", primary: true },
    ];
  }
  return [{ label: "Save changes", status: undefined, primary: true }];
}

export function ListingForm({
  mode,
  screenTitle,
  initial,
  status = "Draft",
  banner,
  blocked,
  onSave,
}: {
  mode: "create" | "edit";
  screenTitle: string;
  initial: ListingDraft;
  /** Current status in edit mode. */
  status?: PropertyStatus;
  /** Quota, rejection reason or other notices shown above the form. */
  banner?: React.ReactNode;
  /** Disables saving (e.g. no listing slots left). */
  blocked?: boolean;
  onSave: (payload: ListingPayload, status: ListingSaveStatus) => Promise<boolean>;
}) {
  const [draft, setDraft] = useState<ListingDraft>(initial);
  const [errors, setErrors] = useState<DraftErrors>({});
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState<string | null>(null);
  const [seoOpen, setSeoOpen] = useState(Boolean(initial.seoTitle || initial.seoDescription));
  const amenities = useAmenities();

  const set = <K extends keyof ListingDraft>(key: K, value: ListingDraft[K]) => {
    setDraft((d) => ({ ...d, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };
  const text = (key: keyof ListingDraft) => ({
    value: draft[key] as string,
    onChangeText: (v: string) => set(key, v as never),
    error: errors[key],
  });

  const nonResidential = NON_RESIDENTIAL_TYPES.includes(draft.type);
  const periodic = draft.purpose === "rent" || draft.purpose === "lease";
  const priceNum = Number(draft.price.replace(/,/g, ""));

  const save = async (action: Action) => {
    const opts = { requireLandmarks: action.status !== "Draft" };
    const all = validateAll(draft, opts);
    if (Object.keys(all).length) {
      setErrors(all);
      if (mode === "create") setStep(Math.max(0, firstInvalidStep(draft, opts)));
      return;
    }
    setBusy(action.label);
    await onSave(draftToPayload(draft), action.status);
    setBusy(null);
  };

  const next = () => {
    const current = WIZARD[step];
    if (current !== "review") {
      const e = validateStep(current, draft, { requireLandmarks: true });
      if (Object.keys(e).length) {
        setErrors((prev) => ({ ...prev, ...e }));
        return;
      }
    }
    setStep((s) => Math.min(s + 1, WIZARD.length - 1));
  };

  const sections: Record<ListingStep, React.ReactNode> = {
    basics: (
      <>
        <TextField
          label="Title"
          required
          placeholder="e.g. 3 BHK apartment near Fateh Sagar"
          maxLength={LIMITS.title}
          {...text("title")}
        />
        <Field label="Property type">
          <ChipGroup options={LISTING_TYPES} value={draft.type} onChange={(v) => set("type", v)} />
        </Field>
        <Field label="Listing for">
          <SegmentedControl
            segments={LISTING_PURPOSES.map((p) => ({ value: p, label: PURPOSE_LABEL[p] }))}
            value={draft.purpose}
            onChange={(v) => set("purpose", v)}
          />
        </Field>
        <TextField
          label="Description"
          required
          multiline
          placeholder="What makes this place worth a visit? Layout, light, condition, neighbourhood."
          hint={`${draft.description.length.toLocaleString("en-IN")} characters`}
          maxLength={LIMITS.description}
          {...text("description")}
        />
      </>
    ),
    location: (
      <>
        <CityField
          required
          value={draft.city}
          error={errors.city}
          onChange={(city, state) => {
            set("city", city);
            setDraft((d) => ({ ...d, state: state ?? "" }));
          }}
        />
        <TextField label="Locality" required placeholder="e.g. Hiran Magri, Sector 4" {...text("locality")} />
        <View style={styles.group}>
          <Text style={styles.groupTitle}>Nearby landmarks</Text>
          <Text style={styles.groupHint}>Buyers use these to judge the location. Needed to submit for review.</Text>
        </View>
        <TextField label="Hospital" placeholder="e.g. GBH American Hospital, 2 km" {...text("nearbyHospital")} />
        <TextField label="School" placeholder="e.g. Seedling Public School, 1 km" {...text("nearbySchool")} />
        <TextField
          label="Transport"
          placeholder="e.g. City bus stand, 3 km"
          {...text("nearbyTransportation")}
        />
      </>
    ),
    details: (
      <>
        <TextField
          label="Area"
          required
          keyboardType="numeric"
          suffix="sq.ft"
          placeholder="1200"
          {...text("size")}
        />
        <Field label="Furnishing">
          <ChipGroup options={FURNISHING_OPTIONS} value={draft.furnished} onChange={(v) => set("furnished", v)} />
        </Field>
        <View style={styles.row}>
          {nonResidential ? null : (
            <TextField label="Bedrooms (BHK)" keyboardType="number-pad" containerStyle={styles.cell} {...text("bhk")} />
          )}
          <TextField label="Bathrooms" keyboardType="number-pad" containerStyle={styles.cell} {...text("bathrooms")} />
        </View>
        <View style={styles.row}>
          <TextField label="Parking spots" keyboardType="number-pad" containerStyle={styles.cell} {...text("parking")} />
          <TextField
            label="Year built"
            keyboardType="number-pad"
            maxLength={4}
            containerStyle={styles.cell}
            {...text("yearBuilt")}
          />
        </View>
      </>
    ),
    price: (
      <>
        <TextField
          label={periodic ? "Monthly rent" : "Asking price"}
          required
          keyboardType="numeric"
          prefix="₹"
          suffix={periodic ? "/month" : undefined}
          hint={priceNum > 0 ? formatPriceWithPeriod(priceNum, draft.purpose) : undefined}
          {...text("price")}
        />
        {periodic ? (
          <TextField label="Security deposit" keyboardType="numeric" prefix="₹" {...text("securityDeposit")} />
        ) : null}
        <TextField
          label="Maintenance"
          keyboardType="numeric"
          prefix="₹"
          suffix="/month"
          hint="Optional"
          {...text("maintenance")}
        />
        <TextField
          label="RERA registration ID"
          autoCapitalize="characters"
          maxLength={LIMITS.reraId}
          hint="Leave blank if the project isn't RERA registered."
          {...text("reraId")}
        />
      </>
    ),
    media: (
      <>
        <Field label={`Photos (${draft.images.length}/${LIMITS.images})`}>
          <PhotoGridUploader
            images={draft.images}
            onChange={(v) => set("images", v)}
            max={LIMITS.images}
            error={errors.images}
          />
          <Text style={styles.groupHint}>The first photo is the cover. Listings with photos get far more enquiries.</Text>
        </Field>
        <Field label="Amenities" error={errors.amenities}>
          <MultiChipGroup
            options={amenities}
            value={draft.amenities}
            onChange={(v) => set("amenities", v)}
            max={LIMITS.amenities}
          />
        </Field>
        <TextField
          label="Video tour link"
          autoCapitalize="none"
          keyboardType="url"
          placeholder="https://youtube.com/…"
          {...text("videoUrl")}
        />
        <Pressable
          onPress={() => setSeoOpen((o) => !o)}
          accessibilityRole="button"
          accessibilityState={{ expanded: seoOpen }}
          style={styles.disclosure}
        >
          <Text style={styles.groupTitle}>Search appearance</Text>
          <Text style={styles.disclosureHint}>{seoOpen ? "Hide" : "Optional"}</Text>
        </Pressable>
        {seoOpen ? (
          <>
            <TextField
              label="Search title"
              placeholder={draft.title || "Uses the listing title"}
              maxLength={LIMITS.seoTitle}
              {...text("seoTitle")}
            />
            <TextField
              label="Search description"
              multiline
              placeholder={draft.description.slice(0, 160) || "Uses the start of the description"}
              maxLength={LIMITS.seoDescription}
              {...text("seoDescription")}
            />
          </>
        ) : null}
      </>
    ),
  };

  const summary: Record<ListingStep, string> = {
    basics: [draft.type, PURPOSE_LABEL[draft.purpose], draft.title].filter(Boolean).join(" · "),
    location: [draft.locality, draft.city].filter(Boolean).join(", ") || "Not set",
    details: [
      draft.size ? `${draft.size} sq.ft` : "",
      !nonResidential && draft.bhk ? `${draft.bhk} BHK` : "",
      draft.furnished,
    ]
      .filter(Boolean)
      .join(" · "),
    price: priceNum > 0 ? formatPriceWithPeriod(priceNum, draft.purpose) : "Not set",
    media: `${draft.images.length} photos · ${draft.amenities.length} amenities`,
  };

  const review = (
    <>
      <ListSection title="Your listing">
        {LISTING_STEPS.map((s, i) => (
          <ListRow key={s} title={STEP_LABEL[s]} subtitle={summary[s]} onPress={() => setStep(i)} />
        ))}
      </ListSection>
      <Text style={styles.groupHint}>
        Submitted listings go live after a quick review by our team. Drafts stay private until you submit.
      </Text>
    </>
  );

  if (mode === "edit") {
    const actions = editActions(status);
    return (
      <Screen
        title={screenTitle}
        fallbackHref="/my-listings"
        footer={
          <View style={styles.footer}>
            {actions.map((a) => (
              <Button
                key={a.label}
                label={a.label}
                variant={a.primary ? "primary" : "secondary"}
                size="lg"
                loading={busy === a.label}
                disabled={blocked || (busy !== null && busy !== a.label)}
                onPress={() => void save(a)}
                style={a.primary ? styles.primary : styles.secondary}
              />
            ))}
          </View>
        }
      >
        {banner}
        {LISTING_STEPS.map((s) => (
          <View key={s} style={styles.section}>
            <Text style={styles.sectionTitle}>{STEP_LABEL[s]}</Text>
            {sections[s]}
          </View>
        ))}
      </Screen>
    );
  }

  const current = WIZARD[step];
  const last = step === WIZARD.length - 1;
  const draftAction: Action = { label: "Save draft", status: "Draft" };
  const submitAction: Action = { label: "Submit for review", status: "Pending Review", primary: true };

  return (
    <Screen
      title={screenTitle}
      fallbackHref="/my-listings"
      rightAction={
        step > 0 ? (
          <Pressable onPress={() => setStep((s) => s - 1)} hitSlop={8} style={styles.headerBtn}>
            <Text style={styles.headerBtnText}>Previous</Text>
          </Pressable>
        ) : undefined
      }
      footer={
        <View style={styles.footer}>
          <Button
            label="Save draft"
            variant="secondary"
            size="lg"
            loading={busy === draftAction.label}
            disabled={blocked || busy !== null}
            onPress={() => void save(draftAction)}
            style={styles.secondary}
          />
          {last ? (
            <Button
              label="Submit for review"
              size="lg"
              loading={busy === submitAction.label}
              disabled={blocked || busy !== null}
              onPress={() => void save(submitAction)}
              style={styles.primary}
            />
          ) : (
            <Button
              label="Continue"
              size="lg"
              icon={ChevronRight}
              disabled={busy !== null}
              onPress={next}
              style={styles.primary}
            />
          )}
        </View>
      }
    >
      <Stepper steps={WIZARD.map((s) => STEP_LABEL[s])} current={step} />
      {banner}
      <View style={styles.section}>{current === "review" ? review : sections[current]}</View>
    </Screen>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {children}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.lg },
  sectionTitle: { ...type.heading, color: colors.ink },
  field: { gap: spacing.sm },
  label: { ...type.label, color: colors.inkSecondary },
  error: { ...type.caption, color: colors.danger },
  group: { gap: spacing.xxs, marginTop: spacing.sm },
  groupTitle: { ...type.emphasis, color: colors.ink },
  groupHint: { ...type.caption, color: colors.inkMuted },
  row: { flexDirection: "row", gap: spacing.md },
  cell: { flex: 1 },
  disclosure: {
    minHeight: touchTarget,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  disclosureHint: { ...type.label, color: colors.accent },
  footer: { flexDirection: "row", gap: spacing.md },
  secondary: { flex: 1 },
  primary: { flex: 1.4 },
  headerBtn: { minHeight: touchTarget, justifyContent: "center", paddingHorizontal: spacing.xs },
  headerBtnText: { ...type.label, color: colors.accent },
});
