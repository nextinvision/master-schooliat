"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormCard } from "@/components/forms/form-card";
import { PhotoUpload } from "@/components/forms/photo-upload";
import { useSettings, useUpdateSettings, useChangePassword } from "@/lib/hooks/use-settings";
import {
  feesConfigSchema,
  changePasswordSchema,
  type FeesConfigFormData,
  type ChangePasswordFormData,
} from "@/lib/schemas/settings-schema";
import { Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function SettingsManagement() {
  const { toast } = useToast();
  const { data: settingsData, isLoading: isSettingsLoading } = useSettings();
  const updateSettings = useUpdateSettings();
  const changePassword = useChangePassword();

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const feesForm = useForm<FeesConfigFormData>({
    resolver: zodResolver(feesConfigSchema),
    defaultValues: {
      studentFeeInstallments: "",
      studentFeeAmount: "",
    },
  });

  const passwordForm = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    if (settingsData?.data) {
      const s = settingsData.data;
      feesForm.setValue(
        "studentFeeInstallments",
        s.studentFeeInstallments?.toString() || ""
      );
      feesForm.setValue("studentFeeAmount", s.studentFeeAmount?.toString() || "");
    }
  }, [settingsData, feesForm]);

  const handleSaveFeesConfig = feesForm.handleSubmit(async (values) => {
    try {
      await updateSettings.mutateAsync({
        request: {
          studentFeeInstallments: Number(values.studentFeeInstallments),
          studentFeeAmount: Number(values.studentFeeAmount),
        },
      });
      toast({
        title: "Success",
        description: "Fees configuration updated successfully!",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Failed to update fees configuration",
        variant: "destructive",
      });
    }
  });

  const handleChangePassword = passwordForm.handleSubmit(async (values) => {
    try {
      await changePassword.mutateAsync({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      passwordForm.reset();
      toast({
        title: "Success",
        description: "Password updated successfully!",
      });
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to update password. Please try again.";

      if (message.toLowerCase().includes("incorrect current password")) {
        passwordForm.setError("currentPassword", {
          type: "manual",
          message: "Incorrect current password",
        });
      }

      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    }
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Settings</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* School Logo */}
        <FormCard title="School Logo">
          <PhotoUpload
            control={feesForm.control}
            name="schoolPhotoId"
            hintText="Upload a school logo"
            buttonText="Add / Update Logo"
            existingImageUrl={settingsData?.data?.logoUrl}
            loading={isSettingsLoading}
            onUploadSuccess={async (fileResponse) => {
              const logoId = fileResponse?.id || fileResponse?.data?.id || "";
              if (!logoId) {
                toast({
                  title: "Error",
                  description: "Failed to get file ID from upload response.",
                  variant: "destructive",
                });
                return;
              }
              try {
                await updateSettings.mutateAsync({
                  request: { logoId },
                });
                toast({
                  title: "Success",
                  description: "School logo updated.",
                });
              } catch (error: any) {
                toast({
                  title: "Error",
                  description: "Failed to save logo to settings.",
                  variant: "destructive",
                });
              }
            }}
            onUploadError={() => {
              toast({
                title: "Error",
                description: "Failed to upload logo.",
                variant: "destructive",
              });
            }}
          />
        </FormCard>

        {/* Fees Configuration */}
        <FormCard title="Fees Configuration">
          <form onSubmit={handleSaveFeesConfig} className="space-y-4">
            <div>
              <Label htmlFor="studentFeeInstallments">
                Student Fee Installments
              </Label>
              <Input
                id="studentFeeInstallments"
                type="number"
                placeholder="Enter number of installments"
                {...feesForm.register("studentFeeInstallments")}
                error={feesForm.formState.errors.studentFeeInstallments?.message}
              />
            </div>

            <div>
              <Label htmlFor="studentFeeAmount">Student Fee Amount</Label>
              <Input
                id="studentFeeAmount"
                type="number"
                placeholder="Enter fee amount"
                {...feesForm.register("studentFeeAmount")}
                error={feesForm.formState.errors.studentFeeAmount?.message}
              />
            </div>

            <Button
              type="submit"
              disabled={updateSettings.isPending}
              className="w-full"
            >
              {updateSettings.isPending ? "Saving..." : "Save Fees Config"}
            </Button>
          </form>
        </FormCard>

        {/* Change Password */}
        <FormCard title="Change Password" className="lg:col-span-2">
          <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
            <div className="relative">
              <Label htmlFor="currentPassword">Current Password</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showCurrentPassword ? "text" : "password"}
                  placeholder="Enter current password"
                  {...passwordForm.register("currentPassword")}
                  error={
                    passwordForm.formState.errors.currentPassword?.message
                  }
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showCurrentPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="relative">
              <Label htmlFor="newPassword">New Password</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  placeholder="Enter new password"
                  {...passwordForm.register("newPassword")}
                  error={passwordForm.formState.errors.newPassword?.message}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showNewPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="relative">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm new password"
                  {...passwordForm.register("confirmPassword")}
                  error={
                    passwordForm.formState.errors.confirmPassword?.message
                  }
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={changePassword.isPending}
              className="w-full"
            >
              {changePassword.isPending ? "Updating..." : "Update Password"}
            </Button>
          </form>
        </FormCard>
      </div>
    </div>
  );
}

