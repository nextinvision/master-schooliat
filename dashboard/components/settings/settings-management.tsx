"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, DollarSign, Bell, Key } from "lucide-react";
import { SchoolProfileSection } from "./SchoolProfileSection";
import { SchoolLogoSection } from "./SchoolLogoSection";
import { FeesConfigSection } from "./FeesConfigSection";
import { NotificationsSection } from "./NotificationsSection";
import { ChangePasswordSection } from "./ChangePasswordSection";

export function SchoolSettingsManagement() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">School Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your school profile, fees, notifications, and account
        </p>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="fees" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Fees
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="account" className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            Account
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <SchoolProfileSection />
          <SchoolLogoSection />
        </TabsContent>

        <TabsContent value="fees" className="space-y-6">
          <FeesConfigSection />
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <NotificationsSection />
        </TabsContent>

        <TabsContent value="account" className="space-y-6">
          <ChangePasswordSection />
        </TabsContent>
      </Tabs>
    </div>
  );
}
