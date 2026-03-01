"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Users,
  Mail,
  Phone,
  MapPin,
  Building2,
  Calendar,
  FileText,
  School as SchoolIcon,
  GraduationCap,
  UserCheck,
  Briefcase,
} from "lucide-react";
import {
  useSchool,
  useUpdateSchool,
  useDeleteSchool,
  useRegions,
  useSchoolStatistics,
  type School,
  type Region,
} from "@/lib/hooks/use-super-admin";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

interface SchoolDetailsViewProps {
  schoolId: string;
}

export function SchoolDetailsView({ schoolId }: SchoolDetailsViewProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { data, isLoading } = useSchool(schoolId);
  const updateSchool = useUpdateSchool();
  const deleteSchool = useDeleteSchool();
  const { data: regionsData } = useRegions();
  const { data: statisticsData } = useSchoolStatistics();

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    email: "",
    phone: "",
    address: [] as string[],
    gstNumber: "",
    principalName: "",
    principalEmail: "",
    principalPhone: "",
    establishedYear: "",
    boardAffiliation: "",
    studentStrength: "",
    certificateLink: "",
    regionId: "" as string | null,
  });

  const school = data as School | null;
  const regions = (regionsData?.data || []) as Region[];
  const schoolStats = statisticsData?.data?.schools?.find(
    (s: any) => s.id === schoolId
  );

  // Initialize form data when school loads
  useEffect(() => {
    if (school) {
      setFormData({
        name: school.name || "",
        code: school.code || "",
        email: school.email || "",
        phone: school.phone || "",
        address: school.address || [],
        gstNumber: (school as any).gstNumber || "",
        principalName: (school as any).principalName || "",
        principalEmail: (school as any).principalEmail || "",
        principalPhone: (school as any).principalPhone || "",
        establishedYear: (school as any).establishedYear?.toString() || "",
        boardAffiliation: (school as any).boardAffiliation || "",
        studentStrength: (school as any).studentStrength?.toString() || "",
        certificateLink: (school as any).certificateLink || "",
        regionId: (school as any).regionId || "",
      });
    }
  }, [school]);

  const handleUpdate = async () => {
    try {
      await updateSchool.mutateAsync({
        id: schoolId,
        ...formData,
      });
      toast({
        title: "Success",
        description: "School updated successfully",
      });
      setIsEditOpen(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update school",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    try {
      await deleteSchool.mutateAsync(schoolId);
      toast({
        title: "Success",
        description: "School deleted successfully",
      });
      router.push("/super-admin/schools");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete school",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!school) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">School not found</p>
        <Button
          variant="outline"
          onClick={() => router.push("/super-admin/schools")}
          className="mt-4"
        >
          Back to Schools
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/super-admin/schools")}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">{school.name}</h1>
            <p className="text-sm text-gray-600">School Code: {school.code}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit School</DialogTitle>
                <DialogDescription>
                  Update school information
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>School Name *</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>School Code *</Label>
                    <Input
                      value={formData.code}
                      onChange={(e) =>
                        setFormData({ ...formData, code: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Email *</Label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone *</Label>
                    <Input
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Address</Label>
                  <Textarea
                    value={formData.address.join("\n")}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        address: e.target.value.split("\n").filter(Boolean),
                      })
                    }
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>GST Number</Label>
                    <Input
                      value={formData.gstNumber}
                      onChange={(e) =>
                        setFormData({ ...formData, gstNumber: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Region</Label>
                    <Select
                      value={formData.regionId || "none"}
                      onValueChange={(value) =>
                        setFormData({ ...formData, regionId: value === "none" ? (null as any) : value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select region" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {regions.map((region) => (
                          <SelectItem key={region.id} value={region.id}>
                            {region.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Principal Name</Label>
                    <Input
                      value={formData.principalName}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          principalName: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Principal Email</Label>
                    <Input
                      type="email"
                      value={formData.principalEmail}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          principalEmail: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Principal Phone</Label>
                    <Input
                      value={formData.principalPhone}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          principalPhone: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Established Year</Label>
                    <Input
                      type="number"
                      value={formData.establishedYear}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          establishedYear: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Board Affiliation</Label>
                    <Input
                      value={formData.boardAffiliation}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          boardAffiliation: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Student Strength</Label>
                    <Input
                      type="number"
                      value={formData.studentStrength}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          studentStrength: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Certificate Link</Label>
                  <Input
                    value={formData.certificateLink}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        certificateLink: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsEditOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdate}
                  disabled={updateSchool.isPending}
                >
                  {updateSchool.isPending ? "Updating..." : "Update"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete School</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete "{school.name}"? This action
                  cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsDeleteOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={deleteSchool.isPending}
                >
                  {deleteSchool.isPending ? "Deleting..." : "Delete"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* School Information Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-2">
              <SchoolIcon className="w-4 h-4 text-gray-500 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500">Name</p>
                <p className="text-sm font-medium">{school.name}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <FileText className="w-4 h-4 text-gray-500 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500">Code</p>
                <p className="text-sm font-medium">{school.code}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Calendar className="w-4 h-4 text-gray-500 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500">Registered</p>
                <p className="text-sm font-medium">
                  {format(new Date(school.createdAt), "MMM dd, yyyy")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-2">
              <Mail className="w-4 h-4 text-gray-500 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500">Email</p>
                <p className="text-sm font-medium">{school.email}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Phone className="w-4 h-4 text-gray-500 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500">Phone</p>
                <p className="text-sm font-medium">{school.phone}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-gray-500 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500">Address</p>
                <p className="text-sm font-medium">
                  {school.address?.[0] || "N/A"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-4 h-4" />
              Statistics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-gray-500" />
                <span className="text-xs text-gray-500">Students</span>
              </div>
              <Badge variant="outline">
                {schoolStats?.totalStudents || (school as any).userCount || 0}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-gray-500" />
                <span className="text-xs text-gray-500">Teachers</span>
              </div>
              <Badge variant="outline">
                {schoolStats?.teachers || 0}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-gray-500" />
                <span className="text-xs text-gray-500">Staff</span>
              </div>
              <Badge variant="outline">
                {schoolStats?.totalStaff || 0}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-500" />
                <span className="text-xs text-gray-500">Admins</span>
              </div>
              <Badge variant="outline">
                {schoolStats?.adminStaff || 0}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Information */}
      {(school as any).gstNumber ||
      (school as any).principalName ||
      (school as any).establishedYear ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Additional Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(school as any).gstNumber && (
                <div>
                  <p className="text-xs text-gray-500">GST Number</p>
                  <p className="text-sm font-medium">
                    {(school as any).gstNumber}
                  </p>
                </div>
              )}
              {(school as any).principalName && (
                <div>
                  <p className="text-xs text-gray-500">Principal Name</p>
                  <p className="text-sm font-medium">
                    {(school as any).principalName}
                  </p>
                </div>
              )}
              {(school as any).principalEmail && (
                <div>
                  <p className="text-xs text-gray-500">Principal Email</p>
                  <p className="text-sm font-medium">
                    {(school as any).principalEmail}
                  </p>
                </div>
              )}
              {(school as any).principalPhone && (
                <div>
                  <p className="text-xs text-gray-500">Principal Phone</p>
                  <p className="text-sm font-medium">
                    {(school as any).principalPhone}
                  </p>
                </div>
              )}
              {(school as any).establishedYear && (
                <div>
                  <p className="text-xs text-gray-500">Established Year</p>
                  <p className="text-sm font-medium">
                    {(school as any).establishedYear}
                  </p>
                </div>
              )}
              {(school as any).boardAffiliation && (
                <div>
                  <p className="text-xs text-gray-500">Board Affiliation</p>
                  <p className="text-sm font-medium">
                    {(school as any).boardAffiliation}
                  </p>
                </div>
              )}
              {(school as any).studentStrength && (
                <div>
                  <p className="text-xs text-gray-500">Student Strength</p>
                  <p className="text-sm font-medium">
                    {(school as any).studentStrength}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

