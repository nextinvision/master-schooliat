"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { get, post, patch } from "@/lib/api/client";
import { keepPreviousData } from "@tanstack/react-query";

// Fetch leave balance
function fetchLeaveBalance() {
  return get("/leave/balance");
}

// Fetch leave history (optionally for a specific user - school admin can pass userId)
function fetchLeaveHistory(params: {
  userId?: string;
  page?: number;
  limit?: number;
  status?: string;
  startDate?: string;
  endDate?: string;
}) {
  return get("/leave/history", params);
}

// Fetch leave types
function fetchLeaveTypes() {
  return get("/leave/types");
}

// Fetch leave calendar
function fetchLeaveCalendar(params: {
  startDate: string;
  endDate: string;
  userId?: string;
}) {
  return get("/leave/calendar", params);
}

// Create leave request
function createLeaveRequestApi(data: {
  leaveTypeId: string;
  startDate: string;
  endDate: string;
  reason: string;
}) {
  return post("/leave/request", { request: data });
}

// Approve leave request (backend: POST /leave/approve, body.request.leaveRequestId)
function approveLeaveApi(leaveRequestId: string) {
  return post("/leave/approve", { request: { leaveRequestId } });
}

// Reject leave request (backend: POST /leave/reject, body.request.leaveRequestId, rejectionReason)
function rejectLeaveApi(leaveRequestId: string, data: { rejectionReason?: string }) {
  return post("/leave/reject", {
    request: { leaveRequestId, rejectionReason: data.rejectionReason ?? null },
  });
}

// Cancel leave request
function cancelLeaveApi(leaveRequestId: string) {
  return post(`/leave/${leaveRequestId}/cancel`);
}

// Hooks
export function useLeaveBalance() {
  return useQuery({
    queryKey: ["leave-balance"],
    queryFn: () => fetchLeaveBalance(),
    staleTime: 60 * 1000,
  });
}

export function useLeaveHistory(params: {
  userId?: string;
  page?: number;
  limit?: number;
  status?: string;
  startDate?: string;
  endDate?: string;
} = {}) {
  return useQuery({
    queryKey: ["leave-history", params],
    queryFn: () => fetchLeaveHistory(params),
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
  });
}

/**
 * Fetches all pending leave requests for the school by aggregating leave/history per teacher.
 * Backend does not expose a single "pending for school" endpoint; this uses existing APIs only.
 * Enriches each leave with requesterName from the teachers list (leave history does not include user).
 */
async function fetchPendingLeaveRequestsForApproval(): Promise<any[]> {
  const teachersRes = await get("/users/teachers", { pageNumber: 1, pageSize: 100 });
  const teachers = teachersRes?.data ?? [];
  const userIds = teachers.map((t: { id: string }) => t.id).filter(Boolean);
  if (userIds.length === 0) return [];

  const results = await Promise.all(
    userIds.map((userId: string) =>
      get("/leave/history", { userId, status: "PENDING", limit: 50 })
    )
  );
  const allLeaves: any[] = [];
  results.forEach((res) => {
    const leaves = res?.data?.leaves ?? [];
    allLeaves.push(...leaves);
  });
  allLeaves.sort(
    (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
  );
  const userMap = new Map(teachers.map((t: any) => [t.id, `${t.firstName || ""} ${t.lastName || ""}`.trim() || t.email]));
  return allLeaves.map((leave) => ({
    ...leave,
    requesterName: userMap.get(leave.userId) || leave.userId,
  }));
}

export function usePendingLeaveRequestsForApproval() {
  return useQuery({
    queryKey: ["leave-pending-approvals"],
    queryFn: fetchPendingLeaveRequestsForApproval,
    staleTime: 30 * 1000,
  });
}

export function useLeaveTypes() {
  return useQuery({
    queryKey: ["leave-types"],
    queryFn: () => fetchLeaveTypes(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useLeaveCalendar(params: {
  startDate: string;
  endDate: string;
  userId?: string;
}) {
  return useQuery({
    queryKey: ["leave-calendar", params],
    queryFn: () => fetchLeaveCalendar(params),
    enabled: !!params.startDate && !!params.endDate,
    staleTime: 60 * 1000,
  });
}

export function useCreateLeaveRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      leaveTypeId: string;
      startDate: string;
      endDate: string;
      reason: string;
    }) => createLeaveRequestApi(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leave-balance"] });
      queryClient.invalidateQueries({ queryKey: ["leave-history"] });
      queryClient.invalidateQueries({ queryKey: ["leave-calendar"] });
    },
  });
}

export function useApproveLeave() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (leaveRequestId: string) => approveLeaveApi(leaveRequestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leave-balance"] });
      queryClient.invalidateQueries({ queryKey: ["leave-history"] });
      queryClient.invalidateQueries({ queryKey: ["leave-calendar"] });
      queryClient.invalidateQueries({ queryKey: ["leave-pending-approvals"] });
    },
  });
}

export function useRejectLeave() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ leaveRequestId, rejectionReason }: { leaveRequestId: string; rejectionReason?: string }) =>
      rejectLeaveApi(leaveRequestId, { rejectionReason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leave-balance"] });
      queryClient.invalidateQueries({ queryKey: ["leave-history"] });
      queryClient.invalidateQueries({ queryKey: ["leave-calendar"] });
      queryClient.invalidateQueries({ queryKey: ["leave-pending-approvals"] });
    },
  });
}

export function useCancelLeave() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (leaveRequestId: string) => cancelLeaveApi(leaveRequestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leave-balance"] });
      queryClient.invalidateQueries({ queryKey: ["leave-history"] });
      queryClient.invalidateQueries({ queryKey: ["leave-calendar"] });
    },
  });
}

