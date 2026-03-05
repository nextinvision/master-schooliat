"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { get, patch, post } from "@/lib/api/client";

function fetchInstallments(installmentNumber: number, endInstallmentNumber?: number, academicYear?: string) {
  const query = endInstallmentNumber ? `?end=${endInstallmentNumber}` : "";
  const academicQuery = academicYear ? `${query ? "&" : "?"}academicYear=${academicYear}` : "";
  return get(`/fees/installments/${installmentNumber}${query}${academicQuery}`);
}

function fetchStudentFees(studentId: string) {
  return get(`/fees/student/${studentId}`);
}

function recordPaymentApi(
  installmentId: string,
  amount?: number,
  paymentMethod?: string,
  isWaiver?: boolean,
  transactionId?: string,
  remarks?: string,
  otp?: string
) {
  return patch(`/fees/installments/${installmentId}/payment`, {
    request: { amount, paymentMethod, isWaiver, transactionId, remarks, otp },
  });
}

function requestFeeOTPApi() {
  return post("/fees/request-otp", {});
}

export function useInstallments(installmentNumber: number, endInstallmentNumber?: number, options: { enabled?: boolean; academicYear?: string } = {}) {
  const { enabled = true, academicYear } = options;
  const shouldFetch = typeof installmentNumber === "number" && installmentNumber >= 1;

  return useQuery({
    queryKey: ["fees", "installments", installmentNumber, endInstallmentNumber, academicYear],
    queryFn: () => fetchInstallments(installmentNumber, endInstallmentNumber, academicYear),
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
    mutationFn: ({
      installmentId,
      amount,
      paymentMethod,
      isWaiver,
      transactionId,
      remarks,
      otp,
    }: {
      installmentId: string;
      amount?: number;
      paymentMethod?: string;
      isWaiver?: boolean;
      transactionId?: string;
      remarks?: string;
      otp?: string;
    }) => recordPaymentApi(installmentId, amount, paymentMethod, isWaiver, transactionId, remarks, otp),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fees", "installments"] });
      queryClient.invalidateQueries({ queryKey: ["fees", "student"] });
    },
  });
}

export function useRequestOTP() {
  return useMutation({
    mutationFn: requestFeeOTPApi,
  });
}

