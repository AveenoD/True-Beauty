"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import Link from "next/link";
import {
  Check,
  Eye,
  EyeOff,
  Save,
  Plus,
  Edit,
  Trash2,
  Mail,
  Shield,
  Bell,
  CheckCircle,
  XCircle,
  Clock,
  Upload,
  FileText,
  User,
  MapPin,
  ArrowLeft,
} from "lucide-react";
import { AxiosError } from "axios";
import { api, ApiSuccess } from "../../lib/api";
import { useAuth, AuthUser } from "../../lib/auth-context";

type Step = "personal" | "address" | "complete";

type Address = {
  id: string;
  name: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
};

export default function ProfileClient() {
  const router = useRouter();
  const { user: authUser, isReady, isLoggedIn, logout, setUserFromProfile } =
    useAuth();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    dateOfBirth: "",
    gender: "",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [emailVerification, setEmailVerification] = useState({
    show: false,
    newEmail: "",
    code: "",
  });
  const [kycStatus, setKycStatus] = useState<
    "pending" | "verified" | "rejected" | "not-submitted"
  >("not-submitted");
  const [isUploading, setIsUploading] = useState(false);
  const [documents, setDocuments] = useState({
    aadhar: null as { name: string; uploadedAt: string } | null,
    pan: null as { name: string; uploadedAt: string } | null,
  });

  const [stepperStep, setStepperStep] = useState<Step>("personal");
  const [completedSteps, setCompletedSteps] = useState<Step[]>([]);

  const loadAddresses = useCallback(async () => {
    setLoadingAddresses(true);
    try {
      const { data } = await api.get<ApiSuccess<Address[]>>("/users/addresses");
      setAddresses(data.data || []);
    } catch {
      setAddresses([]);
    } finally {
      setLoadingAddresses(false);
    }
  }, []);

  useEffect(() => {
    if (!authUser) return;
    setFormData({
      name: authUser.name || "",
      email: authUser.email || "",
      dateOfBirth: "",
      gender: "",
    });
  }, [authUser]);

  useEffect(() => {
    if (isLoggedIn && isReady) {
      loadAddresses();
    }
  }, [isLoggedIn, isReady, loadAddresses]);

  const isFirstTime = !loadingAddresses && addresses.length === 0;

  useEffect(() => {
    if (kycStatus === "pending") {
      const timer = setTimeout(() => {
        setKycStatus("verified");
      }, process.env.NODE_ENV === "development" ? 30000 : 300000);
      return () => clearTimeout(timer);
    }
  }, [kycStatus]);

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  const [showChangePassword, setShowChangePassword] = useState(false);
  const [changePasswordLoading, setChangePasswordLoading] = useState(false);
  const [changePasswordError, setChangePasswordError] = useState("");
  const [changePasswordForm, setChangePasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });
  const [showPw, setShowPw] = useState({
    current: false,
    next: false,
    confirm: false,
  });
  const [deleteLoading, setDeleteLoading] = useState(false);

  const validatePersonal = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (
      formData.email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)
    )
      newErrors.email = "Please enter a valid email address";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const submitChangePassword = async () => {
    setChangePasswordError("");
    if (!changePasswordForm.currentPassword || !changePasswordForm.newPassword) {
      setChangePasswordError("Please fill all password fields");
      return;
    }
    if (changePasswordForm.newPassword !== changePasswordForm.confirmNewPassword) {
      setChangePasswordError("New passwords do not match");
      return;
    }
    setChangePasswordLoading(true);
    try {
      await api.post("/users/change-password", {
        currentPassword: changePasswordForm.currentPassword,
        newPassword: changePasswordForm.newPassword,
      });
      setShowChangePassword(false);
      setChangePasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmNewPassword: "",
      });
      alert("Password changed. Please log in again.");
      await handleLogout();
    } catch (err) {
      const ax = err as AxiosError<{ message?: string }>;
      setChangePasswordError(
        ax.response?.data?.message ||
          (err instanceof Error ? err.message : "Could not change password")
      );
    } finally {
      setChangePasswordLoading(false);
    }
  };

  const submitDeleteAccount = async () => {
    if (!confirm("Are you sure? This will delete your account.")) return;
    setDeleteLoading(true);
    try {
      await api.delete("/users/delete-account");
      await handleLogout();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Could not delete account");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleSavePersonal = async () => {
    if (!validatePersonal()) return;
    setIsSaving(true);
    try {
      const { data } = await api.put<ApiSuccess<AuthUser>>("/users/profile", {
        name: formData.name.trim(),
        phone: authUser?.phone || undefined,
      });
      setUserFromProfile(data.data);
      setIsSaving(false);
      setIsEditing(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      setCompletedSteps(["personal"]);
      setStepperStep("address");
    } catch (err) {
      const ax = err as AxiosError<{ message?: string }>;
      setErrors({
        _form:
          ax.response?.data?.message ||
          (err instanceof Error ? err.message : "Update failed"),
      });
      setIsSaving(false);
    }
  };

  const handleFileUpload = async (type: "aadhar" | "pan", file: File) => {
    setIsUploading(true);
    await new Promise((r) => setTimeout(r, 1500));
    const newDocuments = {
      ...documents,
      [type]: { name: file.name, uploadedAt: new Date().toISOString() },
    };
    setDocuments(newDocuments);
    const newStatus =
      newDocuments.aadhar && newDocuments.pan && kycStatus === "not-submitted"
        ? "pending"
        : kycStatus;
    if (newDocuments.aadhar && newDocuments.pan && kycStatus === "not-submitted")
      setKycStatus("pending");
    setIsUploading(false);
  };

  const getStatusIcon = () => {
    switch (kycStatus) {
      case "verified":
        return <CheckCircle className="w-6 h-6 text-green-600" />;
      case "rejected":
        return <XCircle className="w-6 h-6 text-red-600" />;
      case "pending":
        return <Clock className="w-6 h-6 text-yellow-600" />;
      default:
        return <FileText className="w-6 h-6 text-gray-400" />;
    }
  };
  const getStatusText = () => {
    switch (kycStatus) {
      case "verified":
        return "Verified";
      case "rejected":
        return "Rejected";
      case "pending":
        return "Under Review";
      default:
        return "Not Submitted";
    }
  };
  const getStatusColor = () => {
    switch (kycStatus) {
      case "verified":
        return "bg-green-50 border-green-200 text-green-700";
      case "rejected":
        return "bg-red-50 border-red-200 text-red-700";
      case "pending":
        return "bg-yellow-50 border-yellow-200 text-yellow-700";
      default:
        return "bg-gray-50 border-gray-200 text-gray-700";
    }
  };

  const handleAddressComplete = async (addr: Address) => {
    try {
      const { data } = await api.post<ApiSuccess<Address>>("/users/addresses", {
        name: addr.name,
        phone: addr.phone,
        addressLine1: addr.addressLine1,
        addressLine2: addr.addressLine2 || undefined,
        city: addr.city,
        state: addr.state,
        pincode: addr.pincode,
        isDefault: true,
      });
      setAddresses([data.data]);
      setCompletedSteps(["personal", "address"]);
      setStepperStep("complete");
    } catch (err) {
      const ax = err as AxiosError<{ message?: string }>;
      alert(ax.response?.data?.message || "Could not save address");
    }
  };

  const handleAddressSave = async (addr: Address) => {
    try {
      if (editingAddress?.id) {
        const { data } = await api.put<ApiSuccess<Address>>(
          `/users/addresses/${editingAddress.id}`,
          {
            name: addr.name,
            phone: addr.phone,
            addressLine1: addr.addressLine1,
            addressLine2: addr.addressLine2 || undefined,
            city: addr.city,
            state: addr.state,
            pincode: addr.pincode,
            isDefault: addr.isDefault,
          }
        );
        setAddresses((prev) =>
          prev.map((a) => (a.id === editingAddress.id ? data.data : a))
        );
      } else {
        const { data } = await api.post<ApiSuccess<Address>>("/users/addresses", {
          name: addr.name,
          phone: addr.phone,
          addressLine1: addr.addressLine1,
          addressLine2: addr.addressLine2 || undefined,
          city: addr.city,
          state: addr.state,
          pincode: addr.pincode,
          isDefault: addr.isDefault,
        });
        setAddresses((prev) => [...prev, data.data]);
      }
      setShowAddressForm(false);
      setEditingAddress(null);
    } catch (err) {
      const ax = err as AxiosError<{ message?: string }>;
      alert(ax.response?.data?.message || "Could not save address");
    }
  };

  const handleAddressDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this address?")) return;
    setDeletingId(id);
    try {
      await api.delete(`/users/addresses/${id}`);
      setAddresses((prev) => prev.filter((a) => a.id !== id));
    } catch {
      alert("Could not delete address");
    } finally {
      setDeletingId(null);
    }
  };

  const handleSetDefault = async (id: string | undefined) => {
    if (!id) return;
    try {
      await api.put<ApiSuccess<Address>>(`/users/addresses/${id}`, {
        isDefault: true,
      });
      setAddresses((prev) =>
        prev.map((a) => ({
          ...a,
          isDefault: a.id === id,
        }))
      );
    } catch {
      alert("Could not update default address");
    }
  };

  const user = authUser;

  if (!isReady) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <p className="text-gray-500">Loading…</p>
      </div>
    );
  }

  if (!isLoggedIn || !user) {
    return (
      <div className="min-h-screen gradient-bg flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center pt-24 pb-12 px-4">
          <div className="text-center space-y-4">
            <p className="text-gray-600">Please login to view your profile</p>
            <Link
              href="/login"
              className="text-rose-600 font-medium hover:underline"
            >
              Go to login
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-bg flex flex-col">
      <Header />
      <main className="flex-1 pt-20 sm:pt-24 pb-8 sm:pb-12 px-3 sm:px-4 md:px-8">
        <div className="container mx-auto max-w-6xl">
          <div className="md:hidden mb-4">
            <Link
              href="/"
              className="inline-flex items-center p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
          </div>
          <div className="hidden lg:block mb-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">
                Back to home
              </span>
            </Link>
          </div>
          {isFirstTime && !loadingAddresses ? (
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-rose-100/80 p-4 sm:p-6 md:p-8 mb-4 sm:mb-6">
              <div className="mb-6 sm:mb-8">
                <h2 className="text-xl sm:text-2xl md:text-3xl font-playfair font-bold text-gray-800 mb-2">
                  Complete Your Profile
                </h2>
                <p className="text-sm sm:text-base text-gray-600">
                  Add your details and primary address to continue
                </p>
              </div>
              <div className="flex items-center justify-between mb-6 sm:mb-8 overflow-x-auto pb-2">
                {[
                  { id: "personal", label: "Personal Information" },
                  { id: "address", label: "Primary Address" },
                  { id: "complete", label: "Complete" },
                ].map((step, index) => {
                  const isCompleted = completedSteps.includes(step.id as Step);
                  const isCurrent = stepperStep === step.id;
                  return (
                    <div
                      key={step.id}
                      className="flex items-center flex-1 min-w-[80px] sm:min-w-0"
                    >
                      <div className="flex flex-col items-center flex-1">
                        <div
                          className={`w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center border-2 transition-all ${
                            isCompleted
                              ? "bg-green-500 border-green-500 text-white"
                              : isCurrent
                                ? "bg-rose-500 border-rose-500 text-white"
                                : "bg-white border-gray-300 text-gray-400"
                          }`}
                        >
                          {isCompleted ? (
                            <Check className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
                          ) : (
                            <span className="font-semibold text-xs sm:text-sm md:text-base">
                              {index + 1}
                            </span>
                          )}
                        </div>
                        <p
                          className={`mt-1 sm:mt-2 text-[10px] sm:text-xs md:text-sm text-center font-medium ${
                            isCurrent
                              ? "text-rose-600"
                              : isCompleted
                                ? "text-green-600"
                                : "text-gray-400"
                          }`}
                        >
                          {step.label}
                        </p>
                      </div>
                      {index < 2 && (
                        <div
                          className={`flex-1 h-0.5 mx-1 sm:mx-2 ${
                            isCompleted ? "bg-green-500" : "bg-gray-300"
                          }`}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="mt-8">
                {stepperStep === "personal" && (
                  <PersonalInfoInline
                    user={user}
                    formData={formData}
                    setFormData={setFormData}
                    isEditing={isEditing}
                    setIsEditing={setIsEditing}
                    isSaving={isSaving}
                    success={success}
                    errors={errors}
                    setErrors={setErrors}
                    emailVerification={emailVerification}
                    setEmailVerification={setEmailVerification}
                    handleSave={handleSavePersonal}
                    validate={validatePersonal}
                  />
                )}
                {stepperStep === "address" && (
                  <AddressFormInline
                    address={null}
                    onSave={(addr) => handleAddressComplete(addr)}
                    onCancel={() => {}}
                  />
                )}
                {stepperStep === "complete" && (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Check className="w-10 h-10 text-green-600" />
                    </div>
                    <h3 className="text-2xl font-playfair font-bold text-gray-800 mb-2">
                      Profile Complete!
                    </h3>
                    <p className="text-gray-600">
                      You can now proceed with checkout
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <>
              <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-rose-100/80 p-4 sm:p-6 md:p-8">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center flex-shrink-0">
                    <User className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-playfair font-bold text-gray-800 mb-1 sm:mb-2 truncate">
                      {user.name || "User Profile"}
                    </h1>
                    {user.email && (
                      <p className="text-sm sm:text-base text-gray-600 break-words">
                        <span className="font-medium">Email:</span> {user.email}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mt-4 sm:mt-6">
                <div className="lg:col-span-2 space-y-6">
                  <PersonalInfoInline
                    user={user}
                    formData={formData}
                    setFormData={setFormData}
                    isEditing={isEditing}
                    setIsEditing={setIsEditing}
                    isSaving={isSaving}
                    success={success}
                    errors={errors}
                    setErrors={setErrors}
                    emailVerification={emailVerification}
                    setEmailVerification={setEmailVerification}
                    handleSave={handleSavePersonal}
                    validate={validatePersonal}
                  />
                  <KYCSectionInline
                    kycStatus={kycStatus}
                    getStatusIcon={getStatusIcon}
                    getStatusText={getStatusText}
                    getStatusColor={getStatusColor}
                    documents={documents}
                    handleFileUpload={handleFileUpload}
                    isUploading={isUploading}
                  />
                </div>
                <div className="lg:col-span-1">
                  <div className="space-y-4 sm:space-y-6 flex flex-col">
                    <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-rose-100/80 p-4 sm:p-6 md:p-8">
                      <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                        <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-rose-500" />
                        <h2 className="text-lg sm:text-xl md:text-2xl font-playfair font-bold text-gray-800">
                          Security
                        </h2>
                      </div>
                      <div className="space-y-4">
                        <div className="p-4 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-600 mb-2">Session</p>
                          <button
                            type="button"
                            onClick={handleLogout}
                            className="text-sm text-rose-600 hover:text-rose-700 font-medium"
                          >
                            Log out
                          </button>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-600 mb-2">Password</p>
                          <button
                            type="button"
                            onClick={() => {
                              setChangePasswordError("");
                              setShowChangePassword(true);
                            }}
                            className="text-sm text-rose-600 hover:text-rose-700 font-medium"
                          >
                            Change password
                          </button>
                        </div>
                        <div className="p-4 bg-red-50 rounded-lg border border-red-100">
                          <p className="text-sm text-red-700 mb-2 font-medium">Danger zone</p>
                          <button
                            type="button"
                            onClick={submitDeleteAccount}
                            disabled={deleteLoading}
                            className="text-sm text-red-700 hover:text-red-800 font-medium disabled:opacity-60"
                          >
                            {deleteLoading ? "Deleting..." : "Delete account"}
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-rose-100/80 p-4 sm:p-6 md:p-8">
                      <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                        <Bell className="w-5 h-5 sm:w-6 sm:h-6 text-rose-500" />
                        <h2 className="text-lg sm:text-xl md:text-2xl font-playfair font-bold text-gray-800">
                          Preferences
                        </h2>
                      </div>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div>
                            <p className="text-sm font-medium text-gray-800">
                              Email Notifications
                            </p>
                            <p className="text-xs text-gray-600">
                              Receive updates via email
                            </p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              className="sr-only peer"
                              defaultChecked
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-rose-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-500"></div>
                          </label>
                        </div>
                      </div>
                    </div>
                    {showAddressForm ? (
                      <AddressFormInline
                        address={editingAddress}
                        onSave={handleAddressSave}
                        onCancel={() => {
                          setShowAddressForm(false);
                          setEditingAddress(null);
                        }}
                      />
                    ) : (
                      <div
                        id="addresses"
                        className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-rose-100/80 p-4 sm:p-6 md:p-8"
                      >
                        <div className="flex flex-row items-center justify-between gap-3 mb-4 sm:mb-6">
                          <div className="min-w-0 flex-1">
                            <h2 className="text-lg sm:text-xl md:text-2xl font-playfair font-bold text-gray-800 mb-0.5 sm:mb-1">
                              Saved Addresses
                            </h2>
                            <p className="text-xs sm:text-sm text-gray-600">
                              {addresses.length} of 5 addresses saved
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingAddress(null);
                              setShowAddressForm(true);
                            }}
                            disabled={addresses.length >= 5}
                            className="flex-shrink-0 flex items-center justify-center gap-2 px-3 sm:px-4 py-2 text-sm sm:text-base bg-gradient-to-r from-[#FF3C8C] to-[#FF0066] text-white rounded-lg font-medium hover:opacity-95 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                          >
                            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                            Add
                          </button>
                        </div>
                        {addresses.length === 0 ? (
                          <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                            <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-600 mb-2">
                              No addresses saved yet
                            </p>
                            <button
                              type="button"
                              onClick={() => setShowAddressForm(true)}
                              className="px-4 py-2 bg-gradient-to-r from-[#FF3C8C] to-[#FF0066] text-white rounded-lg hover:opacity-95 transition-colors"
                            >
                              Add
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-3 sm:space-y-4">
                            {addresses.map((addr, index) => (
                              <div
                                key={addr.id ?? `address-${index}`}
                                className={`border rounded-lg p-3 sm:p-4 transition-all ${
                                  addr.isDefault
                                    ? "border-rose-400 bg-rose-50"
                                    : "border-gray-200 hover:border-gray-300"
                                } ${deletingId === addr.id ? "opacity-50" : ""}`}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1.5 sm:mb-2 flex-wrap">
                                      <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-rose-500 flex-shrink-0" />
                                      <h3 className="font-semibold text-sm sm:text-base text-gray-800 truncate">
                                        {addr.name}
                                      </h3>
                                      {addr.isDefault && (
                                        <span className="px-1.5 sm:px-2 py-0.5 bg-rose-500 text-white text-[10px] sm:text-xs font-medium rounded flex-shrink-0">
                                          Default
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-xs sm:text-sm text-gray-600 mb-1 break-words">
                                      {addr.phone}
                                    </p>
                                    <p className="text-xs sm:text-sm text-gray-700 mb-1 break-words">
                                      {addr.addressLine1}
                                      {addr.addressLine2 && `, ${addr.addressLine2}`}
                                    </p>
                                    <p className="text-xs sm:text-sm text-gray-700 break-words">
                                      {addr.city}, {addr.state} - {addr.pincode}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-1 sm:gap-2 ml-2 sm:ml-4 flex-shrink-0">
                                    {!addr.isDefault && addr.id && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          addr.id && handleSetDefault(addr.id)
                                        }
                                        className="p-1.5 sm:p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                        title="Set as default"
                                      >
                                        <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingAddress(addr);
                                        setShowAddressForm(true);
                                      }}
                                      className="p-1.5 sm:p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                      title="Edit address"
                                    >
                                      <Edit className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        addr.id && handleAddressDelete(addr.id)
                                      }
                                      disabled={deletingId === addr.id}
                                      className="p-1.5 sm:p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                      title="Delete address"
                                    >
                                      <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />

      {showChangePassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 border border-rose-100/80 shadow-lg">
            <h3 className="text-xl font-playfair font-bold text-gray-800 mb-2">
              Change password
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              For security, you will be logged out after changing your password.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current password
                </label>
                <div className="relative">
                  <input
                    type={showPw.current ? "text" : "password"}
                    value={changePasswordForm.currentPassword}
                    onChange={(e) =>
                      setChangePasswordForm((p) => ({
                        ...p,
                        currentPassword: e.target.value,
                      }))
                    }
                    className="w-full pr-12 px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((s) => ({ ...s, current: !s.current }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    aria-label={showPw.current ? "Hide password" : "Show password"}
                  >
                    {showPw.current ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New password
                </label>
                <div className="relative">
                  <input
                    type={showPw.next ? "text" : "password"}
                    value={changePasswordForm.newPassword}
                    onChange={(e) =>
                      setChangePasswordForm((p) => ({
                        ...p,
                        newPassword: e.target.value,
                      }))
                    }
                    className="w-full pr-12 px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((s) => ({ ...s, next: !s.next }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    aria-label={showPw.next ? "Hide password" : "Show password"}
                  >
                    {showPw.next ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm new password
                </label>
                <div className="relative">
                  <input
                    type={showPw.confirm ? "text" : "password"}
                    value={changePasswordForm.confirmNewPassword}
                    onChange={(e) =>
                      setChangePasswordForm((p) => ({
                        ...p,
                        confirmNewPassword: e.target.value,
                      }))
                    }
                    className="w-full pr-12 px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((s) => ({ ...s, confirm: !s.confirm }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    aria-label={showPw.confirm ? "Hide password" : "Show password"}
                  >
                    {showPw.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>

            {changePasswordError && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {changePasswordError}
              </div>
            )}

            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => setShowChangePassword(false)}
                className="flex-1 px-4 py-3 rounded-lg bg-gray-200 text-gray-800 font-medium hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitChangePassword}
                disabled={changePasswordLoading}
                className="flex-1 px-4 py-3 rounded-lg bg-gradient-to-r from-[#FF3C8C] to-[#FF0066] text-white font-medium disabled:opacity-70"
              >
                {changePasswordLoading ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PersonalInfoInline(props: any) {
  const {
    user,
    formData,
    setFormData,
    isEditing,
    setIsEditing,
    isSaving,
    success,
    errors,
    setErrors,
    emailVerification,
    setEmailVerification,
    handleSave,
  } = props;
  return (
    <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-rose-100/80 p-4 sm:p-6 md:p-8">
      <div className="flex items-center justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
        <div className="flex-1 min-w-0">
          <h2 className="text-lg sm:text-xl md:text-2xl font-playfair font-bold text-gray-800 mb-1">
            Personal Information
          </h2>
          <p className="text-xs sm:text-sm text-gray-600">
            Manage your personal details
          </p>
        </div>
        {!isEditing && (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-rose-600 hover:text-rose-700 transition-colors flex-shrink-0"
          >
            Edit
          </button>
        )}
      </div>
      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
          <Check className="w-5 h-5 text-green-600" />
          <p className="text-sm text-green-700">Profile updated successfully!</p>
        </div>
      )}
      {errors._form && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          {errors._form}
        </div>
      )}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Full Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => {
              setFormData({ ...formData, name: e.target.value });
              if (errors.name) setErrors({ ...errors, name: "" });
            }}
            disabled={!isEditing}
            className={`w-full px-4 py-3 rounded-lg border ${
              errors.name
                ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                : "border-gray-300 focus:ring-rose-500 focus:border-rose-500"
            } focus:ring-2 focus:outline-none transition-all disabled:bg-gray-50 disabled:cursor-not-allowed`}
            placeholder="Enter your full name"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Phone Number
          </label>
          <input
            type="tel"
            value={
              user?.phone
                ? user.phone.startsWith("+")
                  ? user.phone
                  : `+91 ${user.phone}`
                : ""
            }
            disabled
            className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-gray-50 cursor-not-allowed"
          />
          <p className="mt-1 text-xs text-gray-500">
            Update phone via support if needed
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email Address
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="email"
              value={formData.email}
              onChange={(e) => {
                setFormData({ ...formData, email: e.target.value });
                if (errors.email) setErrors({ ...errors, email: "" });
              }}
              disabled
              className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 bg-gray-50 cursor-not-allowed"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date of Birth
          </label>
          <input
            type="date"
            value={formData.dateOfBirth}
            onChange={(e) =>
              setFormData({ ...formData, dateOfBirth: e.target.value })
            }
            disabled={!isEditing}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-rose-500 focus:border-rose-500 focus:ring-2 focus:outline-none transition-all disabled:bg-gray-50 disabled:cursor-not-allowed"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Gender
          </label>
          <select
            value={formData.gender}
            onChange={(e) =>
              setFormData({ ...formData, gender: e.target.value })
            }
            disabled={!isEditing}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-rose-500 focus:border-rose-500 focus:ring-2 focus:outline-none transition-all disabled:bg-gray-50 disabled:cursor-not-allowed"
          >
            <option value="">Select gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </div>
        {isEditing && (
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4">
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 bg-gradient-to-r from-[#FF3C8C] to-[#FF0066] text-white py-2.5 sm:py-3 rounded-lg text-sm sm:text-base font-medium hover:opacity-95 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed shadow-md hover:shadow-lg flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 sm:w-5 sm:h-5" />
                  Save & Next
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsEditing(false);
                setFormData({
                  name: user?.name || "",
                  email: user?.email || "",
                  dateOfBirth: "",
                  gender: "",
                });
                setErrors({});
                setEmailVerification({
                  show: false,
                  newEmail: "",
                  code: "",
                });
              }}
              className="px-4 sm:px-6 py-2.5 sm:py-3 bg-gray-200 text-gray-700 rounded-lg text-sm sm:text-base font-medium hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function KYCSectionInline(props: any) {
  const {
    kycStatus,
    getStatusIcon,
    getStatusText,
    getStatusColor,
    documents,
    handleFileUpload,
    isUploading,
  } = props;
  return (
    <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-rose-100/80 p-4 sm:p-6 md:p-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
        <div className="flex-1 min-w-0">
          <h2 className="text-lg sm:text-xl md:text-2xl font-playfair font-bold text-gray-800 mb-1">
            KYC & Verification
          </h2>
          <p className="text-xs sm:text-sm text-gray-600">
            Required for withdrawals, not for product orders
          </p>
        </div>
        <div
          className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg border ${getStatusColor()} w-full sm:w-auto justify-center sm:justify-start`}
        >
          {getStatusIcon()}
          <span className="font-medium text-xs sm:text-sm">
            {getStatusText()}
          </span>
        </div>
      </div>
      {kycStatus === "rejected" && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800 font-medium mb-1">
            Verification Rejected
          </p>
          <p className="text-sm text-red-600">
            Your documents were rejected. Please upload clear, valid documents
            and try again.
          </p>
        </div>
      )}
      {kycStatus === "verified" && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-800 font-medium">
            ✓ Your KYC is verified. You can now withdraw funds.
          </p>
        </div>
      )}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Aadhar Card <span className="text-red-500">*</span>
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-rose-400 transition-colors">
            {documents.aadhar ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="w-8 h-8 text-green-600" />
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-800">
                      {documents.aadhar.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      Uploaded{" "}
                      {new Date(documents.aadhar.uploadedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
            ) : (
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload("aadhar", file);
                  }}
                  disabled={isUploading}
                  className="hidden"
                />
                <div className="flex flex-col items-center gap-2">
                  <Upload className="w-8 h-8 text-gray-400" />
                  <p className="text-sm text-gray-600">Click to upload Aadhar</p>
                </div>
              </label>
            )}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            PAN Card <span className="text-red-500">*</span>
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-rose-400 transition-colors">
            {documents.pan ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="w-8 h-8 text-green-600" />
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-800">
                      {documents.pan.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      Uploaded{" "}
                      {new Date(documents.pan.uploadedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
            ) : (
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload("pan", file);
                  }}
                  disabled={isUploading}
                  className="hidden"
                />
                <div className="flex flex-col items-center gap-2">
                  <Upload className="w-8 h-8 text-gray-400" />
                  <p className="text-sm text-gray-600">Click to upload PAN</p>
                </div>
              </label>
            )}
          </div>
        </div>
        {isUploading && (
          <div className="text-center py-4">
            <div className="inline-block w-6 h-6 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-600 mt-2">Uploading...</p>
          </div>
        )}
      </div>
    </div>
  );
}

function AddressFormInline({
  address,
  onSave,
  onCancel,
}: {
  address: Address | null;
  onSave: (a: Address) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState<Address>({
    id: address?.id || "",
    name: address?.name || "",
    phone: address?.phone || "",
    addressLine1: address?.addressLine1 || "",
    addressLine2: address?.addressLine2 || "",
    city: address?.city || "",
    state: address?.state || "",
    pincode: address?.pincode || "",
    isDefault: address?.isDefault || false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.phone.trim()) newErrors.phone = "Phone number is required";
    else if (!/^\d{10}$/.test(formData.phone))
      newErrors.phone = "Please enter a valid 10-digit phone number";
    if (!formData.addressLine1.trim())
      newErrors.addressLine1 = "Address line 1 is required";
    if (!formData.city.trim()) newErrors.city = "City is required";
    if (!formData.state.trim()) newErrors.state = "State is required";
    if (!formData.pincode.trim()) newErrors.pincode = "Pincode is required";
    else if (!/^\d{6}$/.test(formData.pincode))
      newErrors.pincode = "Please enter a valid 6-digit pincode";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSaving(true);
    await onSave(formData);
    setIsSaving(false);
  };
  return (
    <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-rose-100/80 p-4 sm:p-6 md:p-8">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h2 className="text-lg sm:text-xl md:text-2xl font-playfair font-bold text-gray-800">
          {address ? "Edit Address" : "Add New Address"}
        </h2>
        <button
          type="button"
          onClick={onCancel}
          className="p-1.5 sm:p-2 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <span className="text-base sm:text-lg">✕</span>
        </button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Full Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => {
              setFormData({ ...formData, name: e.target.value });
              if (errors.name) setErrors({ ...errors, name: "" });
            }}
            className={`w-full px-4 py-3 rounded-lg border ${
              errors.name
                ? "border-red-300"
                : "border-gray-300 focus:ring-rose-500"
            } focus:ring-2 focus:outline-none transition-all`}
            placeholder="Enter full name"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Phone Number <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, "").slice(0, 10);
              setFormData({ ...formData, phone: value });
              if (errors.phone) setErrors({ ...errors, phone: "" });
            }}
            className={`w-full px-4 py-3 rounded-lg border ${
              errors.phone
                ? "border-red-300"
                : "border-gray-300 focus:ring-rose-500"
            } focus:ring-2 focus:outline-none transition-all`}
            placeholder="Enter 10-digit phone number"
            maxLength={10}
          />
          {errors.phone && (
            <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Address Line 1 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.addressLine1}
            onChange={(e) => {
              setFormData({ ...formData, addressLine1: e.target.value });
              if (errors.addressLine1) setErrors({ ...errors, addressLine1: "" });
            }}
            className={`w-full px-4 py-3 rounded-lg border ${
              errors.addressLine1
                ? "border-red-300"
                : "border-gray-300 focus:ring-rose-500"
            } focus:ring-2 focus:outline-none transition-all`}
            placeholder="House/Flat No., Building Name"
          />
          {errors.addressLine1 && (
            <p className="mt-1 text-sm text-red-600">{errors.addressLine1}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Address Line 2 (Optional)
          </label>
          <input
            type="text"
            value={formData.addressLine2 || ""}
            onChange={(e) =>
              setFormData({ ...formData, addressLine2: e.target.value })
            }
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-rose-500 focus:ring-2 focus:outline-none transition-all"
            placeholder="Street, Area, Landmark"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              City <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.city}
              onChange={(e) => {
                setFormData({ ...formData, city: e.target.value });
                if (errors.city) setErrors({ ...errors, city: "" });
              }}
              className={`w-full px-4 py-3 rounded-lg border ${
                errors.city
                  ? "border-red-300"
                  : "border-gray-300 focus:ring-rose-500"
              } focus:ring-2 focus:outline-none transition-all`}
              placeholder="Enter city"
            />
            {errors.city && (
              <p className="mt-1 text-sm text-red-600">{errors.city}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              State <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.state}
              onChange={(e) => {
                setFormData({ ...formData, state: e.target.value });
                if (errors.state) setErrors({ ...errors, state: "" });
              }}
              className={`w-full px-4 py-3 rounded-lg border ${
                errors.state
                  ? "border-red-300"
                  : "border-gray-300 focus:ring-rose-500"
              } focus:ring-2 focus:outline-none transition-all`}
              placeholder="Enter state"
            />
            {errors.state && (
              <p className="mt-1 text-sm text-red-600">{errors.state}</p>
            )}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Pincode <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.pincode}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, "").slice(0, 6);
              setFormData({ ...formData, pincode: value });
              if (errors.pincode) setErrors({ ...errors, pincode: "" });
            }}
            className={`w-full px-4 py-3 rounded-lg border ${
              errors.pincode
                ? "border-red-300"
                : "border-gray-300 focus:ring-rose-500"
            } focus:ring-2 focus:outline-none transition-all`}
            placeholder="Enter 6-digit pincode"
            maxLength={6}
          />
          {errors.pincode && (
            <p className="mt-1 text-sm text-red-600">{errors.pincode}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isDefault"
            checked={formData.isDefault}
            onChange={(e) =>
              setFormData({ ...formData, isDefault: e.target.checked })
            }
            className="w-4 h-4 text-rose-500 border-gray-300 rounded focus:ring-rose-500"
          />
          <label htmlFor="isDefault" className="text-sm text-gray-700">
            Set as default address
          </label>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4">
          <button
            type="submit"
            disabled={isSaving}
            className="flex-1 bg-gradient-to-r from-[#FF3C8C] to-[#FF0066] text-white py-2.5 sm:py-3 rounded-lg text-sm sm:text-base font-medium hover:opacity-95 transition-all disabled:opacity-70 flex items-center justify-center gap-2"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 sm:w-5 sm:h-5" />
                Save Address
              </>
            )}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 sm:px-6 py-2.5 sm:py-3 bg-gray-200 text-gray-700 rounded-lg text-sm sm:text-base font-medium hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
