"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  LayoutDashboard,
  GraduationCap,
  Users,
  UserCheck,
  DollarSign,
  Calendar,
  CalendarDays,
  Bus,
  Package,
  Award,
  CreditCard,
  FileText,
  MessageCircle,
  School,
  Receipt,
  ShieldCheck,
  BarChart3,
  Store,
  Info,
  MessageSquare,
  ChevronRight,
  ChevronDown,
  LogOut,
  LucideIcon,
  BookOpen,
  Image as ImageIcon,
  FileCheck,
  Settings,
} from "lucide-react";
import { clearToken } from "@/lib/auth/storage";
import {
  MENU_ITEMS,
  SUPER_ADMIN_MENU_ITEMS,
  FINANCE_SUBMENU,
  ATTENDANCE_SUBMENU,
  LEAVE_SUBMENU,
  LIBRARY_SUBMENU,
  RESULTS_SUBMENU,
  STUDENTS_SUBMENU,
  MenuItem,
  SubMenuItem,
} from "@/lib/config/menu-items";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/lib/context/sidebar-context";

const iconMap: Record<string, LucideIcon> = {
  LayoutDashboard,
  GraduationCap,
  Users,
  UserCheck,
  DollarSign,
  Calendar,
  CalendarDays,
  Bus,
  Package,
  Award,
  CreditCard,
  FileText,
  MessageCircle,
  School,
  Receipt,
  ShieldCheck,
  BarChart3,
  Store,
  Info,
  MessageSquare,
  BookOpen,
  Image: ImageIcon,
  FileCheck,
  Settings,
};

export function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { isOpen } = useSidebar();
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({});

  const isActive = (route: string) => {
    return pathname.startsWith(route);
  };

  const isSuperAdminRoute = pathname.startsWith("/super-admin");
  const menuItems = isSuperAdminRoute ? SUPER_ADMIN_MENU_ITEMS : MENU_ITEMS;

  const handleLogout = async () => {
    await clearToken();
    router.replace("/login");
  };

  const toggleSubmenu = (menuName: string) => {
    setExpandedMenus((prev) => ({
      ...prev,
      [menuName]: !prev[menuName],
    }));
  };

  const handleMenuPress = (item: MenuItem) => {
    if (item.hasSubmenu) {
      toggleSubmenu(item.name);
    } else {
      router.push(item.route);
    }
  };

  const getSubmenuItems = (menuName: string): SubMenuItem[] => {
    switch (menuName) {
      case "Finance":
        return FINANCE_SUBMENU;
      case "Attendance":
        return ATTENDANCE_SUBMENU;
      case "Leave Management":
        return LEAVE_SUBMENU;
      case "Library":
        return LIBRARY_SUBMENU;
      case "Result Management":
        return RESULTS_SUBMENU;
      case "Students":
        return STUDENTS_SUBMENU;
      default:
        return [];
    }
  };

  const isMenuExpanded = (menuName: string) => {
    const submenuItems = getSubmenuItems(menuName);
    const isSubmenuActive = submenuItems.some((sub) =>
      pathname.startsWith(sub.route)
    );
    return expandedMenus[menuName] || isSubmenuActive;
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 bottom-0 bg-black border-r border-gray-300 flex flex-col h-screen z-30 transition-all duration-300 ease-in-out",
        isOpen ? "w-[220px] lg:w-[300px]" : "w-[70px] lg:w-[80px]"
      )}
    >
      {/* Logo Container */}
      <div className="flex items-center px-4 lg:px-6 py-4 lg:py-5 gap-2 lg:gap-3 border-b border-gray-800 justify-center lg:justify-start">
        <div className="w-9 h-9 lg:w-12 lg:h-12 bg-white rounded-lg lg:rounded-xl flex items-center justify-center flex-shrink-0">
          <Image
            src="/logo.png"
            alt="SchooliAT Logo"
            width={36}
            height={36}
            className="object-contain"
          />
        </div>
        {isOpen && (
          <span className="text-xl lg:text-2xl font-medium text-white ml-2 lg:ml-3 whitespace-nowrap">
            SchooliAT
          </span>
        )}
      </div>

      {/* Menu Container */}
      <div className="flex-1 overflow-y-auto pb-2 lg:pb-4 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
        {menuItems.map((item) => {
          const active = isActive(item.route);
          const hasSubmenu = item.hasSubmenu;
          const isExpanded = hasSubmenu && isMenuExpanded(item.name);
          const submenuItems = hasSubmenu ? getSubmenuItems(item.name) : [];
          const Icon = iconMap[item.icon] || LayoutDashboard;

          return (
            <div key={item.name}>
              <button
                onClick={() => handleMenuPress(item)}
                className={cn(
                  "flex items-center w-full py-1 lg:py-2 mx-2.5 lg:mx-4 my-1.5 lg:my-2 rounded-lg lg:rounded-xl transition-colors",
                  isOpen ? "px-4 lg:px-6" : "px-0 justify-center",
                  active && !hasSubmenu && "bg-white",
                  !active && !hasSubmenu && "hover:bg-white/10"
                )}
                title={!isOpen ? item.name : undefined}
              >
                <Icon
                  className={cn(
                    "w-5 h-5 lg:w-6 lg:h-6 flex-shrink-0",
                    active && !hasSubmenu ? "text-gray-800" : "text-white"
                  )}
                />
                {isOpen && (
                  <>
                    <span
                      className={cn(
                        "ml-3 lg:ml-4 text-sm lg:text-base flex-1 text-left font-medium",
                        active && !hasSubmenu ? "text-gray-800" : "text-white"
                      )}
                    >
                      {item.name}
                    </span>
                    {hasSubmenu && (
                      <div className="text-gray-500">
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 lg:w-5 lg:h-5" />
                        ) : (
                          <ChevronRight className="w-4 h-4 lg:w-5 lg:h-5" />
                        )}
                      </div>
                    )}
                  </>
                )}
              </button>

              {/* Submenu Items */}
              {hasSubmenu && isExpanded && isOpen && (
                <div className="ml-7 lg:ml-10 mr-2.5 lg:mr-4">
                  {submenuItems.map((subItem) => {
                    const subActive = pathname.startsWith(subItem.route);
                    return (
                      <Link
                        key={subItem.name}
                        href={subItem.route}
                        className={cn(
                          "block py-1 lg:py-1.5 px-3 lg:px-4 my-0.5 lg:my-1 rounded-md lg:rounded-lg transition-colors",
                          subActive
                            ? "bg-white/15"
                            : "hover:bg-white/8 text-white/70"
                        )}
                      >
                        <span
                          className={cn(
                            "text-xs lg:text-sm font-normal",
                            subActive ? "text-white font-medium" : "text-white/70"
                          )}
                        >
                          {subItem.name}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Logout Button */}
      <div className={cn("py-4 border-t border-gray-800", isOpen ? "px-4 lg:px-6" : "px-2")}>
        <button
          onClick={handleLogout}
          className={cn(
            "flex items-center w-full py-2 lg:py-2.5 rounded-lg lg:rounded-xl bg-white hover:bg-green-50 transition-colors cursor-pointer",
            isOpen ? "px-3 lg:px-5" : "px-2 justify-center"
          )}
          title={!isOpen ? "Log Out" : undefined}
        >
          <LogOut className="w-5 h-5 lg:w-6 lg:h-6 text-black flex-shrink-0" />
          {isOpen && (
            <span className="ml-2 lg:ml-3 text-sm lg:text-base text-black flex-1 text-left font-semibold">
              Log Out
            </span>
          )}
        </button>
      </div>
    </aside>
  );
}

