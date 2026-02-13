"use client";

import { useQuery } from "@tanstack/react-query";
import { get } from "@/lib/api/client";

// Fetch attendance reports
function fetchAttendanceReport(params: {
  classId?: string;
  studentId?: string;
  startDate: string;
  endDate: string;
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
function fetchAcademicReport(params: {
  classId?: string;
  examId?: string;
  subjectId?: string;
  studentId?: string;
}) {
  return get("/reports/academic", params);
}

// Fetch salary reports
function fetchSalaryReport(params: {
  startDate?: string;
  endDate?: string;
}) {
  return get("/reports/salary", params);
}

export function useAttendanceReport(params: {
  classId?: string;
  studentId?: string;
  startDate: string;
  endDate: string;
}) {
  return useQuery({
    queryKey: ["attendance-report", params],
    queryFn: () => fetchAttendanceReport(params),
    enabled: !!params.startDate && !!params.endDate,
    staleTime: 60 * 1000,
  });
}

export function useFeeAnalytics(params: {
  classId?: string;
  startDate?: string;
  endDate?: string;
}) {
  return useQuery({
    queryKey: ["fee-analytics", params],
    queryFn: () => fetchFeeAnalytics(params),
    staleTime: 60 * 1000,
  });
}

export function useAcademicReport(params: {
  classId?: string;
  examId?: string;
  subjectId?: string;
  studentId?: string;
}) {
  return useQuery({
    queryKey: ["academic-report", params],
    queryFn: () => fetchAcademicReport(params),
    staleTime: 60 * 1000,
  });
}

export function useSalaryReport(params: {
  startDate?: string;
  endDate?: string;
}) {
  return useQuery({
    queryKey: ["salary-report", params],
    queryFn: () => fetchSalaryReport(params),
    staleTime: 60 * 1000,
  });
}

