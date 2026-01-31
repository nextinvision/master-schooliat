"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ClassesTable } from "@/components/classes/classes-table";
import { useClassesPage } from "@/lib/hooks/use-classes";

export default function ClassesPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const limit = 15;

  const { data, isLoading, isError, error, isFetching, refetch } = useClassesPage(page, limit);

  const classes = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;

  const handleAddNew = useCallback(() => {
    router.push("/admin/classes/update");
  }, [router]);

  if (isLoading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading classes...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error: {error?.message || "Failed to load classes"}</p>
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
      <ClassesTable
        classes={classes}
        onAddNew={handleAddNew}
        page={page - 1}
        onPageChange={(newPage) => setPage(newPage + 1)}
        serverTotalPages={totalPages}
        loading={isFetching}
        onRefresh={refetch}
      />
    </div>
  );
}

