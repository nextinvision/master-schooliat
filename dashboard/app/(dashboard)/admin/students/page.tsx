"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { StudentsTable } from "@/components/students/students-table";
import { useStudentsPage, useCreateStudent, useDeleteStudent } from "@/lib/hooks/use-students";
import { useTCs, useCreateTC, useUpdateTCStatus } from "@/lib/hooks/use-tc";
import { useStudents } from "@/lib/hooks/use-students";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import {
  Plus,
  FileText,
  Eye,
  CheckCircle,
  XCircle,
  Search,
  Users,
  UserPlus,
  GraduationCap,
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
import { FormProvider } from "react-hook-form";
import { addStudentSchema, StudentFormData } from "@/lib/schemas/student-schema";
import { FormTopBar } from "@/components/forms/form-top-bar";
import { FormCard } from "@/components/forms/form-card";
import { RadioGroup } from "@/components/forms/radio-group";
import { ChipGroup } from "@/components/forms/chip-group";
import { ClassDropdown } from "@/components/forms/class-dropdown";
import { TransportDropdown } from "@/components/forms/transport-dropdown";
import { PhotoUpload } from "@/components/forms/photo-upload";
import { Controller } from "react-hook-form";

const createTCSchema = z.object({
  studentId: z.string().min(1, "Student is required"),
  reason: z.string().min(1, "Reason is required"),
  transferDate: z.string().min(1, "Transfer date is required"),
  destinationSchool: z.string().optional(),
  remarks: z.string().optional(),
});

type CreateTCFormData = z.infer<typeof createTCSchema>;

export default function StudentsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("all");

  // Handle tab from URL query parameter
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get("tab");
      if (tab && ["all", "add", "transfer"].includes(tab)) {
        setActiveTab(tab);
      }
    }
  }, []);
  const [page, setPage] = useState(1);
  const [tcPage, setTcPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ISSUED" | "COLLECTED" | "CANCELLED" | "">("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const limit = 15;

  // Students data
  const { data: studentsData, isLoading: studentsLoading, refetch: refetchStudents } = useStudentsPage(page, limit);
  const students = studentsData?.data || [];
  const studentsTotalPages = studentsData?.pagination?.totalPages || 1;

  // Transfer Certificates data
  const { data: tcsData, isLoading: tcsLoading, refetch: refetchTCs } = useTCs({
    page: tcPage,
    limit,
    status: statusFilter || undefined,
    tcNumber: searchQuery || undefined,
  });
  const tcs = tcsData?.data || [];
  const tcsTotalPages = tcsData?.pagination?.totalPages || 1;

  // For TC creation - get all students
  const { data: allStudentsData } = useStudents({ page: 1, limit: 1000 });
  const allStudents = allStudentsData?.data || [];

  // Mutations
  const createStudent = useCreateStudent();
  const deleteStudent = useDeleteStudent();
  const createTC = useCreateTC();
  const updateTCStatus = useUpdateTCStatus();

  // Student form
  const studentForm = useForm<StudentFormData>({
    resolver: zodResolver(addStudentSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      gender: undefined,
      dob: "",
      phone: "",
      email: "",
      areaStreet: "",
      location: "",
      district: "",
      pincode: "",
      state: "",
      fatherName: "",
      fatherContact: "",
      motherName: "",
      motherContact: "",
      fatherIncome: "",
      fatherOccupation: "",
      classId: "",
      accommodationType: "DAY_SCHOLAR",
      transportMode: "Transport",
      transportId: "",
      registrationPhotoId: null,
      aadhaarNumber: "",
      apaarId: "",
      bloodGroup: "",
    },
    mode: "onBlur",
  });

  // TC form
  const tcForm = useForm<CreateTCFormData>({
    resolver: zodResolver(createTCSchema),
    defaultValues: {
      studentId: "",
      reason: "",
      transferDate: "",
      destinationSchool: "",
      remarks: "",
    },
  });

  const handleCreateStudent = useCallback(async (data: StudentFormData) => {
    try {
      await createStudent.mutateAsync(data);
      toast.success("Student created successfully!");
      studentForm.reset();
      refetchStudents();
      setActiveTab("all");
    } catch (error: any) {
      toast.error(error?.message || "Failed to create student");
    }
  }, [createStudent, studentForm, refetchStudents]);

  const handleDeleteStudent = useCallback(async (studentId: string) => {
    if (!confirm("Are you sure you want to delete this student?")) return;
    try {
      await deleteStudent.mutateAsync(studentId);
      toast.success("Student deleted successfully!");
      refetchStudents();
    } catch (error: any) {
      toast.error(error?.message || "Failed to delete student");
    }
  }, [deleteStudent, refetchStudents]);

  const handleBulkDelete = useCallback(async (ids: string[]) => {
    if (!confirm(`Are you sure you want to delete ${ids.length} student(s)?"`)) return;
    try {
      await Promise.all(ids.map(id => deleteStudent.mutateAsync(id)));
      toast.success(`${ids.length} student(s) deleted successfully!`);
      refetchStudents();
    } catch (error: any) {
      toast.error(error?.message || "Failed to delete students");
    }
  }, [deleteStudent, refetchStudents]);

  const handleEditStudent = useCallback((student: any) => {
    router.push(`/admin/students/${student.id}/edit`);
  }, [router]);

  const handleCreateTC = useCallback(async (data: CreateTCFormData) => {
    try {
      await createTC.mutateAsync({
        ...data,
        transferDate: new Date(data.transferDate).toISOString(),
      });
      toast.success("Transfer Certificate created successfully!");
      setIsCreateDialogOpen(false);
      tcForm.reset();
      refetchTCs();
    } catch (error: any) {
      toast.error(error?.message || "Failed to create Transfer Certificate");
    }
  }, [createTC, tcForm, refetchTCs]);

  const handleStatusUpdate = useCallback(
    async (tcId: string, status: "ISSUED" | "COLLECTED" | "CANCELLED") => {
      try {
        await updateTCStatus.mutateAsync({ id: tcId, status });
        toast.success(`TC status updated to ${status}`);
        refetchTCs();
      } catch (error: any) {
        toast.error(error?.message || "Failed to update TC status");
      }
    },
    [updateTCStatus, refetchTCs]
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

  const transportMode = studentForm.watch("transportMode");

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Students</h1>
          <p className="text-gray-600 mt-1">Manage students, add new students, and handle transfer certificates</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all" className="gap-2">
            <Users className="h-4 w-4" />
            All Students
          </TabsTrigger>
          <TabsTrigger value="add" className="gap-2">
            <UserPlus className="h-4 w-4" />
            Add Student
          </TabsTrigger>
          <TabsTrigger value="transfer" className="gap-2">
            <GraduationCap className="h-4 w-4" />
            Transfer Certificates
          </TabsTrigger>
        </TabsList>

        {/* All Students Tab */}
        <TabsContent value="all" className="mt-6">
          <StudentsTable
            students={students}
            onAddNew={() => setActiveTab("add")}
            onEdit={handleEditStudent}
            onDelete={handleDeleteStudent}
            onBulkDelete={handleBulkDelete}
            page={page - 1}
            onPageChange={(newPage) => setPage(newPage + 1)}
            serverTotalPages={studentsTotalPages}
            loading={studentsLoading}
            onRefresh={refetchStudents}
          />
        </TabsContent>

        {/* Add Student Tab */}
        <TabsContent value="add" className="mt-6">
          <FormProvider {...studentForm}>
            <div className="space-y-6">
              <FormTopBar
                title="Add New Student"
                onCancel={() => {
                  studentForm.reset();
                  setActiveTab("all");
                }}
                onReset={() => studentForm.reset()}
                onSave={studentForm.handleSubmit(handleCreateStudent)}
                isSaving={createStudent.isPending}
              />

              <form onSubmit={studentForm.handleSubmit(handleCreateStudent)} className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Basic Information */}
                  <FormCard title="Basic Information">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <Input
                          id="firstName"
                          {...studentForm.register("firstName")}
                          placeholder="First Name"
                          className={studentForm.formState.errors.firstName ? "border-red-500" : ""}
                        />
                        {studentForm.formState.errors.firstName && (
                          <p className="text-sm text-red-500">
                            {studentForm.formState.errors.firstName.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input
                          id="lastName"
                          {...studentForm.register("lastName")}
                          placeholder="Last Name"
                          className={studentForm.formState.errors.lastName ? "border-red-500" : ""}
                        />
                        {studentForm.formState.errors.lastName && (
                          <p className="text-sm text-red-500">
                            {studentForm.formState.errors.lastName.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label>Gender</Label>
                        <Controller
                          control={studentForm.control}
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
                        {studentForm.formState.errors.gender && (
                          <p className="text-sm text-red-500">
                            {studentForm.formState.errors.gender.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="dob">Date of Birth</Label>
                        <Input
                          id="dob"
                          type="date"
                          {...studentForm.register("dob")}
                          className={studentForm.formState.errors.dob ? "border-red-500" : ""}
                        />
                        {studentForm.formState.errors.dob && (
                          <p className="text-sm text-red-500">{studentForm.formState.errors.dob.message}</p>
                        )}
                      </div>

                      <div className="space-y-2 col-span-2">
                        <ClassDropdown
                          name="classId"
                          label="Select Class"
                          rules={{ required: "Class is required" }}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="aadhaarNumber">Aadhaar Number</Label>
                        <Input
                          id="aadhaarNumber"
                          {...studentForm.register("aadhaarNumber")}
                          placeholder="Aadhaar Number"
                          maxLength={12}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="apaarId">Apaar ID</Label>
                        <Input
                          id="apaarId"
                          {...studentForm.register("apaarId")}
                          placeholder="Apaar ID"
                        />
                      </div>

                      <div className="space-y-2 col-span-2">
                        <Label htmlFor="bloodGroup">Blood Group</Label>
                        <Controller
                          control={studentForm.control}
                          name="bloodGroup"
                          render={({ field: { value, onChange } }) => (
                            <select
                              value={value || ""}
                              onChange={(e) => onChange(e.target.value)}
                              className="w-full h-10 px-3 border border-gray-300 rounded-md"
                            >
                              <option value="">Select Blood Group</option>
                              <option value="A_POSITIVE">A+</option>
                              <option value="A_NEGATIVE">A-</option>
                              <option value="B_POSITIVE">B+</option>
                              <option value="B_NEGATIVE">B-</option>
                              <option value="O_POSITIVE">O+</option>
                              <option value="O_NEGATIVE">O-</option>
                              <option value="AB_POSITIVE">AB+</option>
                              <option value="AB_NEGATIVE">AB-</option>
                            </select>
                          )}
                        />
                      </div>
                    </div>

                    <div className="mt-4">
                      <PhotoUpload
                        name="registrationPhotoId"
                        label="Student Photo"
                        rules={{ required: "Student photo is required" }}
                      />
                    </div>
                  </FormCard>

                  {/* Contact Information */}
                  <FormCard title="Contact Information">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                          id="phone"
                          type="tel"
                          {...studentForm.register("phone")}
                          placeholder="Contact number"
                          maxLength={10}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          {...studentForm.register("email")}
                          placeholder="example@gmail.com"
                        />
                      </div>

                      <div className="space-y-2 col-span-2">
                        <Label htmlFor="areaStreet">Area and Street</Label>
                        <Input
                          id="areaStreet"
                          {...studentForm.register("areaStreet")}
                          placeholder="Area and Street"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="location">Location</Label>
                        <Input
                          id="location"
                          {...studentForm.register("location")}
                          placeholder="Location"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="district">District</Label>
                        <Input
                          id="district"
                          {...studentForm.register("district")}
                          placeholder="District"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="pincode">Pincode</Label>
                        <Input
                          id="pincode"
                          type="tel"
                          {...studentForm.register("pincode")}
                          placeholder="Pincode"
                          maxLength={6}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="state">State</Label>
                        <Input
                          id="state"
                          {...studentForm.register("state")}
                          placeholder="State"
                        />
                      </div>
                    </div>
                  </FormCard>

                  {/* Parent Details */}
                  <FormCard title="Parent Details">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="fatherName">Father Name</Label>
                        <Input
                          id="fatherName"
                          {...studentForm.register("fatherName")}
                          placeholder="Full Name"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="motherName">Mother Name</Label>
                        <Input
                          id="motherName"
                          {...studentForm.register("motherName")}
                          placeholder="Full Name"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="fatherContact">Father Contact</Label>
                        <Input
                          id="fatherContact"
                          type="tel"
                          {...studentForm.register("fatherContact")}
                          placeholder="Contact"
                          maxLength={10}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="motherContact">Mother Contact</Label>
                        <Input
                          id="motherContact"
                          type="tel"
                          {...studentForm.register("motherContact")}
                          placeholder="Contact"
                          maxLength={10}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="fatherOccupation">Father Occupation</Label>
                        <Input
                          id="fatherOccupation"
                          {...studentForm.register("fatherOccupation")}
                          placeholder="Occupation"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="fatherIncome">Family Annual Income</Label>
                        <Input
                          id="fatherIncome"
                          type="tel"
                          {...studentForm.register("fatherIncome")}
                          placeholder="Income"
                          maxLength={10}
                        />
                      </div>
                    </div>
                  </FormCard>

                  {/* Additional Information */}
                  <FormCard title="Additional Information">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Accommodation Type</Label>
                        <Controller
                          control={studentForm.control}
                          name="accommodationType"
                          render={({ field: { value, onChange } }) => (
                            <ChipGroup
                              options={[
                                { value: "DAY_SCHOLAR", label: "Day Scholar" },
                                { value: "HOSTELLER", label: "Hosteller" },
                              ]}
                              value={value}
                              onChange={onChange}
                            />
                          )}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Transport Mode</Label>
                        <Controller
                          control={studentForm.control}
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
                                  studentForm.setValue("transportId", "");
                                }
                              }}
                            />
                          )}
                        />
                      </div>

                      {transportMode === "Transport" && (
                        <div className="space-y-2">
                          <TransportDropdown
                            name="transportId"
                            label="Select Transport"
                            rules={{ required: "Transport is required" }}
                          />
                        </div>
                      )}
                    </div>
                  </FormCard>
                </div>
              </form>
            </div>
          </FormProvider>
        </TabsContent>

        {/* Transfer Certificates Tab */}
        <TabsContent value="transfer" className="mt-6">
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Transfer Certificates</h2>
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
                                  {String((tcPage - 1) * limit + index + 1).padStart(2, "0")}
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
                    {tcsTotalPages > 1 && (
                      <div className="flex items-center justify-between mt-4">
                        <div className="text-sm text-gray-600">
                          Page {tcPage} of {tcsTotalPages}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setTcPage(tcPage - 1)}
                            disabled={tcPage === 1}
                          >
                            Previous
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setTcPage(tcPage + 1)}
                            disabled={tcPage === tcsTotalPages}
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
        </TabsContent>
      </Tabs>

      {/* Create TC Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Transfer Certificate</DialogTitle>
            <DialogDescription>
              Create a new transfer certificate for a student
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={tcForm.handleSubmit(handleCreateTC)} className="space-y-4">
            <div>
              <Label htmlFor="studentId">Student *</Label>
              <Select
                value={tcForm.watch("studentId")}
                onValueChange={(value) => tcForm.setValue("studentId", value)}
              >
                <SelectTrigger id="studentId">
                  <SelectValue placeholder="Select Student" />
                </SelectTrigger>
                <SelectContent>
                  {allStudents.map((student: any) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.firstName} {student.lastName} - {student.publicUserId}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {tcForm.formState.errors.studentId && (
                <p className="text-sm text-red-500 mt-1">
                  {tcForm.formState.errors.studentId.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="reason">Reason *</Label>
              <Textarea
                id="reason"
                placeholder="Enter reason for transfer..."
                {...tcForm.register("reason")}
                rows={3}
              />
              {tcForm.formState.errors.reason && (
                <p className="text-sm text-red-500 mt-1">
                  {tcForm.formState.errors.reason.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="transferDate">Transfer Date *</Label>
              <Input
                id="transferDate"
                type="date"
                {...tcForm.register("transferDate")}
              />
              {tcForm.formState.errors.transferDate && (
                <p className="text-sm text-red-500 mt-1">
                  {tcForm.formState.errors.transferDate.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="destinationSchool">Destination School</Label>
              <Input
                id="destinationSchool"
                placeholder="Enter destination school name..."
                {...tcForm.register("destinationSchool")}
              />
            </div>

            <div>
              <Label htmlFor="remarks">Remarks</Label>
              <Textarea
                id="remarks"
                placeholder="Additional remarks..."
                {...tcForm.register("remarks")}
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

