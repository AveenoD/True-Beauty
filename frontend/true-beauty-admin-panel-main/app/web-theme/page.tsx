"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  Image as ImageIcon,
  Palette,
  Layout,
  ImagePlus,
  Store,
  Save,
  RotateCcw,
  X,
  CheckCircle,
} from "lucide-react";
import { useTheme, type WebThemeState } from "@/lib/theme-context";

/* Predefined theme CSS variables (for reference and preset application) */
const THEME_PRESETS = [
  {
    id: "royal-blue",
    name: "Royal Blue",
    class: "theme-royal-blue",
    primary: "#2563EB",
    secondary: "#EFF6FF",
    accent: "#1E40AF",
  },
  {
    id: "emerald-green",
    name: "Emerald Green",
    class: "theme-emerald-green",
    primary: "#059669",
    secondary: "#ECFDF5",
    accent: "#047857",
  },
  {
    id: "purple-glow",
    name: "Purple Glow",
    class: "theme-purple-glow",
    primary: "#7C3AED",
    secondary: "#F5F3FF",
    accent: "#5B21B6",
  },
  {
    id: "sunset-orange",
    name: "Sunset Orange",
    class: "theme-sunset-orange",
    primary: "#F97316",
    secondary: "#FFF7ED",
    accent: "#EA580C",
  },
  {
    id: "teal-ocean",
    name: "Teal Ocean",
    class: "theme-teal-ocean",
    primary: "#0D9488",
    secondary: "#F0FDFA",
    accent: "#0F766E",
  },
  {
    id: "hot-pink",
    name: "Hot Pink",
    class: "theme-hot-pink",
    primary: "#EC4899",
    secondary: "#FDF2F8",
    accent: "#DB2777",
  },
  {
    id: "coffee-brown",
    name: "Coffee Brown",
    class: "theme-coffee-brown",
    primary: "#92400E",
    secondary: "#FEF3C7",
    accent: "#78350F",
  },
  {
    id: "dark-mode-pro",
    name: "Dark Mode Pro",
    class: "theme-dark-mode-pro",
    primary: "#0F172A",
    secondary: "#1E293B",
    accent: "#38BDF8",
  },
  {
    id: "mint-fresh",
    name: "Mint Fresh",
    class: "theme-mint-fresh",
    primary: "#22C55E",
    secondary: "#F0FDF4",
    accent: "#16A34A",
  },
  {
    id: "soft-lavender",
    name: "Soft Lavender",
    class: "theme-soft-lavender",
    primary: "#A78BFA",
    secondary: "#F5F3FF",
    accent: "#7C3AED",
  },
] as const;

const DEFAULT_THEME = {
  primary: "#2563EB",
  secondary: "#EFF6FF",
  accent: "#1E40AF",
  button: "#2563EB",
  background: "#FFFFFF",
};

async function blobUrlToDataUrl(blobUrl: string): Promise<string | null> {
  try {
    const res = await fetch(blobUrl);
    const blob = await res.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export default function WebThemePage() {
  const [brandName, setBrandName] = useState("True Beauty");
  const [footerText, setFooterText] = useState("© 2025 True Beauty. All rights reserved.");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [faviconFile, setFaviconFile] = useState<File | null>(null);
  const [faviconPreview, setFaviconPreview] = useState<string | null>(null);
  const [socialLinks, setSocialLinks] = useState<Record<string, string>>({
    facebook: "",
    instagram: "",
    twitter: "",
    linkedin: "",
    youtube: "",
  });

  const [primaryColor, setPrimaryColor] = useState(DEFAULT_THEME.primary);
  const [secondaryColor, setSecondaryColor] = useState(DEFAULT_THEME.secondary);
  const [accentColor, setAccentColor] = useState(DEFAULT_THEME.accent);
  const [buttonColor, setButtonColor] = useState(DEFAULT_THEME.button);
  const [backgroundColor, setBackgroundColor] = useState(DEFAULT_THEME.background);

  const [heroBanner, setHeroBanner] = useState(true);
  const [featuredProducts, setFeaturedProducts] = useState(true);
  const [services, setServices] = useState(true);
  const [testimonials, setTestimonials] = useState(true);
  const [affiliateSection, setAffiliateSection] = useState(true);

  const [bannerImage, setBannerImage] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [bannerTitle, setBannerTitle] = useState("Welcome to True Beauty");
  const [bannerDescription, setBannerDescription] = useState("Discover premium beauty products and services.");
  const [bannerCta, setBannerCta] = useState("Shop Now");

  const [sellerThemeOverride, setSellerThemeOverride] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const { theme: savedTheme, saveTheme } = useTheme();
  const hasHydrated = useRef(false);
  useEffect(() => {
    if (!savedTheme || hasHydrated.current) return;
    hasHydrated.current = true;
    setBrandName(savedTheme.brandName);
    setFooterText(savedTheme.footerText);
    setSocialLinks(savedTheme.socialLinks ?? { facebook: "", instagram: "", twitter: "", linkedin: "", youtube: "" });
    setPrimaryColor(savedTheme.primaryColor);
    setSecondaryColor(savedTheme.secondaryColor);
    setAccentColor(savedTheme.accentColor);
    setButtonColor(savedTheme.buttonColor);
    setBackgroundColor(savedTheme.backgroundColor);
    setBannerTitle(savedTheme.bannerTitle);
    setBannerDescription(savedTheme.bannerDescription);
    setBannerCta(savedTheme.bannerCta);
    setHeroBanner(savedTheme.heroBanner);
    setFeaturedProducts(savedTheme.featuredProducts);
    setServices(savedTheme.services);
    setTestimonials(savedTheme.testimonials);
    setAffiliateSection(savedTheme.affiliateSection);
    setSellerThemeOverride(savedTheme.sellerThemeOverride);
    if (savedTheme.logoDataUrl) setLogoPreview(savedTheme.logoDataUrl);
    if (savedTheme.faviconDataUrl) setFaviconPreview(savedTheme.faviconDataUrl);
    if (savedTheme.bannerDataUrl) setBannerPreview(savedTheme.bannerDataUrl);
  }, [savedTheme]);

  const handleLogoChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  }, []);

  const handleFaviconChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFaviconFile(file);
      setFaviconPreview(URL.createObjectURL(file));
    }
  }, []);

  const handleBannerChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBannerImage(file);
      setBannerPreview(URL.createObjectURL(file));
    }
  }, []);

  const applyPreset = (preset: (typeof THEME_PRESETS)[number]) => {
    setPrimaryColor(preset.primary);
    setSecondaryColor(preset.secondary);
    setAccentColor(preset.accent);
    setButtonColor(preset.primary);
    setBackgroundColor(preset.secondary);
  };

  const resetToDefault = () => {
    setPrimaryColor(DEFAULT_THEME.primary);
    setSecondaryColor(DEFAULT_THEME.secondary);
    setAccentColor(DEFAULT_THEME.accent);
    setButtonColor(DEFAULT_THEME.button);
    setBackgroundColor(DEFAULT_THEME.background);
    setBrandName("True Beauty");
    setFooterText("© 2025 True Beauty. All rights reserved.");
    setBannerTitle("Welcome to True Beauty");
    setBannerDescription("Discover premium beauty products and services.");
    setBannerCta("Shop Now");
    setSocialLinks({ facebook: "", instagram: "", twitter: "", linkedin: "", youtube: "" });
    setHeroBanner(true);
    setFeaturedProducts(true);
    setServices(true);
    setTestimonials(true);
    setAffiliateSection(true);
    setSellerThemeOverride(false);
    setLogoFile(null);
    setLogoPreview(null);
    setFaviconFile(null);
    setFaviconPreview(null);
    setBannerImage(null);
    setBannerPreview(null);
  };

  const openPreviewModal = () => setPreviewModalOpen(true);

  const handleConfirmApply = async () => {
    setConfirmLoading(true);
    try {
      const logoDataUrl =
        logoPreview?.startsWith("blob:") ? await blobUrlToDataUrl(logoPreview) : logoPreview ?? null;
      const faviconDataUrl =
        faviconPreview?.startsWith("blob:") ? await blobUrlToDataUrl(faviconPreview) : faviconPreview ?? null;
      const bannerDataUrl =
        bannerPreview?.startsWith("blob:") ? await blobUrlToDataUrl(bannerPreview) : bannerPreview ?? null;

      const state: WebThemeState = {
        brandName,
        footerText,
        logoDataUrl,
        faviconDataUrl,
        socialLinks: { ...socialLinks },
        primaryColor,
        secondaryColor,
        accentColor,
        buttonColor,
        backgroundColor,
        heroBanner,
        featuredProducts,
        services,
        testimonials,
        affiliateSection,
        bannerTitle,
        bannerDescription,
        bannerCta,
        bannerDataUrl,
        sellerThemeOverride,
      };
      await saveTheme(state);
      setPreviewModalOpen(false);
      setSuccessMessage("Theme applied successfully.");
      setTimeout(() => setSuccessMessage(null), 3000);
    } finally {
      setConfirmLoading(false);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 max-w-6xl mx-auto px-3 sm:px-0 pb-6">
      {successMessage && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 text-sm font-medium"
        >
          <CheckCircle className="w-5 h-5 shrink-0" />
          {successMessage}
        </div>
      )}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-lg sm:text-xl font-semibold text-gray-900">
          Select Web Theme
        </h1>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <button
            type="button"
            onClick={resetToDefault}
            className="inline-flex justify-center items-center gap-2 px-3 sm:px-4 py-2 rounded-xl border border-gray-200 bg-white text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors flex-1 sm:flex-none whitespace-nowrap"
          >
            <RotateCcw className="w-4 h-4" />
            Reset to default
          </button>
          <button
            type="button"
            onClick={openPreviewModal}
            className="inline-flex justify-center items-center gap-2 px-3 sm:px-4 py-2 rounded-xl border border-gray-200 bg-white text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors flex-1 sm:flex-none"
          >
            Preview
          </button>
          <button
            type="button"
            onClick={handleConfirmApply}
            disabled={confirmLoading}
            className="inline-flex justify-center items-center gap-2 px-4 sm:px-5 py-2 rounded-xl bg-[#D96A86] text-white text-sm font-medium hover:bg-[#C85A76] transition-colors disabled:opacity-60 disabled:pointer-events-none flex-1 sm:flex-none"
          >
            <Save className="w-4 h-4" />
            {confirmLoading ? "Saving…" : "Save"}
          </button>
        </div>
      </div>

      {/* Full-screen preview modal */}
      {previewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
            role="dialog"
            aria-labelledby="preview-modal-title"
            aria-modal="true"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
              <h2 id="preview-modal-title" className="text-lg font-semibold text-gray-900">
                Preview theme
              </h2>
              <button
                type="button"
                onClick={() => setPreviewModalOpen(false)}
                className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 px-6 py-5 space-y-6">
              {/* Branding preview */}
              <section>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Branding
                </h3>
                <div className="flex flex-wrap items-center gap-4">
                  {logoPreview ? (
                    <img src={logoPreview} alt="" className="h-12 w-auto object-contain rounded" />
                  ) : (
                    <div
                      className="h-12 w-24 rounded-lg flex items-center justify-center text-white text-sm font-semibold"
                      style={{ backgroundColor: primaryColor }}
                    >
                      {(brandName || "Brand").slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-gray-900">{brandName || "Brand name"}</p>
                    <p className="text-sm text-gray-600 mt-0.5 line-clamp-2">{footerText || "Footer text"}</p>
                  </div>
                </div>
              </section>

              {/* Live theme preview */}
              <section>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Live theme preview
                </h3>
                <div
                  className="rounded-xl border border-gray-200 p-5 min-h-[200px] transition-colors"
                  style={{ backgroundColor }}
                >
                  {bannerPreview && (
                    <div className="mb-4 overflow-hidden rounded-lg border border-gray-200 bg-gray-100">
                      <img
                        src={bannerPreview}
                        alt="Banner preview"
                        className="w-full h-32 sm:h-40 object-cover"
                      />
                    </div>
                  )}
                  <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200/80">
                    {logoPreview ? (
                      <img src={logoPreview} alt="" className="h-8 w-auto object-contain" />
                    ) : (
                      <div
                        className="h-8 w-20 rounded flex items-center justify-center text-white text-xs font-semibold"
                        style={{ backgroundColor: primaryColor }}
                      >
                        {(brandName || "TB").slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <span className="text-sm font-semibold" style={{ color: primaryColor }}>
                      {brandName || "Header"}
                    </span>
                  </div>
                  <div
                    className="rounded-lg p-4 mb-4"
                    style={{ backgroundColor: secondaryColor, borderLeft: `4px solid ${accentColor}` }}
                  >
                    <p className="text-sm font-medium mb-1" style={{ color: accentColor }}>
                      {bannerTitle || "Card title"}
                    </p>
                    <p className="text-xs opacity-90" style={{ color: accentColor }}>
                      {bannerDescription || "Card description."}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="px-4 py-2 rounded-lg text-white text-sm font-medium"
                    style={{ backgroundColor: buttonColor }}
                  >
                    {bannerCta || "Button"}
                  </button>
                </div>
              </section>

              {/* Selected colors */}
              <section>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Selected colors
                </h3>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-10 h-10 rounded-lg border border-gray-200 shrink-0"
                      style={{ backgroundColor: primaryColor }}
                    />
                    <span className="text-sm text-gray-600">Primary</span>
                    <span className="text-xs font-mono text-gray-400">{primaryColor}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-10 h-10 rounded-lg border border-gray-200 shrink-0"
                      style={{ backgroundColor: secondaryColor }}
                    />
                    <span className="text-sm text-gray-600">Secondary</span>
                    <span className="text-xs font-mono text-gray-400">{secondaryColor}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-10 h-10 rounded-lg border border-gray-200 shrink-0"
                      style={{ backgroundColor: accentColor }}
                    />
                    <span className="text-sm text-gray-600">Accent</span>
                    <span className="text-xs font-mono text-gray-400">{accentColor}</span>
                  </div>
                </div>
              </section>
            </div>
            <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/80 shrink-0">
              <button
                type="button"
                onClick={() => setPreviewModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmApply}
                disabled={confirmLoading}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#D96A86] text-white text-sm font-medium hover:bg-[#C85A76] transition-colors disabled:opacity-60 disabled:pointer-events-none"
              >
                {confirmLoading ? "Applying…" : "Confirm & Apply Theme"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 sm:gap-6">
        {/* Left column: forms */}
        <div className="xl:col-span-2 space-y-6">
          {/* Banner Management */}
          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-4 sm:px-6 py-4 border-b border-gray-100 flex items-center gap-2">
              <ImagePlus className="w-5 h-5 text-gray-500" />
              <h2 className="text-base font-semibold text-gray-900">Banner Management</h2>
            </div>
            <div className="p-4 sm:p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Upload Banner</label>
                <label className="block w-full aspect-[3/1] max-h-40 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center cursor-pointer hover:border-[#D96A86] hover:bg-[#fef5f7] transition-colors overflow-hidden bg-gray-50">
                  <input type="file" accept="image/*" className="hidden" onChange={handleBannerChange} />
                  {bannerPreview ? (
                    <img src={bannerPreview} alt="Banner" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-sm text-gray-500">Click to upload banner image</span>
                  )}
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                <input
                  type="text"
                  value={bannerTitle}
                  onChange={(e) => setBannerTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#D96A86]/30 focus:border-[#D96A86]"
                  placeholder="Banner title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={bannerDescription}
                  onChange={(e) => setBannerDescription(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#D96A86]/30 focus:border-[#D96A86] resize-none"
                  placeholder="Banner description"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">CTA Button Text</label>
                <input
                  type="text"
                  value={bannerCta}
                  onChange={(e) => setBannerCta(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#D96A86]/30 focus:border-[#D96A86]"
                  placeholder="e.g. Shop Now"
                />
              </div>
            </div>
          </section>

          {/* Color Theme */}
          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-4 sm:px-6 py-4 border-b border-gray-100 flex items-center gap-2">
              <Palette className="w-5 h-5 text-gray-500" />
              <h2 className="text-base font-semibold text-gray-900">Color Theme</h2>
            </div>
            <div className="p-4 sm:p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Preset themes</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                  {THEME_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => applyPreset(preset)}
                      className="flex flex-col rounded-xl border-2 border-gray-200 overflow-hidden hover:border-[#D96A86] transition-colors focus:outline-none focus:ring-2 focus:ring-[#D96A86]/30"
                    >
                      <div className="flex h-10">
                        <span className="flex-1" style={{ backgroundColor: preset.primary }} />
                        <span className="flex-1" style={{ backgroundColor: preset.secondary }} />
                        <span className="flex-1" style={{ backgroundColor: preset.accent }} />
                      </div>
                      <span className="text-xs font-medium text-gray-700 py-1.5 px-2 truncate">{preset.name}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Primary Color</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Secondary Color</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Accent Color</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value)}
                      className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Button Color</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={buttonColor}
                      onChange={(e) => setButtonColor(e.target.value)}
                      className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={buttonColor}
                      onChange={(e) => setButtonColor(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm font-mono"
                    />
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Background Color</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={backgroundColor}
                      onChange={(e) => setBackgroundColor(e.target.value)}
                      className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={backgroundColor}
                      onChange={(e) => setBackgroundColor(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Homepage Layout Toggles */}
          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-4 sm:px-6 py-4 border-b border-gray-100 flex items-center gap-2">
              <Layout className="w-5 h-5 text-gray-500" />
              <h2 className="text-base font-semibold text-gray-900">Homepage Layout</h2>
            </div>
            <div className="p-4 sm:p-6">
              <div className="space-y-4">
                {[
                  { state: heroBanner, set: setHeroBanner, label: "Hero Banner" },
                  { state: featuredProducts, set: setFeaturedProducts, label: "Featured Products" },
                  { state: services, set: setServices, label: "Services" },
                  { state: testimonials, set: setTestimonials, label: "Testimonials" },
                  { state: affiliateSection, set: setAffiliateSection, label: "Affiliate Section" },
                ].map(({ state, set, label }) => (
                  <div key={label} className="flex items-center justify-between py-2">
                    <span className="text-sm font-medium text-gray-700">{label}</span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={state}
                      onClick={() => set(!state)}
                      className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border transition-colors focus:outline-none focus:ring-2 focus:ring-[#D96A86]/30 ${
                        state ? "bg-[#D96A86] border-[#D96A86]" : "bg-gray-200 border-gray-200"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition-transform ${
                          state ? "translate-x-5" : "translate-x-0.5"
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </section>

        </div>

        {/* Right column: Live preview */}
        <div className="xl:col-span-1 mt-2 xl:mt-0">
          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden lg:sticky lg:top-4">
            <div className="px-4 sm:px-6 py-4 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-900">Live Preview</h2>
            </div>
            <div
              className="p-4 sm:p-6 min-h-[260px] sm:min-h-[320px] rounded-b-2xl transition-colors"
              style={{ backgroundColor }}
            >
              <div className="space-y-4">
                {bannerPreview && (
                  <div className="overflow-hidden rounded-lg border border-gray-200 bg-gray-100">
                    <img
                      src={bannerPreview}
                      alt="Banner preview"
                      className="w-full h-24 sm:h-32 object-cover"
                    />
                  </div>
                )}
                <div className="flex items-center gap-2">
                  {logoPreview ? (
                    <img src={logoPreview} alt="" className="h-8 w-auto object-contain" />
                  ) : (
                    <div
                      className="h-8 w-20 rounded flex items-center justify-center text-white text-xs font-semibold"
                      style={{ backgroundColor: primaryColor }}
                    >
                      {brandName.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <span className="text-sm font-semibold truncate" style={{ color: primaryColor }}>
                    {brandName || "Brand"}
                  </span>
                </div>
                <div
                  className="rounded-xl p-4 border"
                  style={{ borderColor: secondaryColor, backgroundColor: secondaryColor }}
                >
                  <p className="text-sm font-medium mb-2" style={{ color: accentColor }}>
                    {bannerTitle || "Banner Title"}
                  </p>
                  <p className="text-xs opacity-80 mb-3" style={{ color: accentColor }}>
                    {bannerDescription || "Banner description."}
                  </p>
                  <button
                    type="button"
                    className="px-4 py-2 rounded-lg text-white text-xs font-medium"
                    style={{ backgroundColor: buttonColor }}
                  >
                    {bannerCta || "CTA"}
                  </button>
                </div>
                <div className="flex gap-2">
                  <div
                    className="flex-1 h-16 rounded-lg"
                    style={{ backgroundColor: primaryColor }}
                  />
                  <div
                    className="flex-1 h-16 rounded-lg"
                    style={{ backgroundColor: secondaryColor }}
                  />
                  <div
                    className="flex-1 h-16 rounded-lg"
                    style={{ backgroundColor: accentColor }}
                  />
                </div>
                <p className="text-xs text-gray-500">Primary · Secondary · Accent</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
