import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Button, ChipGroup, CityField, MultiChipGroup, PhotoGridUploader, Screen, TextField } from "@/components/ds";
import { DateField } from "@/components/ds/DateField";
import { ChevronDown, ChevronUp } from "@/components/ui/icons";
import type { Project, ProjectInput, ProjectLifecycle, ProjectOwnershipRole, ProjectStatus } from "@/data/project";
import type { PropertyType } from "@/data/types";
import { useAmenities } from "@/hooks/use-amenities";
import { colors, spacing, touchTarget, type } from "@/theme/tokens";

import { LISTING_TYPES } from "./listing-draft";

const LIFECYCLES: ProjectLifecycle[] = ["Upcoming", "Under Construction", "Ready"];
const ROLES: ProjectOwnershipRole[] = ["Builder", "Owner", "Marketing Partner"];
const LIMITS = { title: 200, description: 20000, images: 30, amenities: 50, types: 10, configs: 20, reraId: 80 };

export type ProjectSaveStatus = "Draft" | "Pending Review" | undefined;

export interface ProjectDraft {
  title: string;
  description: string;
  city: string;
  state: string;
  locality: string;
  ownershipRole: ProjectOwnershipRole;
  lifecycle: ProjectLifecycle;
  propertyTypes: PropertyType[];
  configurations: string;
  priceFrom: string;
  priceTo: string;
  sizeFrom: string;
  sizeTo: string;
  amenities: string[];
  images: string[];
  contactName: string;
  contactPhone: string;
  reraId: string;
  launchDate: string;
  possessionDate: string;
  seoTitle: string;
  seoDescription: string;
}

type Errors = Partial<Record<keyof ProjectDraft, string>>;

export function emptyProjectDraft(defaults: { city: string; contactName: string; contactPhone: string }): ProjectDraft {
  return {
    title: "",
    description: "",
    city: defaults.city,
    state: "",
    locality: "",
    ownershipRole: "Builder",
    lifecycle: "Under Construction",
    propertyTypes: [],
    configurations: "",
    priceFrom: "",
    priceTo: "",
    sizeFrom: "",
    sizeTo: "",
    amenities: [],
    images: [],
    contactName: defaults.contactName,
    contactPhone: defaults.contactPhone,
    reraId: "",
    launchDate: "",
    possessionDate: "",
    seoTitle: "",
    seoDescription: "",
  };
}

export function projectDraftFrom(p: Project): ProjectDraft {
  const num = (n?: number) => (n != null ? String(n) : "");
  return {
    title: p.title,
    description: p.description,
    city: p.city,
    state: p.state ?? "",
    locality: p.locality,
    ownershipRole: p.ownershipRole,
    lifecycle: p.lifecycle,
    propertyTypes: (p.propertyTypes ?? []) as PropertyType[],
    configurations: (p.configurations ?? []).join(", "),
    priceFrom: num(p.priceFrom),
    priceTo: num(p.priceTo),
    sizeFrom: num(p.sizeFrom),
    sizeTo: num(p.sizeTo),
    amenities: p.amenities ?? [],
    images: p.images ?? [],
    contactName: p.contactName ?? "",
    contactPhone: p.contactPhone ?? "",
    reraId: p.reraId ?? "",
    launchDate: p.launchDate?.slice(0, 10) ?? "",
    possessionDate: p.possessionDate?.slice(0, 10) ?? "",
    seoTitle: p.seoTitle ?? "",
    seoDescription: p.seoDescription ?? "",
  };
}

const toNum = (v: string) => (v.trim() ? Number(v.replace(/,/g, "")) : undefined);
const splitConfigs = (v: string) =>
  v
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

function validate(d: ProjectDraft, submitting: boolean): Errors {
  const e: Errors = {};
  const title = d.title.trim();
  if (title.length < 3) e.title = "Use at least 3 characters.";
  if (!d.description.trim()) e.description = "Describe the project.";
  if (d.city.trim().length < 2) e.city = "Choose a city.";
  if (d.locality.trim().length < 2) e.locality = "Enter the locality.";
  for (const [key, val] of [
    ["priceFrom", d.priceFrom],
    ["priceTo", d.priceTo],
    ["sizeFrom", d.sizeFrom],
    ["sizeTo", d.sizeTo],
  ] as const) {
    const n = toNum(val);
    if (n !== undefined && (!Number.isFinite(n) || n < 0)) e[key] = "Enter a number.";
  }
  const pf = toNum(d.priceFrom);
  const pt = toNum(d.priceTo);
  if (pf !== undefined && pt !== undefined && pf > pt) e.priceTo = "Must be at least the starting price.";
  const sf = toNum(d.sizeFrom);
  const st = toNum(d.sizeTo);
  if (sf !== undefined && st !== undefined && sf > st) e.sizeTo = "Must be at least the smallest size.";
  const configs = splitConfigs(d.configurations);
  if (configs.length > LIMITS.configs) e.configurations = `Up to ${LIMITS.configs} configurations.`;
  else if (configs.some((c) => c.length > 40)) e.configurations = "Keep each configuration under 40 characters.";
  const phone = d.contactPhone.trim();
  if (phone && (phone.length < 5 || phone.length > 40)) e.contactPhone = "Enter a valid phone number.";
  if (submitting && d.images.length === 0) e.images = "Add at least one photo to submit for review.";
  return e;
}

function toPayload(d: ProjectDraft): Partial<ProjectInput> {
  const title = d.title.trim();
  const description = d.description.trim();
  const reraId = d.reraId.trim();
  return {
    title,
    description,
    city: d.city.trim(),
    state: d.state.trim() || undefined,
    country: "India",
    locality: d.locality.trim(),
    ownershipRole: d.ownershipRole,
    lifecycle: d.lifecycle,
    propertyTypes: d.propertyTypes,
    configurations: splitConfigs(d.configurations),
    priceFrom: toNum(d.priceFrom),
    priceTo: toNum(d.priceTo),
    sizeFrom: toNum(d.sizeFrom),
    sizeTo: toNum(d.sizeTo),
    amenities: d.amenities,
    images: d.images,
    contactName: d.contactName.trim() || undefined,
    contactPhone: d.contactPhone.trim() || undefined,
    reraId: reraId || undefined,
    reraApproved: Boolean(reraId),
    launchDate: d.launchDate || undefined,
    possessionDate: d.possessionDate || undefined,
    seoTitle: d.seoTitle.trim() || title,
    seoDescription: d.seoDescription.trim() || description.slice(0, 160),
  };
}

type Action = { label: string; status: ProjectSaveStatus; primary?: boolean };

function actionsFor(mode: "create" | "edit", status?: ProjectStatus): Action[] {
  if (mode === "create" || status === "Draft") {
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

/** Shared create/edit form for builder projects, mirroring the web project schema. */
export function ProjectForm({
  mode,
  screenTitle,
  initial,
  status,
  banner,
  onSave,
}: {
  mode: "create" | "edit";
  screenTitle: string;
  initial: ProjectDraft;
  status?: ProjectStatus;
  banner?: React.ReactNode;
  onSave: (payload: Partial<ProjectInput>, status: ProjectSaveStatus) => Promise<boolean>;
}) {
  const [draft, setDraft] = useState(initial);
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [seoOpen, setSeoOpen] = useState(Boolean(initial.seoTitle || initial.seoDescription));
  const amenities = useAmenities();

  const set = <K extends keyof ProjectDraft>(key: K, value: ProjectDraft[K]) => {
    setDraft((d) => ({ ...d, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };
  const text = (key: keyof ProjectDraft) => ({
    value: draft[key] as string,
    onChangeText: (v: string) => set(key, v as never),
    error: errors[key],
  });

  const save = async (action: Action) => {
    const e = validate(draft, action.status === "Pending Review");
    setErrors(e);
    if (Object.keys(e).length) return;
    setBusy(action.label);
    await onSave(toPayload(draft), action.status);
    setBusy(null);
  };

  const actions = actionsFor(mode, status);

  return (
    <Screen
      title={screenTitle}
      fallbackHref="/dealer-projects"
      footer={
        <View style={styles.footer}>
          {actions.map((a) => (
            <Button
              key={a.label}
              label={a.label}
              variant={a.primary ? "primary" : "secondary"}
              loading={busy === a.label}
              disabled={busy !== null && busy !== a.label}
              onPress={() => void save(a)}
              style={a.primary ? styles.primary : styles.secondary}
            />
          ))}
        </View>
      }
    >
      {banner}
      {Object.values(errors).some(Boolean) ? (
        <Text style={styles.errorSummary}>Fix the highlighted fields below.</Text>
      ) : null}

      <Section title="Basics">
        <TextField label="Project name" required maxLength={LIMITS.title} placeholder="e.g. Aravali Heights" {...text("title")} />
        <TextField
          label="Description"
          required
          multiline
          maxLength={LIMITS.description}
          placeholder="Location, layouts, amenities, what sets it apart"
          {...text("description")}
        />
        <Field label="Stage">
          <ChipGroup options={LIFECYCLES} value={draft.lifecycle} onChange={(v) => set("lifecycle", v)} />
        </Field>
        <Field label="Your role">
          <ChipGroup options={ROLES} value={draft.ownershipRole} onChange={(v) => set("ownershipRole", v)} />
        </Field>
      </Section>

      <Section title="Location">
        <CityField
          required
          value={draft.city}
          error={errors.city}
          onChange={(city, state) => {
            set("city", city);
            setDraft((d) => ({ ...d, state: state ?? "" }));
          }}
        />
        <TextField label="Locality" required placeholder="e.g. Shobhagpura" {...text("locality")} />
      </Section>

      <Section title="Units and pricing">
        <Field label={`Property types (${draft.propertyTypes.length}/${LIMITS.types})`}>
          <MultiChipGroup
            options={LISTING_TYPES}
            value={draft.propertyTypes}
            onChange={(v) => set("propertyTypes", v as PropertyType[])}
            max={LIMITS.types}
          />
        </Field>
        <TextField
          label="Configurations"
          placeholder="e.g. 2 BHK, 3 BHK, Penthouse"
          hint="Separate with commas"
          {...text("configurations")}
        />
        <View style={styles.row}>
          <TextField label="Price from" prefix="₹" keyboardType="numeric" containerStyle={styles.cell} {...text("priceFrom")} />
          <TextField label="Price to" prefix="₹" keyboardType="numeric" containerStyle={styles.cell} {...text("priceTo")} />
        </View>
        <View style={styles.row}>
          <TextField label="Size from" suffix="sq.ft" keyboardType="numeric" containerStyle={styles.cell} {...text("sizeFrom")} />
          <TextField label="Size to" suffix="sq.ft" keyboardType="numeric" containerStyle={styles.cell} {...text("sizeTo")} />
        </View>
      </Section>

      <Section title="Photos and amenities">
        <Field label={`Photos (${draft.images.length}/${LIMITS.images})`}>
          <PhotoGridUploader images={draft.images} onChange={(v) => set("images", v)} max={LIMITS.images} error={errors.images} />
        </Field>
        <Field label={`Amenities (${draft.amenities.length})`}>
          <MultiChipGroup options={amenities} value={draft.amenities} onChange={(v) => set("amenities", v)} max={LIMITS.amenities} />
        </Field>
      </Section>

      <Section title="Contact and approvals">
        <TextField label="Contact name" maxLength={120} {...text("contactName")} />
        <TextField label="Contact phone" keyboardType="phone-pad" maxLength={40} {...text("contactPhone")} />
        <TextField
          label="RERA ID"
          autoCapitalize="characters"
          maxLength={LIMITS.reraId}
          hint="Shown as RERA registered once our team verifies it."
          {...text("reraId")}
        />
        <View style={styles.row}>
          <View style={styles.cell}>
            <DateField label="Launch date" value={draft.launchDate} onChange={(v) => set("launchDate", v)} />
          </View>
          <View style={styles.cell}>
            <DateField label="Possession" value={draft.possessionDate} onChange={(v) => set("possessionDate", v)} />
          </View>
        </View>
      </Section>

      <View style={styles.section}>
        <Pressable
          onPress={() => setSeoOpen((o) => !o)}
          style={styles.disclosure}
          accessibilityRole="button"
          accessibilityState={{ expanded: seoOpen }}
        >
          <Text style={styles.sectionTitle}>Search appearance</Text>
          {seoOpen ? <ChevronUp size={18} color={colors.inkMuted} /> : <ChevronDown size={18} color={colors.inkMuted} />}
        </Pressable>
        {seoOpen ? (
          <>
            <TextField label="Search title" placeholder={draft.title || "Defaults to the project name"} maxLength={200} {...text("seoTitle")} />
            <TextField
              label="Search description"
              multiline
              placeholder="Defaults to the start of your description"
              maxLength={500}
              {...text("seoDescription")}
            />
          </>
        ) : null}
      </View>
    </Screen>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.lg },
  sectionTitle: { ...type.heading, color: colors.ink },
  field: { gap: spacing.sm },
  label: { ...type.label, color: colors.inkSecondary },
  errorSummary: { ...type.caption, color: colors.danger },
  row: { flexDirection: "row", gap: spacing.md },
  cell: { flex: 1 },
  disclosure: { minHeight: touchTarget, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  footer: { flexDirection: "row", gap: spacing.md },
  secondary: { flex: 1 },
  primary: { flex: 1.4 },
});
