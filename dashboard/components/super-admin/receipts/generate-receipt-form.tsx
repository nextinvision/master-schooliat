"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
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
import { FormCard } from "@/components/forms/form-card";
import {
  useSchools,
  useReceipt,
  useCreateReceipt,
  useUpdateReceipt,
  useGenerateReceipt,
  School,
} from "@/lib/hooks/use-super-admin";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Receipt } from "lucide-react";

const receiptSchema = z.object({
  schoolId: z.string().min(1, "Please select a school"),
  amount: z.string().min(1, "Amount is required").refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, "Please enter a valid amount"),
  description: z.string().min(1, "Description is required"),
  paymentMethod: z.string().optional(),
  sgstPercent: z.string().optional(),
  cgstPercent: z.string().optional(),
  igstPercent: z.string().optional(),
  ugstPercent: z.string().optional(),
});

type ReceiptFormData = z.infer<typeof receiptSchema>;

const PAYMENT_METHODS = [
  "Bank Transfer",
  "Cash",
  "Cheque",
  "UPI",
  "Credit Card",
  "Debit Card",
];

export function GenerateReceiptForm({ receiptId }: { receiptId?: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const isEditMode = !!receiptId;
  const [isGenerating, setIsGenerating] = useState(false);
  const [gstType, setGstType] = useState<"sgst-ugst" | "cgst-igst" | null>(null);

  const { data: schoolsData } = useSchools();
  const { data: receiptData } = useReceipt(receiptId || "");
  const createReceipt = useCreateReceipt();
  const updateReceipt = useUpdateReceipt();
  const generateReceipt = useGenerateReceipt();

  interface SchoolOption {
    id: string;
    name: string;
    code: string;
  }

  const schools = useMemo<SchoolOption[]>(() => {
    if (!schoolsData?.data) return [];
    return schoolsData.data.map((school: School) => ({
      id: school.id,
      name: school.name,
      code: school.code,
    }));
  }, [schoolsData]);

  const form = useForm<ReceiptFormData>({
    resolver: zodResolver(receiptSchema),
    defaultValues: {
      schoolId: "",
      amount: "",
      description: "",
      paymentMethod: "Bank Transfer",
      sgstPercent: "",
      cgstPercent: "",
      igstPercent: "",
      ugstPercent: "",
    },
  });

  useEffect(() => {
    if (isEditMode && receiptData?.data) {
      const receipt = receiptData.data;
      form.reset({
        schoolId: receipt.schoolId,
        amount: receipt.amount?.toString() || "",
        description: receipt.description || "",
        paymentMethod: receipt.paymentMethod || "Bank Transfer",
        sgstPercent: "",
        cgstPercent: "",
        igstPercent: "",
        ugstPercent: "",
      });
    }
  }, [isEditMode, receiptData, form]);

  const handleGstTypeChange = (type: "sgst-ugst" | "cgst-igst") => {
    setGstType(type);
    if (type === "sgst-ugst") {
      form.setValue("cgstPercent", "");
      form.setValue("igstPercent", "");
    } else {
      form.setValue("sgstPercent", "");
      form.setValue("ugstPercent", "");
    }
  };

  const onSubmit = form.handleSubmit(async (values) => {
    setIsGenerating(true);
    try {
      let currentReceiptId = receiptId;

      if (isEditMode && receiptId) {
        await updateReceipt.mutateAsync({
          id: receiptId,
          schoolId: values.schoolId,
          amount: parseFloat(values.amount),
          description: values.description,
          paymentMethod: values.paymentMethod,
          sgstPercent: values.sgstPercent ? parseFloat(values.sgstPercent) : null,
          cgstPercent: values.cgstPercent ? parseFloat(values.cgstPercent) : null,
          igstPercent: values.igstPercent ? parseFloat(values.igstPercent) : null,
          ugstPercent: values.ugstPercent ? parseFloat(values.ugstPercent) : null,
        });
      } else {
        const result = await createReceipt.mutateAsync({
          schoolId: values.schoolId,
          baseAmount: parseFloat(values.amount),
          description: values.description,
          paymentMethod: values.paymentMethod,
          sgstPercent: values.sgstPercent ? parseFloat(values.sgstPercent) : null,
          cgstPercent: values.cgstPercent ? parseFloat(values.cgstPercent) : null,
          igstPercent: values.igstPercent ? parseFloat(values.igstPercent) : null,
          ugstPercent: values.ugstPercent ? parseFloat(values.ugstPercent) : null,
        });
        currentReceiptId = result?.data?.id;
      }

      if (currentReceiptId) {
        const generateResponse = await generateReceipt.mutateAsync(currentReceiptId);
        if (generateResponse?.data?.html && typeof window !== "undefined") {
          const printWindow = window.open("", "_blank");
          if (printWindow) {
            printWindow.document.write(generateResponse.data.html);
            printWindow.document.close();
            setTimeout(() => {
              printWindow.focus();
              printWindow.print();
            }, 250);
          }
        }
        toast({
          title: "Success",
          description: isEditMode ? "Receipt updated successfully!" : "Receipt generated successfully!",
        });
        router.push("/super-admin/receipts");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Failed to generate receipt",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">
            {isEditMode ? "Edit Receipt" : "Generate Receipt"}
          </h1>
          <p className="text-gray-600 mt-1">
            {isEditMode ? "Update receipt details" : "Create and generate a new receipt"}
          </p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        <FormCard title="Receipt Information" icon={<Receipt className="w-5 h-5" />}>
          <div className="space-y-4">
            <div>
              <Label htmlFor="schoolId">School *</Label>
              <Select
                value={form.watch("schoolId")}
                onValueChange={(value) => form.setValue("schoolId", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a school" />
                </SelectTrigger>
                <SelectContent>
                  {schools.map((school) => (
                    <SelectItem key={school.id} value={school.id}>
                      {school.name} ({school.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.schoolId && (
                <p className="text-sm text-red-500 mt-1">
                  {form.formState.errors.schoolId.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="amount">Amount *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  {...form.register("amount")}
                  error={form.formState.errors.amount?.message}
                />
              </div>

              <div>
                <Label htmlFor="paymentMethod">Payment Method</Label>
                <Select
                  value={form.watch("paymentMethod") || "Bank Transfer"}
                  onValueChange={(value) => form.setValue("paymentMethod", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map((method) => (
                      <SelectItem key={method} value={method}>
                        {method}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Receipt description..."
                rows={4}
                {...form.register("description")}
                error={form.formState.errors.description?.message}
              />
            </div>

            <div>
              <Label>GST Type (Optional)</Label>
              <div className="flex gap-4 mb-4">
                <Button
                  type="button"
                  variant={gstType === "sgst-ugst" ? "default" : "outline"}
                  onClick={() => handleGstTypeChange("sgst-ugst")}
                >
                  SGST/UGST
                </Button>
                <Button
                  type="button"
                  variant={gstType === "cgst-igst" ? "default" : "outline"}
                  onClick={() => handleGstTypeChange("cgst-igst")}
                >
                  CGST/IGST
                </Button>
              </div>

              {gstType === "sgst-ugst" && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="sgstPercent">SGST %</Label>
                    <Input
                      id="sgstPercent"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      {...form.register("sgstPercent")}
                    />
                  </div>
                  <div>
                    <Label htmlFor="ugstPercent">UGST %</Label>
                    <Input
                      id="ugstPercent"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      {...form.register("ugstPercent")}
                    />
                  </div>
                </div>
              )}

              {gstType === "cgst-igst" && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="cgstPercent">CGST %</Label>
                    <Input
                      id="cgstPercent"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      {...form.register("cgstPercent")}
                    />
                  </div>
                  <div>
                    <Label htmlFor="igstPercent">IGST %</Label>
                    <Input
                      id="igstPercent"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      {...form.register("igstPercent")}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </FormCard>

        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isGenerating || createReceipt.isPending || updateReceipt.isPending}
            className="flex-1"
          >
            {isGenerating
              ? "Generating..."
              : isEditMode
              ? "Update & Generate"
              : "Generate Receipt"}
          </Button>
        </div>
      </form>
    </div>
  );
}

