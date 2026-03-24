"use client";

import { ReactNode } from "react";
import { QueryProvider } from "./query-provider";
import { ToastProvider } from "./toast-provider";
import { Toaster } from "@/components/ui/sonner";
import { AcademicYearProvider } from "@/lib/context/academic-year-context";
import { BrowserExtensionNoiseGuard } from "./browser-extension-noise-guard";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryProvider>
      <AcademicYearProvider>
        <BrowserExtensionNoiseGuard>
          <ToastProvider>
            {children}
            <Toaster />
          </ToastProvider>
        </BrowserExtensionNoiseGuard>
      </AcademicYearProvider>
    </QueryProvider>
  );
}

