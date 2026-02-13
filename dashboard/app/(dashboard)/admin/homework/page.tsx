"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useHomework, useDeleteHomework } from "@/lib/hooks/use-homework";
import { HomeworkTable } from "@/components/homework/homework-table";
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
    async (homeworkId: string) => {
      if (!confirm("Are you sure you want to delete this homework?")) {
        return;
      }

      try {
        await deleteHomework.mutateAsync(homeworkId);
        toast.success("Homework deleted successfully!");
        refetch();
      } catch (error: any) {
        toast.error(error?.message || "Failed to delete homework");
      }
    },
    [deleteHomework, refetch]
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
  );
}

