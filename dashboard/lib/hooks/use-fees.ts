"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { get, patch } from "@/lib/api/client";

function fetchInstallments(installmentNumber: number) {
  return get(`/fees/installments/${installmentNumber}`);
}

function fetchStudentFees(studentId: string) {
  return get(`/fees/student/${studentId}`);
}

function recordPaymentApi(installmentId: string, amount: number) {
  return patch(`/fees/installments/${installmentId}/payment`, {
    request: { amount },
  });
}

export function useInstallments(installmentNumber: number, options: { enabled?: boolean } = {}) {
  const { enabled = true } = options;
  const shouldFetch = typeof installmentNumber === "number" && installmentNumber >= 1;

  return useQuery({
    queryKey: ["fees", "installments", installmentNumber],
    queryFn: () => fetchInstallments(installmentNumber),
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
    mutationFn: ({ installmentId, amount }: { installmentId: string; amount: number }) =>
      recordPaymentApi(installmentId, amount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fees", "installments"] });
      queryClient.invalidateQueries({ queryKey: ["fees", "student"] });
    },
  });
}

