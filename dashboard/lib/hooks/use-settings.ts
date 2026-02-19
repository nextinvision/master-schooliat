import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { get, patch, post } from "@/lib/api/client";

export function useSettings() {
  return useQuery({
    queryKey: ["settings"],
    queryFn: () => get("/settings"),
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { request: Partial<Settings> }) =>
      patch("/settings", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (payload: { currentPassword: string; newPassword: string }) =>
      post("/auth/change-password", { request: payload }),
  });
}

export interface Settings {
  id: string;
  schoolId: string | null;
  logoId?: string;
  logoUrl?: string;
  studentFeeInstallments?: number;
  studentFeeAmount?: number;
  platformConfig?: PlatformConfig;
  createdAt: string;
  updatedAt: string;
}

export interface PlatformConfig {
  // Branding
  branding?: {
    platformName?: string;
    primaryColor?: string;
    secondaryColor?: string;
    faviconId?: string;
  };
  // System
  system?: {
    maintenanceMode?: boolean;
    maintenanceMessage?: string;
    smtp?: {
      host?: string;
      port?: number;
      user?: string;
      password?: string;
      fromEmail?: string;
      fromName?: string;
    };
    notifications?: {
      emailEnabled?: boolean;
      pushEnabled?: boolean;
      smsEnabled?: boolean;
    };
  };
  // Security
  security?: {
    ipWhitelist?: string[];
    global2FA?: boolean;
    passwordPolicy?: {
      minLength?: number;
      requireUppercase?: boolean;
      requireLowercase?: boolean;
      requireNumbers?: boolean;
      requireSpecialChars?: boolean;
      preventReuse?: number;
    };
    sessionTimeout?: number; // minutes
    jwtExpiration?: number; // hours
  };
  // Performance
  performance?: {
    cacheEnabled?: boolean;
    cacheTTL?: number; // seconds
    paginationDefault?: number;
    fileUploadLimit?: number; // MB
    queryTimeout?: number; // seconds
  };
  // Audit
  audit?: {
    retentionDays?: number;
    logLevel?: "DEBUG" | "INFO" | "WARN" | "ERROR";
    enableActivityTracking?: boolean;
  };
  // AI
  ai?: {
    chatbotEnabled?: boolean;
    conversationRetentionDays?: number;
    responseConfig?: {
      maxTokens?: number;
      temperature?: number;
    };
  };
  // Features
  features?: {
    [key: string]: boolean;
  };
}

