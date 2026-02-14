"use client";

import { useState, useCallback } from "react";

/**
 * Reusable hook for delete operations with OTP verification
 * Handles OTP modal state and deletion flow
 */
export function useDeleteWithOTP<T extends { id: string }>(
  deleteFn: (id: string) => Promise<any>,
  getEntityName: (entity: T) => string,
  getEntityType: (entity: T) => string,
  onSuccess?: () => void
) {
  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [entityToDelete, setEntityToDelete] = useState<{
    id: string;
    name: string;
    type: string;
  } | null>(null);

  const handleDelete = useCallback(
    (entity: T) => {
      setEntityToDelete({
        id: entity.id,
        name: getEntityName(entity),
        type: getEntityType(entity),
      });
      setOtpModalOpen(true);
    },
    [getEntityName, getEntityType]
  );

  const handleDeleteConfirmed = useCallback(async () => {
    if (!entityToDelete) return;

    try {
      await deleteFn(entityToDelete.id);
      onSuccess?.();
      setEntityToDelete(null);
      setOtpModalOpen(false);
    } catch (error) {
      // Error handling is done by the delete function
      throw error;
    }
  }, [entityToDelete, deleteFn, onSuccess]);

  const handleCancel = useCallback(() => {
    setEntityToDelete(null);
    setOtpModalOpen(false);
  }, []);

  return {
    handleDelete,
    otpModalOpen,
    entityToDelete,
    setOtpModalOpen,
    handleDeleteConfirmed,
    handleCancel,
  };
}

