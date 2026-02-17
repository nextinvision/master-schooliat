"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTCs, useCreateTC, useUpdateTCStatus } from "@/lib/hooks/use-tc";
import { useStudents } from "@/lib/hooks/use-students";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Plus,
  FileText,
  Eye,
  Edit,
  Search,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const createTCSchema = z.object({
  studentId: z.string().min(1, "Student is required"),
  reason: z.string().min(1, "Reason is required"),
  transferDate: z.string().min(1, "Transfer date is required"),
  destinationSchool: z.string().optional(),
  remarks: z.string().optional(),
});

type CreateTCFormData = z.infer<typeof createTCSchema>;

export default function TransferCertificatesPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ISSUED" | "COLLECTED" | "CANCELLED" | "">("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const limit = 15;

  const { data: tcsData, isLoading: tcsLoading, refetch } = useTCs({
    page,
    limit,
    status: statusFilter || undefined,
    tcNumber: searchQuery || undefined,
  });

  const { data: studentsData } = useStudents({ page: 1, limit: 1000 });
  const students = studentsData?.data || [];

  const createTC = useCreateTC();
  const updateTCStatus = useUpdateTCStatus();

  const form = useForm<CreateTCFormData>({
    resolver: zodResolver(createTCSchema),
    defaultValues: {
      studentId: "",
      reason: "",
      transferDate: "",
      destinationSchool: "",
      remarks: "",
    },
  });

  const tcs = tcsData?.data || [];
  const totalPages = tcsData?.pagination?.totalPages || 1;

  const handleCreate = useCallback(async (data: CreateTCFormData) => {
    try {
      await createTC.mutateAsync({
        ...data,
        transferDate: new Date(data.transferDate).toISOString(),
      });
      toast.success("Transfer Certificate created successfully!");
      setIsCreateDialogOpen(false);
      form.reset();
      refetch();
    } catch (error: any) {
      toast.error(error?.message || "Failed to create Transfer Certificate");
    }
  }, [createTC, form, refetch]);

  const handleStatusUpdate = useCallback(
    async (tcId: string, status: "ISSUED" | "COLLECTED" | "CANCELLED") => {
      try {
        await updateTCStatus.mutateAsync({ id: tcId, status });
        toast.success(`TC status updated to ${status}`);
        refetch();
      } catch (error: any) {
        toast.error(error?.message || "Failed to update TC status");
      }
    },
    [updateTCStatus, refetch]
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ISSUED":
        return (
          <Badge className="bg-blue-500 hover:bg-blue-600">
            <CheckCircle className="h-3 w-3 mr-1" />
            Issued
          </Badge>
        );
      case "COLLECTED":
        return (
          <Badge className="bg-green-500 hover:bg-green-600">
            <CheckCircle className="h-3 w-3 mr-1" />
            Collected
          </Badge>
        );
      case "CANCELLED":
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Cancelled
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Transfer Certificates</h1>
          <p className="text-gray-600 mt-1">Manage student transfer certificates</p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Create TC
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by TC number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-48">
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Status</SelectItem>
                  <SelectItem value="ISSUED">Issued</SelectItem>
                  <SelectItem value="COLLECTED">Collected</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* TC Table */}
      <Card>
        <CardHeader>
          <CardTitle>Transfer Certificates</CardTitle>
        </CardHeader>
        <CardContent>
          {tcsLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-[#e5ffc7]">
                      <TableHead className="w-16">No</TableHead>
                      <TableHead>TC Number</TableHead>
                      <TableHead>Student</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Transfer Date</TableHead>
                      <TableHead>Destination</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-40">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tcs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8">
                          No transfer certificates found
                        </TableCell>
                      </TableRow>
                    ) : (
                      tcs.map((tc: any, index: number) => (
                        <TableRow key={tc.id}>
                          <TableCell className="font-medium">
                            {String((page - 1) * limit + index + 1).padStart(2, "0")}
                          </TableCell>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-gray-400" />
                              {tc.tcNumber || "N/A"}
                            </div>
                          </TableCell>
                          <TableCell>
                            {tc.student?.firstName || ""} {tc.student?.lastName || ""}
                          </TableCell>
                          <TableCell>
                            {tc.student?.studentProfile?.class?.grade || "N/A"}
                            {tc.student?.studentProfile?.class?.division
                              ? `-${tc.student.studentProfile.class.division}`
                              : ""}
                          </TableCell>
                          <TableCell className="max-w-xs truncate">{tc.reason || "N/A"}</TableCell>
                          <TableCell>
                            {tc.transferDate
                              ? new Date(tc.transferDate).toLocaleDateString()
                              : "N/A"}
                          </TableCell>
                          <TableCell className="max-w-xs truncate">
                            {tc.destinationSchool || "N/A"}
                          </TableCell>
                          <TableCell>{getStatusBadge(tc.status)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => router.push(`/admin/transfer-certificates/${tc.id}`)}
                                className="h-8 w-8"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {tc.status === "ISSUED" && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleStatusUpdate(tc.id, "COLLECTED")}
                                  className="h-8 w-8 text-green-600"
                                  title="Mark as Collected"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                              )}
                              {tc.status !== "CANCELLED" && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleStatusUpdate(tc.id, "CANCELLED")}
                                  className="h-8 w-8 text-red-600"
                                  title="Cancel TC"
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-gray-600">
                    Page {page} of {totalPages}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page + 1)}
                      disabled={page === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Create TC Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Transfer Certificate</DialogTitle>
            <DialogDescription>
              Create a new transfer certificate for a student
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(handleCreate)} className="space-y-4">
            <div>
              <Label htmlFor="studentId">Student *</Label>
              <Select
                value={form.watch("studentId")}
                onValueChange={(value) => form.setValue("studentId", value)}
              >
                <SelectTrigger id="studentId">
                  <SelectValue placeholder="Select Student" />
                </SelectTrigger>
                <SelectContent>
                  {students.map((student: any) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.firstName} {student.lastName} - {student.publicUserId}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.studentId && (
                <p className="text-sm text-red-500 mt-1">
                  {form.formState.errors.studentId.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="reason">Reason *</Label>
              <Textarea
                id="reason"
                placeholder="Enter reason for transfer..."
                {...form.register("reason")}
                rows={3}
              />
              {form.formState.errors.reason && (
                <p className="text-sm text-red-500 mt-1">
                  {form.formState.errors.reason.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="transferDate">Transfer Date *</Label>
              <Input
                id="transferDate"
                type="date"
                {...form.register("transferDate")}
              />
              {form.formState.errors.transferDate && (
                <p className="text-sm text-red-500 mt-1">
                  {form.formState.errors.transferDate.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="destinationSchool">Destination School</Label>
              <Input
                id="destinationSchool"
                placeholder="Enter destination school name..."
                {...form.register("destinationSchool")}
              />
            </div>

            <div>
              <Label htmlFor="remarks">Remarks</Label>
              <Textarea
                id="remarks"
                placeholder="Additional remarks..."
                {...form.register("remarks")}
                rows={2}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createTC.isPending}>
                {createTC.isPending ? "Creating..." : "Create TC"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

