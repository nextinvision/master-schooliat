"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { get, post, patch, del } from "@/lib/api/client";
import { keepPreviousData } from "@tanstack/react-query";

function fetchStaffMembers({ page = 1, limit = 15 }: { page?: number; limit?: number } = {}) {
    return get("/users/staff", { pageNumber: page, pageSize: limit });
}

function fetchStaffMember(staffId: string) {
    return get(`/users/staff/${staffId}`);
}

function createStaffApi(form: any) {
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
            registrationPhotoId: form.registrationPhotoId || null,
        },
    };
    return post("/users/staff", payload);
}

function updateStaffApi(id: string, form: any) {
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
            registrationPhotoId: form.registrationPhotoId || null,
        },
    };
    return patch(`/users/staff/${id}`, payload);
}

function deleteStaffApi(staffId: string) {
    return del(`/users/staff/${staffId}`);
}

export function useStaffPage(page: number, limit = 15) {
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: ["staff", page, limit],
        queryFn: () => fetchStaffMembers({ page, limit }),
        placeholderData: keepPreviousData,
        staleTime: 30 * 1000,
    });

    // Prefetch next page
    if (!query.isPlaceholderData && query.data?.hasNext) {
        const nextPage = page + 1;
        queryClient.prefetchQuery({
            queryKey: ["staff", nextPage, limit],
            queryFn: () => fetchStaffMembers({ page: nextPage, limit }),
        });
    }

    return query;
}

export function useStaffMember(staffId: string) {
    return useQuery({
        queryKey: ["staffMember", staffId],
        queryFn: () => fetchStaffMember(staffId),
        enabled: !!staffId,
        staleTime: 5 * 60 * 1000,
    });
}

export function useCreateStaff() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (formData: any) => createStaffApi(formData),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["staff"] });
        },
    });
}

export function useUpdateStaff() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, ...form }: { id: string;[key: string]: any }) =>
            updateStaffApi(id, form),
        onSuccess: (_data, { id }) => {
            queryClient.invalidateQueries({ queryKey: ["staff"] });
            queryClient.invalidateQueries({ queryKey: ["staffMember", id] });
        },
    });
}

export function useDeleteStaff() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (staffId: string) => deleteStaffApi(staffId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["staff"] });
        },
    });
}
