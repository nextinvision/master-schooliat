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
  ChevronDown,
  CheckCheck,
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
import {
  useNotifications,
  useUnreadNotificationCount,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from "@/lib/hooks/use-notifications";
import { formatDistanceToNow } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

export function EnhancedNavbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const { isOpen, toggle } = useSidebar();
  const [searchQuery, setSearchQuery] = useState("");
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const { data: notificationsRes, isLoading: notificationsLoading } = useNotifications({
    page: 1,
    limit: 10,
    isRead: null,
  });
  const { data: unreadCount = 0 } = useUnreadNotificationCount();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const notifications = notificationsRes?.data?.notifications ?? [];
  const hasUnread = unreadCount > 0;

  const handleNotificationClick = (item: { id: string; actionUrl?: string | null; isRead: boolean }) => {
    if (!item.isRead) {
      markRead.mutate(item.id);
    }
    if (item.actionUrl) {
      setNotificationsOpen(false);
      router.push(item.actionUrl);
    }
  };

  const handleMarkAllRead = () => {
    markAllRead.mutate();
  };

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
        <DropdownMenu open={notificationsOpen} onOpenChange={setNotificationsOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative rounded-md bg-gray-50 border border-gray-200 hover:bg-gray-100 h-8 w-8"
              title="Notifications"
            >
              <Bell className="h-3.5 w-3.5 text-gray-600" />
              {hasUnread && (
                <span
                  className="absolute top-0.5 right-0.5 min-w-[0.375rem] h-1.5 px-0.5 flex items-center justify-center bg-red-500 text-[10px] font-medium text-white rounded-full"
                  aria-label={`${unreadCount} unread`}
                >
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 max-h-[min(24rem,70vh)] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-2 py-2 border-b">
              <span className="text-sm font-semibold">Notifications</span>
              {hasUnread && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={handleMarkAllRead}
                  disabled={markAllRead.isPending}
                >
                  <CheckCheck className="h-3.5 w-3.5 mr-1" />
                  Mark all read
                </Button>
              )}
            </div>
            <div className="overflow-y-auto flex-1 min-h-0">
              {notificationsLoading ? (
                <div className="p-3 space-y-2">
                  <Skeleton className="h-14 w-full" />
                  <Skeleton className="h-14 w-full" />
                  <Skeleton className="h-14 w-full" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  No notifications yet
                </div>
              ) : (
                <div className="py-1">
                  {notifications.map((item) => (
                    <DropdownMenuItem
                      key={item.id}
                      className="flex flex-col items-stretch gap-0.5 p-3 cursor-pointer rounded-none border-b border-gray-100 last:border-0 focus:bg-gray-50"
                      onSelect={(e) => {
                        e.preventDefault();
                        handleNotificationClick(item);
                      }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span
                          className={item.isRead ? "text-sm font-normal text-gray-700" : "text-sm font-semibold text-gray-900"}
                        >
                          {item.title}
                        </span>
                        {!item.isRead && (
                          <span className="shrink-0 h-2 w-2 rounded-full bg-primary mt-1.5" aria-hidden />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 text-left">
                        {item.content}
                      </p>
                      <span className="text-[10px] text-muted-foreground text-left">
                        {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                      </span>
                    </DropdownMenuItem>
                  ))}
                </div>
              )}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

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

