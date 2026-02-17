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
    <nav className="fixed top-0 left-0 right-0 h-16 lg:h-20 bg-white border-b border-gray-200 z-40 flex items-center justify-between px-4 lg:px-6 shadow-sm">
      {/* Left Section */}
      <div className="flex items-center gap-3 lg:gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggle}
          className="rounded-full bg-gray-50 border border-gray-200 hover:bg-gray-100 h-9 w-9 lg:h-10 lg:w-10"
          title={isOpen ? "Close Sidebar" : "Open Sidebar"}
        >
          {isOpen ? (
            <X className="h-4 w-4 lg:h-5 lg:w-5 text-gray-600" />
          ) : (
            <Menu className="h-4 w-4 lg:h-5 lg:w-5 text-gray-600" />
          )}
        </Button>

        {/* Search Bar */}
        <div className="hidden md:flex items-center relative">
          <Search className="absolute left-3 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 h-9 lg:h-10 w-64 lg:w-80 border-gray-200 focus:border-primary focus:ring-primary"
          />
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-2 lg:gap-3">
        {/* Notifications */}
        <Button
          variant="ghost"
          size="icon"
          className="relative rounded-full bg-gray-50 border border-gray-200 hover:bg-gray-100 h-9 w-9 lg:h-10 lg:w-10"
        >
          <Bell className="h-4 w-4 lg:h-5 lg:w-5 text-gray-600" />
          <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
        </Button>

        {/* Settings */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push(settingsRoute)}
          className="rounded-full bg-gray-50 border border-gray-200 hover:bg-gray-100 h-9 w-9 lg:h-10 lg:w-10"
        >
          <Settings className="h-4 w-4 lg:h-5 lg:w-5 text-gray-600" />
        </Button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center gap-2 h-9 lg:h-10 px-2 lg:px-3 rounded-full bg-gray-50 border border-gray-200 hover:bg-gray-100"
            >
              <Avatar className="h-7 w-7 lg:h-8 lg:w-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs lg:text-sm font-semibold">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
              <span className="hidden lg:block text-sm font-medium text-gray-700">
                {getUserName()}
              </span>
              <ChevronDown className="h-4 w-4 text-gray-500 hidden lg:block" />
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
            <DropdownMenuItem onClick={() => {
              const profileRoute = isSuperAdminRoute ? "/super-admin/profile" : "/admin/profile";
              router.push(profileRoute);
            }}>
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

