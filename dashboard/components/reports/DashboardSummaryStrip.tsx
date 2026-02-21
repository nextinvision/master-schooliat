"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, DollarSign, GraduationCap, Wallet } from "lucide-react";
import { formatCurrency } from "@/lib/utils/analytics";
import type { DashboardSummary } from "@/lib/types/reports";

interface DashboardSummaryStripProps {
  summary: DashboardSummary | null | undefined;
  isLoading: boolean;
}

export function DashboardSummaryStrip({ summary, isLoading }: DashboardSummaryStripProps) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-wrap gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-14 w-40" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!summary) return null;

  const { attendance, fees, academic, salary } = summary;

  return (
    <Card>
      <CardContent className="py-4">
        <div className="flex flex-wrap gap-6">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-green-100 dark:bg-green-900/30 p-2">
              <Users className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Attendance ({attendance.periodLabel})</p>
              <p className="text-lg font-semibold">{attendance.averageRate}% avg</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-100 dark:bg-blue-900/30 p-2">
              <DollarSign className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Fees</p>
              <p className="text-lg font-semibold">{formatCurrency(fees.totalRevenue)} revenue</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-purple-100 dark:bg-purple-900/30 p-2">
              <GraduationCap className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Academic</p>
              <p className="text-lg font-semibold">{academic.averageScore}% avg · {academic.passRate}% pass</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-amber-100 dark:bg-amber-900/30 p-2">
              <Wallet className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Salary</p>
              <p className="text-lg font-semibold">{formatCurrency(salary.totalPaid)} · {salary.totalEmployees} staff</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
