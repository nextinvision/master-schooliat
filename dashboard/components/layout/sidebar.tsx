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
  Database,
  ScrollText,
  Activity,
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
  MASTER_DATA_SUBMENU,
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
  Database,
  ScrollText,
  Activity,
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
      case "Master Data":
        return MASTER_DATA_SUBMENU;
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
        isOpen ? "w-[200px] lg:w-[240px]" : "w-[60px] lg:w-[64px]"
      )}
    >
      {/* Logo Container */}
      <div className="flex items-center px-3 py-2.5 gap-2 border-b border-gray-800 justify-center lg:justify-start">
        <div className="w-7 h-7 bg-white rounded-md flex items-center justify-center flex-shrink-0">
          <div className="w-full h-full bg-gradient-to-br from-green-500 to-green-600 rounded flex items-center justify-center text-white font-bold text-xs">
            SA
          </div>
        </div>
        {isOpen && (
          <span className="text-base font-medium text-white ml-2 whitespace-nowrap">
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
                  "flex items-center w-full py-1.5 mx-2 my-1 rounded-md transition-colors",
                  isOpen ? "px-3" : "px-0 justify-center",
                  active && !hasSubmenu && "bg-white",
                  !active && !hasSubmenu && "hover:bg-white/10"
                )}
                title={!isOpen ? item.name : undefined}
              >
                <Icon
                  className={cn(
                    "w-4 h-4 flex-shrink-0",
                    active && !hasSubmenu ? "text-gray-800" : "text-white"
                  )}
                />
                {isOpen && (
                  <>
                    <span
                      className={cn(
                        "ml-2.5 text-sm flex-1 text-left font-medium",
                        active && !hasSubmenu ? "text-gray-800" : "text-white"
                      )}
                    >
                      {item.name}
                    </span>
                    {hasSubmenu && (
                      <div className="text-gray-500">
                        {isExpanded ? (
                          <ChevronDown className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5" />
                        )}
                      </div>
                    )}
                  </>
                )}
              </button>

              {/* Submenu Items */}
              {hasSubmenu && isExpanded && isOpen && (
                <div className="ml-8 mr-2">
                  {submenuItems.map((subItem) => {
                    const subActive = pathname.startsWith(subItem.route);
                    return (
                      <Link
                        key={subItem.name}
                        href={subItem.route}
                        className={cn(
                          "block py-1 px-2.5 my-0.5 rounded transition-colors",
                          subActive
                            ? "bg-white/15"
                            : "hover:bg-white/8 text-white/70"
                        )}
                      >
                        <span
                          className={cn(
                            "text-xs font-normal",
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
      <div className={cn("py-2.5 border-t border-gray-800", isOpen ? "px-3" : "px-2")}>
        <button
          onClick={handleLogout}
          className={cn(
            "flex items-center w-full py-1.5 rounded-md bg-white hover:bg-green-50 transition-colors cursor-pointer",
            isOpen ? "px-2.5" : "px-2 justify-center"
          )}
          title={!isOpen ? "Log Out" : undefined}
        >
          <LogOut className="w-4 h-4 text-black flex-shrink-0" />
          {isOpen && (
            <span className="ml-2 text-sm text-black flex-1 text-left font-semibold">
              Log Out
            </span>
          )}
        </button>
      </div>
    </aside>
  );
}

