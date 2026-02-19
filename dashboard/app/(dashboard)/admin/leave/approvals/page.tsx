"use client";

import { useState } from "react";
import {
  usePendingLeaveRequestsForApproval,
  useApproveLeave,
  useRejectLeave,
} from "@/lib/hooks/use-leave";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { CheckCircle2, XCircle, ArrowLeft, Calendar } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";

export default function LeaveApprovalsPage() {
  const { data: pendingLeaves, isLoading, refetch } = usePendingLeaveRequestsForApproval();
  const approveLeave = useApproveLeave();
  const rejectLeave = useRejectLeave();

  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const list = Array.isArray(pendingLeaves) ? pendingLeaves : [];

  const handleApprove = async (leaveRequestId: string) => {
    try {
      await approveLeave.mutateAsync(leaveRequestId);
      toast.success("Leave request approved");
      refetch();
    } catch (error: any) {
      toast.error(error?.message || "Failed to approve leave");
    }
  };

  const openRejectDialog = (leave: any) => {
    setSelectedLeave(leave);
    setRejectionReason("");
    setRejectDialogOpen(true);
  };

  const handleReject = async () => {
    if (!selectedLeave?.id) return;
    try {
      await rejectLeave.mutateAsync({
        leaveRequestId: selectedLeave.id,
        rejectionReason: rejectionReason.trim() || undefined,
      });
      toast.success("Leave request rejected");
      setRejectDialogOpen(false);
      setSelectedLeave(null);
      setRejectionReason("");
      refetch();
    } catch (error: any) {
      toast.error(error?.message || "Failed to reject leave");
    }
  };

  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/leave">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-semibold">Leave Approvals</h1>
            <p className="text-sm text-gray-600 mt-0.5">
              Review and approve or reject pending leave requests
            </p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Pending Requests ({list.length})
          </CardTitle>
          <CardDescription>
            Leave requests from teachers and staff awaiting your action. Approve or reject with optional reason.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : list.length === 0 ? (
            <div className="text-center py-12 text-gray-600">
              <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="font-medium">No pending leave requests</p>
              <p className="text-sm mt-1">New requests will appear here for approval.</p>
              <Link href="/admin/leave">
                <Button variant="outline" className="mt-4">
                  Back to Leave Management
                </Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#e5ffc7]">
                    <TableHead>Requester</TableHead>
                    <TableHead>Leave Type</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Days</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Applied On</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {list.map((leave: any) => {
                    const start = new Date(leave.startDate);
                    const end = new Date(leave.endDate);
                    const days =
                      Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                    return (
                      <TableRow key={leave.id}>
                        <TableCell className="font-medium">
                          {leave.requesterName ?? leave.userId}
                        </TableCell>
                        <TableCell>{leave.leaveType?.name ?? "N/A"}</TableCell>
                        <TableCell>{format(start, "MMM dd, yyyy")}</TableCell>
                        <TableCell>{format(end, "MMM dd, yyyy")}</TableCell>
                        <TableCell>
                          {days} day{days !== 1 ? "s" : ""}
                        </TableCell>
                        <TableCell className="max-w-xs truncate">{leave.reason}</TableCell>
                        <TableCell>
                          {format(new Date(leave.createdAt), "MMM dd, yyyy")}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => handleApprove(leave.id)}
                              disabled={approveLeave.isPending}
                            >
                              <CheckCircle2 className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => openRejectDialog(leave)}
                              disabled={rejectLeave.isPending}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Leave Request</DialogTitle>
            <DialogDescription>
              Optionally provide a reason for rejection. The requester will be notified.
            </DialogDescription>
          </DialogHeader>
          {selectedLeave && (
            <div className="space-y-4 py-2">
              <p className="text-sm text-gray-600">
                {selectedLeave.requesterName} – {selectedLeave.leaveType?.name} (
                {format(new Date(selectedLeave.startDate), "MMM dd")}–
                {format(new Date(selectedLeave.endDate), "MMM dd, yyyy")})
              </p>
              <div className="space-y-2">
                <Label htmlFor="rejectionReason">Reason (optional)</Label>
                <Textarea
                  id="rejectionReason"
                  placeholder="e.g. Insufficient coverage during this period"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={3}
                  maxLength={500}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={rejectLeave.isPending}>
              {rejectLeave.isPending ? "Rejecting..." : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
