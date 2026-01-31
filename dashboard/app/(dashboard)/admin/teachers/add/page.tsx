"use client";

import { useRouter } from "next/navigation";
import { useForm, FormProvider, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  addTeacherSchemaWithRefinement,
  AddTeacherFormData,
} from "@/lib/schemas/teacher-schema";
import { useCreateTeacher } from "@/lib/hooks/use-teachers";
import { FormTopBar } from "@/components/forms/form-top-bar";
import { FormCard } from "@/components/forms/form-card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup } from "@/components/forms/radio-group";
import { ChipGroup } from "@/components/forms/chip-group";
import { TransportDropdown } from "@/components/forms/transport-dropdown";
import { PhotoUpload } from "@/components/forms/photo-upload";
import { toast } from "sonner";

export default function AddTeacherPage() {
  const router = useRouter();
  const { mutateAsync: createTeacher, isPending: isSaving } = useCreateTeacher();

  const methods = useForm<AddTeacherFormData>({
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

  const {
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = methods;

  const transportMode = watch("transportMode");

  const onSubmit = async (data: AddTeacherFormData) => {
    try {
      await createTeacher(data);
      toast.success("Teacher saved successfully");
      setTimeout(() => {
        reset();
        router.push("/admin/teachers");
      }, 1500);
    } catch (error: any) {
      toast.error(error?.message || "Failed to save teacher");
    }
  };

  return (
    <FormProvider {...methods}>
      <div className="space-y-6 pb-8">
        <FormTopBar
          title="Add New Teacher"
          onCancel={() => router.push("/admin/teachers")}
          onReset={() => reset()}
          onSave={handleSubmit(onSubmit)}
          isSaving={isSaving}
        />

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Basic Information */}
            <FormCard title="Basic Information">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    {...methods.register("firstName")}
                    placeholder="First Name"
                    className={errors.firstName ? "border-red-500" : ""}
                  />
                  {errors.firstName && (
                    <p className="text-sm text-red-500">
                      {errors.firstName.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    {...methods.register("lastName")}
                    placeholder="Last Name"
                    className={errors.lastName ? "border-red-500" : ""}
                  />
                  {errors.lastName && (
                    <p className="text-sm text-red-500">
                      {errors.lastName.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Gender</Label>
                  <Controller
                    control={methods.control}
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
                  {errors.gender && (
                    <p className="text-sm text-red-500">
                      {errors.gender.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dob">Date of Birth</Label>
                  <Input
                    id="dob"
                    type="date"
                    {...methods.register("dob")}
                    className={errors.dob ? "border-red-500" : ""}
                  />
                  {errors.dob && (
                    <p className="text-sm text-red-500">{errors.dob.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="designation">Designation</Label>
                  <Input
                    id="designation"
                    {...methods.register("designation")}
                    placeholder="Designation"
                    className={errors.designation ? "border-red-500" : ""}
                  />
                  {errors.designation && (
                    <p className="text-sm text-red-500">
                      {errors.designation.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="aadhaarId">Aadhaar ID</Label>
                  <Input
                    id="aadhaarId"
                    type="tel"
                    {...methods.register("aadhaarId")}
                    placeholder="XXXX XXXX XXXX"
                    maxLength={12}
                    className={errors.aadhaarId ? "border-red-500" : ""}
                  />
                  {errors.aadhaarId && (
                    <p className="text-sm text-red-500">
                      {errors.aadhaarId.message}
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
                  <Label htmlFor="panCardNumber">PAN Card Number</Label>
                  <Input
                    id="panCardNumber"
                    {...methods.register("panCardNumber")}
                    placeholder="eg. ABCDE1234F"
                    maxLength={10}
                    style={{ textTransform: "uppercase" }}
                    className={errors.panCardNumber ? "border-red-500 uppercase" : "uppercase"}
                  />
                  {errors.panCardNumber && (
                    <p className="text-sm text-red-500">
                      {errors.panCardNumber.message}
                    </p>
                  )}
                </div>
              </div>
            </FormCard>

            {/* Contact Information */}
            <FormCard title="Contact Information">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contact">Contact</Label>
                  <Input
                    id="contact"
                    type="tel"
                    {...methods.register("contact")}
                    placeholder="Contact number"
                    maxLength={10}
                    className={errors.contact ? "border-red-500" : ""}
                  />
                  {errors.contact && (
                    <p className="text-sm text-red-500">
                      {errors.contact.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    {...methods.register("email")}
                    placeholder="example@gmail.com"
                    className={errors.email ? "border-red-500" : ""}
                  />
                  {errors.email && (
                    <p className="text-sm text-red-500">{errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-2 col-span-2">
                  <Label htmlFor="areaStreet">Area and Street</Label>
                  <Input
                    id="areaStreet"
                    {...methods.register("areaStreet")}
                    placeholder="Area and Street"
                    className={errors.areaStreet ? "border-red-500" : ""}
                  />
                  {errors.areaStreet && (
                    <p className="text-sm text-red-500">
                      {errors.areaStreet.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    {...methods.register("location")}
                    placeholder="Location"
                    className={errors.location ? "border-red-500" : ""}
                  />
                  {errors.location && (
                    <p className="text-sm text-red-500">
                      {errors.location.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="district">District</Label>
                  <Input
                    id="district"
                    {...methods.register("district")}
                    placeholder="District"
                    className={errors.district ? "border-red-500" : ""}
                  />
                  {errors.district && (
                    <p className="text-sm text-red-500">
                      {errors.district.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pincode">Pincode</Label>
                  <Input
                    id="pincode"
                    type="tel"
                    {...methods.register("pincode")}
                    placeholder="Pincode"
                    maxLength={6}
                    className={errors.pincode ? "border-red-500" : ""}
                  />
                  {errors.pincode && (
                    <p className="text-sm text-red-500">
                      {errors.pincode.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    {...methods.register("state")}
                    placeholder="State"
                    className={errors.state ? "border-red-500" : ""}
                  />
                  {errors.state && (
                    <p className="text-sm text-red-500">{errors.state.message}</p>
                  )}
                </div>
              </div>
            </FormCard>

            {/* Education */}
            <FormCard title="Education">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="highestQualification">
                    Highest Qualification
                  </Label>
                  <Input
                    id="highestQualification"
                    {...methods.register("highestQualification")}
                    placeholder="E.g. B.E"
                    className={
                      errors.highestQualification ? "border-red-500" : ""
                    }
                  />
                  {errors.highestQualification && (
                    <p className="text-sm text-red-500">
                      {errors.highestQualification.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="university">University</Label>
                  <Input
                    id="university"
                    {...methods.register("university")}
                    placeholder="University Name"
                    className={errors.university ? "border-red-500" : ""}
                  />
                  {errors.university && (
                    <p className="text-sm text-red-500">
                      {errors.university.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="yearOfPassing">Year of Passing</Label>
                  <Input
                    id="yearOfPassing"
                    type="tel"
                    {...methods.register("yearOfPassing")}
                    placeholder="Year"
                    maxLength={4}
                    className={errors.yearOfPassing ? "border-red-500" : ""}
                  />
                  {errors.yearOfPassing && (
                    <p className="text-sm text-red-500">
                      {errors.yearOfPassing.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="percentage">Percentage / Grade</Label>
                  <Input
                    id="percentage"
                    {...methods.register("percentage")}
                    placeholder="e.g. 78%, 8.2 CGPA"
                    className={errors.percentage ? "border-red-500" : ""}
                  />
                  {errors.percentage && (
                    <p className="text-sm text-red-500">
                      {errors.percentage.message}
                    </p>
                  )}
                </div>
              </div>
            </FormCard>

            {/* Additional Information */}
            <FormCard title="Additional Information">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Transport Mode</Label>
                  <Controller
                    control={methods.control}
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
                            setValue("transportId", "");
                          }
                        }}
                      />
                    )}
                  />
                  {errors.transportMode && (
                    <p className="text-sm text-red-500">
                      {errors.transportMode.message}
                    </p>
                  )}
                </div>

                {transportMode === "Transport" && (
                  <div className="space-y-2">
                    <TransportDropdown
                      name="transportId"
                      label="Select Transport"
                      rules={{ required: "Transport is required" }}
                    />
                    {errors.transportId && (
                      <p className="text-sm text-red-500">
                        {errors.transportId.message}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </FormCard>
          </div>
        </form>
      </div>
    </FormProvider>
  );
}

