"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useBooks, useLibraryDashboard, useDeleteBook } from "@/lib/hooks/use-library";
import { useDeleteWithOTP } from "@/lib/hooks/use-delete-with-otp";
import { DeletionOTPModal } from "@/components/common/deletion-otp-modal";
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
import { Plus, BookOpen, Search, Eye, Edit, Trash2 } from "lucide-react";

export default function LibraryPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const limit = 15;

  const { data, isLoading, refetch } = useBooks({
    page,
    limit,
    title: searchQuery || undefined,
  });

  const { data: dashboardData } = useLibraryDashboard();
  const deleteBook = useDeleteBook();

  const books = data?.data || [];
  const totalPages = data?.pagination?.totalPages || 1;
  const dashboard = dashboardData?.data || {};

  // OTP-enabled delete
  const {
    handleDelete: handleDeleteWithOTP,
    otpModalOpen,
    entityToDelete,
    setOtpModalOpen,
    handleDeleteConfirmed,
    handleCancel,
  } = useDeleteWithOTP(
    async (id: string) => {
      await deleteBook.mutateAsync(id);
      toast.success("Book deleted successfully!");
      refetch();
    },
    (book: any) => book.title || "Book",
    () => "book",
    () => refetch()
  );

  const handleView = useCallback(
    (book: any) => {
      router.push(`/admin/library/${book.id}`);
    },
    [router]
  );

  const handleEdit = useCallback(
    (book: any) => {
      router.push(`/admin/library/${book.id}/edit`);
    },
    [router]
  );

  const handleDelete = useCallback(
    (bookId: string) => {
      const book = books.find((b: any) => b.id === bookId);
      if (book) {
        handleDeleteWithOTP(book);
      }
    },
    [books, handleDeleteWithOTP]
  );

  const handleAddNew = useCallback(() => {
    router.push("/admin/library/add");
  }, [router]);

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Library Management</h1>
        <Button onClick={handleAddNew} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Book
        </Button>
      </div>

      {/* Dashboard Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Books</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard.totalBooks || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-600">Available</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{dashboard.availableBooks || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-600">Issued</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{dashboard.issuedBooks || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-600">Overdue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{dashboard.overdueBooks || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search books by title, author, ISBN..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="max-w-md"
            />
          </div>
        </CardContent>
      </Card>

      {/* Books Table */}
      <Card>
        <CardHeader>
          <CardTitle>Books Catalog</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-[#e5ffc7]">
                      <TableHead className="w-16">No</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Author</TableHead>
                      <TableHead>ISBN</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Total Copies</TableHead>
                      <TableHead>Available</TableHead>
                      <TableHead className="w-32">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {books.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8">
                          No books found
                        </TableCell>
                      </TableRow>
                    ) : (
                      books.map((book: any, index: number) => (
                        <TableRow key={book.id}>
                          <TableCell className="font-medium">
                            {String((page - 1) * limit + index + 1).padStart(2, "0")}
                          </TableCell>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <BookOpen className="h-4 w-4 text-gray-400" />
                              {book.title}
                            </div>
                          </TableCell>
                          <TableCell>{book.author}</TableCell>
                          <TableCell>{book.isbn || "N/A"}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{book.category || "N/A"}</Badge>
                          </TableCell>
                          <TableCell>{book.totalCopies}</TableCell>
                          <TableCell>
                            <Badge
                              className={
                                book.availableCopies > 0
                                  ? "bg-green-500 hover:bg-green-600"
                                  : "bg-red-500 hover:bg-red-600"
                              }
                            >
                              {book.availableCopies}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleView(book)}
                                className="h-8 w-8"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEdit(book)}
                                className="h-8 w-8"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(book.id)}
                                disabled={deleteBook.isPending}
                                className="h-8 w-8"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
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

      {/* Deletion OTP Modal */}
      {entityToDelete && (
        <DeletionOTPModal
          open={otpModalOpen}
          onOpenChange={setOtpModalOpen}
          entityType={entityToDelete.type}
          entityId={entityToDelete.id}
          entityName={entityToDelete.name}
          onSuccess={handleDeleteConfirmed}
          onCancel={handleCancel}
        />
      )}
    </div>
  );
}

