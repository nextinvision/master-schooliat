"use client";

import { ReactNode } from "react";
import { QueryProvider } from "./query-provider";
import { ToastProvider } from "./toast-provider";
import { Toaster } from "@/components/ui/sonner";
import { AcademicYearProvider } from "@/lib/context/academic-year-context";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryProvider>
      <AcademicYearProvider>
        <ToastProvider>
          {children}
          <Toaster />
        </ToastProvider>
      </AcademicYearProvider>
    </QueryProvider>
  );
}

