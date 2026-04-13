"use client";

import React, { useEffect } from "react";
import { Trash2, X } from "lucide-react";

interface DeletePopupProps {
  /** Whether the popup is visible */
  open: boolean;
  /** Optional heading for the dialog */
  title?: string;
  /** Main confirmation message */
  description?: string;
  /** Label for the confirm button (default: "Delete") */
  confirmLabel?: string;
  /** Label for the cancel button (default: "Cancel") */
  cancelLabel?: string;
  /** Called when the user confirms the action */
  onConfirm: () => void;
  /** Called when the user cancels / closes the dialog */
  onCancel: () => void;
}

export default function DeletePopup({
  open,
  title = "Delete item",
  description = "Are you sure you want to delete this item?",
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
}: DeletePopupProps) {
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onCancel();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm px-4"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-white shadow-xl border border-gray-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-red-50 text-red-600">
              <Trash2 className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 pt-4 pb-5">
          {description && (
            <p className="text-sm text-gray-600">{description}</p>
          )}

          <div className="mt-5 flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={onCancel}
              className="inline-flex items-center justify-center px-5 py-2 rounded-full text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="inline-flex items-center justify-center px-5 py-2 rounded-full text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-colors ml-auto"
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}