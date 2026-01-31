"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import { Download, Eye, Plus } from "lucide-react";
import { useReceipts, useGenerateReceipt, Receipt } from "@/lib/hooks/use-super-admin";
import { useToast } from "@/hooks/use-toast";

const STATUS_OPTIONS = ["All", "GENERATED", "PENDING", "PAID", "CANCELLED"];

interface ReceiptDisplay {
  id: string;
  receiptNumber: string;
  schoolName: string;
  schoolCode: string;
  amount: number;
  date: string;
  status: string;
}

export function ReceiptsManagement() {
  const router = useRouter();
  const { toast } = useToast();
  const [page, setPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const itemsPerPage = 10;

  const { data, isLoading, error } = useReceipts(
    undefined,
    statusFilter !== "All" ? statusFilter : undefined
  );

  const generateReceipt = useGenerateReceipt();

  const receipts = useMemo<ReceiptDisplay[]>(() => {
    if (!data?.data) return [];
    let filtered = data.data;

    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (receipt: Receipt) =>
          receipt.school?.name?.toLowerCase().includes(searchLower) ||
          receipt.receiptNumber?.toLowerCase().includes(searchLower)
      );
    }

    return filtered.map((receipt: Receipt) => ({
      id: receipt.id,
      receiptNumber: receipt.receiptNumber,
      schoolName: receipt.school?.name || "N/A",
      amount: parseFloat(String(receipt.amount)) || 0,
      date: new Date(receipt.createdAt).toISOString().split("T")[0],
      status: receipt.status || "GENERATED",
      schoolCode: receipt.school?.code || "N/A",
    }));
  }, [data, searchQuery]);

  const from = page * itemsPerPage;
  const to = Math.min((page + 1) * itemsPerPage, receipts.length);
  const numberOfPages = Math.ceil(receipts.length / itemsPerPage);
  const paginatedReceipts = receipts.slice(from, to);

  useEffect(() => {
    setPage(0);
  }, [searchQuery, statusFilter]);

  const handleViewReceipt = async (receiptId: string) => {
    try {
      const response = await generateReceipt.mutateAsync(receiptId);
      if (response?.data?.html && typeof window !== "undefined") {
        const printWindow = window.open("", "_blank");
        if (printWindow) {
          printWindow.document.write(response.data.html);
          printWindow.document.close();
          printWindow.focus();
        }
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.message || "Failed to generate receipt",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading receipts...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <p className="text-red-600">Failed to load receipts</p>
          <p className="text-sm text-gray-600 mt-2">
            {(error as Error).message}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Receipts Management</h1>
          <p className="text-gray-600 mt-1">
            View and manage all receipts for registered schools
          </p>
        </div>
        <Button
          onClick={() => router.push("/super-admin/receipts/generate")}
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          Generate Receipt
        </Button>
      </div>

      <div className="flex gap-4">
        <Input
          placeholder="Search receipts..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt} value={opt}>
                {opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#e5ffc7]">
                <TableHead>Receipt Number</TableHead>
                <TableHead>School</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-32">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedReceipts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    No receipts found
                  </TableCell>
                </TableRow>
              ) : (
                paginatedReceipts.map((receipt) => (
                  <TableRow key={receipt.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium">
                      {receipt.receiptNumber}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-semibold">{receipt.schoolName}</div>
                        <div className="text-sm text-gray-500">
                          {receipt.schoolCode}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      ₹{receipt.amount.toLocaleString()}
                    </TableCell>
                    <TableCell>{receipt.date}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          receipt.status === "PAID"
                            ? "bg-green-100 text-green-800 border-green-300"
                            : receipt.status === "PENDING"
                            ? "bg-yellow-100 text-yellow-800 border-yellow-300"
                            : "bg-gray-100 text-gray-800 border-gray-300"
                        }
                      >
                        {receipt.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleViewReceipt(receipt.id)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

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
    </div>
  );
}

