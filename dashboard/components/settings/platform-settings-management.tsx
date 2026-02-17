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
  changePasswordSchema,
  type ChangePasswordFormData,
} from "@/lib/schemas/settings-schema";
import { Eye, EyeOff, Building2, Shield, Mail, Globe, Settings as SettingsIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

export function PlatformSettingsManagement() {
  const { toast } = useToast();
  const { data: settingsData, isLoading: isSettingsLoading } = useSettings();
  const updateSettings = useUpdateSettings();
  const changePassword = useChangePassword();

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const passwordForm = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
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
      <div>
        <h1 className="text-2xl font-semibold">Platform Settings</h1>
        <p className="text-gray-600 mt-1">Manage SchooliAT platform configuration and preferences</p>
      </div>

      <Tabs defaultValue="branding" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="branding">
            <Globe className="w-4 h-4 mr-2" />
            Branding
          </TabsTrigger>
          <TabsTrigger value="system">
            <SettingsIcon className="w-4 h-4 mr-2" />
            System
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="w-4 h-4 mr-2" />
            Security
          </TabsTrigger>
          <TabsTrigger value="account">
            <Building2 className="w-4 h-4 mr-2" />
            Account
          </TabsTrigger>
        </TabsList>

        {/* Platform Branding */}
        <TabsContent value="branding" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Platform Branding</CardTitle>
              <CardDescription>
                Configure platform-wide branding and visual identity
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormCard title="Platform Logo">
                <PhotoUpload
                  control={passwordForm.control}
                  name="schoolPhotoId"
                  hintText="Upload platform logo"
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
                        description: "Platform logo updated.",
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
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Configuration */}
        <TabsContent value="system" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Configuration</CardTitle>
              <CardDescription>
                Configure system-wide settings and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Maintenance Mode</Label>
                    <p className="text-sm text-gray-500">
                      Enable maintenance mode to restrict access to the platform
                    </p>
                  </div>
                  <Switch />
                </div>

                <div className="space-y-2">
                  <Label>SMTP Configuration</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="smtpHost">SMTP Host</Label>
                      <Input id="smtpHost" placeholder="smtp.example.com" />
                    </div>
                    <div>
                      <Label htmlFor="smtpPort">SMTP Port</Label>
                      <Input id="smtpPort" type="number" placeholder="587" />
                    </div>
                    <div>
                      <Label htmlFor="smtpUser">SMTP Username</Label>
                      <Input id="smtpUser" placeholder="username" />
                    </div>
                    <div>
                      <Label htmlFor="smtpPassword">SMTP Password</Label>
                      <Input id="smtpPassword" type="password" placeholder="••••••••" />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>System Notifications</Label>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="emailNotifications" className="font-normal">
                        Email Notifications
                      </Label>
                      <Switch id="emailNotifications" defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="pushNotifications" className="font-normal">
                        Push Notifications
                      </Label>
                      <Switch id="pushNotifications" defaultChecked />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>
                Configure platform-wide security policies and access controls
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>IP Whitelisting</Label>
                  <Textarea
                    placeholder="Enter IP addresses or ranges (one per line)&#10;Example:&#10;192.168.1.1&#10;10.0.0.0/8"
                    rows={5}
                  />
                  <p className="text-sm text-gray-500">
                    Restrict admin access to specific IP addresses or ranges
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Two-Factor Authentication</Label>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Enable Global 2FA</p>
                      <p className="text-sm text-gray-500">
                        Require 2FA for all admin users
                      </p>
                    </div>
                    <Switch />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Password Policy</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="minPasswordLength">Minimum Length</Label>
                      <Input id="minPasswordLength" type="number" defaultValue={8} />
                    </div>
                    <div>
                      <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                      <Input id="sessionTimeout" type="number" defaultValue={60} />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Account Settings */}
        <TabsContent value="account" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>
                Update your account password
              </CardDescription>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

