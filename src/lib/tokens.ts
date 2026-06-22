export const tokens = {
  navy: "#002663",
  navyLight: "#1a4080",
  accent: "#1565C0",
  bg: "#EEF2F8",
  surface: "#FFFFFF",
  border: "#DDE4EF",
  text: "#0D1B3E",
  textSub: "#4A5878",
  textMuted: "#8A9ABB",
  success: "#059669",
  successBg: "#ECFDF5",
  warning: "#B45309",
  warningBg: "#FFFBEB",
  teal: "#0F6E56",
  tealBg: "#E1F5EE",
  amber: "#854F0B",
  amberBg: "#FAEEDA",
  gold: "#C9A84C",
} as const;

// Global rule: no shadows anywhere. Kept as an exported "none" so existing
// consumers using `boxShadow: cardShadow` continue to compile but render flat.
export const cardShadow = "none";
