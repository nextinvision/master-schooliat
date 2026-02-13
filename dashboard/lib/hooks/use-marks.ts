"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { get, post } from "@/lib/api/client";
import { keepPreviousData } from "@tanstack/react-query";

// Fetch marks
function fetchMarks(params: {
  examId?: string;
  studentId?: string;
  classId?: string;
  subjectId?: string;
  page?: number;
  limit?: number;
}) {
  return get("/marks", params);
}

// Fetch exams
function fetchExams(params?: {
  classId?: string;
  page?: number;
  limit?: number;
}) {
  return get("/exams", params);
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

// Calculate result
function calculateResultApi(data: {
  examId: string;
  studentId: string;
  classId: string;
  gradeConfig?: Record<string, any>;
}) {
  return post("/marks/calculate-result", { request: data });
}

// Publish results
function publishResultsApi(data: {
  examId: string;
  classId: string;
}) {
  return post("/marks/publish-results", { request: data });
}

export function useMarks(params: {
  examId?: string;
  studentId?: string;
  classId?: string;
  subjectId?: string;
  page?: number;
  limit?: number;
} = {}) {
  return useQuery({
    queryKey: ["marks", params],
    queryFn: () => fetchMarks(params),
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
  });
}

export function useExams(params?: {
  classId?: string;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: ["exams", params],
    queryFn: () => fetchExams(params),
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000,
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
    },
  });
}

export function useCalculateResult() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      examId: string;
      studentId: string;
      classId: string;
      gradeConfig?: Record<string, any>;
    }) => calculateResultApi(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marks"] });
    },
  });
}

export function usePublishResults() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { examId: string; classId: string }) => publishResultsApi(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marks"] });
      queryClient.invalidateQueries({ queryKey: ["results"] });
    },
  });
}

