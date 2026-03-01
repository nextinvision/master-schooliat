"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { get, patch } from "@/lib/api/client";

function fetchInstallments(installmentNumber: number, endInstallmentNumber?: number) {
  const query = endInstallmentNumber ? `?end=${endInstallmentNumber}` : "";
  return get(`/fees/installments/${installmentNumber}${query}`);
}

function fetchStudentFees(studentId: string) {
  return get(`/fees/student/${studentId}`);
}

function recordPaymentApi(installmentId: string, amount?: number, paymentMethod?: string, isWaiver?: boolean) {
  return patch(`/fees/installments/${installmentId}/payment`, {
    request: { amount, paymentMethod, isWaiver },
  });
}

export function useInstallments(installmentNumber: number, endInstallmentNumber?: number, options: { enabled?: boolean } = {}) {
  const { enabled = true } = options;
  const shouldFetch = typeof installmentNumber === "number" && installmentNumber >= 1;

  return useQuery({
    queryKey: ["fees", "installments", installmentNumber, endInstallmentNumber],
    queryFn: () => fetchInstallments(installmentNumber, endInstallmentNumber),
    enabled: shouldFetch && enabled,
    staleTime: 60 * 1000,
  });
}

export function useStudentFees(studentId: string, options: { enabled?: boolean } = {}) {
  const { enabled = true } = options;

  return useQuery({
    queryKey: ["fees", "student", studentId],
    queryFn: () => fetchStudentFees(studentId),
    enabled: !!studentId && enabled,
    staleTime: 60 * 1000,
  });
}

export function useRecordPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ installmentId, amount, paymentMethod, isWaiver }: { installmentId: string; amount?: number; paymentMethod?: string; isWaiver?: boolean }) =>
      recordPaymentApi(installmentId, amount, paymentMethod, isWaiver),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fees", "installments"] });
      queryClient.invalidateQueries({ queryKey: ["fees", "student"] });
    },
  });
}

