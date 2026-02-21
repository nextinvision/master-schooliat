"use client";

import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Eye, DollarSign } from "lucide-react";
import { useInstallments, useRecordPayment } from "@/lib/hooks/use-fees";
import { FeeDetailsModal } from "./fee-details-modal";
import { PaymentModal } from "./payment-modal";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const STATUS_OPTIONS = ["All Status", "Paid", "Pending"];
const YEAR_OPTIONS = ["2023-2024", "2024-2025", "2025-2026"];
const PERIOD_OPTIONS = ["Annual", "Monthly", "Quarterly"];
const INSTALLMENT_OPTIONS = Array.from({ length: 12 }, (_, i) => ({
  value: String(i + 1),
  label: `Installment ${i + 1}`,
}));

function formatCurrency(num: number | string | null | undefined): string {
  return `₹${Number(num || 0).toLocaleString("en-IN")}`;
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

function normalizeStatus(s: string | null | undefined): "Paid" | "Pending" {
  if (!s) return "Pending";
  return s === "PAID" ? "Paid" : "Pending";
}

// Mock chart data - replace with real data
const chartData = [
  { month: "Jan", amount: 500 },
  { month: "Feb", amount: 800 },
  { month: "Mar", amount: 600 },
  { month: "Apr", amount: 400 },
  { month: "May", amount: 700 },
  { month: "Jun", amount: 3000 },
  { month: "Jul", amount: 5000 },
  { month: "Aug", amount: 1500 },
  { month: "Sep", amount: 1200 },
  { month: "Oct", amount: 800 },
  { month: "Nov", amount: 600 },
  { month: "Dec", amount: 700 },
];

interface FeesManagementProps {
  onEdit?: (item: any) => void;
  onDelete?: (id: string) => void;
}

export function FeesManagement({ onEdit, onDelete }: FeesManagementProps) {
  const [page, setPage] = useState(0);
  const itemsPerPage = 10;
  const [searchQuery, setSearchQuery] = useState("");
  const [installmentNumber, setInstallmentNumber] = useState(1);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedInstallment, setSelectedInstallment] = useState<any>(null);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);

  const [statusFilter, setStatusFilter] = useState("All Status");
  const [yearFilter, setYearFilter] = useState("2023-2024");
  const [periodFilter, setPeriodFilter] = useState("Annual");

  const {
    data: installmentsRes,
    isLoading,
    isError,
    error,
    refetch,
  } = useInstallments(installmentNumber);
  const { mutateAsync: recordPayment, isPending: isRecordingPayment } = useRecordPayment();

  const handleViewDetails = (item: any) => {
    setSelectedStudentId(item.studentId);
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedStudentId(null);
  };

  const handleRecordPayment = (item: any) => {
    setSelectedInstallment(item);
    setPaymentModalVisible(true);
  };

  const handleClosePaymentModal = () => {
    setPaymentModalVisible(false);
    setSelectedInstallment(null);
  };

  const handleSubmitPayment = async (amount: number) => {
    if (!selectedInstallment) return;

    try {
      await recordPayment({
        installmentId: selectedInstallment.id,
        amount,
      });
      handleClosePaymentModal();
      refetch();
    } catch (error: any) {
      console.error("Payment failed:", error);
      throw error;
    }
  };

  const installments = useMemo(
    () => installmentsRes?.data?.installments ?? [],
    [installmentsRes]
  );

  // Stats computed from current installment
  const feeStats = useMemo(() => {
    const paid = installments.filter(
      (i: any) => normalizeStatus(i.paymentStatus) === "Paid"
    ).length;
    const pending = installments.filter(
      (i: any) => normalizeStatus(i.paymentStatus) === "Pending"
    ).length;
    const total = installments.reduce((s: number, i: any) => s + (Number(i.amount) || 0), 0);
    const totalPaid = installments.reduce(
      (s: number, i: any) => s + (Number(i.paidAmount) || 0),
      0
    );
    const totalRemaining = installments.reduce(
      (s: number, i: any) => s + (Number(i.remainingAmount) || 0),
      0
    );
    return {
      paid,
      pending,
      totalFees: formatCurrency(total),
      totalHostel: formatCurrency(0),
      totalTransport: formatCurrency(0),
      totalPaid: formatCurrency(totalPaid),
      totalRemaining: formatCurrency(totalRemaining),
    };
  }, [installments]);

  // Filtered data
  const filteredData = useMemo(() => {
    return installments.filter((item: any) => {
      const q = searchQuery.trim().toLowerCase();
      const name = [item.student?.firstName, item.student?.lastName]
        .filter(Boolean)
        .join(" ");
      const matchesSearch = !q || name.toLowerCase().includes(q);
      const status = normalizeStatus(item.paymentStatus);
      const matchesStatus =
        statusFilter === "All Status" || status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [installments, searchQuery, statusFilter]);

  // Pagination
  const from = page * itemsPerPage;
  const to = Math.min((page + 1) * itemsPerPage, filteredData.length);
  const numberOfPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice(from, to);

  useEffect(() => {
    setPage(0);
  }, [searchQuery, statusFilter]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Fees Management</h1>

      {/* Summary Cards Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart Card */}
        <div className="border rounded-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Fees Collection</h3>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="amount" stroke="#4CAF50" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Fee Status Card */}
        <div className="border rounded-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Fee Status</h3>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Fees</span>
              <span className="font-semibold">{feeStats.totalFees}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Paid</span>
              <span className="font-semibold text-primary">{feeStats.totalPaid}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Remaining</span>
              <span className="font-semibold text-red-600">{feeStats.totalRemaining}</span>
            </div>
            <div className="flex gap-4 pt-2 border-t">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary"></div>
                <span className="text-sm">Paid: {feeStats.paid}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                <span className="text-sm">Pending: {feeStats.pending}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search by Student Name"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </div>
        <Select value={String(installmentNumber)} onValueChange={(v) => setInstallmentNumber(Number(v))}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select Installment" />
          </SelectTrigger>
          <SelectContent>
            {INSTALLMENT_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-schooliat-tint">
                <TableHead className="w-16">No</TableHead>
                <TableHead>Student</TableHead>
                <TableHead className="w-32">Amount</TableHead>
                <TableHead className="w-32">Paid</TableHead>
                <TableHead className="w-32">Remaining</TableHead>
                <TableHead className="w-40">Paid At</TableHead>
                <TableHead className="w-32">Status</TableHead>
                <TableHead className="w-32">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : filteredData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    No installments found
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map((item: any, index: number) => {
                  const status = normalizeStatus(item.paymentStatus);
                  const name = [item.student?.firstName, item.student?.lastName]
                    .filter(Boolean)
                    .join(" ") || "—";
                  return (
                    <TableRow key={item.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">
                        {String(index + 1).padStart(2, "0")}
                      </TableCell>
                      <TableCell>{name}</TableCell>
                      <TableCell>{formatCurrency(item.amount)}</TableCell>
                      <TableCell>{formatCurrency(item.paidAmount)}</TableCell>
                      <TableCell>{formatCurrency(item.remainingAmount)}</TableCell>
                      <TableCell>{formatDate(item.paidAt)}</TableCell>
                      <TableCell>
                        <Badge
                          variant={status === "Paid" ? "default" : "secondary"}
                          className={
                            status === "Paid"
                              ? "bg-schooliat-tint text-primary"
                              : "bg-orange-100 text-orange-800"
                          }
                        >
                          {status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleViewDetails(item)}
                            className="h-8 w-8"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRecordPayment(item)}
                            disabled={status === "Paid" || isRecordingPayment}
                            className="h-8 w-8"
                          >
                            <DollarSign className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination */}
      {numberOfPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Page {page + 1} of {numberOfPages}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(Math.min(numberOfPages - 1, page + 1))}
              disabled={page >= numberOfPages - 1}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Modals */}
      <FeeDetailsModal
        visible={modalVisible}
        onClose={handleCloseModal}
        studentId={selectedStudentId}
      />
      <PaymentModal
        visible={paymentModalVisible}
        onClose={handleClosePaymentModal}
        onSubmit={handleSubmitPayment}
        installment={selectedInstallment}
        isSubmitting={isRecordingPayment}
      />
    </div>
  );
}

