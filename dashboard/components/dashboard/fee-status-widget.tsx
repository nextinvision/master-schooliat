"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";

interface FeeStatusWidgetProps {
  paid?: number;
  pending?: number;
  partiallyPaid?: number;
  currentYear?: number;
  currentInstallmentNumber?: number;
}

export function FeeStatusWidget({
  paid = 0,
  pending = 0,
  partiallyPaid = 0,
  currentYear,
  currentInstallmentNumber,
}: FeeStatusWidgetProps) {
  const [selectedPeriod, setSelectedPeriod] = useState("Annual");
  const [selectedYear, setSelectedYear] = useState(currentYear?.toString() || new Date().getFullYear().toString());

  const total = paid + pending + partiallyPaid;
  const paidPercentage = total > 0 ? ((paid / total) * 100).toFixed(1) : "0";
  const pendingPercentage = total > 0 ? (((pending + partiallyPaid) / total) * 100).toFixed(1) : "0";

  return (
    <Card className="relative isolate transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            Fee Status
          </CardTitle>
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
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Paid Fees Card */}
          <div className="p-4 bg-schooliat-tint/50 rounded-lg border border-primary/20 transition-all duration-300 hover:shadow-md hover:-translate-y-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Paid</span>
              <Badge className="bg-primary hover:bg-schooliat-primary-dark text-white">
                {paidPercentage}%
              </Badge>
            </div>
            <p className="text-2xl font-bold text-green-700">
              {paid.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Installment {currentInstallmentNumber || 1}
            </p>
          </div>

          {/* Pending Fees Card */}
          <div className="p-4 bg-orange-50 rounded-lg border border-orange-200 transition-all duration-300 hover:shadow-md hover:-translate-y-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Pending</span>
              <Badge variant="destructive" className="bg-orange-500 hover:bg-orange-600">
                {pendingPercentage}%
              </Badge>
            </div>
            <p className="text-2xl font-bold text-orange-700">
              {(pending + partiallyPaid).toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {pending} pending, {partiallyPaid} partial
            </p>
          </div>
        </div>

        {/* Summary */}
        <div className="mt-4 pt-4 border-t">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Total Students</span>
            <span className="font-semibold text-gray-900">{total.toLocaleString()}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

