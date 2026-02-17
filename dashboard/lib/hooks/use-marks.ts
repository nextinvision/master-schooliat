"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { get, post } from "@/lib/api/client";
import { keepPreviousData } from "@tanstack/react-query";

// Fetch marks
function fetchMarks(params: {
  examId?: string;
  studentId?: string;
  classId?: string;
}) {
  return get("/marks", params);
}

// Fetch results
function fetchResults(params: {
  examId?: string;
  studentId?: string;
}) {
  return get("/marks/results", params);
}

// Enter marks
function enterMarksApi(data: {
  examId: string;
  studentId: string;
  subjectId: string;
  classId: string;
  marksObtained: number;
  maxMarks: number;
}) {
  return post("/marks", { request: data });
}

// Enter bulk marks
function enterBulkMarksApi(data: {
  marks: Array<{
    examId: string;
    studentId: string;
    subjectId: string;
    classId: string;
    marksObtained: number;
    maxMarks: number;
  }>;
}) {
  return post("/marks/bulk", { request: data });
}

// Calculate results
function calculateResultsApi(data: {
  examId: string;
  classId?: string;
}) {
  return post("/marks/calculate", { request: data });
}

// Publish results
function publishResultsApi(data: {
  examId: string;
  classId?: string;
}) {
  return post("/marks/publish", { request: data });
}

// Hooks
export function useMarks(params: {
  examId?: string;
  studentId?: string;
  classId?: string;
} = {}) {
  return useQuery({
    queryKey: ["marks", params],
    queryFn: () => fetchMarks(params),
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
  });
}

export function useResults(params: {
  examId?: string;
  studentId?: string;
} = {}) {
  return useQuery({
    queryKey: ["results", params],
    queryFn: () => fetchResults(params),
    placeholderData: keepPreviousData,
    staleTime: 60 * 1000,
  });
}

export function useEnterMarks() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      examId: string;
      studentId: string;
      subjectId: string;
      classId: string;
      marksObtained: number;
      maxMarks: number;
    }) => enterMarksApi(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marks"] });
      queryClient.invalidateQueries({ queryKey: ["results"] });
    },
  });
}

export function useEnterBulkMarks() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      marks: Array<{
        examId: string;
        studentId: string;
        subjectId: string;
        classId: string;
        marksObtained: number;
        maxMarks: number;
      }>;
    }) => enterBulkMarksApi(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marks"] });
      queryClient.invalidateQueries({ queryKey: ["results"] });
    },
  });
}

export function useCalculateResults() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { examId: string; classId?: string }) =>
      calculateResultsApi(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["results"] });
    },
  });
}

export function usePublishResults() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { examId: string; classId?: string }) =>
      publishResultsApi(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["results"] });
      queryClient.invalidateQueries({ queryKey: ["marks"] });
    },
  });
}

