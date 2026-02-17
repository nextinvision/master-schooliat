"use client";

import { useDashboard } from "@/lib/hooks/use-dashboard";
import { PremiumLoadingSkeleton } from "@/components/dashboard/premium-loading-skeleton";
import { PremiumStatCard } from "@/components/dashboard/premium-stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, GraduationCap, UserCheck, Briefcase, Bell } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { CalendarWidget } from "@/components/dashboard/calendar-widget";
import { NoticeBoardWidget } from "@/components/dashboard/notice-board-widget";
import { FinancialOverviewWidget } from "@/components/dashboard/financial-overview-widget";
import { FeeStatusWidget } from "@/components/dashboard/fee-status-widget";
import { cn } from "@/lib/utils";

export default function AdminDashboardPage() {
  const { data, isLoading } = useDashboard();
  const stats = data?.data || {};

  const school = stats.school || {};
  const userCounts = stats.userCounts || {};
  const students = userCounts.students || { total: 0, boys: 0, girls: 0 };
  const notices = stats.notices || [];
  const installments = stats.installments || {};
  const financial = stats.financial || {};
  const calendar = stats.calendar || {};

  const totalStudents = students.total || 0;
  const boysCount = students.boys || 0;
  const girlsCount = students.girls || 0;
  const teachersCount = userCounts.teachers || 0;
  const totalStaff = userCounts.staff || 0;

  const pieData = [
    { name: "Boys", value: boysCount, color: "#4b830d" },
    { name: "Girls", value: girlsCount, color: "#f59e0b" },
  ];

  // Use real earnings data from API
  const earningsData = financial.monthlyEarnings || [
    { month: "Jan", income: 0, expense: 0 },
    { month: "Feb", income: 0, expense: 0 },
    { month: "Mar", income: 0, expense: 0 },
    { month: "Apr", income: 0, expense: 0 },
    { month: "May", income: 0, expense: 0 },
    { month: "Jun", income: 0, expense: 0 },
    { month: "Jul", income: 0, expense: 0 },
    { month: "Aug", income: 0, expense: 0 },
    { month: "Sep", income: 0, expense: 0 },
    { month: "Oct", income: 0, expense: 0 },
    { month: "Nov", income: 0, expense: 0 },
    { month: "Dec", income: 0, expense: 0 },
  ];

  if (isLoading) {
    return <PremiumLoadingSkeleton />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Card with Premium Styling */}
      <Card 
        className={cn(
          "bg-gradient-to-r from-[#678d3d] via-[#8ab35c] to-[#b8df79] text-white",
          "relative overflow-hidden shadow-2xl",
          "animate-slide-up"
        )}
      >
        {/* Animated Background Elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 animate-pulse" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2 animate-pulse" style={{ animationDelay: "1s" }} />
        
        <CardContent className="p-6 lg:p-8 relative z-10">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="flex-1 animate-slide-in-left">
              <h1 className="text-2xl lg:text-3xl font-bold mb-2 animate-fade-in">
                Welcome, {school.name || "School Team"}! 👋
              </h1>
              <p className="text-white/90 text-sm lg:text-base leading-relaxed">
                Manage your school operations with ease. Stay updated on
                academics, attendance and finances, and more, all at one place.
                Let's keep shaping a brighter future together.
              </p>
            </div>
            <div className="hidden lg:block animate-scale-in" style={{ animationDelay: "0.2s" }}>
              <div className="w-48 h-32 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center border border-white/30 glass-effect">
                <span className="text-white/70 text-sm">Illustration</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid with Premium Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <PremiumStatCard
          title="Students"
          value={totalStudents}
          icon={UserCheck}
          gradient="from-[#4B7D3A] to-[#678d3d]"
          delay={0.1}
          animateCount={true}
        />
        <PremiumStatCard
          title="Teachers"
          value={teachersCount}
          icon={GraduationCap}
          gradient="from-[#B7F08A] to-[#9ae06a]"
          textColor="text-gray-900"
          delay={0.2}
          animateCount={true}
        />
        <PremiumStatCard
          title="Staff"
          value={totalStaff}
          icon={Briefcase}
          gradient="from-[#4B7D3A] to-[#678d3d]"
          delay={0.3}
          animateCount={true}
        />
        <PremiumStatCard
          title="Notices"
          value={notices.length}
          icon={Bell}
          gradient="from-gray-50 to-gray-100"
          textColor="text-gray-900"
          delay={0.4}
          animateCount={true}
        />
      </div>

      {/* Second Row: Calendar and Notice Board with Animations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div 
          className="animate-slide-up"
          style={{ animationDelay: "0.5s", opacity: 0, animationFillMode: "forwards" }}
        >
          <CalendarWidget
            events={calendar.events || []}
            currentMonth={calendar.currentMonth}
            currentYear={calendar.currentYear}
          />
        </div>
        <div 
          className="animate-slide-up"
          style={{ animationDelay: "0.6s", opacity: 0, animationFillMode: "forwards" }}
        >
          <NoticeBoardWidget notices={notices} />
        </div>
      </div>

      {/* Third Row: Financial Overview and Fee Status with Animations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div 
          className="animate-slide-up"
          style={{ animationDelay: "0.7s", opacity: 0, animationFillMode: "forwards" }}
        >
          <FinancialOverviewWidget
            totalIncome={financial.totalIncome}
            totalSalary={financial.totalSalary}
            incomeChangePercent={financial.incomeChangePercent}
            salaryChangePercent={financial.salaryChangePercent}
            currentYear={installments.currentYear}
          />
        </div>
        <div 
          className="animate-slide-up"
          style={{ animationDelay: "0.8s", opacity: 0, animationFillMode: "forwards" }}
        >
          <FeeStatusWidget
            paid={installments.paid}
            pending={installments.pending}
            partiallyPaid={installments.partiallyPaid}
            currentYear={installments.currentYear}
            currentInstallmentNumber={installments.currentInstallmentNumber}
          />
        </div>
      </div>

      {/* Charts Row with Premium Animations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Earnings Chart */}
        <Card 
          className={cn(
            "card-hover-lift animate-scale-in",
            "transition-all duration-300 hover:shadow-xl"
          )}
          style={{ animationDelay: "0.9s", opacity: 0, animationFillMode: "forwards" }}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              Earnings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart 
                data={earningsData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.3} />
                <XAxis 
                  dataKey="month" 
                  stroke="#6b7280"
                  style={{ fontSize: "12px" }}
                />
                <YAxis 
                  stroke="#6b7280"
                  style={{ fontSize: "12px" }}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="income"
                  stroke="#84cc16"
                  strokeWidth={3}
                  name="Income"
                  dot={{ fill: "#84cc16", r: 5, strokeWidth: 2, stroke: "#fff" }}
                  activeDot={{ r: 7 }}
                  animationDuration={1000}
                />
                <Line
                  type="monotone"
                  dataKey="expense"
                  stroke="#bbf7d0"
                  strokeWidth={3}
                  name="Expense"
                  dot={{ fill: "#bbf7d0", r: 5, strokeWidth: 2, stroke: "#fff" }}
                  activeDot={{ r: 7 }}
                  animationDuration={1000}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Students Distribution */}
        <Card 
          className={cn(
            "card-hover-lift animate-scale-in",
            "transition-all duration-300 hover:shadow-xl"
          )}
          style={{ animationDelay: "1s", opacity: 0, animationFillMode: "forwards" }}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#4b830d] animate-pulse" />
              Students Distribution
            </CardTitle>
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
                    outerRadius={90}
                    fill="#8884d8"
                    dataKey="value"
                    animationDuration={1000}
                    animationBegin={0}
                  >
                    {pieData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.color}
                        style={{
                          filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))",
                          transition: "all 0.3s ease"
                        }}
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-6 mt-4">
              <div className="flex items-center gap-2 animate-fade-in">
                <div className="w-4 h-4 rounded-full bg-[#4b830d] shadow-sm" />
                <span className="text-sm font-medium">Boys: {boysCount}</span>
              </div>
              <div className="flex items-center gap-2 animate-fade-in" style={{ animationDelay: "0.2s" }}>
                <div className="w-4 h-4 rounded-full bg-[#f59e0b] shadow-sm" />
                <span className="text-sm font-medium">Girls: {girlsCount}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

