"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";

interface FinancialOverviewWidgetProps {
  totalIncome?: number;
  totalSalary?: number;
  incomeChangePercent?: string;
  salaryChangePercent?: string;
  currentYear?: number;
}

export function FinancialOverviewWidget({
  totalIncome = 0,
  totalSalary = 0,
  incomeChangePercent = "+0%",
  salaryChangePercent = "+0%",
  currentYear,
}: FinancialOverviewWidgetProps) {
  const [selectedPeriod, setSelectedPeriod] = useState("Annual");
  const [selectedYear, setSelectedYear] = useState(currentYear?.toString() || new Date().getFullYear().toString());

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Card className="relative isolate transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-[#678d3d]" />
            Financial Overview
          </CardTitle>
          <div className="flex items-center gap-2">
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-24 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 5 }, (_, i) => {
                  const year = (currentYear || new Date().getFullYear()) - i;
                  return (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-20 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Annual">Annual</SelectItem>
                <SelectItem value="Monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Total Income Card */}
          <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200 transition-all duration-300 hover:shadow-md hover:-translate-y-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Total Income</span>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900 mb-1">
              {formatCurrency(totalIncome)}
            </p>
            <div className="flex items-center gap-1">
              <span className="text-xs font-medium text-green-600">
                {incomeChangePercent}
              </span>
              <span className="text-xs text-gray-500">from last year</span>
            </div>
          </div>

          {/* Salary Distributed Card */}
          <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200 transition-all duration-300 hover:shadow-md hover:-translate-y-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Salary Distributed</span>
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900 mb-1">
              {formatCurrency(totalSalary)}
            </p>
            <div className="flex items-center gap-1">
              <span className="text-xs font-medium text-blue-600">
                {salaryChangePercent}
              </span>
              <span className="text-xs text-gray-500">from last year</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

