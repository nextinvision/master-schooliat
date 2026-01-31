"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { TransportTable } from "@/components/transport/transport-table";
import { useVehiclesPage, useDeleteVehicle } from "@/lib/hooks/use-transport";
import { useToast } from "@/hooks/use-toast";

export default function TransportPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const limit = 15;

  const { data, isLoading, isError, error, isFetching, refetch } = useVehiclesPage(page, limit);
  const deleteVehicle = useDeleteVehicle();

  const transports = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;

  const handleAddNew = useCallback(() => {
    router.push("/admin/transport/add");
  }, [router]);

  const handleEdit = useCallback(
    (transport: any) => {
      sessionStorage.setItem("editingTransport", JSON.stringify(transport));
      router.push(`/admin/transport/${transport.id}/edit`);
    },
    [router]
  );

  const handleDelete = useCallback(
    async (transportId: string) => {
      if (!confirm("Are you sure you want to delete this transport?")) {
        return;
      }

      try {
        await deleteVehicle.mutateAsync(transportId);
        toast({
          title: "Success",
          description: "Transport deleted successfully!",
          variant: "default",
        });
      } catch (error: any) {
        console.error("Delete transport failed:", error);
        toast({
          title: "Error",
          description: error?.message || "Failed to delete transport. Please try again.",
          variant: "destructive",
        });
      }
    },
    [deleteVehicle, toast]
  );

  const handleBulkDelete = useCallback(
    async (ids: string[]) => {
      if (!confirm(`Are you sure you want to delete ${ids.length} transport(s)?`)) {
        return;
      }

      try {
        await Promise.all(ids.map((id) => deleteVehicle.mutateAsync(id)));
        toast({
          title: "Success",
          description: `${ids.length} transport(s) deleted successfully!`,
          variant: "default",
        });
      } catch (error: any) {
        console.error("Bulk delete failed:", error);
        toast({
          title: "Error",
          description: "Failed to delete some transports. Please try again.",
          variant: "destructive",
        });
      }
    },
    [deleteVehicle, toast]
  );

  if (isLoading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading transports...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error: {error?.message || "Failed to load transports"}</p>
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
      <TransportTable
        transports={transports}
        onAddNew={handleAddNew}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onBulkDelete={handleBulkDelete}
        page={page - 1}
        onPageChange={(newPage) => setPage(newPage + 1)}
        serverTotalPages={totalPages}
        loading={isFetching || deleteVehicle.isPending}
        onRefresh={refetch}
      />
    </div>
  );
}

