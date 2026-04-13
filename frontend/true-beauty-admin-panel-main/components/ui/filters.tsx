"use client";

import { useState, useEffect } from "react";
import { Search, ChevronDown, SlidersHorizontal } from "lucide-react";

const MOBILE_BREAKPOINT = 768;

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(typeof window !== "undefined" && window.innerWidth < MOBILE_BREAKPOINT);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return isMobile;
}

export interface FilterOption {
  value: string;
  label: string;
}

interface FiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  /** On viewport < md, this placeholder is used instead of searchPlaceholder */
  searchPlaceholderMobile?: string;
  filterOptions?: FilterOption[];
  filterValue?: string;
  onFilterChange?: (value: string) => void;
  categoryOptions?: FilterOption[];
  categoryValue?: string;
  onCategoryChange?: (value: string) => void;
}

export function Filters({
  search,
  onSearchChange,
  searchPlaceholder = "Search...",
  searchPlaceholderMobile,
  filterOptions,
  filterValue,
  onFilterChange,
  categoryOptions,
  categoryValue,
  onCategoryChange,
}: FiltersProps) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [pendingCategory, setPendingCategory] = useState(categoryValue ?? "");
  const [pendingFilter, setPendingFilter] = useState(filterValue ?? "");

  useEffect(() => {
    if (sheetOpen) {
      setPendingCategory(categoryValue ?? "");
      setPendingFilter(filterValue ?? "");
    }
  }, [sheetOpen, categoryValue, filterValue]);

  const activeLabel =
    filterOptions?.find((opt) => opt.value === filterValue)?.label ??
    filterOptions?.[0]?.label ??
    "All";

  const showFilter = filterOptions && onFilterChange;
  const showCategoryFilter = categoryOptions && onCategoryChange;

  const activeCategoryLabel =
    categoryOptions?.find((opt) => opt.value === categoryValue)?.label ??
    "All categories";

  const hasActiveFilters =
    (categoryValue && categoryValue !== "") || (filterValue && filterValue !== "");
  const filterCount =
    (categoryValue ? 1 : 0) + (filterValue ? 1 : 0);

  const handleApplyFilters = () => {
    onCategoryChange?.(pendingCategory);
    onFilterChange?.(pendingFilter);
    setSheetOpen(false);
  };

  const handleResetFilters = () => {
    setPendingCategory("");
    setPendingFilter("");
  };

  return (
    <div className="flex flex-row gap-2 sm:gap-4">
      <div className="relative flex-1 min-w-0">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder={isMobile && searchPlaceholderMobile != null ? searchPlaceholderMobile : searchPlaceholder}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#f8c6d0] focus:border-transparent transition-all"
        />
      </div>

      {(showCategoryFilter || showFilter) && (
        <>
          {/* Mobile: single Filter button → bottom sheet */}
          <div className="flex shrink-0 md:hidden">
            <button
              type="button"
              onClick={() => setSheetOpen(true)}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-colors min-w-[72px] justify-center ${
                hasActiveFilters
                  ? "border-[#D96A86] bg-[#fef5f7] text-[#D96A86]"
                  : "border-gray-200 bg-white text-gray-700 hover:bg-[#fef5f7]"
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Filter</span>
              {filterCount > 0 && (
                <span className="flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-[#D96A86] text-white text-xs font-semibold">
                  {filterCount}
                </span>
              )}
            </button>
          </div>

          {/* Desktop: separate dropdowns */}
          <div className="hidden md:flex shrink-0 gap-2">
            {showCategoryFilter && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setCategoryOpen((prev) => !prev);
                    setOpen(false);
                  }}
                  className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 hover:bg-[#fef5f7] transition-colors min-w-[120px] sm:min-w-[160px] justify-between"
                >
                  <span className="truncate">{activeCategoryLabel}</span>
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                </button>
                {categoryOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setCategoryOpen(false)}
                    />
                    <div className="absolute right-0 mt-1 w-full min-w-[160px] bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-20">
                      {categoryOptions!.map((opt) => (
                        <button
                          key={opt.value || "all"}
                          type="button"
                          onClick={() => {
                            onCategoryChange(opt.value);
                            setCategoryOpen(false);
                          }}
                          className={`block w-full text-left px-4 py-2 text-sm hover:bg-[#fef5f7] transition-colors ${
                            categoryValue === opt.value ? "bg-[#fef5f7] font-medium" : ""
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {showFilter && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setOpen((prev) => !prev);
                    setCategoryOpen(false);
                  }}
                  className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 hover:bg-[#fef5f7] transition-colors min-w-[120px] sm:min-w-[160px] justify-between"
                >
                  <span className="truncate">{activeLabel}</span>
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                </button>
                {open && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setOpen(false)}
                    />
                    <div className="absolute right-0 mt-1 w-full min-w-[160px] bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-20">
                      {filterOptions!.map((opt) => (
                        <button
                          key={opt.value || "all"}
                          type="button"
                          onClick={() => {
                            onFilterChange(opt.value);
                            setOpen(false);
                          }}
                          className={`block w-full text-left px-4 py-2 text-sm hover:bg-[#fef5f7] transition-colors ${
                            filterValue === opt.value ? "bg-[#fef5f7] font-medium" : ""
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {/* Mobile bottom sheet */}
      {sheetOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40 md:hidden"
            onClick={() => setSheetOpen(false)}
            aria-hidden
          />
          <div
            className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white rounded-t-2xl shadow-[0_-4px_20px_rgba(0,0,0,0.1)] max-h-[85vh] flex flex-col"
            role="dialog"
            aria-modal="true"
            aria-labelledby="filter-sheet-title"
          >
            <div className="flex-shrink-0 px-4 pt-4 pb-2 border-b border-gray-100">
              <h2 id="filter-sheet-title" className="text-lg font-semibold text-gray-900">
                Filters
              </h2>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6">
              {showCategoryFilter && categoryOptions && categoryOptions.length > 0 && (
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Category
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {categoryOptions.map((opt) => {
                      const isSelected = pendingCategory === opt.value;
                      return (
                        <button
                          key={opt.value || "all"}
                          type="button"
                          onClick={() => setPendingCategory(opt.value)}
                          className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                            isSelected
                              ? "bg-[#D96A86] text-white"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              {showFilter && filterOptions && filterOptions.length > 0 && (
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Status
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {filterOptions.map((opt) => {
                      const isSelected = pendingFilter === opt.value;
                      return (
                        <button
                          key={opt.value || "all"}
                          type="button"
                          onClick={() => setPendingFilter(opt.value)}
                          className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                            isSelected
                              ? "bg-[#D96A86] text-white"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            <div className="flex-shrink-0 flex gap-3 px-4 py-4 border-t border-gray-100 bg-gray-50/50">
              <button
                type="button"
                onClick={handleResetFilters}
                className="flex-1 py-3 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={handleApplyFilters}
                className="flex-1 py-3 rounded-xl bg-[#D96A86] text-white text-sm font-medium hover:bg-[#C85A76] transition-colors"
              >
                Apply
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}