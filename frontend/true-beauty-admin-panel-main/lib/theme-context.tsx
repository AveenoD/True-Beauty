"use client";

import React, { createContext, useContext, useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "web-theme";

export interface WebThemeState {
  brandName: string;
  footerText: string;
  logoDataUrl: string | null;
  faviconDataUrl: string | null;
  socialLinks: Record<string, string>;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  buttonColor: string;
  backgroundColor: string;
  heroBanner: boolean;
  featuredProducts: boolean;
  services: boolean;
  testimonials: boolean;
  affiliateSection: boolean;
  bannerTitle: string;
  bannerDescription: string;
  bannerCta: string;
  bannerDataUrl: string | null;
  sellerThemeOverride: boolean;
}

const DEFAULT_THEME: WebThemeState = {
  brandName: "True Beauty",
  footerText: "© 2025 True Beauty. All rights reserved.",
  logoDataUrl: null,
  faviconDataUrl: null,
  socialLinks: { facebook: "", instagram: "", twitter: "", linkedin: "", youtube: "" },
  primaryColor: "#2563EB",
  secondaryColor: "#EFF6FF",
  accentColor: "#1E40AF",
  buttonColor: "#2563EB",
  backgroundColor: "#FFFFFF",
  heroBanner: true,
  featuredProducts: true,
  services: true,
  testimonials: true,
  affiliateSection: true,
  bannerTitle: "Welcome to True Beauty",
  bannerDescription: "Discover premium beauty products and services.",
  bannerCta: "Shop Now",
  bannerDataUrl: null,
  sellerThemeOverride: false,
};

interface ThemeContextValue {
  theme: WebThemeState | null;
  saveTheme: (theme: WebThemeState) => Promise<void>;
  isApplied: boolean;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function applyThemeToDocument(theme: WebThemeState) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.style.setProperty("--theme-primary", theme.primaryColor);
  root.style.setProperty("--theme-secondary", theme.secondaryColor);
  root.style.setProperty("--theme-accent", theme.accentColor);
  root.style.setProperty("--theme-button", theme.buttonColor);
  root.style.setProperty("--theme-background", theme.backgroundColor);
  root.style.setProperty("--primary", theme.primaryColor);
  root.style.setProperty("--background", theme.backgroundColor);
}

function readStoredTheme(): WebThemeState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as WebThemeState;
    return { ...DEFAULT_THEME, ...parsed };
  } catch {
    return null;
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<WebThemeState | null>(null);
  const [isApplied, setIsApplied] = useState(false);

  useEffect(() => {
    const stored = readStoredTheme();
    if (stored) {
      setTheme(stored);
      applyThemeToDocument(stored);
      setIsApplied(true);
    }
  }, []);

  const saveTheme = useCallback(async (next: WebThemeState) => {
    setTheme(next);
    applyThemeToDocument(next);
    setIsApplied(true);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      // TODO: persist to database via API
      // await fetch('/api/theme', { method: 'POST', body: JSON.stringify(next) });
    } catch (e) {
      console.warn("Theme persist failed:", e);
    }
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, saveTheme, isApplied }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}

export { DEFAULT_THEME };
