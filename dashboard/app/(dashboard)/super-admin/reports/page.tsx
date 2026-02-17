"use client";

import { useState } from "react";
import { useAttendanceReports, useFeeAnalytics, useAcademicReports, useSalaryReports } from "@/lib/hooks/use-reports";
import { useSchools } from "@/lib/hooks/use-super-admin";
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
import { BarChart3, TrendingUp, Users, DollarSign, GraduationCap, Calendar, School } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from "recharts";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";

export default function SuperAdminReportsPage() {
  const [activeTab, setActiveTab] = useState<"attendance" | "fees" | "academic" | "salary">("attendance");
  const [dateRange, setDateRange] = useState({
    startDate: format(startOfMonth(subMonths(new Date(), 1)), "yyyy-MM-dd"),
    endDate: format(endOfMonth(new Date()), "yyyy-MM-dd"),
  });
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>("");

  const { data: schoolsData } = useSchools();
  const schools = schoolsData?.data || [];

  const { data: attendanceData, isLoading: attendanceLoading } = useAttendanceReports({
    schoolId: selectedSchoolId || undefined,
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
  });

  const { data: feeData, isLoading: feeLoading } = useFeeAnalytics({
    schoolId: selectedSchoolId || undefined,
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
  });

  const { data: academicData, isLoading: academicLoading } = useAcademicReports({
    schoolId: selectedSchoolId || undefined,
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

  const getChartData = (data: any[], type: string) => {
    if (!data || data.length === 0) return [];
    
    if (type === "attendance") {
      return data.map((item: any) => ({
        date: format(new Date(item.date), "MMM dd"),
        present: item.present || 0,
        absent: item.absent || 0,
        late: item.late || 0,
      }));
    }
    
    if (type === "fees") {
      return data.map((item: any) => ({
        month: format(new Date(item.dueDate), "MMM"),
        paid: item.paid || 0,
        pending: item.pending || 0,
        amount: item.amount || 0,
      }));
    }
    
    return [];
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Multi-School Reports & Analytics</h1>
          <p className="text-gray-600 mt-1">Comprehensive reports and analytics across all schools</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="school">School</Label>
              <Select value={selectedSchoolId} onValueChange={setSelectedSchoolId}>
                <SelectTrigger id="school">
                  <SelectValue placeholder="All Schools" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Schools</SelectItem>
                  {schools.map((school: any) => (
                    <SelectItem key={school.id} value={school.id}>
                      {school.name}
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
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="attendance">
            <Users className="w-4 h-4 mr-2" />
            Attendance
          </TabsTrigger>
          <TabsTrigger value="fees">
            <DollarSign className="w-4 h-4 mr-2" />
            Fees
          </TabsTrigger>
          <TabsTrigger value="academic">
            <GraduationCap className="w-4 h-4 mr-2" />
            Academic
          </TabsTrigger>
          <TabsTrigger value="salary">
            <DollarSign className="w-4 h-4 mr-2" />
            Salary
          </TabsTrigger>
        </TabsList>

        {/* Attendance Reports */}
        <TabsContent value="attendance" className="space-y-4">
          {attendanceLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Total Present</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{attendanceStats.totalPresent || 0}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Total Absent</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{attendanceStats.totalAbsent || 0}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Average Attendance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{attendanceStats.averageAttendance || 0}%</div>
                  </CardContent>
                </Card>
              </div>

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
                      <Line type="monotone" dataKey="present" stroke="#678d3d" strokeWidth={2} />
                      <Line type="monotone" dataKey="absent" stroke="#ef4444" strokeWidth={2} />
                      <Line type="monotone" dataKey="late" stroke="#f59e0b" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Fee Analytics */}
        <TabsContent value="fees" className="space-y-4">
          {feeLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Total Collected</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">₹{feeStats.totalCollected?.toLocaleString() || 0}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Total Pending</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">₹{feeStats.totalPending?.toLocaleString() || 0}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Collection Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{feeStats.collectionRate || 0}%</div>
                  </CardContent>
                </Card>
              </div>

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
                      <Bar dataKey="paid" fill="#678d3d" />
                      <Bar dataKey="pending" fill="#ef4444" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Academic Reports */}
        <TabsContent value="academic" className="space-y-4">
          {academicLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{academicStats.totalStudents || 0}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Average Score</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{academicStats.averageScore || 0}%</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Pass Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{academicStats.passRate || 0}%</div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Academic Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">Academic performance data will be displayed here</p>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Salary Reports */}
        <TabsContent value="salary" className="space-y-4">
          {salaryLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">₹{salaryStats.totalPaid?.toLocaleString() || 0}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Total Staff</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{salaryStats.totalStaff || 0}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Average Salary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">₹{salaryStats.averageSalary?.toLocaleString() || 0}</div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Salary Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">Salary distribution data will be displayed here</p>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

