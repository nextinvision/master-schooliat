"use client";

import { useQuery } from "@tanstack/react-query";
import { get } from "@/lib/api/client";

// Fetch attendance reports
function fetchAttendanceReports(params: {
  classId?: string;
  studentId?: string;
  startDate?: string;
  endDate?: string;
}) {
  return get("/reports/attendance", params);
}

// Fetch fee analytics
function fetchFeeAnalytics(params: {
  classId?: string;
  startDate?: string;
  endDate?: string;
}) {
  return get("/reports/fees", params);
}

// Fetch academic performance reports
function fetchAcademicReports(params: {
  classId?: string;
  examId?: string;
  subjectId?: string;
  studentId?: string;
}) {
  return get("/reports/academic", params);
}

// Fetch salary reports
function fetchSalaryReports(params: {
  startDate?: string;
  endDate?: string;
}) {
  return get("/reports/salary", params);
}

// Hooks
export function useAttendanceReports(params: {
  classId?: string;
  studentId?: string;
  startDate?: string;
  endDate?: string;
} = {}) {
  return useQuery({
    queryKey: ["reports", "attendance", params],
    queryFn: () => fetchAttendanceReports(params),
    staleTime: 5 * 60 * 1000,
  });
}

export function useFeeAnalytics(params: {
  classId?: string;
  startDate?: string;
  endDate?: string;
} = {}) {
  return useQuery({
    queryKey: ["reports", "fees", params],
    queryFn: () => fetchFeeAnalytics(params),
    staleTime: 5 * 60 * 1000,
  });
}

export function useAcademicReports(params: {
  classId?: string;
  examId?: string;
  subjectId?: string;
  studentId?: string;
} = {}) {
  return useQuery({
    queryKey: ["reports", "academic", params],
    queryFn: () => fetchAcademicReports(params),
    staleTime: 5 * 60 * 1000,
  });
}

export function useSalaryReports(params: {
  startDate?: string;
  endDate?: string;
} = {}) {
  return useQuery({
    queryKey: ["reports", "salary", params],
    queryFn: () => fetchSalaryReports(params),
    staleTime: 5 * 60 * 1000,
  });
}

