"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { get, post } from "@/lib/api/client";
import { keepPreviousData } from "@tanstack/react-query";

// Fetch library issues
function fetchLibraryIssues(params: {
  bookId?: string;
  studentId?: string;
  status?: string;
  page?: number;
  limit?: number;
}) {
  return get("/library/issues", params);
}

// Fetch library history
function fetchLibraryHistory(params: {
  studentId?: string;
  bookId?: string;
  page?: number;
  limit?: number;
}) {
  return get("/library/history", params);
}

// Issue book
function issueBookApi(data: {
  bookId: string;
  studentId: string;
  dueDate: string;
}) {
  return post("/library/issues", { request: data });
}

// Return book
function returnBookApi(issueId: string, data?: { finePaid?: number }) {
  return post(`/library/issues/${issueId}/return`, { request: data || {} });
}

// Reserve book
function reserveBookApi(data: {
  bookId: string;
  studentId: string;
}) {
  return post("/library/reservations", { request: data });
}

export function useLibraryIssues(params: {
  bookId?: string;
  studentId?: string;
  status?: string;
  page?: number;
  limit?: number;
} = {}) {
  return useQuery({
    queryKey: ["library-issues", params],
    queryFn: () => fetchLibraryIssues(params),
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
  });
}

export function useLibraryHistory(params: {
  studentId?: string;
  bookId?: string;
  page?: number;
  limit?: number;
} = {}) {
  return useQuery({
    queryKey: ["library-history", params],
    queryFn: () => fetchLibraryHistory(params),
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
  });
}

export function useIssueBook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { bookId: string; studentId: string; dueDate: string }) =>
      issueBookApi(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["library-issues"] });
      queryClient.invalidateQueries({ queryKey: ["library-history"] });
      queryClient.invalidateQueries({ queryKey: ["books"] });
      queryClient.invalidateQueries({ queryKey: ["library-dashboard"] });
    },
  });
}

export function useReturnBook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ issueId, ...data }: { issueId: string; finePaid?: number }) =>
      returnBookApi(issueId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["library-issues"] });
      queryClient.invalidateQueries({ queryKey: ["library-history"] });
      queryClient.invalidateQueries({ queryKey: ["books"] });
      queryClient.invalidateQueries({ queryKey: ["library-dashboard"] });
    },
  });
}

export function useReserveBook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { bookId: string; studentId: string }) => reserveBookApi(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["library-issues"] });
      queryClient.invalidateQueries({ queryKey: ["books"] });
    },
  });
}

