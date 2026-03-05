"use client";

import { useState } from "react";
import {
    useSubjects,
    useCreateSubject,
    useUpdateSubject,
    useDeleteSubject,
} from "@/lib/hooks/use-subjects";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, Book } from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export default function SubjectsPage() {
    const [page, setPage] = useState(1);
    const { data, isLoading, refetch } = useSubjects({ page, limit: 15 });
    const createSubject = useCreateSubject();
    const updateSubject = useUpdateSubject();
    const deleteSubject = useDeleteSubject();

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedSubject, setSelectedSubject] = useState<any>(null);

    // Form states
    const [name, setName] = useState("");
    const [code, setCode] = useState("");
    const [description, setDescription] = useState("");

    const subjects = data?.data || [];
    const totalPages = data?.pagination?.totalPages || 1;

    const openAddDialog = () => {
        setSelectedSubject(null);
        setName("");
        setCode("");
        setDescription("");
        setIsDialogOpen(true);
    };

    const openEditDialog = (subject: any) => {
        setSelectedSubject(subject);
        setName(subject.name || "");
        setCode(subject.code || "");
        setDescription(subject.description || "");
        setIsDialogOpen(true);
    };

    const openDeleteDialog = (subject: any) => {
        setSelectedSubject(subject);
        setIsDeleteDialogOpen(true);
    };

    const handleSave = async () => {
        if (!name.trim()) {
            toast.error("Subject name is required");
            return;
        }

        const payload = {
            name: name.trim(),
            code: code.trim(),
            description: description.trim(),
        };

        try {
            if (selectedSubject) {
                await updateSubject.mutateAsync({ id: selectedSubject.id, data: payload });
                toast.success("Subject updated successfully");
            } else {
                await createSubject.mutateAsync(payload);
                toast.success("Subject created successfully");
            }
            setIsDialogOpen(false);
            refetch();
        } catch (error: any) {
            toast.error(error?.message || "Failed to save subject");
        }
    };

    const handleDelete = async () => {
        if (!selectedSubject) return;
        try {
            await deleteSubject.mutateAsync(selectedSubject.id);
            toast.success("Subject deleted successfully");
            setIsDeleteDialogOpen(false);
            refetch();
        } catch (error: any) {
            toast.error(error?.message || "Failed to delete subject");
        }
    };

    const isProcessing = createSubject.isPending || updateSubject.isPending || deleteSubject.isPending;

    return (
        <div className="space-y-6 pb-8">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold">Subject Management</h1>
                <Button onClick={openAddDialog} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Subject
                </Button>
            </div>

            <div className="bg-white rounded-lg shadow border overflow-hidden">
                {isLoading ? (
                    <div className="p-6">
                        <Skeleton className="h-64 w-full" />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-schooliat-tint">
                                    <TableHead>Subject Name</TableHead>
                                    <TableHead>Subject Code</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {subjects.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-32 text-center text-gray-500">
                                            <Book className="h-10 w-10 mx-auto mb-2 text-gray-300" />
                                            <p>No subjects found.</p>
                                            <p className="text-sm">Click "Add Subject" to create one.</p>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    subjects.map((subject: any) => (
                                        <TableRow key={subject.id}>
                                            <TableCell className="font-medium">{subject.name}</TableCell>
                                            <TableCell>{subject.code || "-"}</TableCell>
                                            <TableCell className="max-w-xs truncate">{subject.description || "-"}</TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => openEditDialog(subject)}
                                                        className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => openDeleteDialog(subject)}
                                                        className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
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
                )}
            </div>

            {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-gray-600">
                        Page {page} of {totalPages}
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page === 1}
                        >
                            Previous
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            )}

            {/* Add / Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{selectedSubject ? "Edit Subject" : "Add Subject"}</DialogTitle>
                        <DialogDescription>
                            {selectedSubject
                                ? "Update the details for this subject."
                                : "Create a new subject to assign to classes."}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">
                                Subject Name <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="name"
                                placeholder="e.g. Mathematics"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="code">Subject Code (Optional)</Label>
                            <Input
                                id="code"
                                placeholder="e.g. MTH101"
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">Description (Optional)</Label>
                            <Textarea
                                id="description"
                                placeholder="Brief description about the subject..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={3}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isProcessing}>
                            Cancel
                        </Button>
                        <Button onClick={handleSave} disabled={isProcessing}>
                            {isProcessing ? "Saving..." : "Save Subject"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Dialog */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Subject</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete <strong>{selectedSubject?.name}</strong>? This action will remove it from the list of available subjects.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={isProcessing}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={isProcessing}>
                            {isProcessing ? "Deleting..." : "Delete"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
