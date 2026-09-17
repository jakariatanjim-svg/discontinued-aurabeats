/**
 * Theme engine — dual core (glassy glassmorphism / modern flat) plus dark and
 * light modes and a live accent colour system. Everything is written to CSS
 * custom properties on <html> so the whole UI re-tints instantly with zero
 * re-render cost, and persisted to localStorage.
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { storage } from "@/utils/storage";
import type { ThemeMode, ThemeName } from "@/types";

export interface AccentPreset {
  name: string;
  value: string;
}

export const ACCENTS: AccentPreset[] = [
  { name: "Nebula", value: "#7c5cff" },
  { name: "Cyber", value: "#22d3ee" },
  { name: "Aurora", value: "#34d399" },
  { name: "Sunset", value: "#fb7185" },
  { name: "Ember", value: "#f97316" },
  { name: "Bloom", value: "#e879f9" },
  { name: "Voltage", value: "#facc15" },
  { name: "Ocean", value: "#3b82f6" },
];

interface ThemeContextValue {
  theme: ThemeName;
  mode: ThemeMode;
  accent: string;
  setTheme: (t: ThemeName) => void;
  setMode: (m: ThemeMode) => void;
  setAccent: (hex: string) => void;
  toggleTheme: () => void;
  toggleMode: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function clampByte(v: number) {
  return Math.min(255, Math.max(0, Math.round(v)));
}

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  const int = parseInt(full, 16);
  return [(int >> 16) & 255, (int >> 8) & 255, int & 255];
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map((c) => clampByte(c).toString(16).padStart(2, "0")).join("")}`;
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6;
  else if (max === gn) h = ((bn - rn) / d + 2) / 6;
  else h = ((rn - gn) / d + 4) / 6;
  return [h, s, l];
}

function hslToHex(h: number, s: number, l: number): string {
  const hue = (h % 1 + 1) % 1;
  const f = (n: number) => {
    const k = (n + hue * 12) % 12;
    const a = s * Math.min(l, 1 - l);
    const val = l - a * Math.max(-1, Math.min(Math.min(k - 3, 9 - k), 1));
    return Math.round(val * 255);
  };
  return rgbToHex(f(0), f(8), f(4));
}

/** Derive a harmonised secondary accent for gradients/glow. */
export function deriveAccent2(hex: string): string {
  const [r, g, b] = hexToRgb(hex);
  const [h, s, l] = rgbToHsl(r, g, b);
  const sat = Math.min(1, Math.max(0.55, s));
  return hslToHex(h + 0.075, sat, Math.min(0.72, Math.max(0.5, l + 0.06)));
}

export function accentRgbString(hex: string): string {
  return hexToRgb(hex).join(" ");
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeName>(() => storage.get<ThemeName>("theme", "glassy"));
  const [mode, setModeState] = useState<ThemeMode>(() => storage.get<ThemeMode>("mode", "dark"));
  const [accent, setAccentState] = useState<string>(() => storage.get<string>("accent", ACCENTS[0].value));

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = theme;
    root.dataset.mode = mode;
    root.style.setProperty("--c-accent", accent);
    root.style.setProperty("--c-accent2", deriveAccent2(accent));
    root.style.setProperty("--accent-rgb", accentRgbString(accent));
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", accent);
    storage.set("theme", theme);
    storage.set("mode", mode);
    storage.set("accent", accent);
  }, [theme, mode, accent]);

  const setTheme = useCallback((t: ThemeName) => setThemeState(t), []);
  const setMode = useCallback((m: ThemeMode) => setModeState(m), []);
  const setAccent = useCallback((hex: string) => setAccentState(hex), []);
  const toggleTheme = useCallback(() => setThemeState((t) => (t === "glassy" ? "modern" : "glassy")), []);
  const toggleMode = useCallback(() => setModeState((m) => (m === "dark" ? "light" : "dark")), []);

  const value = useMemo(
    () => ({ theme, mode, accent, setTheme, setMode, setAccent, toggleTheme, toggleMode }),
    [theme, mode, accent, setTheme, setMode, setAccent, toggleTheme, toggleMode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside <ThemeProvider>");
  return ctx;
}
