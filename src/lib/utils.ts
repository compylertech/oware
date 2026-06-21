import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Centralized design tokens. Import these instead of hardcoding hex values.
 */
export const tokens = {
  color: {
    navy: "#002663",
    navyDark: "#001844",
    navyLight: "#1a4080",
    canvas: "#F6F7F9",
    surface: "#FFFFFF",
    border: "#E5E7EB",
    text: {
      heading: "#101828",
      body: "#475467",
      muted: "#667085",
    },
  },
  radius: {
    card: "14px",
  },
  shadow: {
    card: "0 1px 2px rgba(16,24,40,0.04), 0 1px 3px rgba(16,24,40,0.06)",
  },
} as const;

export function formatCurrency(
  value: number,
  currency: string = "USD",
  locale: string = "en-US",
): string {
  return new Intl.NumberFormat(locale, { style: "currency", currency }).format(value);
}

export function formatDate(
  value: Date | string | number,
  locale: string = "en-US",
  options: Intl.DateTimeFormatOptions = { year: "numeric", month: "short", day: "numeric" },
): string {
  const d = value instanceof Date ? value : new Date(value);
  return new Intl.DateTimeFormat(locale, options).format(d);
}
