// Design tokens for CineStudio. Dark ("Scuro cinematografico", default) and
// light ("Chiaro e pulito") themes with an in-app toggle persisted in storage.
// Keys match the "color" block of /app/design_guidelines.json.
import { useMemo, useSyncExternalStore } from "react";
import { StyleSheet } from "react-native";

import { storage } from "@/src/utils/storage";

export type ColorScheme = "light" | "dark";

const light = {
  surface: "#FAFAFA",
  onSurface: "#111111",
  surfaceSecondary: "#FFFFFF",
  onSurfaceSecondary: "#111111",
  surfaceTertiary: "#F2F2F2",
  onSurfaceTertiary: "#4A4A4A",
  surfaceInverse: "#1C1C1E",
  onSurfaceInverse: "#FFFFFF",
  muted: "#757575",
  brand: "#D4AF37",
  onBrand: "#111111",
  brandPrimary: "#D4AF37",
  onBrandPrimary: "#111111",
  brandSecondary: "#E6D0A3",
  onBrandSecondary: "#111111",
  brandTertiary: "#F4EBD9",
  onBrandTertiary: "#8A6D1C",
  success: "#2E7D32",
  onSuccess: "#FFFFFF",
  warning: "#E65100",
  onWarning: "#FFFFFF",
  error: "#D32F2F",
  onError: "#FFFFFF",
  info: "#455A64",
  onInfo: "#FFFFFF",
  border: "#EBEBEB",
  borderStrong: "#CCCCCC",
  divider: "#EEEEEE",
  backdrop: "rgba(0,0,0,0.45)",
  sidebar: "#F4F4F2",
};

export type ThemeColors = typeof light;

const dark: ThemeColors = {
  surface: "#0A0A0A",
  onSurface: "#EAEAEA",
  surfaceSecondary: "#161618",
  onSurfaceSecondary: "#EAEAEA",
  surfaceTertiary: "#242426",
  onSurfaceTertiary: "#A0A0A5",
  surfaceInverse: "#FAFAFA",
  onSurfaceInverse: "#111111",
  muted: "#8E8E93",
  brand: "#D4AF37",
  onBrand: "#111111",
  brandPrimary: "#D4AF37",
  onBrandPrimary: "#111111",
  brandSecondary: "#E6D0A3",
  onBrandSecondary: "#111111",
  brandTertiary: "#38311B",
  onBrandTertiary: "#E6D0A3",
  success: "#4CAF50",
  onSuccess: "#000000",
  warning: "#FF9800",
  onWarning: "#000000",
  error: "#F44336",
  onError: "#FFFFFF",
  info: "#607D8B",
  onInfo: "#FFFFFF",
  border: "#2A2A2A",
  borderStrong: "#4A4A4A",
  divider: "#1E1E1E",
  backdrop: "rgba(0,0,0,0.65)",
  sidebar: "#111113",
};

export const themes: { light: ThemeColors; dark: ThemeColors } = { light, dark };

export const fonts = { display: "Fraunces", text: "Geist", script: "CourierPrime" };
export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48 };
export const radius = { sm: 6, md: 12, lg: 20, pill: 999 };
export const type = { sm: 12, base: 14, lg: 16, xl: 20, xxl: 24 };

const PREF_KEY = "theme_pref";
let current: ColorScheme = "dark";
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

export function setColorScheme(scheme: ColorScheme) {
  current = scheme;
  emit();
  storage.setItem(PREF_KEY, scheme);
}

export async function loadColorScheme() {
  const s = await storage.getItem<string>(PREF_KEY, "dark");
  if (s === "light" || s === "dark") {
    current = s;
    emit();
  }
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

export function useTheme(): { scheme: ColorScheme; colors: ThemeColors } {
  const scheme = useSyncExternalStore(subscribe, () => current, () => current);
  return { scheme, colors: themes[scheme] };
}

export function makeStyles<T extends StyleSheet.NamedStyles<T> | StyleSheet.NamedStyles<any>>(
  factory: (colors: ThemeColors) => T & StyleSheet.NamedStyles<any>,
): () => T {
  return function useStyles(): T {
    const { colors } = useTheme();
    return useMemo(() => StyleSheet.create(factory(colors)), [colors]);
  };
}
