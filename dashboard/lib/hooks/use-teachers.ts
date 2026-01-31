"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { get, post, patch, del } from "@/lib/api/client";
import { keepPreviousData } from "@tanstack/react-query";

function fetchTeachers({ page = 1, limit = 15 }: { page?: number; limit?: number } = {}) {
  return get("/users/teachers", { page, limit });
}

function fetchTeacher(teacherId: string) {
  return get(`/users/teachers/${teacherId}`);
}

function createTeacherApi(form: any) {
  const payload = {
    request: {
      firstName: form.firstName?.trim(),
      lastName: form.lastName?.trim(),
      email: form.email?.trim(),
      contact: form.contact?.trim(),
      gender: form.gender,
      dateOfBirth: form.dob,
      address: [
        `${form.areaStreet}`,
        `${form.location}, ${form.district}`,
        `${form.state} - ${form.pincode}`,
      ].filter(Boolean),
      aadhaarId: form.aadhaarId?.trim(),
      panCardNumber: form.panCardNumber?.trim(),
      subjects: form.subjects?.trim(),
      designation: form.designation?.trim(),
      highestQualification: form.highestQualification?.trim(),
      university: form.university?.trim(),
      yearOfPassing: Number(form.yearOfPassing),
      grade: form.percentage?.trim(),
      transportId:
        form.transportMode === "Transport" ? form.transportId ?? null : null,
      registrationPhotoId: form.registrationPhotoId || null,
    },
  };
  return post("/users/teachers", payload);
}

function updateTeacherApi(id: string, form: any) {
  const payload = {
    request: {
      firstName: form.firstName?.trim(),
      lastName: form.lastName?.trim(),
      email: form.email?.trim(),
      contact: form.contact?.trim(),
      gender: form.gender,
      dateOfBirth: form.dateOfBirth,
      address: [
        `${form.areaStreet}`,
        `${form.location}, ${form.district}`,
        `${form.state} - ${form.pincode}`,
      ].filter(Boolean),
      aadhaarId: form.aadhaarId?.trim(),
      subjects: form.subjects?.trim(),
      panCardNumber: form.panCardNumber?.trim(),
      designation: form.designation?.trim(),
      highestQualification: form.highestQualification?.trim(),
      university: form.university?.trim(),
      yearOfPassing: form.yearOfPassing?.toString().trim() || null,
      grade: form.percentage?.trim(),
      transportId:
        form.transportMode === "Transport" ? form.transportId ?? null : null,
      registrationPhotoId: form.registrationPhotoId || null,
    },
  };
  return patch(`/users/teachers/${id}`, payload);
}

function deleteTeacherApi(teacherId: string) {
  return del(`/users/teachers/${teacherId}`);
}

export function useTeachersPage(page: number, limit = 15) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["teachers", page, limit],
    queryFn: () => fetchTeachers({ page, limit }),
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
  });

  // Prefetch next page
  if (!query.isPlaceholderData && query.data?.hasNext) {
    const nextPage = page + 1;
    queryClient.prefetchQuery({
      queryKey: ["teachers", nextPage, limit],
      queryFn: () => fetchTeachers({ page: nextPage, limit }),
    });
  }

  return query;
}

export function useTeacher(teacherId: string) {
  return useQuery({
    queryKey: ["teacher", teacherId],
    queryFn: () => fetchTeacher(teacherId),
    enabled: !!teacherId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateTeacher() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (formData: any) => createTeacherApi(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teachers"] });
    },
  });
}

export function useUpdateTeacher() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...form }: { id: string; [key: string]: any }) =>
      updateTeacherApi(id, form),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["teachers"] });
      queryClient.invalidateQueries({ queryKey: ["teacher", id] });
    },
  });
}

export function useDeleteTeacher() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (teacherId: string) => deleteTeacherApi(teacherId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teachers"] });
    },
  });
}

