"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, X } from "lucide-react";

interface SubscriptionGateModalProps {
  open: boolean;
  message: string;
  onClose: () => void;
}

export function SubscriptionGateModal({ open, message, onClose }: SubscriptionGateModalProps) {
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white shadow-xl border border-amber-100"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="subscription-gate-title"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-2 rounded-lg bg-amber-50 text-amber-700 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h2
              id="subscription-gate-title"
              className="text-sm font-semibold text-gray-900 truncate"
            >
              Subscription required
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors shrink-0"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 pt-4 pb-5">
          <p className="text-sm text-gray-600 leading-relaxed">{message}</p>
          <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-full text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              Close
            </button>
            <Link
              href="/subscription"
              onClick={onClose}
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-full text-sm font-medium text-white bg-[#D96A86] hover:bg-[#C85A76] transition-colors text-center"
            >
              View plans
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
