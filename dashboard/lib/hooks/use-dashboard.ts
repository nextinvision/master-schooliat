"use client";

import { useQuery } from "@tanstack/react-query";
import { get } from "@/lib/api/client";

function fetchDashboardStats() {
  return get("/statistics/dashboard");
}

export function useDashboard(options = {}) {
  return useQuery({
    queryKey: ["dashboard", "statistics"],
    queryFn: fetchDashboardStats,
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
}

export { fetchDashboardStats };

