"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useGalleries, useDeleteGallery } from "@/lib/hooks/use-gallery";
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
import { Plus, Image as ImageIcon, Eye, Edit, Trash2, Search } from "lucide-react";
import { format } from "date-fns";

export default function GalleryPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const limit = 15;

  const { data, isLoading, refetch } = useGalleries({
    page,
    limit,
  });

  const deleteGallery = useDeleteGallery();

  const galleries = data?.data || [];
  const totalPages = data?.pagination?.totalPages || 1;

  const filteredGalleries = galleries.filter((gallery: any) =>
    gallery.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleView = useCallback(
    (gallery: any) => {
      router.push(`/admin/gallery/${gallery.id}`);
    },
    [router]
  );

  const handleEdit = useCallback(
    (gallery: any) => {
      router.push(`/admin/gallery/${gallery.id}/edit`);
    },
    [router]
  );

  const handleDelete = useCallback(
    async (galleryId: string) => {
      if (!confirm("Are you sure you want to delete this gallery?")) {
        return;
      }

      try {
        await deleteGallery.mutateAsync(galleryId);
        toast.success("Gallery deleted successfully!");
        refetch();
      } catch (error: any) {
        toast.error(error?.message || "Failed to delete gallery");
      }
    },
    [deleteGallery, refetch]
  );

  const handleAddNew = useCallback(() => {
    router.push("/admin/gallery/add");
  }, [router]);

  const getPrivacyBadge = (privacy: string) => {
    switch (privacy) {
      case "PUBLIC":
        return <Badge className="bg-green-500 hover:bg-green-600">Public</Badge>;
      case "PRIVATE":
        return <Badge variant="destructive">Private</Badge>;
      case "CLASS_ONLY":
        return <Badge className="bg-blue-500 hover:bg-blue-600">Class Only</Badge>;
      default:
        return <Badge>{privacy}</Badge>;
    }
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Gallery Management</h1>
        <Button onClick={handleAddNew} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Gallery
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search galleries by title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-md"
            />
          </div>
        </CardContent>
      </Card>

      {/* Galleries Table */}
      <Card>
        <CardHeader>
          <CardTitle>Photo Galleries</CardTitle>
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
                      <TableHead>Description</TableHead>
                      <TableHead>Privacy</TableHead>
                      <TableHead>Images</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="w-32">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredGalleries.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          No galleries found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredGalleries.map((gallery: any, index: number) => (
                        <TableRow key={gallery.id}>
                          <TableCell className="font-medium">
                            {String((page - 1) * limit + index + 1).padStart(2, "0")}
                          </TableCell>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <ImageIcon className="h-4 w-4 text-gray-400" />
                              {gallery.title}
                            </div>
                          </TableCell>
                          <TableCell className="max-w-xs truncate">
                            {gallery.description || "N/A"}
                          </TableCell>
                          <TableCell>{getPrivacyBadge(gallery.privacy)}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {gallery.images?.length || 0} images
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {gallery.createdAt
                              ? format(new Date(gallery.createdAt), "MMM dd, yyyy")
                              : "N/A"}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleView(gallery)}
                                className="h-8 w-8"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEdit(gallery)}
                                className="h-8 w-8"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(gallery.id)}
                                disabled={deleteGallery.isPending}
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
    </div>
  );
}

