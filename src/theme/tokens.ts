/**
 * Design tokens — single source of truth for the app's visual language.
 *
 * Spacing follows an 8pt system (4 is the half-step).
 * Colors preserve the committed brand: cream canvas, slate ink, warm orange accent.
 */

export const colors = {
  /** Screen canvas */
  bg: "#FAF9F6",
  /** Cards and elevated surfaces */
  surface: "#FFFFFF",
  /** Recessed panels inside cards (input wells, info blocks) */
  surfaceSubtle: "#F5F4F0",

  ink: "#0F1E36",
  inkSecondary: "#44506A",
  inkMuted: "#6B7280",

  border: "#EAE9E4",
  borderStrong: "#D9D7CF",

  accent: "#E05A36",
  accentSoft: "rgba(224, 90, 54, 0.08)",
  accentBorder: "rgba(224, 90, 54, 0.22)",

  info: "#005B96",
  infoSoft: "rgba(0, 91, 150, 0.08)",
  success: "#0E9F6E",
  successSoft: "rgba(14, 159, 110, 0.10)",
  danger: "#DC2626",
  dangerSoft: "rgba(220, 38, 38, 0.08)",

  onAccent: "#FFFFFF",
  overlay: "rgba(15, 30, 54, 0.55)",
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 999,
} as const;

export const shadow = {
  /** Resting cards */
  card: "0 1px 3px rgba(15, 30, 54, 0.06)",
  /** Floating elements: sheets, popovers, primary CTAs */
  raised: "0 4px 16px rgba(15, 30, 54, 0.10)",
  /** Accent CTA glow */
  accent: "0 4px 12px rgba(224, 90, 54, 0.28)",
} as const;

type TextStyleToken = {
  fontSize: number;
  fontWeight: "500" | "600" | "700" | "800";
  letterSpacing?: number;
  lineHeight?: number;
};

export const type = {
  /** Screen titles */
  title: { fontSize: 22, fontWeight: "800", letterSpacing: -0.4 },
  /** Section headings */
  heading: { fontSize: 17, fontWeight: "700", letterSpacing: -0.2 },
  /** Card titles, prominent values */
  emphasis: { fontSize: 15, fontWeight: "700" },
  /** Default body copy */
  body: { fontSize: 15, fontWeight: "500", lineHeight: 21 },
  /** Secondary labels, buttons */
  label: { fontSize: 13, fontWeight: "600" },
  /** Metadata, timestamps */
  caption: { fontSize: 12, fontWeight: "500", lineHeight: 16 },
  /** Badges, chips */
  micro: { fontSize: 11, fontWeight: "700", letterSpacing: 0.2 },
} satisfies Record<string, TextStyleToken>;

export const hitSlop = { top: 8, bottom: 8, left: 8, right: 8 } as const;
