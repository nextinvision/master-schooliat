"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { get, post, del } from "@/lib/api/client";
import { keepPreviousData } from "@tanstack/react-query";
import { ClassItem } from "@/lib/schemas/class-schema";

function fetchClasses({ page = 1, limit = 15 }: { page?: number; limit?: number } = {}) {
  return get("/schools/classes", { pageNumber: page, pageSize: limit });
}

function fetchClass(classId: string) {
  return get(`/schools/classes/${classId}`);
}

function createClassesApi(classes: ClassItem[]) {
  const payload = {
    request: classes.map((cls) => ({
      id: cls.id || null,
      grade: cls.grade,
      division: cls.division || null,
      classTeacherId: cls.classTeacherId || null,
    })),
  };
  return post("/schools/classes", payload);
}

function deleteClassApi(classId: string) {
  return del(`/schools/classes/${classId}`);
}

export function useClassesPage(page: number, limit = 15) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["classes", page, limit],
    queryFn: () => fetchClasses({ page, limit }),
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
  });

  // Prefetch next page
  if (!query.isPlaceholderData && query.data?.hasNext) {
    const nextPage = page + 1;
    queryClient.prefetchQuery({
      queryKey: ["classes", nextPage, limit],
      queryFn: () => fetchClasses({ page: nextPage, limit }),
    });
  }

  return query;
}

export function useClass(classId: string) {
  return useQuery({
    queryKey: ["class", classId],
    queryFn: () => fetchClass(classId),
    enabled: !!classId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateClasses() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (classes: ClassItem[]) => createClassesApi(classes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes"] });
    },
  });
}

export function useUpdateClasses() {
  return useCreateClasses();
}

export function useDeleteClass() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (classId: string) => deleteClassApi(classId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes"] });
    },
  });
}
