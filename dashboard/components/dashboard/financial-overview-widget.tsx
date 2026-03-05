import { useState } from "react";
import { TrendingUp, BarChart2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
  incomeChangePercent = "+12%",
  salaryChangePercent = "+0.5%",
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
    <Card className="relative isolate border-none shadow-sm h-full rounded-2xl flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between pb-0 shrink-0">
        <CardTitle className="text-lg font-bold">Financial Overview</CardTitle>
        <div className="flex items-center gap-2">
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-28 h-8 text-xs border-none bg-gray-50 text-gray-500 rounded-full focus:ring-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 5 }, (_, i) => {
                const year = (currentYear || new Date().getFullYear()) - i;
                return (
                  <SelectItem key={year} value={year.toString()}>
                    {year}-{year + 1}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-24 h-8 text-xs border-none bg-gray-50 text-gray-500 rounded-full focus:ring-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Annual">Annual</SelectItem>
              <SelectItem value="Monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-center pt-6 pb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
          {/* Total Income Card */}
          <div className="p-5 bg-[#fff8e7] rounded-2xl border border-transparent transition-all shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <div className="w-8 h-8 rounded-full bg-[#fdeab1] flex items-center justify-center text-[#d97706]">
                <BarChart2 className="h-4 w-4" />
              </div>
              <div className="flex items-center gap-1 bg-blue-50 text-blue-500 px-2 py-1 rounded-full text-xs font-bold">
                <TrendingUp className="h-3 w-3" />
                {incomeChangePercent}
              </div>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 mb-1">
                {formatCurrency(totalIncome)}
              </p>
              <span className="text-sm font-medium text-gray-600">Total Income</span>
            </div>
          </div>

          {/* Salary Distributed Card */}
          <div className="p-5 bg-[#fff8e7] rounded-2xl border border-transparent transition-all shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <div className="w-8 h-8 rounded-full bg-[#fdeab1] flex items-center justify-center text-[#d97706]">
                <BarChart2 className="h-4 w-4" />
              </div>
              <div className="flex items-center gap-1 bg-blue-50 text-blue-500 px-2 py-1 rounded-full text-xs font-bold">
                <TrendingUp className="h-3 w-3" />
                {salaryChangePercent}
              </div>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 mb-1">
                {formatCurrency(totalSalary)}
              </p>
              <span className="text-sm font-medium text-gray-600">Salary Distributed</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
