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
import { useClassFilters } from "@/lib/hooks/use-class-filters";
import { searchStudentsByName } from "@/lib/utils/search-utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StudentDetailModal } from "./student-detail-modal";
import { PasswordResetModal } from "./password-reset-modal";
import { cn } from "@/lib/utils";

const STUDENT_COLUMNS = [
  { key: "no", title: "No", width: "w-16" },
  { key: "student", title: "Student", width: "w-48" },
  { key: "rollNo", title: "Roll No", width: "w-32" },
  { key: "class", title: "Class", width: "w-28" },
  { key: "fatherName", title: "Father Name", width: "w-40" },
  { key: "attendance", title: "Attendance", width: "w-28" },
  { key: "transport", title: "Transport", width: "w-28" },
  { key: "fees", title: "Fees", width: "w-24" },
  { key: "contact", title: "Contact", width: "w-40" },
  { key: "action", title: "Action", width: "w-32" },
];

interface StudentsTableProps {
  students: any[];
  onAddNew: () => void;
  onEdit: (student: any) => void;
  onDelete: (studentId: string) => void;
  onBulkDelete: (ids: string[]) => void;
  page: number;
  onPageChange: (page: number) => void;
  serverTotalPages: number;
  loading: boolean;
  onRefresh: () => void;
}

export function StudentsTable({
  students,
  onAddNew,
  onEdit,
  onDelete,
  onBulkDelete,
  page,
  onPageChange,
  serverTotalPages,
  loading,
}: StudentsTableProps) {
  const { classFilter, divisionFilter } = useClassFilters();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClass, setSelectedClass] = useState(classFilter.defaultValue);
  const [selectedDivision, setSelectedDivision] = useState(divisionFilter.defaultValue);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [passwordResetVisible, setPasswordResetVisible] = useState(false);
  const [resetStudent, setResetStudent] = useState<any>(null);

  // Filter and search
  let filteredStudents = students;
  
  if (searchQuery.trim()) {
    filteredStudents = searchStudentsByName(filteredStudents, searchQuery);
  }

  if (selectedClass !== classFilter.defaultValue) {
    filteredStudents = classFilter.onFilter(filteredStudents, selectedClass);
  }

  if (selectedDivision !== divisionFilter.defaultValue) {
    filteredStudents = divisionFilter.onFilter(filteredStudents, selectedDivision);
  }

  const handleViewDetails = (student: any) => {
    setSelectedStudent(student);
    setModalVisible(true);
  };

  const handlePasswordReset = (student: any) => {
    setResetStudent(student);
    setPasswordResetVisible(true);
  };

  const toggleRowSelection = (id: string) => {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedRows.size === filteredStudents.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(filteredStudents.map((s) => s.id)));
    }
  };

  const isAllSelected = filteredStudents.length > 0 && selectedRows.size === filteredStudents.length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Students</h1>
        <Button onClick={onAddNew} className="gap-2">
          <Plus className="h-4 w-4" />
          Add New
        </Button>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg p-4 space-y-4 border">
        <div className="flex items-center gap-4 flex-wrap">
          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Select Class" />
            </SelectTrigger>
            <SelectContent>
              {classFilter.options.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedDivision} onValueChange={setSelectedDivision}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Select Division" />
            </SelectTrigger>
            <SelectContent>
              {divisionFilter.options.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex-1 min-w-[200px] max-w-[280px]">
            <Input
              placeholder="Search by Name"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>
        </div>

        {selectedRows.size > 0 && (
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{selectedRows.size} selected</Badge>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onBulkDelete(Array.from(selectedRows))}
            >
              Delete Selected
            </Button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-schooliat-tint">
                <TableHead className="w-12">
                  <Checkbox
                    checked={isAllSelected}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                {STUDENT_COLUMNS.map((column) => (
                  <TableHead key={column.key} className={column.width}>
                    {column.title}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={STUDENT_COLUMNS.length + 1} className="text-center py-8">
                    No students found
                  </TableCell>
                </TableRow>
              ) : (
                filteredStudents.map((student, index) => (
                  <TableRow
                    key={student.id}
                    className={cn(
                      selectedRows.has(student.id) && "bg-blue-50"
                    )}
                  >
                    <TableCell>
                      <Checkbox
                        checked={selectedRows.has(student.id)}
                        onCheckedChange={() => toggleRowSelection(student.id)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      {String(index + 1).padStart(2, "0")}
                    </TableCell>
                    <TableCell className="font-medium">
                      {student.firstName} {student.lastName}
                    </TableCell>
                    <TableCell>
                      {student.studentProfile?.rollNumber || "N/A"}
                    </TableCell>
                    <TableCell>
                      {student.studentProfile?.class?.grade || "N/A"}-
                      {student.studentProfile?.class?.division || ""}
                    </TableCell>
                    <TableCell>
                      {student.studentProfile?.fatherName || "N/A"}
                    </TableCell>
                    <TableCell className="text-center">
                      {student.attendance?.percentage || "N/A"}%
                    </TableCell>
                    <TableCell>{student.transport || "N/A"}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          student.fees === "DUE" ? "destructive" : "default"
                        }
                        className={
                          student.fees === "PAID"
                            ? "bg-primary hover:bg-schooliat-primary-dark"
                            : ""
                        }
                      >
                        {student.fees || "N/A"}
                      </Badge>
                    </TableCell>
                    <TableCell>{student.contact || "N/A"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleViewDetails(student)}
                          className="h-8 w-8"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onEdit(student)}
                          className="h-8 w-8"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onDelete(student.id)}
                          disabled={loading}
                          className="h-8 w-8"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handlePasswordReset(student)}
                          className="h-8 w-8"
                        >
                          <Key className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between p-4 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page - 1)}
            disabled={page === 0 || loading}
          >
            Previous
          </Button>
          <span className="text-sm text-gray-600">
            Page {page + 1} of {serverTotalPages || 1}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page + 1)}
            disabled={page + 1 >= (serverTotalPages || 1) || loading}
          >
            Next
          </Button>
        </div>
      </div>

      {/* Modals */}
      <StudentDetailModal
        visible={modalVisible && !!selectedStudent}
        onClose={() => {
          setModalVisible(false);
          setTimeout(() => setSelectedStudent(null), 300);
        }}
        student={selectedStudent}
      />

      <PasswordResetModal
        visible={passwordResetVisible}
        onClose={() => {
          setPasswordResetVisible(false);
          setResetStudent(null);
        }}
        userId={resetStudent?.id}
        userName={`${resetStudent?.firstName || ""} ${resetStudent?.lastName || ""}`}
      />
    </div>
  );
}

