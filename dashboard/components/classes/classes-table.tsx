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
import { Plus } from "lucide-react";

const CLASS_COLUMNS = [
  { key: "no", title: "No", width: "w-16" },
  { key: "grade", title: "Grade", width: "w-32" },
  { key: "division", title: "Division", width: "w-32" },
  { key: "teacher", title: "Class Teacher", width: "w-64" },
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
              <TableRow className="bg-[#e5ffc7]">
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

