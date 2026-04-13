"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  Clock,
  IndianRupee,
  FileText,
  Image as ImageIcon,
  Tag,
  Scissors,
  MapPin,
  Phone,
  Calendar,
} from "lucide-react";
import { useParams } from "next/navigation";
import { useServices } from "@/lib/services-context";

const STATUS_LABELS: Record<string, string> = {
  active: "Active",
  inactive: "Inactive",
};

const STATUS_CLASSES: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700",
  inactive: "bg-red-50 text-red-700",
};

function formatPrice(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(amount);
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

export default function ServiceDetailPage() {
  const params = useParams();
  const { getServiceById } = useServices();
  const id = typeof params.id === "string" ? params.id : params.id?.[0];
  const service = id ? getServiceById(id) : undefined;

  if (!id || !service) {
    return (
      <div className="space-y-6">
        <Link
          href="/services"
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to My Services
        </Link>
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center">
          <p className="text-gray-500">Service not found.</p>
        </div>
      </div>
    );
  }

  const statusClass =
    STATUS_CLASSES[service.status] ?? "bg-gray-100 text-gray-700";

  const hasLocationContact =
    service.areaBranchName ||
    service.fullAddress ||
    service.city ||
    service.state ||
    service.pincode ||
    service.phoneNumber ||
    service.workingHours ||
    service.workingDays;

  return (
    <div className="space-y-6">
      <Link
        href="/services"
        className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to My Services
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Image */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 bg-[#fef5f7] flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">Image</h2>
            </div>
            <div className="p-4">
              {service.image ? (
                <div className="relative aspect-square rounded-xl bg-[#fef5f7] overflow-hidden">
                  <Image
                    src={service.image}
                    alt={service.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 33vw"
                    unoptimized
                  />
                </div>
              ) : (
                <div className="aspect-square rounded-xl bg-[#fef5f7] flex items-center justify-center text-gray-400">
                  No image
                </div>
              )}
            </div>
          </div>

          {service.howToUseVideoUrl && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="relative aspect-square w-full overflow-hidden rounded-2xl">
                {/\.(mp4|webm|ogg)(\?|$)/i.test(service.howToUseVideoUrl) ? (
                  <video
                    src={service.howToUseVideoUrl}
                    className="absolute inset-0 h-full w-full object-cover"
                    autoPlay
                    muted
                    loop
                    playsInline
                    title={`${service.name} how to use video`}
                  />
                ) : (
                  <iframe
                    src={
                      service.howToUseVideoUrl.includes("?")
                        ? `${service.howToUseVideoUrl}&autoplay=1&mute=1`
                        : `${service.howToUseVideoUrl}?autoplay=1&mute=1`
                    }
                    title={`${service.name} how to use video`}
                    className="absolute inset-0 h-full w-full border-0 object-cover"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                )}
              </div>
            </div>
          )}
        </div>

        {/* Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-[#fef5f7]">
              <h1 className="text-xl font-semibold text-gray-900">{service.name}</h1>
              <div className="flex flex-wrap gap-2 mt-2">
                <span
                  className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${statusClass}`}
                >
                  {STATUS_LABELS[service.status] ?? service.status}
                </span>
              </div>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-[#fef5f7]">
                    <Tag className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </p>
                    <p className="text-gray-900 font-medium mt-0.5">
                      {service.category}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-[#fef5f7]">
                    <IndianRupee className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </p>
                    <div className="mt-0.5">
                      {service.discountPrice &&
                      service.discountPrice > 0 &&
                      service.discountPrice < service.price ? (
                        <>
                          <p className="text-gray-900 font-semibold text-base text-red-600">
                            {formatPrice(service.discountPrice)}
                          </p>
                          <p className="text-xs text-gray-500 line-through">
                            {formatPrice(service.price)}
                          </p>
                        </>
                      ) : (
                        <p className="text-gray-900 font-medium">
                          {formatPrice(service.price)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-[#fef5f7]">
                    <Clock className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Duration
                    </p>
                    <p className="text-gray-900 font-medium mt-0.5">
                      {formatDuration(service.durationMinutes)}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-[#fef5f7]">
                    <Calendar className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Booking confirmation
                    </p>
                    <p className="text-gray-900 font-medium mt-0.5">
                      {service.bookingConfirmationMode === "instant"
                        ? "Instantly after booking"
                        : "Confirmed after 24 hours"}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-[#fef5f7]">
                    <Scissors className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </p>
                    <p className="text-gray-900 font-medium mt-0.5">
                      {formatDate(service.createdAt)}
                    </p>
                  </div>
                </div>
              </div>

              {service.description && (
                <div className="pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-5 h-5 text-gray-600" />
                    <h3 className="text-sm font-semibold text-gray-900">
                      Description
                    </h3>
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">
                    {service.description}
                  </p>
                </div>
              )}

              {hasLocationContact && (
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex items-center gap-2 mb-3">
                    <MapPin className="w-5 h-5 text-[#D96A86]" />
                    <h3 className="text-base font-semibold text-gray-900 tracking-tight">
                      Location & Contact
                    </h3>
                  </div>

                  <div className="rounded-xl border border-gray-200 bg-gray-50/50 overflow-hidden">
                    {/* Address group */}
                    {(service.areaBranchName || service.fullAddress || service.city || service.state || service.pincode) && (
                      <>
                        <div className="px-4 py-3 sm:px-5 sm:py-3.5">
                          <div className="space-y-2.5">
                            {service.areaBranchName && (
                              <div>
                                <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">
                                  Area / Branch
                                </p>
                                <p className="text-sm font-medium text-gray-900 mt-0.5 leading-snug">
                                  {service.areaBranchName}
                                </p>
                              </div>
                            )}
                            {service.fullAddress && (
                              <div>
                                <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">
                                  Full Address
                                </p>
                                <p className="text-sm font-medium text-gray-900 mt-0.5 leading-snug">
                                  {service.fullAddress}
                                </p>
                              </div>
                            )}
                            {(service.city || service.state || service.pincode) && (
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-2.5 pt-0.5">
                                {service.city && (
                                  <div>
                                    <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">
                                      City
                                    </p>
                                    <p className="text-sm font-medium text-gray-900 mt-0.5">
                                      {service.city}
                                    </p>
                                  </div>
                                )}
                                {service.state && (
                                  <div>
                                    <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">
                                      State
                                    </p>
                                    <p className="text-sm font-medium text-gray-900 mt-0.5">
                                      {service.state}
                                    </p>
                                  </div>
                                )}
                                {service.pincode && (
                                  <div>
                                    <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">
                                      Pincode
                                    </p>
                                    <p className="text-sm font-medium text-gray-900 mt-0.5">
                                      {service.pincode}
                                    </p>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        {(service.phoneNumber || service.workingHours || service.workingDays) && (
                          <div className="h-px bg-gray-200" aria-hidden />
                        )}
                      </>
                    )}

                    {/* Number, Time, Days — single row */}
                    {(service.phoneNumber || service.workingHours || service.workingDays) && (
                      <div className="px-4 py-3 sm:px-5 sm:py-3.5">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-3 sm:gap-y-0">
                          {service.phoneNumber && (
                            <div className="flex items-center gap-3">
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#fef5f7]">
                                <Phone className="h-4 w-4 text-[#D96A86]" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">
                                  Phone
                                </p>
                                <p className="text-sm font-semibold text-gray-900 tracking-tight truncate">
                                  {service.phoneNumber}
                                </p>
                              </div>
                            </div>
                          )}
                          {service.workingHours && (
                            <div className="flex items-center gap-3">
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#fef5f7]">
                                <Clock className="h-4 w-4 text-[#D96A86]" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">
                                  Hours
                                </p>
                                <p className="text-sm font-medium text-gray-900">
                                  {service.workingHours}
                                </p>
                              </div>
                            </div>
                          )}
                          {service.workingDays && (
                            <div className="flex items-center gap-3">
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#fef5f7]">
                                <Calendar className="h-4 w-4 text-[#D96A86]" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">
                                  Days
                                </p>
                                <p className="text-sm font-medium text-gray-900">
                                  {service.workingDays}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
