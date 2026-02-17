"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { get, post, patch, del } from "@/lib/api/client";
import { keepPreviousData } from "@tanstack/react-query";

function fetchStudents({ page = 1, limit = 15 }: { page?: number; limit?: number } = {}) {
  return get("/users/students", { page, limit });
}

function fetchStudent(studentId: string) {
  return get(`/users/students/${studentId}`);
}

function createStudentApi(form: any) {
  const payload = {
    request: {
      firstName: form.firstName?.trim(),
      lastName: form.lastName?.trim(),
      gender: form.gender,
      dateOfBirth: form.dob,
      contact: form.phone?.trim(),
      email: form.email?.trim(),
      classId: form.classId,
      address: [
        `${form.areaStreet}`,
        `${form.location}, ${form.district}`,
        `${form.state} - ${form.pincode}`,
      ].filter(Boolean),
      fatherName: form.fatherName?.trim(),
      fatherContact: form.fatherContact?.trim(),
      motherName: form.motherName?.trim(),
      motherContact: form.motherContact?.trim(),
      annualIncome: form.fatherIncome,
      fatherOccupation: form.fatherOccupation?.trim(),
      aadhaarId: form.aadhaarNumber?.trim() || null,
      apaarId: form.apaarId?.trim() || null,
      rollNumber: form.rollNumber?.trim() || null,
      accommodationType: form.accommodationType,
      transport: form.transportMode,
      transportId: form.transportMode === "Transport" ? form.transportId : null,
      registrationPhotoId: form.registrationPhotoId || null,
      bloodGroup: form.bloodGroup,
    },
  };
  return post("/users/students", payload);
}

function updateStudentApi(studentId: string, form: any) {
  const payload = {
    request: {
      firstName: form.firstName?.trim(),
      lastName: form.lastName?.trim(),
      gender: form.gender,
      dateOfBirth: form.dob,
      contact: form.phone?.trim(),
      email: form.email?.trim(),
      classId: form.classId,
      address: [
        `${form.areaStreet}`,
        `${form.location}, ${form.district}`,
        `${form.state} - ${form.pincode}`,
      ].filter(Boolean),
      fatherName: form.fatherName?.trim(),
      fatherContact: form.fatherContact?.trim(),
      motherName: form.motherName?.trim(),
      motherContact: form.motherContact?.trim(),
      annualIncome: form.fatherIncome,
      fatherOccupation: form.fatherOccupation?.trim(),
      aadhaarId: form.aadhaarNumber?.trim() || null,
      apaarId: form.apaarId?.trim() || null,
      rollNumber: form.rollNumber?.trim() || null,
      accommodationType: form.accommodationType,
      transport: form.transportMode,
      transportId: form.transportMode === "Transport" ? form.transportId : null,
      registrationPhotoId: form.registrationPhotoId || null,
    },
  };
  return patch(`/users/students/${studentId}`, payload);
}

function deleteStudentApi(studentId: string) {
  return del(`/users/students/${studentId}`);
}

export function useStudentsPage(page: number, limit = 15) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["students", page, limit],
    queryFn: () => fetchStudents({ page, limit }),
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
  });

  // Prefetch next page
  if (!query.isPlaceholderData && query.data?.hasNext) {
    const nextPage = page + 1;
    queryClient.prefetchQuery({
      queryKey: ["students", nextPage, limit],
      queryFn: () => fetchStudents({ page: nextPage, limit }),
    });
  }

  return query;
}

export function useStudent(studentId: string) {
  return useQuery({
    queryKey: ["student", studentId],
    queryFn: () => fetchStudent(studentId),
    enabled: !!studentId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (formData: any) => createStudentApi(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
    },
  });
}

export function useUpdateStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...form }: { id: string; [key: string]: any }) =>
      updateStudentApi(id, form),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      queryClient.invalidateQueries({ queryKey: ["student", id] });
    },
  });
}

export function useDeleteStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (studentId: string) => deleteStudentApi(studentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
    },
  });
}

// Wrapper hook for simpler API
export function useStudents(params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: ["students", params?.page || 1, params?.limit || 1000],
    queryFn: () => fetchStudents({ page: params?.page || 1, limit: params?.limit || 1000 }),
    staleTime: 30 * 1000,
  });
}

