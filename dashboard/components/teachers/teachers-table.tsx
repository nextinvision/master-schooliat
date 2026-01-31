"use client";

import { useState } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Eye, Edit, Trash2, Key, Plus } from "lucide-react";
import { searchTeachersByName } from "@/lib/utils/search-utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TeacherDetailModal } from "./teacher-detail-modal";
import { PasswordResetModal } from "../students/password-reset-modal";
import { cn } from "@/lib/utils";

const TEACHER_COLUMNS = [
  { key: "no", title: "No", width: "w-16" },
  { key: "teacher", title: "Teachers", width: "w-48" },
  { key: "employeeId", title: "Employee ID", width: "w-32" },
  { key: "class", title: "Class", width: "w-28" },
  { key: "subject", title: "Subject", width: "w-40" },
  { key: "attendance", title: "Attendance", width: "w-28" },
  { key: "transport", title: "Transport", width: "w-28" },
  { key: "salary", title: "Salary", width: "w-24" },
  { key: "contact", title: "Contact", width: "w-40" },
  { key: "action", title: "Action", width: "w-32" },
];

const SUBJECT_OPTIONS = [
  "All Subjects",
  "English",
  "Science",
  "Math",
  "History",
];

interface TeachersTableProps {
  teachers: any[];
  onAddNew: () => void;
  onEdit: (teacher: any) => void;
  onDelete: (teacherId: string) => void;
  onBulkDelete: (ids: string[]) => void;
  page: number;
  onPageChange: (page: number) => void;
  serverTotalPages: number;
  loading: boolean;
  onRefresh: () => void;
}

export function TeachersTable({
  teachers,
  onAddNew,
  onEdit,
  onDelete,
  onBulkDelete,
  page,
  onPageChange,
  serverTotalPages,
  loading,
}: TeachersTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("All Subjects");
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<any>(null);
  const [passwordResetVisible, setPasswordResetVisible] = useState(false);
  const [resetTeacher, setResetTeacher] = useState<any>(null);

  // Filter and search
  let filteredTeachers = teachers;

  if (searchQuery.trim()) {
    filteredTeachers = searchTeachersByName(filteredTeachers, searchQuery);
  }

  if (selectedSubject !== "All Subjects") {
    filteredTeachers = filteredTeachers.filter((teacher) =>
      (teacher.subjects || "").toLowerCase().includes(selectedSubject.toLowerCase())
    );
  }

  const handleViewDetails = (teacher: any) => {
    setSelectedTeacher(teacher);
    setModalVisible(true);
  };

  const handlePasswordReset = (teacher: any) => {
    setResetTeacher(teacher);
    setPasswordResetVisible(true);
  };

  const handlePasswordResetClose = () => {
    setResetTeacher(null);
    setPasswordResetVisible(false);
  };

  const toggleRowSelection = (teacherId: string) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(teacherId)) {
      newSelected.delete(teacherId);
    } else {
      newSelected.add(teacherId);
    }
    setSelectedRows(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedRows.size === filteredTeachers.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(filteredTeachers.map((t) => t.id)));
    }
  };

  const handleBulkDelete = () => {
    if (selectedRows.size > 0) {
      onBulkDelete(Array.from(selectedRows));
      setSelectedRows(new Set());
    }
  };

  const allSelected = filteredTeachers.length > 0 && selectedRows.size === filteredTeachers.length;
  const someSelected = selectedRows.size > 0 && selectedRows.size < filteredTeachers.length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-semibold">Teachers</h1>
        <Button onClick={onAddNew} className="gap-2">
          <Plus className="w-4 h-4" />
          Add New
        </Button>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search by Name"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </div>
        <Select value={selectedSubject} onValueChange={setSelectedSubject}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Subject" />
          </SelectTrigger>
          <SelectContent>
            {SUBJECT_OPTIONS.map((subject) => (
              <SelectItem key={subject} value={subject}>
                {subject}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Bulk Actions */}
      {selectedRows.size > 0 && (
        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
          <span className="text-sm text-blue-700">
            {selectedRows.size} teacher(s) selected
          </span>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleBulkDelete}
            disabled={loading}
          >
            Delete Selected
          </Button>
        </div>
      )}

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={toggleSelectAll}
                    aria-label="Select all"
                  />
                </TableHead>
                {TEACHER_COLUMNS.map((column) => (
                  <TableHead key={column.key} className={column.width}>
                    {column.title}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && filteredTeachers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={TEACHER_COLUMNS.length + 1} className="text-center py-8">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : filteredTeachers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={TEACHER_COLUMNS.length + 1} className="text-center py-8">
                    No teachers found
                  </TableCell>
                </TableRow>
              ) : (
                filteredTeachers.map((teacher, index) => {
                  const isSelected = selectedRows.has(teacher.id);
                  return (
                    <TableRow
                      key={teacher.id}
                      className={cn(
                        isSelected && "bg-blue-50",
                        "hover:bg-gray-50"
                      )}
                    >
                      <TableCell>
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleRowSelection(teacher.id)}
                          aria-label={`Select ${teacher.firstName} ${teacher.lastName}`}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        {String(index + 1).padStart(2, "0")}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {teacher.firstName} {teacher.lastName}
                        </div>
                      </TableCell>
                      <TableCell>{teacher.publicUserId || "N/A"}</TableCell>
                      <TableCell>{teacher.class || "N/A"}</TableCell>
                      <TableCell>{teacher.subjects || "N/A"}</TableCell>
                      <TableCell>
                        {teacher.attendance?.percentage || "N/A"}
                      </TableCell>
                      <TableCell>{teacher.transport || "N/A"}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            teacher.salary === "DUE"
                              ? "destructive"
                              : teacher.salary === "PAID"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {teacher.salary || "N/A"}
                        </Badge>
                      </TableCell>
                      <TableCell>{teacher.contact || "N/A"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleViewDetails(teacher)}
                            className="h-8 w-8"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onEdit(teacher)}
                            className="h-8 w-8"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onDelete(teacher.id)}
                            disabled={loading}
                            className="h-8 w-8"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handlePasswordReset(teacher)}
                            className="h-8 w-8"
                          >
                            <Key className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
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

      {/* Modals */}
      <TeacherDetailModal
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          setTimeout(() => setSelectedTeacher(null), 300);
        }}
        teacher={selectedTeacher}
      />
      <PasswordResetModal
        visible={passwordResetVisible}
        onClose={handlePasswordResetClose}
        userId={resetTeacher?.id}
        userName={`${resetTeacher?.firstName || ""} ${resetTeacher?.lastName || ""}`}
        onSuccess={() => {
          // Toast will be handled by the modal
        }}
      />
    </div>
  );
}

