"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { EnhancedNavbar } from "@/components/layout/enhanced-navbar";
import { ChatBot } from "@/components/layout/chatbot";
import { useSidebar } from "@/lib/context/sidebar-context";
import { cn } from "@/lib/utils";

export function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isOpen } = useSidebar();

  // Check if we're on a school admin route (not super-admin or employee)
  const isSchoolAdminRoute = pathname.startsWith("/admin");

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <div
        className={cn(
          "flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out",
          isOpen ? "ml-[200px] lg:ml-[240px]" : "ml-[60px] lg:ml-[64px]"
        )}
      >
        <EnhancedNavbar />
        <main
          className={cn(
            "flex-1 overflow-y-auto p-3 min-h-[calc(100vh-3rem)]",
            "mt-12"
          )}
        >
          {children}
        </main>
      </div>
      {/* ChatBot for School Admin */}
      {isSchoolAdminRoute && <ChatBot />}
    </div>
  );
}

