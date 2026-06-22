export const FONTS = {
  body: "'DM Sans', sans-serif",
  display: "'Sora', sans-serif",
  mono: "'DM Mono', monospace",
} as const;

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
  textMuted: "#8A9ABB",
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
  muted: "#7A879F",
  ink: "#16233F",
  cardBg: tokens.surface,
  pageBg: tokens.bg,
  rowHover: "#F8FAFD",
} as const;

export const cardShadow = "none";
