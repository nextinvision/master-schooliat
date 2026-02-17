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
          isOpen ? "ml-[220px] lg:ml-[300px]" : "ml-[70px] lg:ml-[80px]"
        )}
      >
        <EnhancedNavbar />
        <main
          className={cn(
            "flex-1 overflow-y-auto p-4 lg:p-7 min-h-[calc(100vh-4rem)] lg:min-h-[calc(100vh-5rem)]",
            "mt-16 lg:mt-20"
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

