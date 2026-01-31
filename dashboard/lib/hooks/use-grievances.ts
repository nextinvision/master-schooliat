import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { get, post, patch } from "@/lib/api/client";

export function useGrievances(params?: { status?: string; priority?: string }) {
  const { status, priority } = params || {};
  return useQuery({
    queryKey: ["grievances", status, priority],
    queryFn: () => get("/grievances", { status, priority }),
    staleTime: 30 * 1000,
  });
}

export function useMyGrievances(params?: { status?: string; priority?: string }) {
  const { status, priority } = params || {};
  return useQuery({
    queryKey: ["myGrievances", status, priority],
    queryFn: () => get("/grievances/my", { status, priority }),
    staleTime: 30 * 1000,
  });
}

export function useGrievance(id: string) {
  return useQuery({
    queryKey: ["grievance", id],
    queryFn: () => get(`/grievances/${id}`),
    enabled: !!id,
    staleTime: 30 * 1000,
  });
}

export function useCreateGrievance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (formData: CreateGrievanceData) =>
      post("/grievances", { request: formData }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myGrievances"] });
      queryClient.invalidateQueries({ queryKey: ["grievances"] });
    },
  });
}

export function useUpdateGrievance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...formData }: { id: string } & Partial<Grievance>) =>
      patch(`/grievances/${id}`, { request: formData }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["grievances"] });
      queryClient.invalidateQueries({ queryKey: ["myGrievances"] });
      queryClient.invalidateQueries({ queryKey: ["grievance", variables.id] });
    },
  });
}

export function useAddGrievanceComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ grievanceId, content }: { grievanceId: string; content: string }) =>
      post(`/grievances/${grievanceId}/comments`, {
        request: { content },
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["grievance", variables.grievanceId],
      });
      queryClient.invalidateQueries({ queryKey: ["grievances"] });
      queryClient.invalidateQueries({ queryKey: ["myGrievances"] });
    },
  });
}

export interface Grievance {
  id: string;
  title: string;
  description: string;
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  createdBy?: {
    id: string;
    firstName: string;
    lastName: string;
    role?: {
      name: string;
    };
  };
  school?: {
    id: string;
    name: string;
  };
  comments?: GrievanceComment[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateGrievanceData {
  title: string;
  description: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
}

export interface GrievanceComment {
  id: string;
  content: string;
  createdBy: {
    id: string;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
}

