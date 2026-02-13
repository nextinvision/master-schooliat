"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLeaveBalance, useLeaveHistory, useCreateLeaveRequest } from "@/lib/hooks/use-leave";
import { LeaveRequestForm } from "@/components/leave/leave-request-form";
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
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Plus, Calendar, Clock, CheckCircle2, XCircle } from "lucide-react";
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function LeavePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"request" | "history" | "balance">("request");
  const [page, setPage] = useState(1);

  const { data: balanceData, isLoading: balanceLoading } = useLeaveBalance();
  const { data: historyData, isLoading: historyLoading } = useLeaveHistory({
    page,
    limit: 15,
  });
  const createLeaveRequest = useCreateLeaveRequest();

  const balance = balanceData?.data || {};
  const history = historyData?.data || [];
  const totalPages = historyData?.pagination?.totalPages || 1;

  const handleSubmitLeaveRequest = async (data: any) => {
    try {
      await createLeaveRequest.mutateAsync(data);
      toast.success("Leave request submitted successfully");
      setActiveTab("history");
    } catch (error: any) {
      toast.error(error?.message || "Failed to submit leave request");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "APPROVED":
        return <Badge className="bg-green-500 hover:bg-green-600">Approved</Badge>;
      case "REJECTED":
        return <Badge variant="destructive">Rejected</Badge>;
      case "PENDING":
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">Pending</Badge>;
      case "CANCELLED":
        return <Badge variant="secondary">Cancelled</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Leave Management</h1>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList>
          <TabsTrigger value="request">Request Leave</TabsTrigger>
          <TabsTrigger value="history">Leave History</TabsTrigger>
          <TabsTrigger value="balance">Leave Balance</TabsTrigger>
        </TabsList>

        {/* Request Leave Tab */}
        <TabsContent value="request" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Submit Leave Request</CardTitle>
            </CardHeader>
            <CardContent>
              <LeaveRequestForm
                onSubmit={handleSubmitLeaveRequest}
                isSubmitting={createLeaveRequest.isPending}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Leave History Tab */}
        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Leave History</CardTitle>
            </CardHeader>
            <CardContent>
              {historyLoading ? (
                <Skeleton className="h-64 w-full" />
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-[#e5ffc7]">
                        <TableHead>Leave Type</TableHead>
                        <TableHead>Start Date</TableHead>
                        <TableHead>End Date</TableHead>
                        <TableHead>Days</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Applied On</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {history.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8">
                            No leave requests found
                          </TableCell>
                        </TableRow>
                      ) : (
                        history.map((request: any) => {
                          const start = new Date(request.startDate);
                          const end = new Date(request.endDate);
                          const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

                          return (
                            <TableRow key={request.id}>
                              <TableCell className="font-medium">
                                {request.leaveType?.name || "N/A"}
                              </TableCell>
                              <TableCell>{format(start, "MMM dd, yyyy")}</TableCell>
                              <TableCell>{format(end, "MMM dd, yyyy")}</TableCell>
                              <TableCell>{days} day{days !== 1 ? "s" : ""}</TableCell>
                              <TableCell className="max-w-xs truncate">
                                {request.reason}
                              </TableCell>
                              <TableCell>{getStatusBadge(request.status)}</TableCell>
                              <TableCell>
                                {format(new Date(request.createdAt), "MMM dd, yyyy")}
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}

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
            </CardContent>
          </Card>
        </TabsContent>

        {/* Leave Balance Tab */}
        <TabsContent value="balance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Leave Balance</CardTitle>
            </CardHeader>
            <CardContent>
              {balanceLoading ? (
                <Skeleton className="h-64 w-full" />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(balance).map(([typeName, balanceInfo]: [string, any]) => (
                    <Card key={typeName}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">{typeName}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Total:</span>
                            <span className="font-semibold">{balanceInfo.total || 0}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Used:</span>
                            <span className="font-semibold text-red-600">
                              {balanceInfo.used || 0}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Remaining:</span>
                            <span className="font-semibold text-green-600">
                              {balanceInfo.remaining || 0}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

