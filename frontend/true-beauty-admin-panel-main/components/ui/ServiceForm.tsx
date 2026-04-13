"use client";

import React, { useEffect } from "react";
import type { Service } from "@/lib/services-data";
import type { ServiceFormValues } from "@/lib/services-context";

const STATUS_OPTIONS: { value: Service["status"]; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

const CATEGORY_OPTIONS = [
  "Facials",
  "Hair",
  "Nails",
  "Makeup",
  "Threading & Waxing",
  "Massage",
  "Body Care",
  "Other",
];

const TIME_OPTIONS = [
  "06:00 AM",
  "06:30 AM",
  "07:00 AM",
  "07:30 AM",
  "08:00 AM",
  "08:30 AM",
  "09:00 AM",
  "09:30 AM",
  "10:00 AM",
  "10:30 AM",
  "11:00 AM",
  "11:30 AM",
  "12:00 PM",
  "12:30 PM",
  "01:00 PM",
  "01:30 PM",
  "02:00 PM",
  "02:30 PM",
  "03:00 PM",
  "03:30 PM",
  "04:00 PM",
  "04:30 PM",
  "05:00 PM",
  "05:30 PM",
  "06:00 PM",
  "06:30 PM",
  "07:00 PM",
  "07:30 PM",
  "08:00 PM",
  "08:30 PM",
  "09:00 PM",
  "09:30 PM",
  "10:00 PM",
  "10:30 PM",
];

const WORKING_DAYS_PRESETS: { key: string; label: string; value: string }[] = [];

const DAY_SHORT_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const emptyForm: ServiceFormValues = {
  name: "",
  description: "",
  category: "",
  price: 0,
  discountPrice: 0,
  durationMinutes: 0,
  image: "",
  status: "active",
  bookingConfirmationMode: "after_24h",
  howToUseText: "",
  howToUseVideoUrl: "",
  areaBranchName: "",
  fullAddress: "",
  city: "",
  state: "",
  pincode: "",
  phoneNumber: "",
  workingHours: "",
  workingDays: "",
};

interface ServiceFormProps {
  initialValues?: Service | null;
  onSubmit: (values: ServiceFormValues) => void;
  onCancel: () => void;
}

export function ServiceForm({
  initialValues,
  onSubmit,
  onCancel,
}: ServiceFormProps) {
  const [values, setValues] = React.useState<ServiceFormValues>(emptyForm);
  const [imageFile, setImageFile] = React.useState<File | null>(null);
  const [workingDaysMode, setWorkingDaysMode] =
    React.useState<"preset" | "custom">("preset");
  const [workingDaysPresetKey, setWorkingDaysPresetKey] =
    React.useState<string>("");
  const [customWorkingDays, setCustomWorkingDays] = React.useState<string[]>(
    []
  );
  const [openingTime, setOpeningTime] = React.useState<string>("");
  const [closingTime, setClosingTime] = React.useState<string>("");

  useEffect(() => {
    if (initialValues) {
      setValues({
        name: initialValues.name,
        description: initialValues.description ?? "",
        category: initialValues.category,
        price: initialValues.price,
        discountPrice: initialValues.discountPrice ?? 0,
        durationMinutes: initialValues.durationMinutes,
        image: initialValues.image ?? "",
        status: initialValues.status,
        bookingConfirmationMode: initialValues.bookingConfirmationMode ?? "after_24h",
        howToUseText: initialValues.howToUseText ?? "",
        howToUseVideoUrl: initialValues.howToUseVideoUrl ?? "",
        areaBranchName: initialValues.areaBranchName ?? "",
        fullAddress: initialValues.fullAddress ?? "",
        city: initialValues.city ?? "",
        state: initialValues.state ?? "",
        pincode: initialValues.pincode ?? "",
        phoneNumber: initialValues.phoneNumber ?? "",
        workingHours: initialValues.workingHours ?? "",
        workingDays: initialValues.workingDays ?? "",
      });

      const wd = initialValues.workingDays ?? "";
      if (wd) {
        const preset = WORKING_DAYS_PRESETS.find((p) => p.value === wd);
        if (preset) {
          setWorkingDaysMode("preset");
          setWorkingDaysPresetKey(preset.key);
          setCustomWorkingDays([]);
        } else {
          setWorkingDaysMode("custom");
          setWorkingDaysPresetKey("custom");
          const tokens = wd.split(/[, ]+/).filter(Boolean);
          const days = DAY_SHORT_LABELS.filter((d) => tokens.includes(d));
          setCustomWorkingDays(days);
        }
      } else {
        setWorkingDaysMode("preset");
        setWorkingDaysPresetKey("");
        setCustomWorkingDays([]);
      }

      const wh = initialValues.workingHours ?? "";
      if (wh && wh.includes("-")) {
        const [from, to] = wh.split("-").map((part) => part.trim());
        setOpeningTime(from);
        setClosingTime(to);
      } else {
        setOpeningTime("");
        setClosingTime("");
      }
      setImageFile(null);
    } else {
      setValues(emptyForm);
      setWorkingDaysMode("preset");
      setWorkingDaysPresetKey("");
      setCustomWorkingDays([]);
      setOpeningTime("");
      setClosingTime("");
      setImageFile(null);
    }
  }, [initialValues]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!values.name.trim()) return;

    let imageValue = values.image?.trim() ?? "";
    if (imageFile) {
      imageValue = URL.createObjectURL(imageFile);
    }

    const trimmedHowToUseText = values.howToUseText?.trim() ?? "";
    const trimmedHowToUseVideoUrl = values.howToUseVideoUrl?.trim() ?? "";

    onSubmit({
      ...values,
      name: values.name.trim(),
      description: values.description?.trim() ?? "",
      category: values.category.trim() || "Other",
      price: values.price || 0,
      durationMinutes: Math.max(0, values.durationMinutes ?? 0),
      image: imageValue,
      bookingConfirmationMode: values.bookingConfirmationMode ?? "after_24h",
      howToUseType:
        trimmedHowToUseText && !trimmedHowToUseVideoUrl
          ? "text"
          : trimmedHowToUseVideoUrl && !trimmedHowToUseText
            ? "video"
            : undefined,
      howToUseText: trimmedHowToUseText,
      howToUseVideoUrl: trimmedHowToUseVideoUrl,
      areaBranchName: values.areaBranchName?.trim() ?? "",
      fullAddress: values.fullAddress?.trim() ?? "",
      city: values.city?.trim() ?? "",
      state: values.state?.trim() ?? "",
      pincode: values.pincode?.trim() ?? "",
      phoneNumber: values.phoneNumber?.trim() ?? "",
      workingHours:
        openingTime && closingTime
          ? `${openingTime} - ${closingTime}`
          : values.workingHours?.trim() ?? "",
      workingDays: values.workingDays?.trim() ?? "",
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="service-name" className="block text-sm font-medium text-gray-700 mb-1">
          Service Name <span className="text-red-500">*</span>
        </label>
        <input
          id="service-name"
          type="text"
          required
          value={values.name}
          onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#f8c6d0] focus:border-transparent outline-none transition-all"
          placeholder="e.g. Classic Facial"
        />
      </div>
      <div>
        <label htmlFor="service-category" className="block text-sm font-medium text-gray-700 mb-1">
          Category <span className="text-red-500">*</span>
        </label>
        <select
          id="service-category"
          required
          value={values.category}
          onChange={(e) => setValues((v) => ({ ...v, category: e.target.value }))}
          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#f8c6d0] focus:border-transparent outline-none transition-all bg-white"
        >
          <option value="">Select category</option>
          {CATEGORY_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="service-image-file" className="block text-sm font-medium text-gray-700 mb-1">
          Service Image 
        </label>
        <input
          id="service-image-file"
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0] ?? null;
            setImageFile(file);
          }}
          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#f8c6d0] focus:border-transparent outline-none transition-all bg-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-[#fef5f7] file:text-[#D96A86] hover:file:bg-[#f8e0e6]"
        />
        <p className="mt-1 text-xs text-gray-500">
          Upload an image from your device. This will be used inside the admin panel.
        </p>
      </div>
      <div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="service-price" className="block text-sm font-medium text-gray-700 mb-1">
            Price (₹) <span className="text-red-500">*</span>
          </label>
          <input
            id="service-price"
            type="number"
            min={0}
            step={1}
            required
            value={values.price === 0 ? "" : values.price}
            onChange={(e) => setValues((v) => ({ ...v, price: Number(e.target.value) || 0 }))}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#f8c6d0] focus:border-transparent outline-none transition-all"
          />
        </div>
        <div>
          <label
            htmlFor="service-discount-price"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Discount Price (₹)
          </label>
          <input
            id="service-discount-price"
            type="number"
            min={0}
            step={1}
            value={values.discountPrice && values.discountPrice > 0 ? values.discountPrice : ""}
            onChange={(e) =>
              setValues((v) => ({
                ...v,
                discountPrice: Number(e.target.value) || 0,
              }))
            }
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#f8c6d0] focus:border-transparent outline-none transition-all"
            placeholder="Optional"
          />
        </div>
        </div>
      </div>
      <div>
        <label htmlFor="service-description" className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          id="service-description"
          rows={3}
          value={values.description ?? ""}
          onChange={(e) => setValues((v) => ({ ...v, description: e.target.value }))}
          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#f8c6d0] focus:border-transparent outline-none transition-all resize-none"
          placeholder="Brief description of the service..."
        />
      </div>
      <div className="pt-4 border-t border-gray-200">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">
          Schedule
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="service-duration" className="block text-sm font-medium text-gray-700 mb-1">
              Duration (min) <span className="text-red-500">*</span>
            </label>
            <input
              id="service-duration"
              type="number"
              min={0}
              step={5}
              required
              value={values.durationMinutes === 0 ? "" : values.durationMinutes}
              onChange={(e) =>
                setValues((v) => ({
                  ...v,
                  durationMinutes: Math.max(0, Math.floor(Number(e.target.value) || 0)),
                }))
              }
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#f8c6d0] focus:border-transparent outline-none transition-all"
            />
          </div>
        </div>
        <div className="mt-4">
          <p className="block text-sm font-medium text-gray-700 mb-2">
            Booking confirmation
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <label className="inline-flex items-center gap-2 text-sm text-gray-700">
              <input
                type="radio"
                name="bookingConfirmationMode"
                value="after_24h"
                checked={values.bookingConfirmationMode === "after_24h"}
                onChange={() =>
                  setValues((v) => ({
                    ...v,
                    bookingConfirmationMode: "after_24h",
                  }))
                }
                className="h-4 w-4 text-[#D96A86] border-gray-300 focus:ring-[#f8c6d0]"
              />
              <span>Confirm after 24 hours</span>
            </label>
            <label className="inline-flex items-center gap-2 text-sm text-gray-700">
              <input
                type="radio"
                name="bookingConfirmationMode"
                value="instant"
                checked={values.bookingConfirmationMode === "instant"}
                onChange={() =>
                  setValues((v) => ({
                    ...v,
                    bookingConfirmationMode: "instant",
                  }))
                }
                className="h-4 w-4 text-[#D96A86] border-gray-300 focus:ring-[#f8c6d0]"
              />
              <span>Confirm instantly</span>
            </label>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            If you choose &quot;Confirm after 24 hours&quot;, any new booking for this service will
            only be marked as confirmed after 24 hours.
          </p>
        </div>
      </div>
      <div className="pt-4 border-t border-gray-200">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">
          How to use
        </h3>
        <div className="space-y-4">
          <div>
            <label
              htmlFor="service-how-to-use-text"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Instructions (text)
            </label>
            <textarea
              id="service-how-to-use-text"
              rows={3}
              value={values.howToUseText ?? ""}
              onChange={(e) =>
                setValues((v) => ({ ...v, howToUseText: e.target.value }))
              }
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#f8c6d0] focus:border-transparent outline-none transition-all resize-none"
              placeholder="Step-by-step usage instructions..."
            />
          </div>

          <div>
            <label
              htmlFor="service-how-to-use-video-url"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Video URL
            </label>
            <input
              id="service-how-to-use-video-url"
              type="url"
              value={values.howToUseVideoUrl ?? ""}
              onChange={(e) =>
                setValues((v) => ({
                  ...v,
                  howToUseVideoUrl: e.target.value,
                }))
              }
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#f8c6d0] focus:border-transparent outline-none transition-all"
              placeholder="Paste YouTube, Instagram, or other video link"
            />
            <p className="mt-1 text-xs text-gray-500">
              You can fill text, video URL, or both. Any video URL is allowed,
              including social media links.
            </p>
          </div>
        </div>
      </div>
      <div>
        <label htmlFor="service-status" className="block text-sm font-medium text-gray-700 mb-1">
          Status
        </label>
        <select
          id="service-status"
          value={values.status}
          onChange={(e) =>
            setValues((v) => ({ ...v, status: e.target.value as Service["status"] }))
          }
          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#f8c6d0] focus:border-transparent outline-none transition-all bg-white"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Location & Contact Section */}
      <div className="pt-4 border-t border-gray-200">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Location & Contact</h3>
        <div className="space-y-4">
          <div>
            <label htmlFor="service-area-branch" className="block text-sm font-medium text-gray-700 mb-1">
              Area / Branch Name
            </label>
            <input
              id="service-area-branch"
              type="text"
              value={values.areaBranchName ?? ""}
              onChange={(e) => setValues((v) => ({ ...v, areaBranchName: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#f8c6d0] focus:border-transparent outline-none transition-all"
              placeholder="e.g. MG Road Branch"
            />
          </div>
          <div>
            <label htmlFor="service-full-address" className="block text-sm font-medium text-gray-700 mb-1">
              Full Address
            </label>
            <textarea
              id="service-full-address"
              rows={2}
              value={values.fullAddress ?? ""}
              onChange={(e) => setValues((v) => ({ ...v, fullAddress: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#f8c6d0] focus:border-transparent outline-none transition-all resize-none"
              placeholder="Street, landmark, building"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="service-city" className="block text-sm font-medium text-gray-700 mb-1">
                City
              </label>
              <input
                id="service-city"
                type="text"
                value={values.city ?? ""}
                onChange={(e) => setValues((v) => ({ ...v, city: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#f8c6d0] focus:border-transparent outline-none transition-all"
                placeholder="e.g. Bangalore"
              />
            </div>
            <div>
              <label htmlFor="service-state" className="block text-sm font-medium text-gray-700 mb-1">
                State
              </label>
              <input
                id="service-state"
                type="text"
                value={values.state ?? ""}
                onChange={(e) => setValues((v) => ({ ...v, state: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#f8c6d0] focus:border-transparent outline-none transition-all"
                placeholder="e.g. Karnataka"
              />
            </div>
          </div>
          <div>
            <label htmlFor="service-pincode" className="block text-sm font-medium text-gray-700 mb-1">
              Pincode
            </label>
            <input
              id="service-pincode"
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={values.pincode ?? ""}
              onChange={(e) => setValues((v) => ({ ...v, pincode: e.target.value.replace(/\D/g, "").slice(0, 6) }))}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#f8c6d0] focus:border-transparent outline-none transition-all"
              placeholder="e.g. 560001"
            />
          </div>
          <div>
            <label htmlFor="service-phone" className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number
            </label>
            <input
              id="service-phone"
              type="tel"
              value={values.phoneNumber ?? ""}
              onChange={(e) => setValues((v) => ({ ...v, phoneNumber: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#f8c6d0] focus:border-transparent outline-none transition-all"
              placeholder="e.g. +91 98765 43210"
            />
          </div>
          <div>
            <label htmlFor="service-working-hours-from" className="block text-sm font-medium text-gray-700 mb-1">
              Working Hours
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">From</p>
                <select
                  id="service-working-hours-from"
                  value={openingTime}
                  onChange={(e) => {
                    const from = e.target.value;
                    setOpeningTime(from);
                    setValues((v) => ({
                      ...v,
                      workingHours:
                        from && closingTime ? `${from} - ${closingTime}` : "",
                    }));
                  }}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-[#f8c6d0] focus:border-transparent outline-none transition-all text-sm"
                >
                  <option value="">Opening time</option>
                  {TIME_OPTIONS.map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">To</p>
                <select
                  id="service-working-hours-to"
                  value={closingTime}
                  onChange={(e) => {
                    const to = e.target.value;
                    setClosingTime(to);
                    setValues((v) => ({
                      ...v,
                      workingHours:
                        openingTime && to ? `${openingTime} - ${to}` : "",
                    }));
                  }}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-[#f8c6d0] focus:border-transparent outline-none transition-all text-sm"
                >
                  <option value="">Closing time</option>
                  {TIME_OPTIONS.map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {values.workingHours && (
              <p className="mt-1 text-xs text-gray-500">
                Selected:{" "}
                <span className="font-medium text-gray-700">
                  {values.workingHours}
                </span>
              </p>
            )}
          </div>
          <div>
            <label htmlFor="service-working-days" className="block text-sm font-medium text-gray-700 mb-1">
              Working Days
            </label>
        <div className="space-y-2">
          <select
            id="service-working-days"
            value={workingDaysMode === "custom" ? "custom" : ""}
            onChange={(e) => {
              const key = e.target.value;
              if (key === "custom") {
                setWorkingDaysMode("custom");
                setWorkingDaysPresetKey("custom");
                setValues((v) => ({
                  ...v,
                  workingDays: customWorkingDays.join(", "),
                }));
              }
            }}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-[#f8c6d0] focus:border-transparent outline-none transition-all"
          >
            <option value="" disabled hidden>
              Select working days
            </option>
            <option value="custom">Custom Day Range</option>
          </select>

          {workingDaysMode === "preset" && values.workingDays && (
            <p className="text-xs text-gray-500">
              Selected:{" "}
              <span className="font-medium text-gray-700">
                {values.workingDays}
              </span>
            </p>
          )}

          {workingDaysMode === "custom" && (
            <div className="space-y-1.5">
              <div className="flex flex-wrap gap-1.5">
                {DAY_SHORT_LABELS.map((day) => {
                  const active = customWorkingDays.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() =>
                        setCustomWorkingDays((prev) => {
                          const exists = prev.includes(day);
                          const next = exists
                            ? prev.filter((d) => d !== day)
                            : [...prev, day];
                          next.sort(
                            (a, b) =>
                              DAY_SHORT_LABELS.indexOf(a) -
                              DAY_SHORT_LABELS.indexOf(b)
                          );
                          setValues((v) => ({
                            ...v,
                            workingDays: next.join(", "),
                          }));
                          return next;
                        })
                      }
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                        active
                          ? "bg-[#D96A86] text-white border-transparent"
                          : "bg-white text-gray-700 border-gray-200 hover:bg-[#fef5f7]"
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-gray-500">
                {customWorkingDays.length
                  ? `Selected: ${customWorkingDays.join(", ")}`
                  : "Select one or more days."}
              </p>
            </div>
          )}
        </div>
          </div>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2.5 rounded-xl font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="flex-1 px-4 py-2.5 rounded-xl font-medium text-white bg-[#D96A86] hover:bg-[#C85A76] transition-colors"
        >
          {initialValues ? "Update Service" : "Add Service"}
        </button>
      </div>
    </form>
  );
}
