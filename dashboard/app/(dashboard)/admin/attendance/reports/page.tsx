"use client";

import { useState } from "react";
import { useAttendanceReport } from "@/lib/hooks/use-reports";
import { useClassesContext } from "@/lib/context/classes-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { Download, Calendar, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import { format, subDays, subMonths } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function AttendanceReportsPage() {
  const { classes, isLoading: classesLoading } = useClassesContext();
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [startDate, setStartDate] = useState<string>(
    format(subMonths(new Date(), 1), "yyyy-MM-dd")
  );
  const [endDate, setEndDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));

  const { data, isLoading, isError } = useAttendanceReport({
    classId: selectedClassId || undefined,
    startDate,
    endDate,
  });

  const reportData = data?.data || [];
  const statistics = data?.statistics || {};

  const handleExportPDF = async () => {
    if (reportData.length === 0) {
      toast.error("No data to export");
      return;
    }

    const { exportToPDF, formatDataForExport } = await import("@/lib/utils/export");
    const { data: formattedData, headers } = formatDataForExport(reportData, {
      Date: "date",
      Student: "student",
      Class: "class",
      Status: "status",
      "Late Time": "lateArrivalTime",
      "Absence Reason": "absenceReason",
    });

    // Format the data properly
    const exportData = reportData.map((record: any) => ({
      Date: format(new Date(record.date), "MMM dd, yyyy"),
      Student: `${record.student?.firstName || ""} ${record.student?.lastName || ""}`.trim(),
      Class: `${record.class?.grade || ""}${record.class?.division ? `-${record.class.division}` : ""}`,
      Status: record.status,
      "Late Time": record.lateArrivalTime || "N/A",
      "Absence Reason": record.absenceReason || "N/A",
    }));

    await exportToPDF(
      exportData,
      `attendance-report-${startDate}-to-${endDate}`,
      ["Date", "Student", "Class", "Status", "Late Time", "Absence Reason"],
      `Attendance Report (${format(new Date(startDate), "MMM dd, yyyy")} - ${format(new Date(endDate), "MMM dd, yyyy")})`
    );
  };

  const handleExportExcel = () => {
    if (reportData.length === 0) {
      toast.error("No data to export");
      return;
    }

    const { exportToExcel } = require("@/lib/utils/export");
    const exportData = reportData.map((record: any) => ({
      Date: format(new Date(record.date), "MMM dd, yyyy"),
      Student: `${record.student?.firstName || ""} ${record.student?.lastName || ""}`.trim(),
      Class: `${record.class?.grade || ""}${record.class?.division ? `-${record.class.division}` : ""}`,
      Status: record.status,
      "Late Time": record.lateArrivalTime || "N/A",
      "Absence Reason": record.absenceReason || "N/A",
    }));

    exportToExcel(
      exportData,
      `attendance-report-${startDate}-to-${endDate}`,
      ["Date", "Student", "Class", "Status", "Late Time", "Absence Reason"]
    );
  };

  const getQuickDateRange = (days: number) => {
    setEndDate(format(new Date(), "yyyy-MM-dd"));
    setStartDate(format(subDays(new Date(), days), "yyyy-MM-dd"));
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Attendance Reports</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExportPDF}>
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
          <Button variant="outline" onClick={handleExportExcel}>
            <Download className="h-4 w-4 mr-2" />
            Export Excel
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Class</Label>
              {classesLoading ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Classes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Classes</SelectItem>
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
              <Label>Start Date</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>End Date</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Quick Range</Label>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => getQuickDateRange(7)}
                  className="flex-1"
                >
                  7 Days
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => getQuickDateRange(30)}
                  className="flex-1"
                >
                  30 Days
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Records</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.totalRecords || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-600">Present</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {statistics.presentCount || 0}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {statistics.totalRecords
                ? ((statistics.presentCount / statistics.totalRecords) * 100).toFixed(1)
                : 0}
              %
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-600">Absent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{statistics.absentCount || 0}</div>
            <p className="text-xs text-gray-500 mt-1">
              {statistics.totalRecords
                ? ((statistics.absentCount / statistics.totalRecords) * 100).toFixed(1)
                : 0}
              %
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-yellow-600">Late</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{statistics.lateCount || 0}</div>
            <p className="text-xs text-gray-500 mt-1">
              {statistics.totalRecords
                ? ((statistics.lateCount / statistics.totalRecords) * 100).toFixed(1)
                : 0}
              %
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Report Table */}
      <Card>
        <CardHeader>
          <CardTitle>Attendance Details</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : isError ? (
            <div className="text-center py-8 text-red-500">
              Failed to load attendance report
            </div>
          ) : reportData.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>No attendance records found for the selected period</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#e5ffc7]">
                    <TableHead>Date</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Late Time</TableHead>
                    <TableHead>Absence Reason</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportData.map((record: any) => (
                    <TableRow key={record.id}>
                      <TableCell>{format(new Date(record.date), "MMM dd, yyyy")}</TableCell>
                      <TableCell className="font-medium">
                        {record.student?.firstName} {record.student?.lastName}
                      </TableCell>
                      <TableCell>
                        {record.class?.grade}
                        {record.class?.division ? `-${record.class.division}` : ""}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            record.status === "PRESENT"
                              ? "bg-green-500 hover:bg-green-600"
                              : record.status === "LATE"
                              ? "bg-yellow-500 hover:bg-yellow-600"
                              : "bg-red-500 hover:bg-red-600"
                          }
                        >
                          {record.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{record.lateArrivalTime || "N/A"}</TableCell>
                      <TableCell>{record.absenceReason || "N/A"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

