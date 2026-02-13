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

// Delete entity with OTP verification
// Backend expects otpId and otpCode in request body
function deleteWithOTPApi(data: {
  entityType: string;
  entityId: string;
  otpId: string;
  otpCode: string;
}) {
  // Map entity types to actual API endpoints
  const entityTypeMap: Record<string, string> = {
    student: "users/students",
    teacher: "users/teachers",
    employee: "users/employees",
    homework: "homework",
    book: "library/books",
    gallery: "gallery",
    note: "notes",
    transport: "transport",
    circular: "circulars",
    calendar: "calendar",
    event: "calendar/events",
    holiday: "calendar/holidays",
  };

  const endpoint = entityTypeMap[data.entityType.toLowerCase()] || `users/${data.entityType}s`;
  
  // Send DELETE request with OTP in body
  // Backend middleware expects otpId and otpCode in request body
  return del(`/${endpoint}/${data.entityId}`, {
    otpId: data.otpId,
    otpCode: data.otpCode,
  });
}

export function useRequestDeletionOTP() {
  return useMutation({
    mutationFn: (data: { entityType: string; entityId: string }) =>
      requestDeletionOTPApi(data),
  });
}

export function useDeleteWithOTP() {
  return useMutation({
    mutationFn: (data: {
      entityType: string;
      entityId: string;
      otpId: string;
      otpCode: string;
    }) => deleteWithOTPApi(data),
  });
}

