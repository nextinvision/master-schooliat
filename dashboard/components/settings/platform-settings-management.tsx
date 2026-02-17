"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormCard } from "@/components/forms/form-card";
import { PhotoUpload } from "@/components/forms/photo-upload";
import { useSettings, useUpdateSettings, useChangePassword, type PlatformConfig } from "@/lib/hooks/use-settings";
import {
  changePasswordSchema,
  type ChangePasswordFormData,
} from "@/lib/schemas/settings-schema";
import {
  Eye,
  EyeOff,
  Building2,
  Shield,
  Mail,
  Globe,
  Settings as SettingsIcon,
  Database,
  Activity,
  FileText,
  Bot,
  Bell,
  Zap,
  Lock,
  Server,
  Palette,
  Key,
  AlertCircle,
  Save,
  RefreshCw,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export function PlatformSettingsManagement() {
  const { toast } = useToast();
  const { data: settingsData, isLoading: isSettingsLoading } = useSettings();
  const updateSettings = useUpdateSettings();
  const changePassword = useChangePassword();

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Platform config state
  const [platformConfig, setPlatformConfig] = useState<PlatformConfig>({});

  // Initialize platform config from settings
  useEffect(() => {
    if (settingsData?.data?.platformConfig) {
      setPlatformConfig(settingsData.data.platformConfig);
    }
  }, [settingsData]);

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

  const updatePlatformConfig = async (updates: Partial<PlatformConfig>) => {
    setIsSaving(true);
    try {
      const newConfig = {
        ...platformConfig,
        ...updates,
      };
      await updateSettings.mutateAsync({
        request: {
          platformConfig: newConfig,
        },
      });
      setPlatformConfig(newConfig);
      toast({
        title: "Success",
        description: "Platform settings updated successfully!",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.response?.data?.message || "Failed to update settings",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const updateNestedConfig = (path: string[], value: any) => {
    const newConfig = { ...platformConfig };
    let current: any = newConfig;
    for (let i = 0; i < path.length - 1; i++) {
      if (!current[path[i]]) {
        current[path[i]] = {};
      }
      current = current[path[i]];
    }
    current[path[path.length - 1]] = value;
    updatePlatformConfig(newConfig);
  };

  if (isSettingsLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Platform Settings</h1>
          <p className="text-gray-600 mt-1">
            Comprehensive control over SchooliAT platform configuration
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          Super Admin
        </Badge>
      </div>

      <Tabs defaultValue="branding" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 h-auto p-1">
          <TabsTrigger value="branding" className="flex items-center gap-2">
            <Palette className="w-4 h-4" />
            <span className="hidden sm:inline">Branding</span>
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2">
            <SettingsIcon className="w-4 h-4" />
            <span className="hidden sm:inline">System</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            <span className="hidden sm:inline">Security</span>
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <Zap className="w-4 h-4" />
            <span className="hidden sm:inline">Performance</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            <span className="hidden sm:inline">Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="audit" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">Audit</span>
          </TabsTrigger>
          <TabsTrigger value="ai" className="flex items-center gap-2">
            <Bot className="w-4 h-4" />
            <span className="hidden sm:inline">AI</span>
          </TabsTrigger>
          <TabsTrigger value="account" className="flex items-center gap-2">
            <Key className="w-4 h-4" />
            <span className="hidden sm:inline">Account</span>
          </TabsTrigger>
        </TabsList>

        {/* Platform Branding */}
        <TabsContent value="branding" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5" />
                Platform Branding
              </CardTitle>
              <CardDescription>
                Configure platform-wide branding and visual identity
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormCard title="Platform Logo">
                <PhotoUpload
                  control={passwordForm.control}
                  name="schoolPhotoId"
                  hintText="Upload platform logo (Recommended: 512x512px)"
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

              <Separator />

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="platformName">Platform Name</Label>
                  <Input
                    id="platformName"
                    placeholder="SchooliAT"
                    value={platformConfig?.branding?.platformName || ""}
                    onChange={(e) =>
                      updateNestedConfig(["branding", "platformName"], e.target.value)
                    }
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="primaryColor">Primary Color</Label>
                    <div className="flex gap-2">
                      <Input
                        id="primaryColor"
                        type="color"
                        className="w-20 h-10"
                        value={platformConfig?.branding?.primaryColor || "#000000"}
                        onChange={(e) =>
                          updateNestedConfig(["branding", "primaryColor"], e.target.value)
                        }
                      />
                      <Input
                        placeholder="#000000"
                        value={platformConfig?.branding?.primaryColor || ""}
                        onChange={(e) =>
                          updateNestedConfig(["branding", "primaryColor"], e.target.value)
                        }
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="secondaryColor">Secondary Color</Label>
                    <div className="flex gap-2">
                      <Input
                        id="secondaryColor"
                        type="color"
                        className="w-20 h-10"
                        value={platformConfig?.branding?.secondaryColor || "#666666"}
                        onChange={(e) =>
                          updateNestedConfig(["branding", "secondaryColor"], e.target.value)
                        }
                      />
                      <Input
                        placeholder="#666666"
                        value={platformConfig?.branding?.secondaryColor || ""}
                        onChange={(e) =>
                          updateNestedConfig(["branding", "secondaryColor"], e.target.value)
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Configuration */}
        <TabsContent value="system" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="w-5 h-5" />
                System Configuration
              </CardTitle>
              <CardDescription>
                Configure system-wide settings and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-0.5">
                    <Label>Maintenance Mode</Label>
                    <p className="text-sm text-gray-500">
                      Enable maintenance mode to restrict access to the platform
                    </p>
                  </div>
                  <Switch
                    checked={platformConfig?.system?.maintenanceMode || false}
                    onCheckedChange={(checked) =>
                      updateNestedConfig(["system", "maintenanceMode"], checked)
                    }
                  />
                </div>

                {platformConfig?.system?.maintenanceMode && (
                  <div className="space-y-1.5">
                    <Label htmlFor="maintenanceMessage">Maintenance Message</Label>
                    <Textarea
                      id="maintenanceMessage"
                      placeholder="The platform is currently under maintenance. Please check back later."
                      rows={3}
                      value={platformConfig?.system?.maintenanceMessage || ""}
                      onChange={(e) =>
                        updateNestedConfig(["system", "maintenanceMessage"], e.target.value)
                      }
                    />
                  </div>
                )}

                <Separator />

                <div className="space-y-3">
                  <Label className="text-base font-semibold">SMTP Configuration</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="smtpHost">SMTP Host</Label>
                      <Input
                        id="smtpHost"
                        placeholder="smtp.gmail.com"
                        value={platformConfig?.system?.smtp?.host || ""}
                        onChange={(e) =>
                          updateNestedConfig(["system", "smtp", "host"], e.target.value)
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="smtpPort">SMTP Port</Label>
                      <Input
                        id="smtpPort"
                        type="number"
                        placeholder="587"
                        value={platformConfig?.system?.smtp?.port || ""}
                        onChange={(e) =>
                          updateNestedConfig(
                            ["system", "smtp", "port"],
                            parseInt(e.target.value) || 587
                          )
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="smtpUser">SMTP Username</Label>
                      <Input
                        id="smtpUser"
                        placeholder="your-email@gmail.com"
                        value={platformConfig?.system?.smtp?.user || ""}
                        onChange={(e) =>
                          updateNestedConfig(["system", "smtp", "user"], e.target.value)
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="smtpPassword">SMTP Password</Label>
                      <Input
                        id="smtpPassword"
                        type="password"
                        placeholder="••••••••"
                        value={platformConfig?.system?.smtp?.password || ""}
                        onChange={(e) =>
                          updateNestedConfig(["system", "smtp", "password"], e.target.value)
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="smtpFromEmail">From Email</Label>
                      <Input
                        id="smtpFromEmail"
                        type="email"
                        placeholder="noreply@schooliat.com"
                        value={platformConfig?.system?.smtp?.fromEmail || ""}
                        onChange={(e) =>
                          updateNestedConfig(["system", "smtp", "fromEmail"], e.target.value)
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="smtpFromName">From Name</Label>
                      <Input
                        id="smtpFromName"
                        placeholder="SchooliAT"
                        value={platformConfig?.system?.smtp?.fromName || ""}
                        onChange={(e) =>
                          updateNestedConfig(["system", "smtp", "fromName"], e.target.value)
                        }
                      />
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
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Security Settings
              </CardTitle>
              <CardDescription>
                Configure platform-wide security policies and access controls
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label>IP Whitelisting</Label>
                  <Textarea
                    placeholder="Enter IP addresses or ranges (one per line)&#10;Example:&#10;192.168.1.1&#10;10.0.0.0/8&#10;172.16.0.0/12"
                    rows={6}
                    value={
                      platformConfig?.security?.ipWhitelist?.join("\n") || ""
                    }
                    onChange={(e) =>
                      updateNestedConfig(
                        ["security", "ipWhitelist"],
                        e.target.value
                          .split("\n")
                          .map((ip) => ip.trim())
                          .filter((ip) => ip.length > 0)
                      )
                    }
                  />
                  <p className="text-sm text-gray-500">
                    Restrict admin access to specific IP addresses or ranges. Leave empty to allow all IPs.
                  </p>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <Label>Enable Global 2FA</Label>
                      <p className="text-sm text-gray-500">
                        Require two-factor authentication for all admin users
                      </p>
                    </div>
                    <Switch
                      checked={platformConfig?.security?.global2FA || false}
                      onCheckedChange={(checked) =>
                        updateNestedConfig(["security", "global2FA"], checked)
                      }
                    />
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <Label className="text-base font-semibold">Password Policy</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="minPasswordLength">Minimum Length</Label>
                        <Input
                          id="minPasswordLength"
                          type="number"
                          min={8}
                          max={128}
                          value={platformConfig?.security?.passwordPolicy?.minLength || 8}
                          onChange={(e) =>
                            updateNestedConfig(
                              ["security", "passwordPolicy", "minLength"],
                              parseInt(e.target.value) || 8
                            )
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="preventReuse">Prevent Reuse (last N passwords)</Label>
                        <Input
                          id="preventReuse"
                          type="number"
                          min={0}
                          max={24}
                          value={platformConfig?.security?.passwordPolicy?.preventReuse || 0}
                          onChange={(e) =>
                            updateNestedConfig(
                              ["security", "passwordPolicy", "preventReuse"],
                              parseInt(e.target.value) || 0
                            )
                          }
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="requireUppercase" className="font-normal">
                          Require Uppercase Letters
                        </Label>
                        <Switch
                          id="requireUppercase"
                          checked={platformConfig?.security?.passwordPolicy?.requireUppercase || false}
                          onCheckedChange={(checked) =>
                            updateNestedConfig(
                              ["security", "passwordPolicy", "requireUppercase"],
                              checked
                            )
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="requireLowercase" className="font-normal">
                          Require Lowercase Letters
                        </Label>
                        <Switch
                          id="requireLowercase"
                          checked={platformConfig?.security?.passwordPolicy?.requireLowercase || false}
                          onCheckedChange={(checked) =>
                            updateNestedConfig(
                              ["security", "passwordPolicy", "requireLowercase"],
                              checked
                            )
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="requireNumbers" className="font-normal">
                          Require Numbers
                        </Label>
                        <Switch
                          id="requireNumbers"
                          checked={platformConfig?.security?.passwordPolicy?.requireNumbers || false}
                          onCheckedChange={(checked) =>
                            updateNestedConfig(
                              ["security", "passwordPolicy", "requireNumbers"],
                              checked
                            )
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="requireSpecialChars" className="font-normal">
                          Require Special Characters
                        </Label>
                        <Switch
                          id="requireSpecialChars"
                          checked={platformConfig?.security?.passwordPolicy?.requireSpecialChars || false}
                          onCheckedChange={(checked) =>
                            updateNestedConfig(
                              ["security", "passwordPolicy", "requireSpecialChars"],
                              checked
                            )
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                      <Input
                        id="sessionTimeout"
                        type="number"
                        min={5}
                        max={1440}
                        value={platformConfig?.security?.sessionTimeout || 60}
                        onChange={(e) =>
                          updateNestedConfig(
                            ["security", "sessionTimeout"],
                            parseInt(e.target.value) || 60
                          )
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="jwtExpiration">JWT Token Expiration (hours)</Label>
                      <Input
                        id="jwtExpiration"
                        type="number"
                        min={1}
                        max={168}
                        value={platformConfig?.security?.jwtExpiration || 24}
                        onChange={(e) =>
                          updateNestedConfig(
                            ["security", "jwtExpiration"],
                            parseInt(e.target.value) || 24
                          )
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Settings */}
        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Performance Settings
              </CardTitle>
              <CardDescription>
                Configure performance optimization and resource limits
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-0.5">
                    <Label>Enable Caching</Label>
                    <p className="text-sm text-gray-500">
                      Enable response caching to improve performance
                    </p>
                  </div>
                  <Switch
                    checked={platformConfig?.performance?.cacheEnabled ?? true}
                    onCheckedChange={(checked) =>
                      updateNestedConfig(["performance", "cacheEnabled"], checked)
                    }
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="cacheTTL">Cache TTL (seconds)</Label>
                    <Input
                      id="cacheTTL"
                      type="number"
                      min={0}
                      value={platformConfig?.performance?.cacheTTL || 300}
                      onChange={(e) =>
                        updateNestedConfig(
                          ["performance", "cacheTTL"],
                          parseInt(e.target.value) || 300
                        )
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="paginationDefault">Default Pagination Size</Label>
                    <Input
                      id="paginationDefault"
                      type="number"
                      min={10}
                      max={1000}
                      value={platformConfig?.performance?.paginationDefault || 50}
                      onChange={(e) =>
                        updateNestedConfig(
                          ["performance", "paginationDefault"],
                          parseInt(e.target.value) || 50
                        )
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="fileUploadLimit">File Upload Limit (MB)</Label>
                    <Input
                      id="fileUploadLimit"
                      type="number"
                      min={1}
                      max={1000}
                      value={platformConfig?.performance?.fileUploadLimit || 10}
                      onChange={(e) =>
                        updateNestedConfig(
                          ["performance", "fileUploadLimit"],
                          parseInt(e.target.value) || 10
                        )
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="queryTimeout">Query Timeout (seconds)</Label>
                    <Input
                      id="queryTimeout"
                      type="number"
                      min={1}
                      max={300}
                      value={platformConfig?.performance?.queryTimeout || 30}
                      onChange={(e) =>
                        updateNestedConfig(
                          ["performance", "queryTimeout"],
                          parseInt(e.target.value) || 30
                        )
                      }
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notification Preferences
              </CardTitle>
              <CardDescription>
                Configure notification channels and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-gray-500">
                      Enable email notifications for system events
                    </p>
                  </div>
                  <Switch
                    checked={platformConfig?.system?.notifications?.emailEnabled ?? true}
                    onCheckedChange={(checked) =>
                      updateNestedConfig(["system", "notifications", "emailEnabled"], checked)
                    }
                  />
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label>Push Notifications</Label>
                    <p className="text-sm text-gray-500">
                      Enable push notifications for mobile apps
                    </p>
                  </div>
                  <Switch
                    checked={platformConfig?.system?.notifications?.pushEnabled ?? true}
                    onCheckedChange={(checked) =>
                      updateNestedConfig(["system", "notifications", "pushEnabled"], checked)
                    }
                  />
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label>SMS Notifications</Label>
                    <p className="text-sm text-gray-500">
                      Enable SMS notifications (requires SMS gateway)
                    </p>
                  </div>
                  <Switch
                    checked={platformConfig?.system?.notifications?.smsEnabled || false}
                    onCheckedChange={(checked) =>
                      updateNestedConfig(["system", "notifications", "smsEnabled"], checked)
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audit Logs */}
        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Audit Logs & Activity Tracking
              </CardTitle>
              <CardDescription>
                Configure audit logging and activity tracking settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label>Enable Activity Tracking</Label>
                    <p className="text-sm text-gray-500">
                      Track user activities and system events
                    </p>
                  </div>
                  <Switch
                    checked={platformConfig?.audit?.enableActivityTracking ?? true}
                    onCheckedChange={(checked) =>
                      updateNestedConfig(["audit", "enableActivityTracking"], checked)
                    }
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="retentionDays">Log Retention (days)</Label>
                    <Input
                      id="retentionDays"
                      type="number"
                      min={1}
                      max={365}
                      value={platformConfig?.audit?.retentionDays || 90}
                      onChange={(e) =>
                        updateNestedConfig(
                          ["audit", "retentionDays"],
                          parseInt(e.target.value) || 90
                        )
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="logLevel">Log Level</Label>
                    <select
                      id="logLevel"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={platformConfig?.audit?.logLevel || "INFO"}
                      onChange={(e) =>
                        updateNestedConfig(["audit", "logLevel"], e.target.value)
                      }
                    >
                      <option value="DEBUG">DEBUG</option>
                      <option value="INFO">INFO</option>
                      <option value="WARN">WARN</option>
                      <option value="ERROR">ERROR</option>
                    </select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Configuration */}
        <TabsContent value="ai" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="w-5 h-5" />
                AI Chatbot Configuration
              </CardTitle>
              <CardDescription>
                Configure AI chatbot settings and behavior
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label>Enable AI Chatbot</Label>
                    <p className="text-sm text-gray-500">
                      Enable AI-powered chatbot for user assistance
                    </p>
                  </div>
                  <Switch
                    checked={platformConfig?.ai?.chatbotEnabled ?? true}
                    onCheckedChange={(checked) =>
                      updateNestedConfig(["ai", "chatbotEnabled"], checked)
                    }
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="conversationRetentionDays">
                      Conversation Retention (days)
                    </Label>
                    <Input
                      id="conversationRetentionDays"
                      type="number"
                      min={1}
                      max={365}
                      value={platformConfig?.ai?.conversationRetentionDays || 30}
                      onChange={(e) =>
                        updateNestedConfig(
                          ["ai", "conversationRetentionDays"],
                          parseInt(e.target.value) || 30
                        )
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="maxTokens">Max Tokens</Label>
                    <Input
                      id="maxTokens"
                      type="number"
                      min={100}
                      max={4000}
                      value={platformConfig?.ai?.responseConfig?.maxTokens || 1000}
                      onChange={(e) =>
                        updateNestedConfig(
                          ["ai", "responseConfig", "maxTokens"],
                          parseInt(e.target.value) || 1000
                        )
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="temperature">Temperature (0-1)</Label>
                    <Input
                      id="temperature"
                      type="number"
                      min={0}
                      max={1}
                      step={0.1}
                      value={platformConfig?.ai?.responseConfig?.temperature || 0.7}
                      onChange={(e) =>
                        updateNestedConfig(
                          ["ai", "responseConfig", "temperature"],
                          parseFloat(e.target.value) || 0.7
                        )
                      }
                    />
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
              <CardTitle className="flex items-center gap-2">
                <Key className="w-5 h-5" />
                Change Password
              </CardTitle>
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
