"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useStudentsPage, useDeleteStudent } from "@/lib/hooks/use-students";
import { StudentsTable } from "@/components/students/students-table";
import { DeletionOTPModal } from "@/components/common/deletion-otp-modal";
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

  // OTP Modal state
  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [entityToDelete, setEntityToDelete] = useState<{
    id: string;
    name: string;
    type: string;
  } | null>(null);

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
      const student = students.find((s: any) => s.id === studentId);
      if (student) {
        setEntityToDelete({
          id: studentId,
          name: `${student.firstName} ${student.lastName}`,
          type: "student",
        });
        setOtpModalOpen(true);
      }
    },
    [students]
  );

  const handleDeleteConfirmed = useCallback(
    async () => {
      if (!entityToDelete) return;
      try {
        await deleteStudent.mutateAsync(entityToDelete.id);
        toast.success("Student deleted successfully!");
        refetch();
      } catch (error: any) {
        console.error("Delete student failed:", error);
        toast.error(error?.message || "Failed to delete student. Please try again.");
      }
    },
    [entityToDelete, deleteStudent, refetch]
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

      {/* Deletion OTP Modal */}
      {entityToDelete && (
        <DeletionOTPModal
          open={otpModalOpen}
          onOpenChange={setOtpModalOpen}
          entityType={entityToDelete.type}
          entityId={entityToDelete.id}
          entityName={entityToDelete.name}
          onSuccess={handleDeleteConfirmed}
          onCancel={() => setEntityToDelete(null)}
        />
      )}
    </div>
  );
}

