"use client";

import { useQuery } from "@tanstack/react-query";
import { get } from "@/lib/api/client";

function fetchDashboardStats(academicYear?: string) {
  return get("/statistics/dashboard", { academicYear });
}

export interface DashboardStats {
  data?: {
    school?: any;
    userCounts?: {
      students?: { total: number; boys: number; girls: number };
      teachers?: number;
      staff?: number;
    };
    notices?: any[];
    installments?: any;
    financial?: any;
    calendar?: any;
    timetableSlots?: any[];
    pendingHomeworks?: any[];
    submittedHomeworks?: any[];
    upcomingExams?: any[];
    recentNotices?: any[];
    [key: string]: any;
  };
  [key: string]: any;
}

export function useDashboard(options: {
  academicYear?: string;
  [key: string]: any;
} = {}) {
  const { academicYear, ...rest } = options;
  return useQuery<DashboardStats>({
    queryKey: ["dashboard", "statistics", academicYear],
    queryFn: () => fetchDashboardStats(academicYear),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1, // Retry once on failure (e.g. transient 500)
    ...rest,
  });
}

export { fetchDashboardStats };

