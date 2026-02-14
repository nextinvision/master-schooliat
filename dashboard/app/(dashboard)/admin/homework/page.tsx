"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useHomework, useDeleteHomework } from "@/lib/hooks/use-homework";
import { HomeworkTable } from "@/components/homework/homework-table";
import { useDeleteWithOTP } from "@/lib/hooks/use-delete-with-otp";
import { DeletionOTPModal } from "@/components/common/deletion-otp-modal";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

export default function HomeworkPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const limit = 15;

  const { data, isLoading, isError, error, refetch } = useHomework({
    page,
    limit,
  });

  const deleteHomework = useDeleteHomework();

  const homeworks = data?.data || [];
  const totalPages = data?.pagination?.totalPages || 1;

  // OTP-enabled delete
  const {
    handleDelete: handleDeleteWithOTP,
    otpModalOpen,
    entityToDelete,
    setOtpModalOpen,
    handleDeleteConfirmed,
    handleCancel,
  } = useDeleteWithOTP(
    async (id: string) => {
      await deleteHomework.mutateAsync(id);
      toast.success("Homework deleted successfully!");
      refetch();
    },
    (homework: any) => homework.title || "Homework",
    () => "homework",
    () => refetch()
  );

  const handleView = useCallback(
    (homework: any) => {
      router.push(`/admin/homework/${homework.id}`);
    },
    [router]
  );

  const handleEdit = useCallback(
    (homework: any) => {
      router.push(`/admin/homework/${homework.id}/edit`);
    },
    [router]
  );

  const handleDelete = useCallback(
    (homeworkId: string) => {
      const homework = homeworks.find((h: any) => h.id === homeworkId);
      if (homework) {
        handleDeleteWithOTP(homework);
      }
    },
    [homeworks, handleDeleteWithOTP]
  );

  const handleAddNew = useCallback(() => {
    router.push("/admin/homework/add");
  }, [router]);

  if (isLoading && !data) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">
            Error loading homework: {error?.message || "Unknown error"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <HomeworkTable
        homeworks={homeworks}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onAddNew={handleAddNew}
        page={page}
        onPageChange={setPage}
        totalPages={totalPages}
        loading={deleteHomework.isPending}
      />
      {entityToDelete && (
        <DeletionOTPModal
          open={otpModalOpen}
          onOpenChange={setOtpModalOpen}
          entityType={entityToDelete.type}
          entityId={entityToDelete.id}
          entityName={entityToDelete.name}
          onSuccess={handleDeleteConfirmed}
          onCancel={handleCancel}
        />
      )}
    </>
  );
}

