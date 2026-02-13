"use client";

import { useQuery } from "@tanstack/react-query";
import { get } from "@/lib/api/client";

// Fetch subjects
function fetchSubjects(params?: {
  classId?: string;
  page?: number;
  limit?: number;
}) {
  return get("/subjects", params);
}

// Hooks
export function useSubjects(params?: {
  classId?: string;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: ["subjects", params],
    queryFn: () => fetchSubjects(params),
    staleTime: 5 * 60 * 1000,
  });
}

