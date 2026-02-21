"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormCard } from "@/components/forms/form-card";
import { useSettings, useUpdateSettings } from "@/lib/hooks/use-settings";
import { feesConfigSchema, type FeesConfigFormData } from "@/lib/schemas/settings-schema";
import { useToast } from "@/hooks/use-toast";
import { DollarSign } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export function FeesConfigSection() {
  const { toast } = useToast();
  const { data: settingsData, isLoading } = useSettings();
  const updateSettings = useUpdateSettings();

  const form = useForm<FeesConfigFormData>({
    resolver: zodResolver(feesConfigSchema),
    defaultValues: {
      studentFeeInstallments: "",
      studentFeeAmount: "",
    },
  });

  useEffect(() => {
    if (settingsData?.data) {
      const s = settingsData.data;
      form.setValue("studentFeeInstallments", s.studentFeeInstallments?.toString() ?? "");
      form.setValue("studentFeeAmount", s.studentFeeAmount?.toString() ?? "");
    }
  }, [settingsData, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await updateSettings.mutateAsync({
        request: {
          studentFeeInstallments: Number(values.studentFeeInstallments),
          studentFeeAmount: Number(values.studentFeeAmount),
        },
      });
      toast({ title: "Success", description: "Fees configuration updated successfully." });
    } catch (err: unknown) {
      const message = err && typeof err === "object" && "message" in err ? String((err as { message: string }).message) : "Failed to update fees configuration.";
      toast({ title: "Error", description: message, variant: "destructive" });
    }
  });

  if (isLoading) {
    return (
      <FormCard title="Fees Configuration" icon={<DollarSign className="h-5 w-5" />}>
        <Skeleton className="h-40 w-full" />
      </FormCard>
    );
  }

  return (
    <FormCard title="Fees Configuration" icon={<DollarSign className="h-5 w-5" />}>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <Label htmlFor="studentFeeInstallments">Student Fee Installments</Label>
          <Input
            id="studentFeeInstallments"
            type="number"
            min={1}
            placeholder="e.g. 12"
            {...form.register("studentFeeInstallments")}
            error={form.formState.errors.studentFeeInstallments?.message}
          />
          {form.formState.errors.studentFeeInstallments && (
            <p className="text-sm text-destructive mt-1">{form.formState.errors.studentFeeInstallments.message}</p>
          )}
        </div>
        <div>
          <Label htmlFor="studentFeeAmount">Default Student Fee Amount (₹)</Label>
          <Input
            id="studentFeeAmount"
            type="number"
            min={0}
            placeholder="e.g. 50000"
            {...form.register("studentFeeAmount")}
            error={form.formState.errors.studentFeeAmount?.message}
          />
          {form.formState.errors.studentFeeAmount && (
            <p className="text-sm text-destructive mt-1">{form.formState.errors.studentFeeAmount.message}</p>
          )}
        </div>
        <Button type="submit" disabled={updateSettings.isPending}>
          {updateSettings.isPending ? "Saving..." : "Save Fees Config"}
        </Button>
      </form>
    </FormCard>
  );
}
