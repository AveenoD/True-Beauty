"use client";

import React, { useState } from "react";

export interface TabItem<T extends string = string> {
  id: T;
  label: string;
  content: React.ReactNode;
}

interface TabinationProps<T extends string = string> {
  tabs: TabItem<T>[];
  defaultTabId?: T;
  className?: string;
  tabListClassName?: string;
  panelClassName?: string;
}

export function Tabination<T extends string = string>({
  tabs,
  defaultTabId,
  className = "",
  tabListClassName = "",
  panelClassName = "",
}: TabinationProps<T>) {
  const firstId = tabs[0]?.id;
  const [activeId, setActiveId] = useState<T | undefined>(defaultTabId ?? (firstId as T));

  const currentTab = tabs.find((t) => t.id === activeId) ?? tabs[0];

  return (
    <div className={className}>
      {/* Tab list */}
      <div
        role="tablist"
        className={`
          flex gap-2 md:gap-3 border-b border-gray-200 bg-[#fef5f7]/50 rounded-t-2xl
          px-3 md:px-4 pt-2.5 md:pt-3 pb-0
          overflow-x-auto md:overflow-visible
          whitespace-nowrap md:whitespace-normal
          ${tabListClassName}
        `}
      >
        {tabs.map((tab) => {
          const isActive = activeId === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveId(tab.id as T)}
              className={`
                px-4 py-2 md:px-6 md:py-3 text-sm font-medium rounded-t-xl transition-colors
                flex-shrink-0
                ${isActive
                  ? "bg-white text-gray-900 shadow-sm border border-b-0 border-gray-200 -mb-px"
                  : "text-gray-600 hover:text-gray-900 hover:bg-white/70"
                }
              `}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab panel */}
      <div
        role="tabpanel"
        className={`bg-white rounded-b-2xl border border-t-0 border-gray-200 shadow-sm p-6 ${panelClassName}`}
      >
        {currentTab?.content}
      </div>
    </div>
  );
}
