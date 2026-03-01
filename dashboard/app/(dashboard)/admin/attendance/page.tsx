"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAttendance, useMarkAttendance, useMarkBulkAttendance, useAttendanceStatistics, useAttendancePeriods } from "@/lib/hooks/use-attendance";
import { AttendanceMarkingTable } from "@/components/attendance/attendance-marking-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Calendar, Download, BarChart3 } from "lucide-react";
import { format } from "date-fns";
import { useClassesContext } from "@/lib/context/classes-context";
import { useStudentsPage } from "@/lib/hooks/use-students";

export default function AttendancePage() {
  const router = useRouter();
  const { classes, isLoading: classesLoading } = useClassesContext();
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const [viewMode, setViewMode] = useState<"mark" | "view" | "report">("mark");

  // Fetch students for the selected class
  const { data: studentsData, isLoading: studentsLoading } = useStudentsPage(1, 1000);
  const students = studentsData?.data || [];

  // Filter students by class
  const filteredStudents = selectedClassId
    ? students.filter((s: any) => s.studentProfile?.classId === selectedClassId)
    : [];

  // Fetch attendance for selected date and class
  const { data: attendanceData, isLoading: attendanceLoading, refetch } = useAttendance({
    classId: selectedClassId,
    date: selectedDate,
  });

  // Fetch attendance statistics
  const { data: statisticsData } = useAttendanceStatistics({
    classId: selectedClassId,
    startDate: format(new Date(new Date().setMonth(new Date().getMonth() - 1)), "yyyy-MM-dd"),
    endDate: format(new Date(), "yyyy-MM-dd"),
  });

  // Fetch attendance periods
  const { data: periodsData } = useAttendancePeriods();
  const periods = periodsData?.data || [];

  const markAttendance = useMarkAttendance();
  const markBulkAttendance = useMarkBulkAttendance();

  const handleMarkAttendance = useCallback(
    async (data: {
      studentId: string;
      status: "PRESENT" | "ABSENT" | "LATE";
      lateArrivalTime?: string;
      absenceReason?: string;
    }) => {
      if (!selectedClassId) {
        toast.error("Please select a class");
        return;
      }

      try {
        await markAttendance.mutateAsync({
          ...data,
          classId: selectedClassId,
          date: selectedDate,
        });
        toast.success("Attendance marked successfully");
        refetch();
      } catch (error: any) {
        toast.error(error?.message || "Failed to mark attendance");
      }
    },
    [selectedClassId, selectedDate, markAttendance, refetch]
  );

  const handleBulkMark = useCallback(
    async (status: "PRESENT" | "ABSENT" | "LATE") => {
      if (!selectedClassId) {
        toast.error("Please select a class");
        return;
      }

      if (filteredStudents.length === 0) {
        toast.error("No students found for this class");
        return;
      }

      try {
        const attendances = filteredStudents.map((student: any) => ({
          studentId: student.id,
          classId: selectedClassId,
          date: selectedDate,
          status,
        }));

        await markBulkAttendance.mutateAsync({ attendances });
        toast.success(`Marked all students as ${status}`);
        refetch();
      } catch (error: any) {
        toast.error(error?.message || "Failed to mark bulk attendance");
      }
    },
    [selectedClassId, selectedDate, filteredStudents, markBulkAttendance, refetch]
  );

  const statistics = statisticsData?.data || {};
  const presentCount = statistics.presentCount || 0;
  const absentCount = statistics.absentCount || 0;
  const lateCount = statistics.lateCount || 0;
  const totalCount = statistics.totalCount || filteredStudents.length;
  const attendancePercentage = totalCount > 0 ? ((presentCount / totalCount) * 100).toFixed(1) : "0";

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Attendance Management</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setViewMode(viewMode === "mark" ? "view" : "mark")}
          >
            {viewMode === "mark" ? "View Mode" : "Mark Mode"}
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push("/admin/attendance/reports")}
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Reports
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Class</Label>
              {classesLoading ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes?.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.division ? `${cls.grade}-${cls.division}` : cls.grade}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="space-y-2">
              <Label>Date</Label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Period (Optional)</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="All Periods" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Periods</SelectItem>
                  {periods.map((period: any) => (
                    <SelectItem key={period.id} value={period.id}>
                      {period.name} ({period.startTime} - {period.endTime})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      {selectedClassId && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Students</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-primary">Present</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{presentCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-red-600">Absent</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{absentCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-yellow-600">Attendance %</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{attendancePercentage}%</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Attendance Table */}
      {selectedClassId ? (
        studentsLoading ? (
          <Card>
            <CardContent className="pt-6">
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>
                Attendance for {format(new Date(selectedDate), "MMMM dd, yyyy")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AttendanceMarkingTable
                students={filteredStudents.map((student: any) => ({
                  id: student.id,
                  firstName: student.firstName,
                  lastName: student.lastName,
                  rollNumber: student.studentProfile?.rollNumber,
                  attendance: attendanceData?.data?.find(
                    (a: any) => a.studentId === student.id
                  ),
                }))}
                date={selectedDate}
                classId={selectedClassId}
                onMarkAttendance={handleMarkAttendance}
                onBulkMark={handleBulkMark}
                isLoading={markAttendance.isPending || markBulkAttendance.isPending}
              />
            </CardContent>
          </Card>
        )
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12 text-gray-500">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>Please select a class to view and mark attendance</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

