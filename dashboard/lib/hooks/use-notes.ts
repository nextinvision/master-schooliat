"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { get, post, put, del } from "@/lib/api/client";
import { keepPreviousData } from "@tanstack/react-query";

// Fetch notes
function fetchNotes(params: {
  subjectId?: string;
  classId?: string;
  chapter?: string;
  topic?: string;
  page?: number;
  limit?: number;
}) {
  return get("/notes/notes", params);
}

// Fetch syllabus
function fetchSyllabus(params: {
  subjectId?: string;
  classId?: string;
  academicYear?: string;
}) {
  return get("/notes/syllabus", params);
}

// Create note
function createNoteApi(data: {
  title: string;
  description: string;
  subjectId: string;
  classId: string;
  chapter?: string;
  topic?: string;
  fileId?: string;
}) {
  return post("/notes/notes", { request: data });
}

// Update note
function updateNoteApi(noteId: string, data: {
  title?: string;
  description?: string;
  chapter?: string;
  topic?: string;
  fileId?: string;
}) {
  return put(`/notes/notes/${noteId}`, { request: data });
}

// Delete note
function deleteNoteApi(noteId: string) {
  return del(`/notes/notes/${noteId}`);
}

// Create syllabus
function createSyllabusApi(data: {
  subjectId: string;
  classId: string;
  academicYear: string;
  chapters: Array<{
    chapterNumber: number;
    chapterName: string;
    topics: string[];
  }>;
  fileId?: string;
}) {
  return post("/notes/syllabus", { request: data });
}

// Update syllabus
function updateSyllabusApi(syllabusId: string, data: {
  chapters?: Array<{
    chapterNumber: number;
    chapterName: string;
    topics: string[];
  }>;
  fileId?: string;
}) {
  return put(`/notes/syllabus/${syllabusId}`, { request: data });
}

// Delete syllabus
function deleteSyllabusApi(syllabusId: string) {
  return del(`/notes/syllabus/${syllabusId}`);
}

// Hooks
export function useNotes(params: {
  subjectId?: string;
  classId?: string;
  chapter?: string;
  topic?: string;
  page?: number;
  limit?: number;
} = {}) {
  return useQuery({
    queryKey: ["notes", params],
    queryFn: () => fetchNotes(params),
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
  });
}

export function useSyllabus(params: {
  subjectId?: string;
  classId?: string;
  academicYear?: string;
} = {}) {
  return useQuery({
    queryKey: ["syllabus", params],
    queryFn: () => fetchSyllabus(params),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      title: string;
      description: string;
      subjectId: string;
      classId: string;
      chapter?: string;
      topic?: string;
      fileId?: string;
    }) => createNoteApi(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
    },
  });
}

export function useUpdateNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; [key: string]: any }) =>
      updateNoteApi(id, data),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
    },
  });
}

export function useDeleteNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (noteId: string) => deleteNoteApi(noteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
    },
  });
}

export function useCreateSyllabus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      subjectId: string;
      classId: string;
      academicYear: string;
      chapters: Array<{
        chapterNumber: number;
        chapterName: string;
        topics: string[];
      }>;
      fileId?: string;
    }) => createSyllabusApi(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["syllabus"] });
    },
  });
}

export function useUpdateSyllabus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; [key: string]: any }) =>
      updateSyllabusApi(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["syllabus"] });
    },
  });
}

export function useDeleteSyllabus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (syllabusId: string) => deleteSyllabusApi(syllabusId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["syllabus"] });
    },
  });
}

