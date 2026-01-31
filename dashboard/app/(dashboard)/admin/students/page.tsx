"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useStudentsPage, useDeleteStudent } from "@/lib/hooks/use-students";
import { StudentsTable } from "@/components/students/students-table";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

export default function StudentsPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const limit = 15;
  const { data, isLoading, isError, error, isFetching, refetch } =
    useStudentsPage(page, limit);
  const deleteStudent = useDeleteStudent();
  const students = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;

  const handleAddNew = useCallback(() => {
    router.push("/admin/students/add");
  }, [router]);

  const handleEdit = useCallback(
    (student: any) => {
      router.push(`/admin/students/${student.id}/edit`);
    },
    [router]
  );

  const handleDelete = useCallback(
    async (studentId: string) => {
      try {
        await deleteStudent.mutateAsync(studentId);
        toast.success("Student deleted successfully!");
      } catch (error: any) {
        console.error("Delete student failed:", error);
        toast.error(error?.message || "Failed to delete student. Please try again.");
      }
    },
    [deleteStudent]
  );

  const handleBulkDelete = useCallback((ids: string[]) => {
    console.log("Bulk delete ids:", ids);
    // TODO: Implement bulk delete
  }, []);

  if (isLoading && !data) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-red-500">Error: {error?.message || "Failed to load students"}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <StudentsTable
        students={students}
        onAddNew={handleAddNew}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onBulkDelete={handleBulkDelete}
        page={page - 1}
        onPageChange={(next) => setPage(next + 1)}
        serverTotalPages={totalPages}
        loading={isFetching}
        onRefresh={refetch}
      />
    </div>
  );
}

