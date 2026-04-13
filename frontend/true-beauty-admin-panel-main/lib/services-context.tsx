"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
} from "react";
import {
  MOCK_SERVICES,
  generateServiceId,
  type Service,
  type ServiceStatus,
} from "./services-data";

export type ServiceFormValues = Omit<
  Service,
  "id" | "deletedAt" | "createdAt" | "updatedAt"
> & { id?: string };

interface ServicesContextValue {
  services: Service[];
  addService: (values: ServiceFormValues) => Service;
  updateService: (id: string, values: Partial<ServiceFormValues>) => void;
  softDeleteService: (id: string) => void;
  getServiceById: (id: string) => Service | undefined;
}

const ServicesContext = createContext<ServicesContextValue | null>(null);

export function ServicesProvider({ children }: { children: React.ReactNode }) {
  const [services, setServices] = useState<Service[]>(() =>
    MOCK_SERVICES.map((s) => ({ ...s }))
  );

  const visibleServices = useMemo(
    () => services.filter((s) => !s.deletedAt),
    [services]
  );

  const addService = useCallback((values: ServiceFormValues): Service => {
    const now = new Date().toISOString();
    const trimmedHowToUseText = values.howToUseText?.trim() ?? "";
    const trimmedHowToUseVideoUrl = values.howToUseVideoUrl?.trim() ?? "";

    const newService: Service = {
      id: generateServiceId(),
      name: values.name,
      description: values.description ?? "",
      category: values.category,
      price: values.price,
      discountPrice:
        values.discountPrice && values.discountPrice > 0
          ? values.discountPrice
          : undefined,
      durationMinutes: values.durationMinutes,
      image: values.image ?? null,
      status: values.status,
      bookingConfirmationMode: values.bookingConfirmationMode ?? "after_24h",
      howToUseType:
        trimmedHowToUseText && !trimmedHowToUseVideoUrl
          ? "text"
          : trimmedHowToUseVideoUrl && !trimmedHowToUseText
            ? "video"
            : undefined,
      howToUseText: trimmedHowToUseText || undefined,
      howToUseVideoUrl: trimmedHowToUseVideoUrl || undefined,
      areaBranchName: values.areaBranchName ?? undefined,
      fullAddress: values.fullAddress ?? undefined,
      city: values.city ?? undefined,
      state: values.state ?? undefined,
      pincode: values.pincode ?? undefined,
      phoneNumber: values.phoneNumber ?? undefined,
      workingHours: values.workingHours ?? undefined,
      workingDays: values.workingDays ?? undefined,
      createdAt: now,
      updatedAt: now,
    };
    setServices((prev) => [...prev, newService]);
    return newService;
  }, []);

  const updateService = useCallback(
    (id: string, values: Partial<ServiceFormValues>) => {
      setServices((prev) =>
        prev.map((s) => {
          if (s.id !== id) return s;
          return {
            ...s,
            ...values,
            updatedAt: new Date().toISOString(),
          };
        })
      );
    },
    []
  );

  const softDeleteService = useCallback((id: string) => {
    setServices((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, deletedAt: new Date().toISOString() } : s
      )
    );
  }, []);

  const getServiceById = useCallback(
    (id: string) => services.find((s) => s.id === id && !s.deletedAt),
    [services]
  );

  const value: ServicesContextValue = {
    services: visibleServices,
    addService,
    updateService,
    softDeleteService,
    getServiceById,
  };

  return (
    <ServicesContext.Provider value={value}>{children}</ServicesContext.Provider>
  );
}

export function useServices() {
  const ctx = useContext(ServicesContext);
  if (!ctx) throw new Error("useServices must be used within ServicesProvider");
  return ctx;
}
