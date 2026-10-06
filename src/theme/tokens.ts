/**
 * Design tokens — single source of truth for SqftGo's visual language.
 *
 * Palette: terracotta accent (#C95B3C) for primary actions and selection, navy (#1B3864)
 * for brand surfaces, warm off-white canvas (#FAF8F5), ink text (#1C2530).
 * Type: Inter, iOS-style scale (34 / 28 / 22 / 17 / 16 / 13 / 11).
 * Spacing on a 4pt grid; radii 10 / 16 / 24 / pill.
 */

export const fonts = {
  logo: "Fredoka_600SemiBold",
  sansRegular: "Inter_400Regular",
  sansMedium: "Inter_500Medium",
  sansSemiBold: "Inter_600SemiBold",
  sansBold: "Inter_700Bold",
} as const;

export const colors = {
  /** Warm off-white screen canvas */
  bg: "#FAF8F5",
  /** Cards and elevated surfaces */
  surface: "#FFFFFF",
  /** Recessed panels (input wells, info blocks) */
  surfaceSubtle: "#F3F0EB",

  ink: "#1C2530",
  inkSecondary: "#4A5563",
  inkMuted: "#6B7280",

  border: "#E8E3DC",
  borderStrong: "#D6CFC5",
  /** Row separators inside grouped lists */
  divider: "#EFEAE2",

  /** Brand navy — headers, secondary emphasis */
  primary: "#1B3864",
  primarySoft: "rgba(27, 56, 100, 0.07)",
  primaryBorder: "rgba(27, 56, 100, 0.20)",

  /** Terracotta — primary CTAs and active selection only */
  accent: "#C95B3C",
  accentPressed: "#B04D31",
  accentSoft: "rgba(201, 91, 60, 0.09)",
  accentBorder: "rgba(201, 91, 60, 0.28)",

  info: "#1B5E96",
  infoSoft: "rgba(27, 94, 150, 0.08)",
  success: "#467E54",
  successSoft: "rgba(70, 126, 84, 0.11)",
  danger: "#C2412D",
  dangerSoft: "rgba(194, 65, 45, 0.09)",
  warning: "#B45309",
  warningSoft: "#FDF0DC",
  warningBorder: "rgba(180, 83, 9, 0.28)",
  /** Gold — ratings, featured and premium highlights */
  star: "#DFAB34",
  gold: "#DFAB34",
  featuredSoft: "#F4E8C5",
  placeholder: "#9AA1AB",

  onPrimary: "#FFFFFF",
  onPrimaryMuted: "rgba(255, 255, 255, 0.75)",
  onAccent: "#FFFFFF",
  overlay: "rgba(28, 37, 48, 0.5)",
} as const;

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  "3xl": 32,
  "4xl": 40,
} as const;

export const radius = {
  xs: 6,
  sm: 10,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
} as const;

export const shadow = {
  card: "0 1px 2px rgba(28, 37, 48, 0.06)",
  raised: "0 8px 24px rgba(28, 37, 48, 0.12)",
  button: "0 2px 4px rgba(28, 37, 48, 0.08)",
  accent: "0 2px 4px rgba(28, 37, 48, 0.08)",
} as const;

/** Minimum touch target (iOS HIG). */
export const touchTarget = 44;

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
  /** Large screen titles (iOS Large Title) */
  display: { fontFamily: fonts.sansBold, fontSize: 34, fontWeight: "700", letterSpacing: -0.6, lineHeight: 41 },
  /** Hero numbers and primary titles */
  hero: { fontFamily: fonts.sansBold, fontSize: 28, fontWeight: "700", letterSpacing: -0.5, lineHeight: 34 },
  /** Screen and sheet titles */
  title: { fontFamily: fonts.sansBold, fontSize: 22, fontWeight: "700", letterSpacing: -0.3, lineHeight: 28 },
  /** Section headings */
  heading: { fontFamily: fonts.sansSemiBold, fontSize: 17, fontWeight: "600", letterSpacing: -0.2, lineHeight: 22 },
  /** Card titles, bold labels */
  emphasis: { fontFamily: fonts.sansSemiBold, fontSize: 16, fontWeight: "600", lineHeight: 21 },
  /** Regular body text */
  body: { fontFamily: fonts.sansRegular, fontSize: 16, fontWeight: "400", lineHeight: 22 },
  /** Secondary text, form labels, buttons */
  label: { fontFamily: fonts.sansMedium, fontSize: 15, fontWeight: "500", lineHeight: 20 },
  /** Captions, timestamps */
  caption: { fontFamily: fonts.sansRegular, fontSize: 13, fontWeight: "400", lineHeight: 18 },
  /** Badges, micro labels */
  micro: { fontFamily: fonts.sansMedium, fontSize: 11, fontWeight: "600", letterSpacing: 0.2, lineHeight: 13 },
} satisfies Record<string, TextStyleToken>;

export const hitSlop = { top: 8, bottom: 8, left: 8, right: 8 } as const;
