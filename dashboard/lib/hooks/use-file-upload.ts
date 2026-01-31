"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { uploadFile, getFile } from "@/lib/api/client";

export function useFileUpload() {
  return useMutation({
    mutationFn: async (file: File | { uri: string; name: string; type: string }) => {
      if (file instanceof File) {
        return uploadFile(file);
      } else {
        // For React Native web compatibility
        const response = await fetch(file.uri);
        const blob = await response.blob();
        const fileObj = new File([blob], file.name, { type: file.type });
        return uploadFile(fileObj);
      }
    },
  });
}

export function useFile(fileId: string | null | undefined, options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: ["file", fileId],
    queryFn: () => {
      if (!fileId) throw new Error("File ID is required");
      return getFile(fileId);
    },
    enabled: !!fileId && (options.enabled !== false),
    staleTime: 5 * 60 * 1000,
  });
}

