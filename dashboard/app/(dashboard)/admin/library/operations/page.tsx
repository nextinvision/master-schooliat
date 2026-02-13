"use client";

import { useState, useCallback } from "react";
import { useLibraryIssues, useIssueBook, useReturnBook } from "@/lib/hooks/use-library-operations";
import { useBooks } from "@/lib/hooks/use-library";
import { useStudentsPage } from "@/lib/hooks/use-students";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { BookOpen, ArrowRight, ArrowLeft, Plus } from "lucide-react";
import { format, addDays } from "date-fns";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function LibraryOperationsPage() {
  const [activeTab, setActiveTab] = useState<"issues" | "issue-new">("issues");
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("ISSUED");

  // Issue new book dialog
  const [issueDialogOpen, setIssueDialogOpen] = useState(false);
  const [selectedBookId, setSelectedBookId] = useState<string>("");
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [dueDate, setDueDate] = useState<string>(format(addDays(new Date(), 14), "yyyy-MM-dd"));

  const { data: issuesData, isLoading: issuesLoading, refetch } = useLibraryIssues({
    page,
    limit: 15,
    status: statusFilter,
  });

  const { data: booksData } = useBooks({ page: 1, limit: 100 });
  const { data: studentsData } = useStudentsPage(1, 1000);

  const issueBook = useIssueBook();
  const returnBook = useReturnBook();

  const issues = issuesData?.data || [];
  const books = booksData?.data || [];
  const students = studentsData?.data || [];
  const totalPages = issuesData?.pagination?.totalPages || 1;

  const handleIssueBook = useCallback(async () => {
    if (!selectedBookId || !selectedStudentId || !dueDate) {
      toast.error("Please fill all fields");
      return;
    }

    try {
      await issueBook.mutateAsync({
        bookId: selectedBookId,
        studentId: selectedStudentId,
        dueDate,
      });
      toast.success("Book issued successfully");
      setIssueDialogOpen(false);
      setSelectedBookId("");
      setSelectedStudentId("");
      setDueDate(format(addDays(new Date(), 14), "yyyy-MM-dd"));
      refetch();
    } catch (error: any) {
      toast.error(error?.message || "Failed to issue book");
    }
  }, [selectedBookId, selectedStudentId, dueDate, issueBook, refetch]);

  const handleReturnBook = useCallback(
    async (issueId: string) => {
      try {
        await returnBook.mutateAsync({ issueId });
        toast.success("Book returned successfully");
        refetch();
      } catch (error: any) {
        toast.error(error?.message || "Failed to return book");
      }
    },
    [returnBook, refetch]
  );

  const getStatusBadge = (status: string, dueDate?: string) => {
    const isOverdue = dueDate && new Date(dueDate) < new Date() && status === "ISSUED";
    
    if (isOverdue) {
      return <Badge className="bg-red-500 hover:bg-red-600">Overdue</Badge>;
    }
    
    switch (status) {
      case "ISSUED":
        return <Badge className="bg-blue-500 hover:bg-blue-600">Issued</Badge>;
      case "RETURNED":
        return <Badge className="bg-green-500 hover:bg-green-600">Returned</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Library Operations</h1>
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ISSUED">Issued</SelectItem>
              <SelectItem value="RETURNED">Returned</SelectItem>
              <SelectItem value="ALL">All</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => setIssueDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Issue Book
          </Button>
        </div>
      </div>

      {/* Issues Table */}
      <Card>
        <CardHeader>
          <CardTitle>Book Issues</CardTitle>
        </CardHeader>
        <CardContent>
          {issuesLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : issues.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>No book issues found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-[#e5ffc7]">
                      <TableHead>Book</TableHead>
                      <TableHead>Student</TableHead>
                      <TableHead>Issue Date</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Fine</TableHead>
                      <TableHead className="w-32">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {issues.map((issue: any) => (
                      <TableRow key={issue.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <BookOpen className="h-4 w-4 text-gray-400" />
                            {issue.book?.title || "N/A"}
                          </div>
                        </TableCell>
                        <TableCell>
                          {issue.student?.firstName} {issue.student?.lastName}
                        </TableCell>
                        <TableCell>
                          {format(new Date(issue.issueDate), "MMM dd, yyyy")}
                        </TableCell>
                        <TableCell>
                          {format(new Date(issue.dueDate), "MMM dd, yyyy")}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(issue.status, issue.dueDate)}
                        </TableCell>
                        <TableCell>
                          {issue.fineAmount ? `₹${issue.fineAmount}` : "N/A"}
                        </TableCell>
                        <TableCell>
                          {issue.status === "ISSUED" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleReturnBook(issue.id)}
                              disabled={returnBook.isPending}
                            >
                              <ArrowLeft className="h-4 w-4 mr-1" />
                              Return
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
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
                      disabled={page >= totalPages}
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

      {/* Issue Book Dialog */}
      <Dialog open={issueDialogOpen} onOpenChange={setIssueDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Issue Book</DialogTitle>
            <DialogDescription>
              Select a book and student to issue a new book.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Book</Label>
              <Select value={selectedBookId} onValueChange={setSelectedBookId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Book" />
                </SelectTrigger>
                <SelectContent>
                  {books
                    .filter((book: any) => book.availableCopies > 0)
                    .map((book: any) => (
                      <SelectItem key={book.id} value={book.id}>
                        {book.title} - {book.author} (Available: {book.availableCopies})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Student</Label>
              <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Student" />
                </SelectTrigger>
                <SelectContent>
                  {students.map((student: any) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.firstName} {student.lastName} - {student.studentProfile?.class?.grade || "N/A"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Due Date</Label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                min={format(new Date(), "yyyy-MM-dd")}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIssueDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleIssueBook} disabled={issueBook.isPending}>
              {issueBook.isPending ? "Issuing..." : "Issue Book"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

