"use client";

import { useState } from "react";
import { useAttendanceReports, useFeeAnalytics, useAcademicReports, useSalaryReports } from "@/lib/hooks/use-reports";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BarChart3, TrendingUp, Users, DollarSign, GraduationCap, Calendar } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from "recharts";
import { format, subMonths, startOfMonth, endOfMonth, isValid } from "date-fns";
import { useClasses } from "@/lib/hooks/use-classes";

function safeFormatDate(value: string | Date | null | undefined, fmt: string): string {
  if (value == null) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  return isValid(d) ? format(d, fmt) : "—";
}

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<"attendance" | "fees" | "academic" | "salary">("attendance");
  const [dateRange, setDateRange] = useState({
    startDate: format(startOfMonth(subMonths(new Date(), 1)), "yyyy-MM-dd"),
    endDate: format(endOfMonth(new Date()), "yyyy-MM-dd"),
  });
  const [selectedClassId, setSelectedClassId] = useState<string>("all");

  const { data: classesData } = useClasses({ page: 1, limit: 1000 });
  const classes = classesData?.data || [];

  const { data: attendanceData, isLoading: attendanceLoading } = useAttendanceReports({
    classId: selectedClassId && selectedClassId !== "all" ? selectedClassId : undefined,
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
  });

  const { data: feeData, isLoading: feeLoading } = useFeeAnalytics({
    classId: selectedClassId || undefined,
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
  });

  const { data: academicData, isLoading: academicLoading } = useAcademicReports({
    classId: selectedClassId || undefined,
  });

  const { data: salaryData, isLoading: salaryLoading } = useSalaryReports({
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
  });

  const attendanceReport = attendanceData?.data || [];
  const attendanceStats = attendanceData?.statistics || {};
  const feeAnalytics = feeData?.data || [];
  const feeStats = feeData?.statistics || {};
  const academicReport = academicData?.data || [];
  const academicStats = academicData?.statistics || {};
  const salaryReport = salaryData?.data || [];
  const salaryStats = salaryData?.statistics || {};

  // Map academic marks to chart shape (studentName, totalMarks, percentage) with safe values
  const academicChartData = (academicReport || []).slice(0, 10).map((m: any) => {
    const student = m?.student;
    const name = student
      ? [student.firstName, student.lastName].filter(Boolean).join(" ").trim() || "—"
      : "—";
    return {
      studentName: name,
      totalMarks: Number(m?.totalMarks ?? m?.marksObtained ?? 0),
      percentage: Number(m?.percentage ?? 0),
    };
  });

  // Salary chart data: ensure amount and employeeName are safe
  const salaryChartData = (salaryReport || []).slice(0, 10).map((p: any) => ({
    employeeName: p?.employeeName ?? p?.userId ?? "—",
    amount: Number(p?.amount ?? p?.totalAmount ?? 0),
  }));

  const getChartData = (data: any[], type: string) => {
    if (!data || data.length === 0) return [];

    if (type === "attendance") {
      // Backend returns flat attendance records; aggregate by date
      const byDate: Record<string, { present: number; absent: number; late: number }> = {};
      for (const item of data) {
        const dateKey = item.date ? (typeof item.date === "string" ? item.date : item.date.toISOString?.()?.slice(0, 10) ?? "") : "";
        if (!dateKey) continue;
        if (!byDate[dateKey]) byDate[dateKey] = { present: 0, absent: 0, late: 0 };
        const status = (item.status || "").toUpperCase();
        if (status === "PRESENT") byDate[dateKey].present += 1;
        else if (status === "ABSENT") byDate[dateKey].absent += 1;
        else if (status === "LATE") byDate[dateKey].late += 1;
      }
      return Object.entries(byDate)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([dateKey, counts]) => ({
          date: safeFormatDate(dateKey, "MMM dd"),
          present: counts.present,
          absent: counts.absent,
          late: counts.late,
        }));
    }

    if (type === "fees") {
      return data.map((item: any) => ({
        month: safeFormatDate(item.dueDate ?? item.createdAt, "MMM"),
        paid: item.paymentStatus === "PAID" ? Number(item.paidAmount ?? item.amount ?? 0) : 0,
        pending: item.paymentStatus === "PENDING" ? Number(item.amount ?? 0) : 0,
        amount: Number(item.amount ?? 0),
      }));
    }

    return [];
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Reports & Analytics</h1>
          <p className="text-gray-600 mt-1">Comprehensive reports and analytics for school administration</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="class">Class</Label>
              <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                <SelectTrigger id="class">
                  <SelectValue placeholder="All Classes" />
                </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Classes</SelectItem>
                    {classes.map((cls: any) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.grade}{cls.division ? `-${cls.division}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
              />
            </div>
            <div className="flex items-end">
              <Button className="w-full">Generate Report</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="fees">Fees</TabsTrigger>
          <TabsTrigger value="academic">Academic</TabsTrigger>
          <TabsTrigger value="salary">Salary</TabsTrigger>
        </TabsList>

        {/* Attendance Reports */}
        <TabsContent value="attendance" className="space-y-6">
          {attendanceLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">Total Students</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <Users className="h-8 w-8 text-[#678d3d]" />
                      <div className="text-3xl font-bold">{attendanceStats.totalStudents || 0}</div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">Average Attendance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-8 w-8 text-green-600" />
                      <div className="text-3xl font-bold">{attendanceStats.averageAttendance || 0}%</div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">Present Days</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-8 w-8 text-blue-600" />
                      <div className="text-3xl font-bold">{attendanceStats.totalPresent || 0}</div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">Absent Days</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-8 w-8 text-red-600" />
                      <div className="text-3xl font-bold">{attendanceStats.totalAbsent || 0}</div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Attendance Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={getChartData(attendanceReport, "attendance")}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="present" stroke="#84cc16" strokeWidth={2} name="Present" />
                      <Line type="monotone" dataKey="absent" stroke="#ef4444" strokeWidth={2} name="Absent" />
                      <Line type="monotone" dataKey="late" stroke="#f59e0b" strokeWidth={2} name="Late" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Fee Analytics */}
        <TabsContent value="fees" className="space-y-6">
          {feeLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">Total Revenue</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-8 w-8 text-green-600" />
                      <div className="text-3xl font-bold">
                        ₹{feeStats.totalRevenue?.toLocaleString() || 0}
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">Paid Amount</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-8 w-8 text-blue-600" />
                      <div className="text-3xl font-bold">
                        ₹{feeStats.totalPaid?.toLocaleString() || 0}
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">Pending Amount</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-8 w-8 text-orange-600" />
                      <div className="text-3xl font-bold">
                        ₹{feeStats.totalPending?.toLocaleString() || 0}
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">Collection Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <Users className="h-8 w-8 text-purple-600" />
                      <div className="text-3xl font-bold">{feeStats.collectionRate || 0}%</div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Fee Collection Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={getChartData(feeAnalytics, "fees")}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="paid" fill="#84cc16" name="Paid" />
                      <Bar dataKey="pending" fill="#ef4444" name="Pending" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Academic Reports */}
        <TabsContent value="academic" className="space-y-6">
          {academicLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">Total Students</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <Users className="h-8 w-8 text-[#678d3d]" />
                      <div className="text-3xl font-bold">{academicStats.totalStudents || 0}</div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">Average Score</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <GraduationCap className="h-8 w-8 text-blue-600" />
                      <div className="text-3xl font-bold">{academicStats.averageScore || 0}%</div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">Pass Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-8 w-8 text-green-600" />
                      <div className="text-3xl font-bold">{academicStats.passRate || 0}%</div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">Top Performers</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-8 w-8 text-purple-600" />
                      <div className="text-3xl font-bold">{academicStats.topPerformers || 0}</div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Academic Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={academicChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="studentName" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="totalMarks" fill="#84cc16" name="Total Marks" />
                      <Bar dataKey="percentage" fill="#3b82f6" name="Percentage" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Salary Reports */}
        <TabsContent value="salary" className="space-y-6">
          {salaryLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">Total Paid</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-8 w-8 text-green-600" />
                      <div className="text-3xl font-bold">
                        ₹{salaryStats.totalPaid?.toLocaleString() || 0}
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">Total Employees</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <Users className="h-8 w-8 text-[#678d3d]" />
                      <div className="text-3xl font-bold">{salaryStats.totalEmployees || 0}</div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">Average Salary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-8 w-8 text-blue-600" />
                      <div className="text-3xl font-bold">
                        ₹{salaryStats.averageSalary?.toLocaleString() || 0}
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">Pending Payments</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-8 w-8 text-orange-600" />
                      <div className="text-3xl font-bold">{salaryStats.pendingPayments || 0}</div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Salary Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={salaryChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="employeeName" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="amount" fill="#84cc16" name="Salary Amount" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

