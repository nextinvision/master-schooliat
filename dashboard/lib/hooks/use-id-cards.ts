"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { get, post } from "@/lib/api/client";

function fetchIdCardsStatus() {
  return get("/id-cards/status");
}

function generateClassIdCardsApi(classId: string) {
  return post(`/id-cards/classes/${classId}/generate`);
}

function fetchTemplates(type: string = "ID_CARD") {
  return get("/templates", { type });
}

function fetchTemplateDefaultConfig(templateId: string) {
  return get(`/templates/${templateId}/default`);
}

function fetchIdCardConfig() {
  return get("/id-cards/config");
}

function saveIdCardConfigApi(data: { templateId: string; config: any }) {
  return post("/id-cards/config", { request: data });
}

export interface IdCardStatus {
  id: string;
  grade: string;
  division?: string;
  status: "Generated" | "Not generated";
  generatedOn?: string;
  collectionId?: string;
}

export interface IdCardsStatusResponse {
  message: string;
  data: IdCardStatus[];
}

export function useIdCardsStatus() {
  return useQuery<IdCardsStatusResponse>({
    queryKey: ["id-cards", "status"],
    queryFn: fetchIdCardsStatus,
    staleTime: 30 * 1000,
  });
}

export function useGenerateClassIdCards() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (classId: string) => generateClassIdCardsApi(classId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["id-cards"] });
    },
  });
}

export function useTemplates(type: string = "ID_CARD") {
  return useQuery({
    queryKey: ["templates", type],
    queryFn: () => fetchTemplates(type),
    staleTime: 5 * 60 * 1000,
    enabled: !!type,
  });
}

export function useSaveIdCardConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { templateId: string; config: any }) =>
      saveIdCardConfigApi(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["id-cards"] });
      queryClient.invalidateQueries({ queryKey: ["id-cards", "config"] });
    },
  });
}

export function useTemplateDefaultConfig(templateId: string | null) {
  return useQuery({
    queryKey: ["templates", templateId, "default-config"],
    queryFn: () => fetchTemplateDefaultConfig(templateId!),
    enabled: !!templateId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useIdCardConfig() {
  return useQuery({
    queryKey: ["id-cards", "config"],
    queryFn: fetchIdCardConfig,
    staleTime: 30 * 1000,
  });
}

