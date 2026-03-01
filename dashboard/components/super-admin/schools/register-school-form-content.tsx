"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormCard } from "@/components/forms/form-card";
import { useCreateSchool } from "@/lib/hooks/use-super-admin";
import { useToast } from "@/hooks/use-toast";
import { Plus, X, School } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const schoolSchema = z.object({
  name: z.string().min(1, "School name is required"),
  code: z.string().min(1, "School code is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(1, "Phone number is required"),
  address: z.array(z.string().min(1, "Address line cannot be empty")),
  gstNumber: z.string().optional(),
  principalName: z.string().optional(),
  principalEmail: z.string().email("Invalid email").optional().or(z.literal("")),
  principalPhone: z.string().optional(),
  establishedYear: z.string().optional(),
  boardAffiliation: z.string().optional(),
  studentStrength: z.string().optional(),
  certificateLink: z.string().url("Invalid URL").optional().or(z.literal("")),
});

type SchoolFormData = z.infer<typeof schoolSchema>;

interface RegisterSchoolFormContentProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  showBackButton?: boolean;
}

export function RegisterSchoolFormContent({
  onSuccess,
  onCancel,
  showBackButton = false,
}: RegisterSchoolFormContentProps) {
  const router = useRouter();
  const { toast } = useToast();
  const createSchool = useCreateSchool();
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [credentials, setCredentials] = useState<{ loginId: string; password: string } | null>(null);

  const form = useForm<SchoolFormData>({
    resolver: zodResolver(schoolSchema),
    defaultValues: {
      name: "",
      code: "",
      email: "",
      phone: "",
      address: [""],
      gstNumber: "",
      principalName: "",
      principalEmail: "",
      principalPhone: "",
      establishedYear: "",
      boardAffiliation: "",
      studentStrength: "",
      certificateLink: "",
    },
  });

  // Auto-generate school code from name
  useEffect(() => {
    const name = form.watch("name");
    if (name) {
      const generateCode = (name: string) => {
        const words = name.trim().toUpperCase().split(" ");
        let code = "";

        if (words.length === 1) {
          code = words[0].substring(0, 4);
        } else if (words.length === 2) {
          code = words[0].substring(0, 2) + words[1].substring(0, 2);
        } else {
          code = words
            .slice(0, 3)
            .map((w) => w[0])
            .join("");
        }

        const randomNum = Math.floor(1000 + Math.random() * 9000);
        return `${code}${randomNum}`;
      };

      form.setValue("code", generateCode(name));
    }
  }, [form.watch("name")]);

  const addressLines = form.watch("address");

  const addAddressLine = () => {
    form.setValue("address", [...addressLines, ""]);
  };

  const removeAddressLine = (index: number) => {
    if (addressLines.length > 1) {
      form.setValue(
        "address",
        addressLines.filter((_, i) => i !== index)
      );
    }
  };

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const result = await createSchool.mutateAsync({
        name: values.name.trim(),
        code: values.code.trim(),
        email: values.email.trim(),
        phone: values.phone.trim(),
        address: values.address.filter((a) => a.trim()),
        gstNumber: values.gstNumber?.trim() || undefined,
        principalName: values.principalName?.trim() || undefined,
        principalEmail: values.principalEmail?.trim() || undefined,
        principalPhone: values.principalPhone?.trim() || undefined,
        establishedYear: values.establishedYear?.trim() || undefined,
        boardAffiliation: values.boardAffiliation?.trim() || undefined,
        studentStrength: values.studentStrength?.trim() || undefined,
        certificateLink: values.certificateLink?.trim() || undefined,
      });

      if (result?.data?.password) {
        setCredentials({
          loginId: result.data.email,
          password: result.data.password,
        });
        setShowSuccessModal(true);
      } else {
        toast({
          title: "Success",
          description: "School registered successfully!",
        });
        form.reset();
        if (onSuccess) {
          onSuccess();
        } else {
          router.push("/super-admin/schools");
        }
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Failed to register school",
        variant: "destructive",
      });
    }
  });

  const handleCancel = () => {
    form.reset();
    if (onCancel) {
      onCancel();
    } else {
      router.back();
    }
  };

  const handleSuccessContinue = () => {
    setShowSuccessModal(false);
    form.reset();
    if (onSuccess) {
      onSuccess();
    } else {
      router.push("/super-admin/schools");
    }
  };

  return (
    <>
      <form onSubmit={onSubmit} className="space-y-6">
        <FormCard title="Basic Information" icon={<School className="w-5 h-5" />}>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">School Name *</Label>
              <Input
                id="name"
                placeholder="Enter school name"
                {...form.register("name")}
                error={form.formState.errors.name?.message}
              />
            </div>

            <div>
              <Label htmlFor="code">School Code *</Label>
              <Input
                id="code"
                placeholder="Auto-generated from name"
                {...form.register("code")}
                error={form.formState.errors.code?.message}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="school@example.com"
                  {...form.register("email")}
                  error={form.formState.errors.email?.message}
                />
              </div>

              <div>
                <Label htmlFor="phone">Phone *</Label>
                <Input
                  id="phone"
                  placeholder="+91 1234567890"
                  {...form.register("phone")}
                  error={form.formState.errors.phone?.message}
                />
              </div>
            </div>

            <div>
              <Label>Address *</Label>
              {addressLines.map((line, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <Input
                    placeholder={`Address line ${index + 1}`}
                    {...form.register(`address.${index}` as any)}
                    error={
                      form.formState.errors.address?.[index]?.message
                    }
                  />
                  {addressLines.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => removeAddressLine(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={addAddressLine}
                className="mt-2"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Address Line
              </Button>
            </div>
          </div>
        </FormCard>

        <FormCard title="Additional Information">
          <div className="space-y-4">
            <div>
              <Label htmlFor="gstNumber">GST Number</Label>
              <Input
                id="gstNumber"
                placeholder="GST number (optional)"
                {...form.register("gstNumber")}
                error={form.formState.errors.gstNumber?.message}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="principalName">Principal Name</Label>
                <Input
                  id="principalName"
                  placeholder="Principal name"
                  {...form.register("principalName")}
                  error={form.formState.errors.principalName?.message}
                />
              </div>

              <div>
                <Label htmlFor="principalEmail">Principal Email</Label>
                <Input
                  id="principalEmail"
                  type="email"
                  placeholder="principal@example.com"
                  {...form.register("principalEmail")}
                  error={form.formState.errors.principalEmail?.message}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="principalPhone">Principal Phone</Label>
                <Input
                  id="principalPhone"
                  placeholder="+91 1234567890"
                  {...form.register("principalPhone")}
                  error={form.formState.errors.principalPhone?.message}
                />
              </div>

              <div>
                <Label htmlFor="establishedYear">Established Year</Label>
                <Input
                  id="establishedYear"
                  type="number"
                  placeholder="2020"
                  {...form.register("establishedYear")}
                  error={form.formState.errors.establishedYear?.message}
                />
              </div>

              <div>
                <Label htmlFor="studentStrength">Student Strength</Label>
                <Input
                  id="studentStrength"
                  type="number"
                  placeholder="500"
                  {...form.register("studentStrength")}
                  error={form.formState.errors.studentStrength?.message}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="boardAffiliation">Board Affiliation</Label>
              <Input
                id="boardAffiliation"
                placeholder="CBSE, ICSE, State Board, etc."
                {...form.register("boardAffiliation")}
                error={form.formState.errors.boardAffiliation?.message}
              />
            </div>

            <div>
              <Label htmlFor="certificateLink">Certificate Link</Label>
              <Input
                id="certificateLink"
                type="url"
                placeholder="https://example.com/certificate.pdf"
                {...form.register("certificateLink")}
                error={form.formState.errors.certificateLink?.message}
              />
            </div>
          </div>
        </FormCard>

        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={createSchool.isPending}
            className="flex-1"
          >
            {createSchool.isPending ? "Registering..." : "Register School"}
          </Button>
        </div>
      </form>

      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>School Registered Successfully!</DialogTitle>
            <DialogDescription>
              Please save these credentials. They will not be shown again.
            </DialogDescription>
          </DialogHeader>
          {credentials && (
            <div className="space-y-4">
              <div>
                <Label>Login ID</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input value={credentials.loginId} readOnly />
                  <Button
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(credentials.loginId);
                      toast({ title: "Copied to clipboard" });
                    }}
                  >
                    Copy
                  </Button>
                </div>
              </div>
              <div>
                <Label>Password</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input value={credentials.password} readOnly type="password" />
                  <Button
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(credentials.password);
                      toast({ title: "Copied to clipboard" });
                    }}
                  >
                    Copy
                  </Button>
                </div>
              </div>
              <Button
                onClick={handleSuccessContinue}
                className="w-full"
              >
                Continue
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

