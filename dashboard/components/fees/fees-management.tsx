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
import {
  Search,
  Plus,
  Filter,
  Calendar as CalendarIcon,
  FileDown,
  Loader2,
  DownloadCloud,
  Eye,
  IndianRupee,
  Ban,
} from "lucide-react";
import { useInstallments, useRecordPayment } from "@/lib/hooks/use-fees";
import { get, downloadFromApi } from "@/lib/api/client";
import { FeeDetailsModal } from "./fee-details-modal";
import { PaymentModal } from "./payment-modal";
import { CancelFeeInstallmentModal } from "./cancel-fee-installment-modal";
import { PaymentFormData } from "@/lib/schemas/fees-schema";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { PaymentInfoCard } from "./payment-info-card";
import { toast } from "sonner";

const STATUS_OPTIONS = ["All Status", "Paid", "Partially Paid", "Pending", "Cancelled"];
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

function normalizeStatus(
  s: string | null | undefined
): "Paid" | "Partially Paid" | "Pending" | "Cancelled" {
  if (!s) return "Pending";
  if (s === "PAID") return "Paid";
  if (s === "PARTIALLY_PAID") return "Partially Paid";
  if (s === "CANCELLED") return "Cancelled";
  return "Pending";
}

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function buildCollectionChartData(installments: any[]): { month: string; amount: number }[] {
  const buckets = MONTH_LABELS.map((m) => ({ month: m, amount: 0 }));
  for (const inst of installments || []) {
    if (inst.paymentStatus !== "PAID" || !inst.paidAt) continue;
    const d = new Date(inst.paidAt);
    if (Number.isNaN(d.getTime())) continue;
    const idx = d.getMonth();
    const paid = Number(inst.paidAmount ?? inst.amount ?? 0);
    if (idx >= 0 && idx < 12) buckets[idx].amount += paid;
  }
  return buckets;
}

interface FeesManagementProps {
  onEdit?: (item: any) => void;
  onDelete?: (id: string) => void;
}

export function FeesManagement({ onEdit, onDelete }: FeesManagementProps) {
  const [page, setPage] = useState(0);
  const itemsPerPage = 10;
  const [searchQuery, setSearchQuery] = useState("");
  const [installmentNumber, setInstallmentNumber] = useState(1);
  const [endInstallmentNumber, setEndInstallmentNumber] = useState(1);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedInstallment, setSelectedInstallment] = useState<any>(null);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [lookupQuery, setLookupQuery] = useState("");
  const [lookupResults, setLookupResults] = useState<any[]>([]);
  const [lookupStudentId, setLookupStudentId] = useState<string | null>(null);
  const [cancelInstallment, setCancelInstallment] = useState<any | null>(null);

  const [statusFilter, setStatusFilter] = useState("All Status");
  const [yearFilter, setYearFilter] = useState("2023-2024");
  const [periodFilter, setPeriodFilter] = useState("Annual");

  const {
    data: installmentsRes,
    isLoading,
    isError,
    error,
    refetch,
  } = useInstallments(installmentNumber, endInstallmentNumber, {
    enabled: true,
    academicYear: yearFilter,
  });
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

  const runStudentLookup = async () => {
    const q = lookupQuery.trim();
    if (q.length < 2) {
      toast.error("Enter at least 2 characters (name, ID, email, or phone)");
      return;
    }
    try {
      const res = await get("/fees/lookup-student", { q });
      const list = res?.data?.students ?? [];
      setLookupResults(list);
      if (list.length === 0) toast.info("No students matched");
    } catch (e: any) {
      toast.error(e?.message || "Lookup failed");
    }
  };

  const handleSubmitPayment = async (data: PaymentFormData) => {
    if (!selectedInstallment) return;

    try {
      await recordPayment({
        installmentId: selectedInstallment.id,
        amount: data.isWaiver ? undefined : Math.round(Number(data.amount) || 0),
        paymentMethod: data.paymentMethod,
        isWaiver: data.isWaiver,
        transactionId: data.transactionId,
        remarks: data.remarks,
        otp: data.otp,
      });
      handleClosePaymentModal();
      refetch();
    } catch (error: any) {
      console.error("Payment failed:", error);
      throw error;
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const blob = await downloadFromApi(
        `/fees/export?academicYear=${encodeURIComponent(yearFilter)}`
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `fees_report_${yearFilter}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Fees report exported successfully!");
    } catch (e: any) {
      toast.error(e?.message || "Failed to export fees");
    } finally {
      setIsExporting(false);
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
    const cancelled = installments.filter(
      (i: any) => normalizeStatus(i.paymentStatus) === "Cancelled"
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
      cancelled,
      totalFees: formatCurrency(total),
      totalHostel: formatCurrency(0),
      totalTransport: formatCurrency(0),
      totalPaid: formatCurrency(totalPaid),
      totalRemaining: formatCurrency(totalRemaining),
    };
  }, [installments]);

  // Filtered data
  const chartData = useMemo(
    () => buildCollectionChartData(installments),
    [installments],
  );

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
      const matchesLookup =
        !lookupStudentId || item.studentId === lookupStudentId;
      return matchesSearch && matchesStatus && matchesLookup;
    });
  }, [installments, searchQuery, statusFilter, lookupStudentId]);

  // Pagination
  const from = page * itemsPerPage;
  const to = Math.min((page + 1) * itemsPerPage, filteredData.length);
  const numberOfPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice(from, to);

  useEffect(() => {
    setPage(0);
  }, [searchQuery, statusFilter, lookupStudentId]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Fees Management</h1>
        <Button
          variant="outline"
          onClick={handleExport}
          disabled={isExporting}
          className="gap-2"
        >
          {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <DownloadCloud className="h-4 w-4" />}
          Download Report
        </Button>
      </div>

      {/* Payment Info Card */}
      <PaymentInfoCard />

      {/* Summary Cards Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart Card */}
        <div className="border rounded-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Fees Collection (by payment month)</h3>
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
              <div className="flex flex-wrap gap-4 pt-2 border-t">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary"></div>
                <span className="text-sm">Paid: {feeStats.paid}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                <span className="text-sm">Pending: {feeStats.pending}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-slate-400"></div>
                <span className="text-sm">Cancelled: {feeStats.cancelled}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Student lookup (fee desk) */}
      <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
        <div className="text-sm font-medium">Find student for payment</div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            placeholder="Public ID, email, phone, or name fragment"
            value={lookupQuery}
            onChange={(e) => setLookupQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && runStudentLookup()}
            className="flex-1"
          />
          <Button type="button" variant="secondary" onClick={runStudentLookup} className="gap-2 shrink-0">
            <Search className="h-4 w-4" />
            Search
          </Button>
        </div>
        {lookupResults.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {lookupResults.map((s: any) => (
              <Button
                key={s.id}
                type="button"
                size="sm"
                variant={lookupStudentId === s.id ? "default" : "outline"}
                onClick={() => {
                  setLookupStudentId(s.id);
                  const name = [s.firstName, s.lastName].filter(Boolean).join(" ");
                  setSearchQuery(name || s.publicUserId || "");
                }}
              >
                {s.publicUserId || s.id.slice(0, 8)} — {[s.firstName, s.lastName].filter(Boolean).join(" ")}
              </Button>
            ))}
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => {
                setLookupStudentId(null);
                setLookupResults([]);
              }}
            >
              Clear filter
            </Button>
          </div>
        )}
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
        <div className="flex gap-2">
          <Select value={String(installmentNumber)} onValueChange={(v) => setInstallmentNumber(Number(v))}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="From Installment" />
            </SelectTrigger>
            <SelectContent>
              {INSTALLMENT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  From: {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={String(endInstallmentNumber)} onValueChange={(v) => setEndInstallmentNumber(Number(v))}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="To Installment" />
            </SelectTrigger>
            <SelectContent>
              {INSTALLMENT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value} disabled={Number(option.value) < installmentNumber}>
                  To: {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
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
                        {String(from + index + 1).padStart(2, "0")}
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
                              : status === "Partially Paid"
                                ? "bg-amber-100 text-amber-800"
                                : status === "Cancelled"
                                  ? "bg-slate-200 text-slate-800"
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
                            disabled={
                              status === "Paid" || status === "Cancelled" || isRecordingPayment
                            }
                            className="h-8 w-8"
                            title={
                              status === "Paid"
                                ? "Fully paid"
                                : status === "Cancelled"
                                  ? "Cancelled"
                                  : "Record Payment"
                            }
                          >
                            <IndianRupee className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setCancelInstallment(item)}
                            disabled={status === "Cancelled"}
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            title="Cancel installment (OTP)"
                          >
                            <Ban className="w-4 h-4" />
                          </Button>
                          {item.receiptFileUrl && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => window.open(item.receiptFileUrl, "_blank")}
                              className="h-8 w-8 text-primary"
                              title="Download Receipt"
                            >
                              <DownloadCloud className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            title="Student fee receipt"
                            onClick={async () => {
                              try {
                                const res = await get(`/fees/student/${item.studentId}`);
                                const installments = res?.data?.installments ?? [];
                                const withReceipt = installments.filter((i: any) => i.receiptFileUrl);
                                if (withReceipt.length > 0) {
                                  window.open(withReceipt[0].receiptFileUrl, "_blank");
                                } else {
                                  toast.info("No receipt available for this student yet. Record a payment first.");
                                }
                              } catch {
                                toast.error("Could not load student receipts.");
                              }
                            }}
                          >
                            <FileDown className="w-4 h-4" />
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
        <div className="flex items-center justify-between border rounded-lg p-3 bg-gray-50">
          <div className="text-sm text-gray-600">
            Showing {from + 1}–{to} of {filteredData.length} records &middot; Page {page + 1} of {numberOfPages}
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
      <CancelFeeInstallmentModal
        visible={!!cancelInstallment}
        onClose={() => setCancelInstallment(null)}
        installment={cancelInstallment}
        onSuccess={() => refetch()}
      />
    </div>
  );
}

