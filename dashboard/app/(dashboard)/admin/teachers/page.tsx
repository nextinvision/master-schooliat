"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { TeachersTable } from "@/components/teachers/teachers-table";
import { useTeachersPage, useCreateTeacher, useDeleteTeacher } from "@/lib/hooks/use-teachers";
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
import {
  addTeacherSchemaWithRefinement,
  AddTeacherFormData,
} from "@/lib/schemas/teacher-schema";
import { FormCard } from "@/components/forms/form-card";
import { RadioGroup } from "@/components/forms/radio-group";
import { ChipGroup } from "@/components/forms/chip-group";
import { TransportDropdown } from "@/components/forms/transport-dropdown";
import { PhotoUpload } from "@/components/forms/photo-upload";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { UserPlus } from "lucide-react";

export default function TeachersPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [isAddTeacherDialogOpen, setIsAddTeacherDialogOpen] = useState(false);
  const limit = 15;

  // Teachers data
  const { data: teachersData, isLoading: teachersLoading, refetch: refetchTeachers } = useTeachersPage(page, limit);
  const teachers = teachersData?.data || [];
  const teachersTotalPages = teachersData?.totalPages || 1;

  // Mutations
  const createTeacher = useCreateTeacher();
  const deleteTeacher = useDeleteTeacher();

  // Teacher form
  const teacherForm = useForm<AddTeacherFormData>({
    resolver: zodResolver(addTeacherSchemaWithRefinement),
    defaultValues: {
      firstName: "",
      lastName: "",
      gender: undefined,
      dob: "",
      designation: "",
      contact: "",
      email: "",
      areaStreet: "",
      location: "",
      district: "",
      pincode: "",
      state: "",
      highestQualification: "",
      university: "",
      yearOfPassing: "",
      percentage: "",
      transportMode: "Transport",
      transportId: "",
      registrationPhotoId: null,
      aadhaarId: "",
      panCardNumber: "",
    },
    mode: "onBlur",
  });

  const handleCreateTeacher = useCallback(async (data: AddTeacherFormData) => {
    try {
      await createTeacher.mutateAsync(data);
      toast.success("Teacher created successfully!");
      teacherForm.reset();
      setIsAddTeacherDialogOpen(false);
      refetchTeachers();
    } catch (error: any) {
      toast.error(error?.message || "Failed to create teacher");
    }
  }, [createTeacher, teacherForm, refetchTeachers]);

  const handleDeleteTeacher = useCallback(async (teacherId: string) => {
    if (!confirm("Are you sure you want to delete this teacher?")) return;
    try {
      await deleteTeacher.mutateAsync(teacherId);
      toast.success("Teacher deleted successfully!");
      refetchTeachers();
    } catch (error: any) {
      toast.error(error?.message || "Failed to delete teacher");
    }
  }, [deleteTeacher, refetchTeachers]);

  const handleBulkDelete = useCallback(async (ids: string[]) => {
    if (!confirm(`Are you sure you want to delete ${ids.length} teacher(s)?`)) return;
    try {
      await Promise.all(ids.map(id => deleteTeacher.mutateAsync(id)));
      toast.success(`${ids.length} teacher(s) deleted successfully!`);
      refetchTeachers();
    } catch (error: any) {
      toast.error(error?.message || "Failed to delete teachers");
    }
  }, [deleteTeacher, refetchTeachers]);

  const handleEditTeacher = useCallback((teacher: any) => {
    router.push(`/admin/teachers/${teacher.id}/edit`);
  }, [router]);

  const transportMode = teacherForm.watch("transportMode");

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Teachers</h1>
          <p className="text-gray-600 mt-1">Manage teachers and their information</p>
        </div>
        <Button 
          onClick={() => setIsAddTeacherDialogOpen(true)} 
          className="gap-2"
        >
          <UserPlus className="h-4 w-4" />
          Add Teacher
        </Button>
      </div>

      {/* Teachers Table */}
      <TeachersTable
        teachers={teachers}
        onAddNew={() => setIsAddTeacherDialogOpen(true)}
        onEdit={handleEditTeacher}
        onDelete={handleDeleteTeacher}
        onBulkDelete={handleBulkDelete}
        page={page - 1}
        onPageChange={(newPage) => setPage(newPage + 1)}
        serverTotalPages={teachersTotalPages}
        loading={teachersLoading}
        onRefresh={refetchTeachers}
      />

      {/* Add Teacher Dialog */}
      <Dialog open={isAddTeacherDialogOpen} onOpenChange={setIsAddTeacherDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Add New Teacher</DialogTitle>
            <DialogDescription>
              Fill in the teacher information below. All required fields are marked with *.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="flex-1 pr-4">
            <FormProvider {...teacherForm}>
              <form onSubmit={teacherForm.handleSubmit(handleCreateTeacher)} className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Basic Information */}
                  <FormCard title="Basic Information">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name *</Label>
                        <Input
                          id="firstName"
                          {...teacherForm.register("firstName")}
                          placeholder="First Name"
                          className={teacherForm.formState.errors.firstName ? "border-red-500" : ""}
                        />
                        {teacherForm.formState.errors.firstName && (
                          <p className="text-sm text-red-500">
                            {teacherForm.formState.errors.firstName.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name *</Label>
                        <Input
                          id="lastName"
                          {...teacherForm.register("lastName")}
                          placeholder="Last Name"
                          className={teacherForm.formState.errors.lastName ? "border-red-500" : ""}
                        />
                        {teacherForm.formState.errors.lastName && (
                          <p className="text-sm text-red-500">
                            {teacherForm.formState.errors.lastName.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label>Gender *</Label>
                        <Controller
                          control={teacherForm.control}
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
                        {teacherForm.formState.errors.gender && (
                          <p className="text-sm text-red-500">
                            {teacherForm.formState.errors.gender.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="dob">Date of Birth *</Label>
                        <Input
                          id="dob"
                          type="date"
                          {...teacherForm.register("dob")}
                          className={teacherForm.formState.errors.dob ? "border-red-500" : ""}
                        />
                        {teacherForm.formState.errors.dob && (
                          <p className="text-sm text-red-500">{teacherForm.formState.errors.dob.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="designation">Designation *</Label>
                        <Input
                          id="designation"
                          {...teacherForm.register("designation")}
                          placeholder="Designation"
                          className={teacherForm.formState.errors.designation ? "border-red-500" : ""}
                        />
                        {teacherForm.formState.errors.designation && (
                          <p className="text-sm text-red-500">
                            {teacherForm.formState.errors.designation.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="aadhaarId">Aadhaar ID *</Label>
                        <Input
                          id="aadhaarId"
                          type="tel"
                          {...teacherForm.register("aadhaarId")}
                          placeholder="XXXX XXXX XXXX"
                          maxLength={12}
                          className={teacherForm.formState.errors.aadhaarId ? "border-red-500" : ""}
                        />
                        {teacherForm.formState.errors.aadhaarId && (
                          <p className="text-sm text-red-500">
                            {teacherForm.formState.errors.aadhaarId.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2 col-span-2">
                        <PhotoUpload
                          name="registrationPhotoId"
                          label="Teacher Photo"
                        />
                      </div>

                      <div className="space-y-2 col-span-2">
                        <Label htmlFor="panCardNumber">PAN Card Number *</Label>
                        <Input
                          id="panCardNumber"
                          {...teacherForm.register("panCardNumber")}
                          placeholder="eg. ABCDE1234F"
                          maxLength={10}
                          style={{ textTransform: "uppercase" }}
                          className={teacherForm.formState.errors.panCardNumber ? "border-red-500 uppercase" : "uppercase"}
                        />
                        {teacherForm.formState.errors.panCardNumber && (
                          <p className="text-sm text-red-500">
                            {teacherForm.formState.errors.panCardNumber.message}
                          </p>
                        )}
                      </div>
                    </div>
                  </FormCard>

                  {/* Contact Information */}
                  <FormCard title="Contact Information">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="contact">Contact *</Label>
                        <Input
                          id="contact"
                          type="tel"
                          {...teacherForm.register("contact")}
                          placeholder="Contact number"
                          maxLength={10}
                          className={teacherForm.formState.errors.contact ? "border-red-500" : ""}
                        />
                        {teacherForm.formState.errors.contact && (
                          <p className="text-sm text-red-500">
                            {teacherForm.formState.errors.contact.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          id="email"
                          type="email"
                          {...teacherForm.register("email")}
                          placeholder="example@gmail.com"
                          className={teacherForm.formState.errors.email ? "border-red-500" : ""}
                        />
                        {teacherForm.formState.errors.email && (
                          <p className="text-sm text-red-500">{teacherForm.formState.errors.email.message}</p>
                        )}
                      </div>

                      <div className="space-y-2 col-span-2">
                        <Label htmlFor="areaStreet">Area and Street *</Label>
                        <Input
                          id="areaStreet"
                          {...teacherForm.register("areaStreet")}
                          placeholder="Area and Street"
                          className={teacherForm.formState.errors.areaStreet ? "border-red-500" : ""}
                        />
                        {teacherForm.formState.errors.areaStreet && (
                          <p className="text-sm text-red-500">
                            {teacherForm.formState.errors.areaStreet.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="location">Location *</Label>
                        <Input
                          id="location"
                          {...teacherForm.register("location")}
                          placeholder="Location"
                          className={teacherForm.formState.errors.location ? "border-red-500" : ""}
                        />
                        {teacherForm.formState.errors.location && (
                          <p className="text-sm text-red-500">
                            {teacherForm.formState.errors.location.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="district">District *</Label>
                        <Input
                          id="district"
                          {...teacherForm.register("district")}
                          placeholder="District"
                          className={teacherForm.formState.errors.district ? "border-red-500" : ""}
                        />
                        {teacherForm.formState.errors.district && (
                          <p className="text-sm text-red-500">
                            {teacherForm.formState.errors.district.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="pincode">Pincode *</Label>
                        <Input
                          id="pincode"
                          type="tel"
                          {...teacherForm.register("pincode")}
                          placeholder="Pincode"
                          maxLength={6}
                          className={teacherForm.formState.errors.pincode ? "border-red-500" : ""}
                        />
                        {teacherForm.formState.errors.pincode && (
                          <p className="text-sm text-red-500">
                            {teacherForm.formState.errors.pincode.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="state">State *</Label>
                        <Input
                          id="state"
                          {...teacherForm.register("state")}
                          placeholder="State"
                          className={teacherForm.formState.errors.state ? "border-red-500" : ""}
                        />
                        {teacherForm.formState.errors.state && (
                          <p className="text-sm text-red-500">{teacherForm.formState.errors.state.message}</p>
                        )}
                      </div>
                    </div>
                  </FormCard>

                  {/* Education */}
                  <FormCard title="Education">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="highestQualification">Highest Qualification *</Label>
                        <Input
                          id="highestQualification"
                          {...teacherForm.register("highestQualification")}
                          placeholder="E.g. B.E"
                          className={
                            teacherForm.formState.errors.highestQualification ? "border-red-500" : ""
                          }
                        />
                        {teacherForm.formState.errors.highestQualification && (
                          <p className="text-sm text-red-500">
                            {teacherForm.formState.errors.highestQualification.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="university">University *</Label>
                        <Input
                          id="university"
                          {...teacherForm.register("university")}
                          placeholder="University Name"
                          className={teacherForm.formState.errors.university ? "border-red-500" : ""}
                        />
                        {teacherForm.formState.errors.university && (
                          <p className="text-sm text-red-500">
                            {teacherForm.formState.errors.university.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="yearOfPassing">Year of Passing *</Label>
                        <Input
                          id="yearOfPassing"
                          type="tel"
                          {...teacherForm.register("yearOfPassing")}
                          placeholder="Year"
                          maxLength={4}
                          className={teacherForm.formState.errors.yearOfPassing ? "border-red-500" : ""}
                        />
                        {teacherForm.formState.errors.yearOfPassing && (
                          <p className="text-sm text-red-500">
                            {teacherForm.formState.errors.yearOfPassing.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="percentage">Percentage / Grade *</Label>
                        <Input
                          id="percentage"
                          {...teacherForm.register("percentage")}
                          placeholder="e.g. 78%, 8.2 CGPA"
                          className={teacherForm.formState.errors.percentage ? "border-red-500" : ""}
                        />
                        {teacherForm.formState.errors.percentage && (
                          <p className="text-sm text-red-500">
                            {teacherForm.formState.errors.percentage.message}
                          </p>
                        )}
                      </div>
                    </div>
                  </FormCard>

                  {/* Additional Information */}
                  <FormCard title="Additional Information">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Transport Mode *</Label>
                        <Controller
                          control={teacherForm.control}
                          name="transportMode"
                          render={({ field: { value, onChange } }) => (
                            <ChipGroup
                              options={[
                                { value: "Transport", label: "Transport" },
                                { value: "Non Transport", label: "Non Transport" },
                              ]}
                              value={value}
                              onChange={(val) => {
                                onChange(val);
                                if (val === "Non Transport") {
                                  teacherForm.setValue("transportId", "");
                                }
                              }}
                            />
                          )}
                        />
                        {teacherForm.formState.errors.transportMode && (
                          <p className="text-sm text-red-500">
                            {teacherForm.formState.errors.transportMode.message}
                          </p>
                        )}
                      </div>

                      {transportMode === "Transport" && (
                        <div className="space-y-2">
                          <TransportDropdown
                            name="transportId"
                            label="Select Transport *"
                            rules={{ required: "Transport is required" }}
                          />
                          {teacherForm.formState.errors.transportId && (
                            <p className="text-sm text-red-500">
                              {teacherForm.formState.errors.transportId.message}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </FormCard>
                </div>
              </form>
            </FormProvider>
          </ScrollArea>
          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                teacherForm.reset();
                setIsAddTeacherDialogOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => teacherForm.reset()}
            >
              Reset
            </Button>
            <Button
              type="button"
              onClick={teacherForm.handleSubmit(handleCreateTeacher)}
              disabled={createTeacher.isPending}
            >
              {createTeacher.isPending ? "Creating..." : "Create Teacher"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

