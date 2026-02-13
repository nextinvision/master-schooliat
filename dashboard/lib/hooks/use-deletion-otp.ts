"use client";

import { useMutation } from "@tanstack/react-query";
import { post, del } from "@/lib/api/client";

// Request deletion OTP
function requestDeletionOTPApi(data: {
  entityType: string;
  entityId: string;
}) {
  return post("/deletion-otp/request", { request: data });
}

// Verify OTP and delete entity
function verifyOTPAndDeleteApi(data: {
  entityType: string;
  entityId: string;
  otp: string;
}) {
  // The backend should handle OTP verification and deletion
  // This endpoint structure may need to be adjusted based on backend implementation
  return del(`/${data.entityType}/${data.entityId}?otp=${data.otp}`);
}

export function useRequestDeletionOTP() {
  return useMutation({
    mutationFn: (data: { entityType: string; entityId: string }) =>
      requestDeletionOTPApi(data),
  });
}

export function useVerifyOTPAndDelete() {
  return useMutation({
    mutationFn: (data: { entityType: string; entityId: string; otp: string }) =>
      verifyOTPAndDeleteApi(data),
  });
}

