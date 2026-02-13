"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, XCircle, Clock, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  rollNumber?: string;
  attendance?: {
    status: "PRESENT" | "ABSENT" | "LATE";
    lateArrivalTime?: string;
    absenceReason?: string;
  };
}

interface AttendanceMarkingTableProps {
  students: Student[];
  date: string;
  classId: string;
  onMarkAttendance: (data: {
    studentId: string;
    status: "PRESENT" | "ABSENT" | "LATE";
    lateArrivalTime?: string;
    absenceReason?: string;
  }) => void;
  onBulkMark: (status: "PRESENT" | "ABSENT" | "LATE") => void;
  isLoading?: boolean;
}

export function AttendanceMarkingTable({
  students,
  date,
  classId,
  onMarkAttendance,
  onBulkMark,
  isLoading = false,
}: AttendanceMarkingTableProps) {
  const [attendanceData, setAttendanceData] = useState<Record<string, {
    status: "PRESENT" | "ABSENT" | "LATE";
    lateArrivalTime?: string;
    absenceReason?: string;
  }>>(() => {
    const initial: Record<string, any> = {};
    students.forEach((student) => {
      initial[student.id] = student.attendance || { status: "PRESENT" };
    });
    return initial;
  });

  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());

  const handleStatusChange = (studentId: string, status: "PRESENT" | "ABSENT" | "LATE") => {
    setAttendanceData((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status,
        lateArrivalTime: status === "LATE" ? prev[studentId]?.lateArrivalTime : undefined,
        absenceReason: status === "ABSENT" ? prev[studentId]?.absenceReason : undefined,
      },
    }));
  };

  const handleLateTimeChange = (studentId: string, time: string) => {
    setAttendanceData((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        lateArrivalTime: time,
      },
    }));
  };

  const handleAbsenceReasonChange = (studentId: string, reason: string) => {
    setAttendanceData((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        absenceReason: reason,
      },
    }));
  };

  const handleSave = (studentId: string) => {
    const data = attendanceData[studentId];
    if (data) {
      onMarkAttendance({
        studentId,
        ...data,
      });
    }
  };

  const handleBulkMark = (status: "PRESENT" | "ABSENT" | "LATE") => {
    const updates: Record<string, any> = {};
    selectedStudents.forEach((studentId) => {
      updates[studentId] = { status };
    });
    setAttendanceData((prev) => ({ ...prev, ...updates }));
    onBulkMark(status);
  };

  const toggleStudentSelection = (studentId: string) => {
    setSelectedStudents((prev) => {
      const next = new Set(prev);
      if (next.has(studentId)) {
        next.delete(studentId);
      } else {
        next.add(studentId);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedStudents.size === students.length) {
      setSelectedStudents(new Set());
    } else {
      setSelectedStudents(new Set(students.map((s) => s.id)));
    }
  };

  const getStatusIcon = (status: "PRESENT" | "ABSENT" | "LATE") => {
    switch (status) {
      case "PRESENT":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case "ABSENT":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "LATE":
        return <Clock className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getStatusBadge = (status: "PRESENT" | "ABSENT" | "LATE") => {
    switch (status) {
      case "PRESENT":
        return <Badge className="bg-green-500 hover:bg-green-600">Present</Badge>;
      case "ABSENT":
        return <Badge variant="destructive">Absent</Badge>;
      case "LATE":
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">Late</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Bulk Actions */}
      {selectedStudents.size > 0 && (
        <div className="bg-white rounded-lg p-4 border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{selectedStudents.size} selected</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleBulkMark("PRESENT")}
              disabled={isLoading}
            >
              Mark All Present
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleBulkMark("ABSENT")}
              disabled={isLoading}
            >
              Mark All Absent
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleBulkMark("LATE")}
              disabled={isLoading}
            >
              Mark All Late
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#e5ffc7]">
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedStudents.size === students.length && students.length > 0}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead className="w-16">No</TableHead>
                <TableHead>Student Name</TableHead>
                <TableHead className="w-24">Roll No</TableHead>
                <TableHead className="w-32">Status</TableHead>
                <TableHead className="w-40">Late Time</TableHead>
                <TableHead>Absence Reason</TableHead>
                <TableHead className="w-24">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    No students found
                  </TableCell>
                </TableRow>
              ) : (
                students.map((student, index) => {
                  const attendance = attendanceData[student.id] || { status: "PRESENT" as const };
                  return (
                    <TableRow key={student.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedStudents.has(student.id)}
                          onCheckedChange={() => toggleStudentSelection(student.id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        {String(index + 1).padStart(2, "0")}
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400" />
                          {student.firstName} {student.lastName}
                        </div>
                      </TableCell>
                      <TableCell>{student.rollNumber || "N/A"}</TableCell>
                      <TableCell>
                        <Select
                          value={attendance.status}
                          onValueChange={(value: "PRESENT" | "ABSENT" | "LATE") =>
                            handleStatusChange(student.id, value)
                          }
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="PRESENT">
                              <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                                Present
                              </div>
                            </SelectItem>
                            <SelectItem value="ABSENT">
                              <div className="flex items-center gap-2">
                                <XCircle className="h-4 w-4 text-red-600" />
                                Absent
                              </div>
                            </SelectItem>
                            <SelectItem value="LATE">
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-yellow-600" />
                                Late
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        {attendance.status === "LATE" ? (
                          <Input
                            type="time"
                            value={attendance.lateArrivalTime || ""}
                            onChange={(e) => handleLateTimeChange(student.id, e.target.value)}
                            className="w-full"
                          />
                        ) : (
                          <span className="text-gray-400">N/A</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {attendance.status === "ABSENT" ? (
                          <Input
                            placeholder="Reason for absence"
                            value={attendance.absenceReason || ""}
                            onChange={(e) => handleAbsenceReasonChange(student.id, e.target.value)}
                            className="w-full"
                          />
                        ) : (
                          <span className="text-gray-400">N/A</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          onClick={() => handleSave(student.id)}
                          disabled={isLoading}
                          className="bg-[#4CAF50] hover:bg-[#45a049]"
                        >
                          Save
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

