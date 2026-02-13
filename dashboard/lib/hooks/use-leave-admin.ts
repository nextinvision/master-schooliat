"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { get, post } from "@/lib/api/client";
import { keepPreviousData } from "@tanstack/react-query";

// Fetch pending leave requests (for admins)
function fetchPendingLeaveRequests(params: {
  page?: number;
  limit?: number;
  status?: string;
  userId?: string;
}) {
  return get("/leave/requests", params);
}

// Approve leave
function approveLeaveApi(data: { leaveRequestId: string }) {
  return post("/leave/approve", { request: data });
}

// Reject leave
function rejectLeaveApi(data: { leaveRequestId: string; rejectionReason?: string }) {
  return post("/leave/reject", { request: data });
}

export function usePendingLeaveRequests(params: {
  page?: number;
  limit?: number;
  status?: string;
  userId?: string;
} = {}) {
  return useQuery({
    queryKey: ["pending-leave-requests", params],
    queryFn: () => fetchPendingLeaveRequests(params),
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
  });
}

export function useApproveLeave() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { leaveRequestId: string }) => approveLeaveApi(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-leave-requests"] });
      queryClient.invalidateQueries({ queryKey: ["leave-history"] });
      queryClient.invalidateQueries({ queryKey: ["leave-balance"] });
    },
  });
}

export function useRejectLeave() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { leaveRequestId: string; rejectionReason?: string }) =>
      rejectLeaveApi(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-leave-requests"] });
      queryClient.invalidateQueries({ queryKey: ["leave-history"] });
    },
  });
}

