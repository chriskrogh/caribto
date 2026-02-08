import { useTheme } from "../context";

const colorMap = {
  "bg-background": { light: "bg-background", dark: "bg-background-dark" },
  "text-foreground": {
    light: "text-foreground",
    dark: "text-foreground-dark",
  },
  "text-background": {
    light: "text-background",
    dark: "text-background-dark",
  },
  "bg-card": { light: "bg-card", dark: "bg-card-dark" },
  "text-card-foreground": {
    light: "text-card-foreground",
    dark: "text-card-foreground-dark",
  },
  "bg-primary": { light: "bg-primary", dark: "bg-primary-dark" },
  "text-primary": { light: "text-primary", dark: "text-primary-dark" },
  "text-primary-foreground": {
    light: "text-primary-foreground",
    dark: "text-primary-foreground-dark",
  },
  "bg-secondary": { light: "bg-secondary", dark: "bg-secondary-dark" },
  "text-secondary-foreground": {
    light: "text-secondary-foreground",
    dark: "text-secondary-foreground-dark",
  },
  "bg-muted": { light: "bg-muted", dark: "bg-muted-dark" },
  "text-muted-foreground": {
    light: "text-muted-foreground",
    dark: "text-muted-foreground-dark",
  },
  "bg-accent": { light: "bg-accent", dark: "bg-accent-dark" },
  "text-accent-foreground": {
    light: "text-accent-foreground",
    dark: "text-accent-foreground-dark",
  },
  "bg-destructive": { light: "bg-destructive", dark: "bg-destructive-dark" },
  "text-destructive-foreground": {
    light: "text-destructive-foreground",
    dark: "text-destructive-foreground-dark",
  },
  "border-border": { light: "border-border", dark: "border-border-dark" },
  "bg-border": { light: "bg-border", dark: "bg-border-dark" },
  "bg-input": { light: "bg-input", dark: "bg-input-dark" },
  "ring-ring": { light: "ring-ring", dark: "ring-ring-dark" },
  "bg-chart": { light: "bg-chart", dark: "bg-chart-dark" },
} as const;

/**
 * Hook that returns theme-aware color classes
 * Usage: const bgClass = useThemeColor('bg-background');
 */
export const useThemeColorClassName = () => {
  const { isDark } = useTheme();
  return (colorName: keyof typeof colorMap) =>
    isDark ? colorMap[colorName].dark : colorMap[colorName].light;
};
