"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Download } from "lucide-react";
import { toast } from "sonner";
import { getAuthToken } from "@/lib/auth/storage";
import { BASE_URL } from "@/lib/api/config";

const CLASS_COLUMNS = [
  { key: "no", title: "No", width: "w-16" },
  { key: "grade", title: "Grade", width: "w-32" },
  { key: "division", title: "Division", width: "w-32" },
  { key: "teacher", title: "Class Teacher", width: "w-64" },
  { key: "action", title: "Action", width: "w-24" },
];

interface ClassesTableProps {
  classes: any[];
  onAddNew: () => void;
  page: number;
  onPageChange: (page: number) => void;
  serverTotalPages: number;
  loading: boolean;
  onRefresh: () => void;
}

export function ClassesTable({
  classes,
  onAddNew,
  page,
  onPageChange,
  serverTotalPages,
  loading,
}: ClassesTableProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredClasses = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return classes;

    return classes.filter((cls) => {
      const gradeMatch = cls.grade?.toLowerCase().includes(q);
      const divisionMatch = cls.division?.toLowerCase().includes(q);
      const teacherMatch =
        cls.classTeacher &&
        `${cls.classTeacher.firstName} ${cls.classTeacher.lastName}`
          .toLowerCase()
          .includes(q);
      return gradeMatch || divisionMatch || teacherMatch;
    });
  }, [classes, searchQuery]);

  const handleDownload = async (classId: string, className: string) => {
    try {
      const token = await getAuthToken();
      const baseUrl = BASE_URL;
      const response = await fetch(`${baseUrl}/schools/classes/${classId}/students/export`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to download file");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `class_${className.replace(/\s+/g, "_")}_students.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Download started");
    } catch (error: any) {
      toast.error(error?.message || "Failed to download class data");
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-semibold">Classes</h1>
        <Button onClick={onAddNew} className="gap-2">
          <Plus className="w-4 h-4" />
          Add/Update
        </Button>
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search by Grade, Division, or Teacher"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-schooliat-tint">
                {CLASS_COLUMNS.map((column) => (
                  <TableHead key={column.key} className={column.width}>
                    {column.title}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && filteredClasses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={CLASS_COLUMNS.length} className="text-center py-8">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : filteredClasses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={CLASS_COLUMNS.length} className="text-center py-8">
                    No classes found
                  </TableCell>
                </TableRow>
              ) : (
                filteredClasses.map((cls, index) => (
                  <TableRow key={cls.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium">
                      {String(index + 1).padStart(2, "0")}
                    </TableCell>
                    <TableCell>{cls.grade || "-"}</TableCell>
                    <TableCell>{cls.division || "-"}</TableCell>
                    <TableCell>
                      {cls.classTeacher
                        ? `${cls.classTeacher.firstName} ${cls.classTeacher.lastName}`
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDownload(cls.id, `${cls.grade}${cls.division ? "_" + cls.division : ""}`)}
                        className="h-8 w-8 text-primary hover:text-primary/90"
                        title="Download Student List"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination */}
      {serverTotalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Page {page + 1} of {serverTotalPages}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(Math.max(0, page - 1))}
              disabled={page === 0 || loading}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(Math.min(serverTotalPages - 1, page + 1))}
              disabled={page >= serverTotalPages - 1 || loading}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

