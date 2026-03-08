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
import { Download, Eye, Plus, Trash2 } from "lucide-react";
import { useInvoices, useGenerateInvoice, useDeleteInvoice, Invoice } from "@/lib/hooks/use-super-admin";
import { useToast } from "@/hooks/use-toast";
import { GenerateInvoiceForm } from "./generate-invoice-form";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

const STATUS_OPTIONS = ["All", "DRAFT", "SENT", "PAID", "OVERDUE", "CANCELLED"];

export default function InvoicesManagement() {
    const { toast } = useToast();
    const [page, setPage] = useState(0);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("All");
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const itemsPerPage = 10;

    const { data, isLoading, error } = useInvoices({
        status: statusFilter !== "All" ? statusFilter : undefined,
    });

    const generateInvoice = useGenerateInvoice();
    const deleteInvoice = useDeleteInvoice();

    const invoices = useMemo((): Invoice[] => {
        if (!data?.data) return [];
        let filtered: Invoice[] = data.data as Invoice[];

        if (searchQuery) {
            const searchLower = searchQuery.toLowerCase();
            filtered = filtered.filter(
                (invoice) =>
                    invoice.school?.name?.toLowerCase().includes(searchLower) ||
                    invoice.vendor?.name?.toLowerCase().includes(searchLower) ||
                    invoice.invoiceNumber?.toLowerCase().includes(searchLower)
            );
        }

        return filtered;
    }, [data, searchQuery]);

    const numberOfPages = Math.ceil(invoices.length / itemsPerPage);
    const paginatedInvoices = invoices.slice(page * itemsPerPage, (page + 1) * itemsPerPage);

    useEffect(() => {
        setPage(0);
    }, [searchQuery, statusFilter]);

    const handleViewInvoice = async (invoiceId: string) => {
        try {
            const response = await generateInvoice.mutateAsync({ invoiceId });
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
                description: err?.message || "Failed to generate invoice",
                variant: "destructive",
            });
        }
    };

    const handleDeleteInvoice = async (invoiceId: string) => {
        if (!confirm("Are you sure you want to delete this invoice?")) return;
        try {
            await deleteInvoice.mutateAsync(invoiceId);
            toast({ title: "Success", description: "Invoice deleted successfully" });
        } catch (err: any) {
            toast({
                title: "Error",
                description: err?.message || "Failed to delete invoice",
                variant: "destructive",
            });
        }
    };

    if (isLoading) return <div className="py-10 text-center">Loading invoices...</div>;
    if (error) return <div className="py-10 text-center text-red-500">Error loading invoices</div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-semibold">Invoices</h1>
                    <p className="text-gray-600 mt-1">Generate and manage invoices for schools and vendors</p>
                </div>
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button className="gap-2">
                            <Plus className="w-4 h-4" />
                            Generate Invoice
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Generate New Invoice</DialogTitle>
                        </DialogHeader>
                        <GenerateInvoiceForm onSuccess={() => setIsCreateOpen(false)} />
                    </DialogContent>
                </Dialog>
            </div>

            <div className="flex gap-4">
                <Input
                    placeholder="Search by school, vendor or invoice #..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="max-w-sm"
                />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        {STATUS_OPTIONS.map((opt) => (
                            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="border rounded-lg overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/50">
                            <TableHead>Invoice #</TableHead>
                            <TableHead>Recipient</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                            <TableHead>Created At</TableHead>
                            <TableHead>Due Date</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="w-24 text-center">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedInvoices.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                    No invoices found
                                </TableCell>
                            </TableRow>
                        ) : (
                            paginatedInvoices.map((invoice) => (
                                <TableRow key={invoice.id} className="hover:bg-muted/50 transition-colors">
                                    <TableCell className="font-medium">{invoice.invoiceNumber || "DRAFT"}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-semibold text-primary">
                                                {invoice.school?.name || invoice.vendor?.name || "Unknown"}
                                            </span>
                                            <span className="text-xs text-muted-foreground capitalize">
                                                {invoice.school ? "School" : "Vendor"}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right font-medium">₹{Number(invoice.amount).toLocaleString()}</TableCell>
                                    <TableCell>{new Date(invoice.createdAt).toLocaleDateString()}</TableCell>
                                    <TableCell>{invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : "-"}</TableCell>
                                    <TableCell>
                                        <Badge
                                            variant="outline"
                                            className={
                                                invoice.status === "PAID"
                                                    ? "bg-green-100 text-green-800 border-green-200"
                                                    : invoice.status === "DRAFT"
                                                        ? "bg-gray-100 text-gray-800 border-gray-200"
                                                        : "bg-blue-100 text-blue-800 border-blue-200"
                                            }
                                        >
                                            {invoice.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center justify-center gap-1">
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10" onClick={() => handleViewInvoice(invoice.id)}>
                                                <Eye className="w-4 h-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDeleteInvoice(invoice.id)}>
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {numberOfPages > 1 && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">Page {page + 1} of {numberOfPages}</p>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>Previous</Button>
                        <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(numberOfPages - 1, p + 1))} disabled={page >= numberOfPages - 1}>Next</Button>
                    </div>
                </div>
            )}
        </div>
    );
}
