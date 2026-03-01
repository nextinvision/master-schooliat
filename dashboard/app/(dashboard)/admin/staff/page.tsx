"use client";

import { useState, useCallback } from "react";
import { StaffTable } from "@/components/staff/staff-table";
import { useStaffPage, useCreateStaff, useDeleteStaff } from "@/lib/hooks/use-staff";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useForm, FormProvider, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { staffSchema, StaffFormData } from "@/lib/schemas/staff-schema";
import { FormCard } from "@/components/forms/form-card";
import { RadioGroup } from "@/components/forms/radio-group";
import { PhotoUpload } from "@/components/forms/photo-upload";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { UserPlus } from "lucide-react";

export default function StaffPage() {
    const [page, setPage] = useState(1);
    const [isAddStaffDialogOpen, setIsAddStaffDialogOpen] = useState(false);
    const limit = 15;

    // Staff data
    const { data: staffData, isLoading: staffLoading, refetch: refetchStaff } = useStaffPage(page, limit);
    const staff = staffData?.data || [];
    const staffTotalPages = staffData?.totalPages || 1;

    // Mutations
    const createStaff = useCreateStaff();
    const deleteStaff = useDeleteStaff();

    // Staff form
    const staffForm = useForm<StaffFormData>({
        resolver: zodResolver(staffSchema),
        defaultValues: {
            firstName: "",
            lastName: "",
            gender: undefined,
            dob: "",
            contact: "",
            email: "",
            areaStreet: "",
            location: "",
            district: "",
            pincode: "",
            state: "",
            registrationPhotoId: null,
            aadhaarId: "",
        },
        mode: "onBlur",
    });

    const handleCreateStaff = useCallback(async (data: StaffFormData) => {
        try {
            await createStaff.mutateAsync(data);
            toast.success("Staff member created successfully!");
            staffForm.reset();
            setIsAddStaffDialogOpen(false);
            refetchStaff();
        } catch (error: any) {
            toast.error(error?.message || "Failed to create staff member");
        }
    }, [createStaff, staffForm, refetchStaff]);

    const handleDeleteStaff = useCallback(async (staffId: string) => {
        try {
            await deleteStaff.mutateAsync(staffId);
            toast.success("Staff member deleted successfully!");
            refetchStaff();
        } catch (error: any) {
            toast.error(error?.message || "Failed to delete staff member");
        }
    }, [deleteStaff, refetchStaff]);

    const handleBulkDelete = useCallback(async (ids: string[]) => {
        try {
            await Promise.all(ids.map(id => deleteStaff.mutateAsync(id)));
            toast.success(`${ids.length} staff member(s) deleted successfully!`);
            refetchStaff();
        } catch (error: any) {
            toast.error(error?.message || "Failed to delete staff members");
        }
    }, [deleteStaff, refetchStaff]);

    const handleEditStaff = useCallback((member: any) => {
        // For now, edit is not implemented as a separate page, 
        // but we could open an edit dialog here.
        toast.info("Edit functionality for staff is coming soon!");
    }, []);

    return (
        <div className="space-y-6 pb-8">
            {/* Table */}
            <StaffTable
                staff={staff}
                onAddNew={() => setIsAddStaffDialogOpen(true)}
                onEdit={handleEditStaff}
                onDelete={handleDeleteStaff}
                onBulkDelete={handleBulkDelete}
                page={page - 1}
                onPageChange={(newPage) => setPage(newPage + 1)}
                serverTotalPages={staffTotalPages}
                loading={staffLoading}
                onRefresh={refetchStaff}
            />

            {/* Add Staff Dialog */}
            <Dialog open={isAddStaffDialogOpen} onOpenChange={setIsAddStaffDialogOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                    <DialogHeader>
                        <DialogTitle>Add New Staff Member</DialogTitle>
                        <DialogDescription>
                            Fill in the information below to add a new staff member.
                        </DialogDescription>
                    </DialogHeader>
                    <ScrollArea className="flex-1 pr-4">
                        <FormProvider {...staffForm}>
                            <form onSubmit={staffForm.handleSubmit(handleCreateStaff)} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-1">
                                    {/* Basic Information */}
                                    <FormCard title="Basic Information">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="firstName">First Name *</Label>
                                                <Input
                                                    id="firstName"
                                                    {...staffForm.register("firstName")}
                                                    placeholder="First Name"
                                                    className={staffForm.formState.errors.firstName ? "border-red-500" : ""}
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="lastName">Last Name *</Label>
                                                <Input
                                                    id="lastName"
                                                    {...staffForm.register("lastName")}
                                                    placeholder="Last Name"
                                                    className={staffForm.formState.errors.lastName ? "border-red-500" : ""}
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label>Gender *</Label>
                                                <Controller
                                                    control={staffForm.control}
                                                    name="gender"
                                                    render={({ field: { value, onChange } }) => (
                                                        <RadioGroup
                                                            options={[
                                                                { value: "MALE", label: "Male" },
                                                                { value: "FEMALE", label: "Female" },
                                                            ]}
                                                            value={value}
                                                            onChange={onChange}
                                                        />
                                                    )}
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="dob">Date of Birth *</Label>
                                                <Input
                                                    id="dob"
                                                    type="date"
                                                    {...staffForm.register("dob")}
                                                    className={staffForm.formState.errors.dob ? "border-red-500" : ""}
                                                />
                                            </div>

                                            <div className="space-y-2 col-span-2">
                                                <Label htmlFor="aadhaarId">Aadhaar ID *</Label>
                                                <Input
                                                    id="aadhaarId"
                                                    {...staffForm.register("aadhaarId")}
                                                    placeholder="XXXX XXXX XXXX"
                                                    maxLength={12}
                                                />
                                            </div>

                                            <div className="space-y-2 col-span-2 md:col-span-1">
                                                <Label htmlFor="basicSalary">Monthly Base Salary</Label>
                                                <Input
                                                    id="basicSalary"
                                                    type="number"
                                                    {...staffForm.register("basicSalary", { valueAsNumber: true })}
                                                    placeholder="Enter exact salary (e.g. 50000)"
                                                    className={staffForm.formState.errors.basicSalary ? "border-red-500" : ""}
                                                />
                                            </div>

                                            <div className="space-y-2 col-span-2">
                                                <PhotoUpload
                                                    name="registrationPhotoId"
                                                    label="Profile Photo"
                                                />
                                            </div>
                                        </div>
                                    </FormCard>

                                    {/* Contact & Address */}
                                    <FormCard title="Contact & Address">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="contact">Contact *</Label>
                                                <Input
                                                    id="contact"
                                                    {...staffForm.register("contact")}
                                                    placeholder="Phone number"
                                                    maxLength={10}
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="email">Email *</Label>
                                                <Input
                                                    id="email"
                                                    type="email"
                                                    {...staffForm.register("email")}
                                                    placeholder="example@gmail.com"
                                                />
                                            </div>

                                            <div className="space-y-2 col-span-2">
                                                <Label htmlFor="areaStreet">Area and Street *</Label>
                                                <Input
                                                    id="areaStreet"
                                                    {...staffForm.register("areaStreet")}
                                                    placeholder="Area and Street"
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="location">Location *</Label>
                                                <Input
                                                    id="location"
                                                    {...staffForm.register("location")}
                                                    placeholder="Location"
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="district">District *</Label>
                                                <Input
                                                    id="district"
                                                    {...staffForm.register("district")}
                                                    placeholder="District"
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="pincode">Pincode *</Label>
                                                <Input
                                                    id="pincode"
                                                    {...staffForm.register("pincode")}
                                                    placeholder="6 digits"
                                                    maxLength={6}
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="state">State *</Label>
                                                <Input
                                                    id="state"
                                                    {...staffForm.register("state")}
                                                    placeholder="State"
                                                />
                                            </div>
                                        </div>
                                    </FormCard>
                                </div>
                            </form>
                        </FormProvider>
                    </ScrollArea>
                    <DialogFooter className="mt-6">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                staffForm.reset();
                                setIsAddStaffDialogOpen(false);
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            onClick={staffForm.handleSubmit(handleCreateStaff)}
                            disabled={createStaff.isPending}
                            className="bg-primary hover:bg-primary/90 font-bold px-8"
                        >
                            {createStaff.isPending ? "Creating..." : "Create Staff Member"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
