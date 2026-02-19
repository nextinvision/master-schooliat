"use client";

import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";
import { 
  Settings, 
  Bell, 
  Search, 
  Menu,
  X,
  User,
  LogOut,
  ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { clearToken } from "@/lib/auth/storage";
import { useAuth } from "@/lib/hooks/use-auth";
import { useSidebar } from "@/lib/context/sidebar-context";
import { cn } from "@/lib/utils";

export function EnhancedNavbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const { isOpen, toggle } = useSidebar();
  const [searchQuery, setSearchQuery] = useState("");

  const isSuperAdminRoute = pathname.startsWith("/super-admin");
  const settingsRoute = isSuperAdminRoute ? "/super-admin/settings" : "/admin/settings";
  const profileRoute =
    isSuperAdminRoute
      ? "/super-admin/profile"
      : pathname.startsWith("/employee")
        ? "/employee/profile"
        : "/admin/profile";

  const handleLogout = async () => {
    await clearToken();
    router.replace("/login");
  };

  const getUserInitials = () => {
    if (user?.email) {
      const emailParts = user.email.split("@")[0].split(".");
      if (emailParts.length >= 2) {
        return `${emailParts[0][0]}${emailParts[1][0]}`.toUpperCase();
      }
      return user.email[0].toUpperCase();
    }
    return "U";
  };

  const getUserName = () => {
    if (user?.email) {
      const emailParts = user.email.split("@")[0].split(".");
      if (emailParts.length >= 2) {
        return `${emailParts[0]} ${emailParts[1]}`.replace(/\b\w/g, (l) => l.toUpperCase());
      }
      return user.email.split("@")[0];
    }
    return "User";
  };

  return (
    <nav className="fixed top-0 left-0 right-0 h-12 bg-white border-b border-gray-200 z-40 flex items-center justify-between px-3 shadow-sm">
      {/* Left Section */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggle}
          className="rounded-md bg-gray-50 border border-gray-200 hover:bg-gray-100 h-8 w-8"
          title={isOpen ? "Close Sidebar" : "Open Sidebar"}
        >
          {isOpen ? (
            <X className="h-3.5 w-3.5 text-gray-600" />
          ) : (
            <Menu className="h-3.5 w-3.5 text-gray-600" />
          )}
        </Button>

        {/* Search Bar */}
        <div className="hidden md:flex items-center relative">
          <Search className="absolute left-2.5 h-3.5 w-3.5 text-gray-400" />
          <Input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 pr-3 h-8 w-56 text-sm border-gray-200 focus:border-primary focus:ring-primary"
          />
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-1.5">
        {/* Notifications */}
        <Button
          variant="ghost"
          size="icon"
          className="relative rounded-md bg-gray-50 border border-gray-200 hover:bg-gray-100 h-8 w-8"
        >
          <Bell className="h-3.5 w-3.5 text-gray-600" />
          <span className="absolute top-0.5 right-0.5 h-1.5 w-1.5 bg-red-500 rounded-full"></span>
        </Button>

        {/* Settings */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push(settingsRoute)}
          className="rounded-md bg-gray-50 border border-gray-200 hover:bg-gray-100 h-8 w-8"
        >
          <Settings className="h-3.5 w-3.5 text-gray-600" />
        </Button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center gap-1.5 h-8 px-2 rounded-md bg-gray-50 border border-gray-200 hover:bg-gray-100"
            >
              <Avatar className="h-6 w-6">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
              <span className="hidden lg:block text-xs font-medium text-gray-700">
                {getUserName()}
              </span>
              <ChevronDown className="h-3 w-3 text-gray-500 hidden lg:block" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{getUserName()}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push(profileRoute)}>
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push(settingsRoute)}>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-red-600">
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  );
}

