"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { CircularsTable } from "@/components/circulars/circulars-table";
import { useNoticesPage, useDeleteNotice } from "@/lib/hooks/use-notices";
import { useToast } from "@/hooks/use-toast";

export default function CircularsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const limit = 15;

  const { data, isLoading, isError, error, isFetching, refetch } = useNoticesPage(page, limit);
  const deleteNotice = useDeleteNotice();

  const notices = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;

  const handleAddNew = useCallback(() => {
    router.push("/admin/circulars/add");
  }, [router]);

  const handleEdit = useCallback(
    (notice: any) => {
      sessionStorage.setItem("editingNotice", JSON.stringify(notice));
      router.push(`/admin/circulars/${notice.id}/edit`);
    },
    [router]
  );

  const handleDelete = useCallback(
    async (noticeId: string) => {
      if (!confirm("Are you sure you want to delete this notice?")) {
        return;
      }

      try {
        await deleteNotice.mutateAsync(noticeId);
        toast({
          title: "Success",
          description: "Notice deleted successfully!",
          variant: "default",
        });
      } catch (error: any) {
        console.error("Delete notice failed:", error);
        toast({
          title: "Error",
          description: error?.message || "Failed to delete notice. Please try again.",
          variant: "destructive",
        });
      }
    },
    [deleteNotice, toast]
  );

  const handleBulkDelete = useCallback(
    async (ids: string[]) => {
      if (!confirm(`Are you sure you want to delete ${ids.length} notice(s)?`)) {
        return;
      }

      try {
        await Promise.all(ids.map((id) => deleteNotice.mutateAsync(id)));
        toast({
          title: "Success",
          description: `${ids.length} notice(s) deleted successfully!`,
          variant: "default",
        });
      } catch (error: any) {
        console.error("Bulk delete failed:", error);
        toast({
          title: "Error",
          description: "Failed to delete some notices. Please try again.",
          variant: "destructive",
        });
      }
    },
    [deleteNotice, toast]
  );

  if (isLoading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading notices...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error: {error?.message || "Failed to load notices"}</p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <CircularsTable
        notices={notices}
        onAddNew={handleAddNew}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onBulkDelete={handleBulkDelete}
        page={page - 1}
        onPageChange={(newPage) => setPage(newPage + 1)}
        serverTotalPages={totalPages}
        loading={isFetching || deleteNotice.isPending}
        onRefresh={refetch}
      />
    </div>
  );
}

