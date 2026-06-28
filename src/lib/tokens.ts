const formatCssFontFamily = (family: string, fallback: "sans-serif" | "monospace") =>
  `'${family}', ${fallback}`;

const formatGoogleFontFamily = (family: string) => family.split(" ").join("+");

export const FONT_FAMILIES = {
  body: "Karla",
  display: "Karla",
  mono: "Karla",
} as const;

export const FONTS = {
  body: formatCssFontFamily(FONT_FAMILIES.body, "sans-serif"),
  display: formatCssFontFamily(FONT_FAMILIES.display, "sans-serif"),
  mono: formatCssFontFamily(FONT_FAMILIES.mono, "monospace"),
} as const;

export const FONT_CSS_VARIABLES = {
  "--oware-font-body": FONTS.body,
  "--oware-font-display": FONTS.display,
  "--oware-font-mono": FONTS.mono,
} as const;

const GOOGLE_FONT_DEFINITIONS = [
  { family: FONT_FAMILIES.body, weights: [400, 500, 600, 700, 800] },
  { family: FONT_FAMILIES.display, weights: [400, 500, 600, 700, 800] },
  { family: FONT_FAMILIES.mono, weights: [400, 500] },
] as const;

const googleFontRequests = Array.from(
  GOOGLE_FONT_DEFINITIONS.reduce((requests, definition) => {
    const weights = requests.get(definition.family) ?? new Set<number>();
    definition.weights.forEach((weight) => weights.add(weight));
    requests.set(definition.family, weights);
    return requests;
  }, new Map<string, Set<number>>()),
).map(([family, weights]) => {
  const weightList = Array.from(weights)
    .sort((a, b) => a - b)
    .join(";");
  return `family=${formatGoogleFontFamily(family)}:wght@${weightList}`;
});

export const FONT_STYLESHEET_URL = `https://fonts.googleapis.com/css2?${googleFontRequests.join(
  "&",
)}&display=swap`;

// Single source of truth for color. `LOAN` below is derived from these so the
// same hue is never defined twice. Add new colors here and reference them
// rather than hardcoding hex in components.
export const tokens = {
  navy: "#002663",
  navyLight: "#1a4080",
  accent: "#1565C0",
  bg: "#F4F6FB",
  surface: "#FFFFFF",
  border: "#DDE4EF",
  text: "#0D1B3E",
  textSub: "#4A5878",
  // Darkened from #8A9ABB to meet WCAG AA (~5.4:1 on white) for small labels.
  textMuted: "#5B6A86",
  success: "#059669",
  successBg: "#ECFDF5",
  warning: "#B45309",
  warningBg: "#FFFBEB",
  danger: "#DC2626",
  dangerBg: "#FEF2F2",
  blue: "#3B5BDB",
  blueBg: "#EEF2FF",
  purple: "#7C3AED",
  purpleBg: "#F5F3FF",
  teal: "#0F6E56",
  tealBg: "#E1F5EE",
  amber: "#854F0B",
  amberBg: "#FAEEDA",
  gold: "#C9A84C",
} as const;

// Loan-section palette. Shared hues are derived from `tokens` (one source of
// truth); a few values (ink, border, muted, rowHover) are intentionally tuned
// for the dense loan tables and kept explicit.
export const LOAN = {
  navy: tokens.navy,
  blue: tokens.blue,
  blueBg: tokens.blueBg,
  blueBorder: "#C7D2FE",
  green: tokens.success,
  greenBg: tokens.successBg,
  amber: tokens.warning,
  amberBg: tokens.warningBg,
  red: tokens.danger,
  redBg: tokens.dangerBg,
  purple: tokens.purple,
  purpleBg: tokens.purpleBg,
  border: "#E6EAF2",
  // Darkened from #7A879F to meet WCAG AA on white.
  muted: "#5B6A86",
  ink: "#16233F",
  cardBg: tokens.surface,
  pageBg: tokens.bg,
  rowHover: "#F8FAFD",
} as const;

export const cardShadow = "none";
