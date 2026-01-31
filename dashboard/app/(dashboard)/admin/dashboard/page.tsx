"use client";

import { useDashboard } from "@/lib/hooks/use-dashboard";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, GraduationCap, UserCheck, Briefcase } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

export default function AdminDashboardPage() {
  const { data, isLoading } = useDashboard();
  const stats = data?.data || {};

  const school = stats.school || {};
  const userCounts = stats.userCounts || {};
  const students = userCounts.students || { total: 0, boys: 0, girls: 0 };
  const notices = stats.notices || [];

  const totalStudents = students.total || 0;
  const boysCount = students.boys || 0;
  const girlsCount = students.girls || 0;
  const teachersCount = userCounts.teachers || 0;
  const totalStaff = userCounts.staff || 0;

  const pieData = [
    { name: "Boys", value: boysCount, color: "#4b830d" },
    { name: "Girls", value: girlsCount, color: "#f59e0b" },
  ];

  const earningsData = [
    { month: "Jan", income: 4000, expense: 2400 },
    { month: "Feb", income: 3000, expense: 1398 },
    { month: "Mar", income: 2000, expense: 9800 },
    { month: "Apr", income: 2780, expense: 3908 },
    { month: "May", income: 1890, expense: 4800 },
    { month: "Jun", income: 2390, expense: 3800 },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Card */}
      <Card className="bg-gradient-to-r from-[#678d3d] to-[#8ab35c] text-white">
        <CardContent className="p-6 lg:p-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-2xl lg:text-3xl font-bold mb-2">
                Welcome, {school.name || "School Team"}!
              </h1>
              <p className="text-white/90 text-sm lg:text-base">
                Manage your school operations with ease. Stay updated on
                academics, attendance and finances, and more, all at one place.
                Let's keep shaping a brighter future together.
              </p>
            </div>
            <div className="hidden lg:block">
              <div className="w-48 h-32 bg-white/20 rounded-lg flex items-center justify-center">
                <span className="text-white/50">Illustration</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-[#4B7D3A] text-white">
          <CardContent className="p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm lg:text-base opacity-90">Students</p>
                <p className="text-2xl lg:text-3xl font-bold mt-2">
                  {totalStudents.toLocaleString()}
                </p>
              </div>
              <UserCheck className="h-8 w-8 lg:h-10 lg:w-10 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#B7F08A]">
          <CardContent className="p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm lg:text-base text-gray-700">Teachers</p>
                <p className="text-2xl lg:text-3xl font-bold mt-2 text-gray-900">
                  {teachersCount.toLocaleString()}
                </p>
              </div>
              <GraduationCap className="h-8 w-8 lg:h-10 lg:w-10 text-gray-700" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#4B7D3A] text-white">
          <CardContent className="p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm lg:text-base opacity-90">Staff</p>
                <p className="text-2xl lg:text-3xl font-bold mt-2">
                  {totalStaff.toLocaleString()}
                </p>
              </div>
              <Briefcase className="h-8 w-8 lg:h-10 lg:w-10 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm lg:text-base text-gray-600">Notices</p>
                <p className="text-2xl lg:text-3xl font-bold mt-2">
                  {notices.length}
                </p>
              </div>
              <Users className="h-8 w-8 lg:h-10 lg:w-10 text-gray-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Earnings Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Earnings</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={earningsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="income"
                  stroke="#84cc16"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="expense"
                  stroke="#bbf7d0"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Students Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Students Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-[#4b830d]" />
                <span className="text-sm">Boys: {boysCount}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-[#f59e0b]" />
                <span className="text-sm">Girls: {girlsCount}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

