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
      post("/auth/change-password", payload),
  });
}

export interface Settings {
  id: string;
  schoolId: string;
  logoId?: string;
  logoUrl?: string;
  studentFeeInstallments?: number;
  studentFeeAmount?: number;
  createdAt: string;
  updatedAt: string;
}

