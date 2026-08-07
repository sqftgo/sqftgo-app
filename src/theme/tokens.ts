/**
 * Design tokens — single source of truth for SqftGo's visual language.
 *
 * 1. Typography: Fredoka for logo/wordmark, Inter for all UI text.
 * 2. Palette: Deep Emerald Forest (#0F382C) primary, Warm Terracotta (#C86D51) single accent, Light Gray canvas (#F8F9FA).
 * 3. Buttons: Flat with 1px border or subtle 0 2px 4px rgba(0,0,0,0.08) neutral shadow.
 */

export const fonts = {
  logo: "Fredoka_600SemiBold",
  sansRegular: "Inter_400Regular",
  sansMedium: "Inter_500Medium",
  sansSemiBold: "Inter_600SemiBold",
  sansBold: "Inter_700Bold",
} as const;

export const colors = {
  /** Warm off-white / cream screen canvas */
  bg: "#FAF9F6",
  /** Cards and elevated surfaces */
  surface: "#FFFFFF",
  /** Recessed panels (input wells, info blocks) */
  surfaceSubtle: "#F5F4F0",

  ink: "#0F1E36",
  inkSecondary: "#44506A",
  inkMuted: "#6B7280",

  border: "#EAE9E4",
  borderStrong: "#D9D7CF",

  /** Primary brand color - Deep Navy / Slate Ink (#0F1E36) */
  primary: "#0F1E36",
  primarySoft: "rgba(15, 30, 54, 0.07)",
  primaryBorder: "rgba(15, 30, 54, 0.20)",

  /** Single accent color - Terracotta / Warm Coral (#E05A36) (reserved ONLY for primary CTAs & active selection) */
  accent: "#E05A36",
  accentSoft: "rgba(224, 90, 54, 0.08)",
  accentBorder: "rgba(224, 90, 54, 0.25)",

  info: "#005B96",
  infoSoft: "rgba(0, 91, 150, 0.08)",
  success: "#0E9F6E",
  successSoft: "rgba(14, 159, 110, 0.10)",
  danger: "#DC2626",
  dangerSoft: "rgba(220, 38, 38, 0.08)",

  onPrimary: "#FFFFFF",
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
  md: 10,
  lg: 14,
  xl: 18,
  full: 999,
} as const;

export const shadow = {
  /** Flat card border shadow */
  card: "0 1px 2px rgba(0, 0, 0, 0.05)",
  /** Floating sheets, modal popovers */
  raised: "0 4px 12px rgba(0, 0, 0, 0.08)",
  /** Flat button minimal neutral shadow (no soft colored glow) */
  button: "0 2px 4px rgba(0, 0, 0, 0.08)",
  /** Backward compatible alias pointing to flat neutral shadow */
  accent: "0 2px 4px rgba(0, 0, 0, 0.08)",
} as const;

type TextStyleToken = {
  fontFamily?: string;
  fontSize: number;
  fontWeight: "400" | "500" | "600" | "700" | "800";
  letterSpacing?: number;
  lineHeight?: number;
};

export const type = {
  /** Brand wordmark logo font */
  logo: { fontFamily: fonts.logo, fontSize: 24, fontWeight: "600" },
  /** Main screen titles */
  title: { fontFamily: fonts.sansBold, fontSize: 22, fontWeight: "700", letterSpacing: -0.3, lineHeight: 28 },
  /** Section headings */
  heading: { fontFamily: fonts.sansSemiBold, fontSize: 17, fontWeight: "600", letterSpacing: -0.2, lineHeight: 23 },
  /** Card titles, bold labels */
  emphasis: { fontFamily: fonts.sansSemiBold, fontSize: 15, fontWeight: "600" },
  /** Regular body text */
  body: { fontFamily: fonts.sansRegular, fontSize: 15, fontWeight: "400", lineHeight: 22 },
  /** Secondary text, form labels, buttons */
  label: { fontFamily: fonts.sansMedium, fontSize: 14, fontWeight: "500" },
  /** Captions, timestamps */
  caption: { fontFamily: fonts.sansRegular, fontSize: 12, fontWeight: "400", lineHeight: 16 },
  /** Badges, micro labels (Sentence / Title case) */
  micro: { fontFamily: fonts.sansMedium, fontSize: 11, fontWeight: "500", letterSpacing: 0.1 },
} satisfies Record<string, TextStyleToken>;

export const hitSlop = { top: 8, bottom: 8, left: 8, right: 8 } as const;

