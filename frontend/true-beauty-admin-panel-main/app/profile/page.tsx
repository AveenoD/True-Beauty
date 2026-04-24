"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { User, Camera, Save, ArrowLeft, Eye, EyeOff, Loader2 } from "lucide-react";
import { useAdminAuth } from "@/lib/admin-auth-context";
import { api, ApiSuccess } from "@/lib/api";

export default function ProfilePage() {
  const { admin, refreshSession } = useAdminAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (admin) {
      setName(admin.name || "");
      setEmail(admin.email || "");
      setProfilePhoto(admin.profilePhoto || null);
    }
  }, [admin]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setProfilePhoto(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await api.put<ApiSuccess<unknown>>("/admins/profile", {
        name: name.trim(),
        profilePhoto: profilePhoto || undefined,
      });
      await refreshSession();
      setMessage({ type: "success", text: "Profile updated successfully." });
    } catch (err: any) {
      setMessage({ type: "error", text: err?.response?.data?.message || err?.message || "Failed to update profile." });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "New passwords do not match." });
      return;
    }
    if (newPassword.length < 8) {
      setMessage({ type: "error", text: "New password must be at least 8 characters." });
      return;
    }
    setPasswordSaving(true);
    setMessage(null);
    try {
      await api.put<ApiSuccess<unknown>>("/admins/profile/password", {
        currentPassword,
        newPassword,
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setMessage({ type: "success", text: "Password changed successfully." });
    } catch (err: any) {
      setMessage({ type: "error", text: err?.response?.data?.message || err?.message || "Failed to change password." });
    } finally {
      setPasswordSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Back to dashboard</span>
          <span className="sm:hidden">Back</span>
        </Link>
        <div className="flex-1 text-center sm:text-center">
          <h1 className="text-xl font-semibold text-gray-900">Profile</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            View and update your personal details
          </p>
        </div>
        <div className="w-[120px] hidden sm:block" />
      </div>

      {message && (
        <div className={`rounded-xl px-4 py-3 text-sm ${message.type === "success" ? "bg-emerald-50 border border-emerald-100 text-emerald-700" : "bg-red-50 border border-red-100 text-red-700"}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSaveProfile} className="space-y-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-900">Personal information</h2>
          </div>
          <div className="p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-start gap-6">
              <div className="flex flex-col items-center gap-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="relative w-24 h-24 rounded-full bg-[#fef5f7] border-2 border-gray-200 flex items-center justify-center overflow-hidden hover:border-[#D96A86] transition-colors"
                >
                  {profilePhoto ? (
                    <img
                      src={profilePhoto}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-10 h-10 text-gray-400" />
                  )}
                  <span className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[#D96A86] flex items-center justify-center">
                    <Camera className="w-4 h-4 text-white" />
                  </span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
                <span className="text-xs text-gray-500">Profile photo</span>
              </div>
              <div className="flex-1 space-y-4 min-w-0">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Full name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-[#D96A86]/30 focus:border-[#D96A86] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    readOnly
                    className="w-full px-3 py-2 rounded-xl border border-gray-100 text-sm bg-gray-50 text-gray-500 cursor-not-allowed"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#D96A86] text-white font-medium hover:bg-[#C85A76] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? "Saving..." : "Save profile"}
          </button>
        </div>
      </form>

      <form onSubmit={handleChangePassword} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Change password</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Leave blank to keep current password
          </p>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Current password
            </label>
            <div className="relative">
              <input
                type={showCurrentPassword ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 pr-10 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-[#D96A86]/30 focus:border-[#D96A86] outline-none"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword((v) => !v)}
                className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600"
                aria-label={showCurrentPassword ? "Hide password" : "Show password"}
              >
                {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              New password
            </label>
            <div className="relative">
              <input
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 pr-10 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-[#D96A86]/30 focus:border-[#D96A86] outline-none"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword((v) => !v)}
                className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600"
                aria-label={showNewPassword ? "Hide password" : "Show password"}
              >
                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Confirm new password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 pr-10 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-[#D96A86]/30 focus:border-[#D96A86] outline-none"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((v) => !v)}
                className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600"
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {newPassword && confirmPassword && newPassword !== confirmPassword && (
              <p className="text-xs text-red-600 mt-1">Passwords do not match</p>
            )}
          </div>
        </div>
        <div className="px-6 pb-6">
          <button
            type="submit"
            disabled={passwordSaving || !currentPassword || !newPassword || !confirmPassword}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#D96A86] text-white font-medium hover:bg-[#C85A76] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {passwordSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {passwordSaving ? "Changing..." : "Change password"}
          </button>
        </div>
      </form>
    </div>
  );
}
