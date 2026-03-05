"use client";

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { get } from "@/lib/api/client";

function fetchDashboardStats(academicYear?: string, filterType?: string, filterValue?: string) {
  return get("/statistics/dashboard", { academicYear, filterType, filterValue });
}

export interface DashboardStats {
  data?: {
    school?: any;
    userCounts?: {
      students?: { total: number; boys: number; girls: number; present?: number };
      teachers?: number;
      staff?: number;
      presentStaffAndTeachers?: number;
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
  filterType?: string;
  filterValue?: string;
  [key: string]: any;
} = {}) {
  const { academicYear, filterType, filterValue, ...rest } = options;
  return useQuery<DashboardStats>({
    queryKey: ["dashboard", "statistics", academicYear, filterType, filterValue],
    queryFn: async () => {
      console.log("Fetching dashboard stats...", { academicYear, filterType, filterValue });
      const startTime = performance.now();
      try {
        const res = await fetchDashboardStats(academicYear, filterType, filterValue);
        console.log(`Dashboard stats fetched in ${performance.now() - startTime}ms`, res);
        return res;
      } catch (e) {
        console.error("Dashboard fetch failed:", e);
        throw e;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1, // Retry once on failure (e.g. transient 500)
    placeholderData: keepPreviousData,
    ...rest,
  });
}

export { fetchDashboardStats };

