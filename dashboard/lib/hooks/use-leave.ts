"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { get, post, patch } from "@/lib/api/client";
import { keepPreviousData } from "@tanstack/react-query";

// Fetch leave balance
function fetchLeaveBalance() {
  return get("/leave/balance");
}

// Fetch leave history
function fetchLeaveHistory(params: {
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

// Approve leave request
function approveLeaveApi(leaveRequestId: string, data: {
  comments?: string;
}) {
  return post(`/leave/${leaveRequestId}/approve`, { request: data });
}

// Reject leave request
function rejectLeaveApi(leaveRequestId: string, data: {
  comments: string;
}) {
  return post(`/leave/${leaveRequestId}/reject`, { request: data });
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
    mutationFn: ({ leaveRequestId, ...data }: { leaveRequestId: string; comments?: string }) =>
      approveLeaveApi(leaveRequestId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leave-balance"] });
      queryClient.invalidateQueries({ queryKey: ["leave-history"] });
      queryClient.invalidateQueries({ queryKey: ["leave-calendar"] });
    },
  });
}

export function useRejectLeave() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ leaveRequestId, ...data }: { leaveRequestId: string; comments: string }) =>
      rejectLeaveApi(leaveRequestId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leave-balance"] });
      queryClient.invalidateQueries({ queryKey: ["leave-history"] });
      queryClient.invalidateQueries({ queryKey: ["leave-calendar"] });
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

