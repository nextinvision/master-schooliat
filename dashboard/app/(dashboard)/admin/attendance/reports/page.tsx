"use client";

import { useState, useMemo } from "react";
import { useAttendanceReports } from "@/lib/hooks/use-reports";
import { useClasses } from "@/lib/hooks/use-classes";
import { useStudents } from "@/lib/hooks/use-students";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  Calendar,
  Download,
  TrendingUp,
  Users,
  FileText,
  AlertCircle,
  CheckCircle,
  Clock,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { toast } from "sonner";

const COLORS = {
  PRESENT: "#84cc16",
  ABSENT: "#ef4444",
  LATE: "#f59e0b",
};

export default function AttendanceReportsPage() {
  const [dateRange, setDateRange] = useState({
    startDate: format(startOfMonth(subMonths(new Date(), 1)), "yyyy-MM-dd"),
    endDate: format(endOfMonth(new Date()), "yyyy-MM-dd"),
  });
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");

  // Fetch classes
  const { data: classesData, isLoading: classesLoading } = useClasses({ page: 1, limit: 1000 });
  const classes = classesData?.data || [];

  // Fetch students for selected class
  const { data: studentsData, isLoading: studentsLoading } = useStudents({
    page: 1,
    limit: 1000,
  });
  const allStudents = studentsData?.data || [];
  const filteredStudents = selectedClassId
    ? allStudents.filter((s: any) => s.studentProfile?.classId === selectedClassId)
    : [];

  // Fetch attendance reports
  const { data: reportsData, isLoading: reportsLoading, refetch } = useAttendanceReports({
    classId: selectedClassId || undefined,
    studentId: selectedStudentId || undefined,
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
  });

  const attendanceRecords = reportsData?.data || [];
  const statistics = reportsData?.statistics || {};

  // Process data for charts
  const dailyAttendanceData = useMemo(() => {
    if (!attendanceRecords || attendanceRecords.length === 0) return [];

    // Group by date
    const groupedByDate: Record<string, { present: number; absent: number; late: number }> = {};

    attendanceRecords.forEach((record: any) => {
      const dateKey = format(new Date(record.date), "MMM dd");
      if (!groupedByDate[dateKey]) {
        groupedByDate[dateKey] = { present: 0, absent: 0, late: 0 };
      }

      if (record.status === "PRESENT") {
        groupedByDate[dateKey].present++;
      } else if (record.status === "ABSENT") {
        groupedByDate[dateKey].absent++;
      } else if (record.status === "LATE") {
        groupedByDate[dateKey].late++;
      }
    });

    return Object.entries(groupedByDate)
      .map(([date, counts]) => ({
        date,
        ...counts,
      }))
      .sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateA.getTime() - dateB.getTime();
      });
  }, [attendanceRecords]);

  const statusDistributionData = useMemo(() => {
    const present = statistics.presentCount || 0;
    const absent = statistics.absentCount || 0;
    const late = statistics.lateCount || 0;
    const total = present + absent + late;

    return [
      { name: "Present", value: present, percentage: total > 0 ? ((present / total) * 100).toFixed(1) : 0 },
      { name: "Absent", value: absent, percentage: total > 0 ? ((absent / total) * 100).toFixed(1) : 0 },
      { name: "Late", value: late, percentage: total > 0 ? ((late / total) * 100).toFixed(1) : 0 },
    ].filter((item) => item.value > 0);
  }, [statistics]);

  const classWiseData = useMemo(() => {
    if (!attendanceRecords || attendanceRecords.length === 0) return [];

    const groupedByClass: Record<
      string,
      { present: number; absent: number; late: number; total: number }
    > = {};

    attendanceRecords.forEach((record: any) => {
      const className =
        record.student?.studentProfile?.class?.grade +
        (record.student?.studentProfile?.class?.division
          ? `-${record.student.studentProfile.class.division}`
          : "") || "Unknown";

      if (!groupedByClass[className]) {
        groupedByClass[className] = { present: 0, absent: 0, late: 0, total: 0 };
      }

      groupedByClass[className].total++;
      if (record.status === "PRESENT") {
        groupedByClass[className].present++;
      } else if (record.status === "ABSENT") {
        groupedByClass[className].absent++;
      } else if (record.status === "LATE") {
        groupedByClass[className].late++;
      }
    });

    return Object.entries(groupedByClass).map(([className, counts]) => ({
      className,
      ...counts,
      attendanceRate:
        counts.total > 0 ? ((counts.present / counts.total) * 100).toFixed(1) : 0,
    }));
  }, [attendanceRecords]);

  const handleExport = () => {
    // TODO: Implement PDF/Excel export
    toast.info("Export functionality coming soon");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PRESENT":
        return (
          <Badge className="bg-green-500 hover:bg-green-600">
            <CheckCircle className="h-3 w-3 mr-1" />
            Present
          </Badge>
        );
      case "ABSENT":
        return (
          <Badge variant="destructive">
            <AlertCircle className="h-3 w-3 mr-1" />
            Absent
          </Badge>
        );
      case "LATE":
        return (
          <Badge className="bg-yellow-500 hover:bg-yellow-600">
            <Clock className="h-3 w-3 mr-1" />
            Late
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Attendance Reports</h1>
          <p className="text-gray-600 mt-1">Comprehensive attendance analytics and reports</p>
        </div>
        <Button onClick={handleExport} className="gap-2" variant="outline">
          <Download className="h-4 w-4" />
          Export Report
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="class">Class</Label>
              {classesLoading ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                  <SelectTrigger id="class">
                    <SelectValue placeholder="All Classes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Classes</SelectItem>
                    {classes.map((cls: any) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.grade}
                        {cls.division ? `-${cls.division}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="student">Student</Label>
              {studentsLoading ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <Select
                  value={selectedStudentId}
                  onValueChange={setSelectedStudentId}
                  disabled={!selectedClassId}
                >
                  <SelectTrigger id="student">
                    <SelectValue placeholder={selectedClassId ? "Select Student" : "Select Class First"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Students</SelectItem>
                    {filteredStudents.map((student: any) => (
                      <SelectItem key={student.id} value={student.id}>
                        {student.firstName} {student.lastName} - {student.publicUserId || student.id.slice(0, 8)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      {reportsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Records</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <FileText className="h-8 w-8 text-blue-600" />
                <div className="text-3xl font-bold">{statistics.totalDays || 0}</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-green-600">Present</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div className="text-3xl font-bold text-green-600">
                  {statistics.presentCount || 0}
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-red-600">Absent</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-8 w-8 text-red-600" />
                <div className="text-3xl font-bold text-red-600">{statistics.absentCount || 0}</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-yellow-600">Attendance Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-8 w-8 text-yellow-600" />
                <div className="text-3xl font-bold text-yellow-600">
                  {statistics.attendanceRate || "0.00"}%
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts */}
      {reportsLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-96 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Daily Attendance Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Daily Attendance Trend</CardTitle>
            </CardHeader>
            <CardContent>
              {dailyAttendanceData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={dailyAttendanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="present"
                      stroke={COLORS.PRESENT}
                      strokeWidth={2}
                      name="Present"
                    />
                    <Line
                      type="monotone"
                      dataKey="absent"
                      stroke={COLORS.ABSENT}
                      strokeWidth={2}
                      name="Absent"
                    />
                    <Line
                      type="monotone"
                      dataKey="late"
                      stroke={COLORS.LATE}
                      strokeWidth={2}
                      name="Late"
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-gray-500">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                    <p>No data available for the selected period</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Status Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Status Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              {statusDistributionData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={statusDistributionData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry: any) => `${entry.name}: ${entry.percentage}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {statusDistributionData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            entry.name === "Present"
                              ? COLORS.PRESENT
                              : entry.name === "Absent"
                              ? COLORS.ABSENT
                              : COLORS.LATE
                          }
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-gray-500">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                    <p>No data available for the selected period</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Class-wise Attendance */}
          {classWiseData.length > 0 && (
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Class-wise Attendance</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={classWiseData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="className" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="present" fill={COLORS.PRESENT} name="Present" />
                    <Bar dataKey="absent" fill={COLORS.ABSENT} name="Absent" />
                    <Bar dataKey="late" fill={COLORS.LATE} name="Late" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Attendance Records Table */}
      <Card>
        <CardHeader>
          <CardTitle>Attendance Records</CardTitle>
        </CardHeader>
        <CardContent>
          {reportsLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : attendanceRecords.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>No attendance records found for the selected filters</p>
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
                    <TableHead>Late Arrival</TableHead>
                    <TableHead>Absence Reason</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendanceRecords.map((record: any, index: number) => (
                    <TableRow key={record.id || index}>
                      <TableCell className="font-medium">
                        {format(new Date(record.date), "MMM dd, yyyy")}
                      </TableCell>
                      <TableCell>
                        {record.student?.firstName || ""} {record.student?.lastName || ""}
                        {record.student?.publicUserId && (
                          <span className="text-gray-500 text-sm ml-2">
                            ({record.student.publicUserId})
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {record.student?.studentProfile?.class?.grade || "N/A"}
                        {record.student?.studentProfile?.class?.division
                          ? `-${record.student.studentProfile.class.division}`
                          : ""}
                      </TableCell>
                      <TableCell>{getStatusBadge(record.status)}</TableCell>
                      <TableCell>
                        {record.lateArrivalTime
                          ? format(new Date(record.lateArrivalTime), "hh:mm a")
                          : "N/A"}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {record.absenceReason || "N/A"}
                      </TableCell>
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

