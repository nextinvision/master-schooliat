"use client";

import { useAuth } from "@/lib/hooks/use-auth";
import { Sidebar } from "@/components/layout/sidebar";
import { EnhancedNavbar } from "@/components/layout/enhanced-navbar";
import { ChatBot } from "@/components/layout/chatbot";
import { usePathname } from "next/navigation";
import { ClassesProvider } from "@/lib/context/classes-context";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { isLoading } = useAuth();

  // Routes that should NOT show sidebar and header (public/auth pages)
  const publicRoutes = ["/", "/login", "/forgot-password"];
  const shouldShowSidebar = !publicRoutes.some((route) => pathname === route);

  // Check if we're on a school admin route (not super-admin or employee)
  const isSchoolAdminRoute = pathname.startsWith("/admin");

  if (isLoading) {
    return (
      <div className="flex h-screen">
        <Skeleton className="w-[220px] lg:w-[300px] fixed left-0 top-0 bottom-0" />
        <div className="flex-1 flex flex-col ml-[220px] lg:ml-[300px]">
          <Skeleton className="h-16 lg:h-20 fixed top-0 left-[220px] lg:left-[300px] right-0" />
          <Skeleton className="flex-1 mt-16 lg:mt-20" />
        </div>
      </div>
    );
  }

  if (!shouldShowSidebar) {
    return <>{children}</>;
  }

  return (
    <ClassesProvider>
      <div className="flex min-h-screen bg-gray-100">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 ml-[220px] lg:ml-[300px]">
          <EnhancedNavbar />
          <main className="flex-1 overflow-y-auto p-4 lg:p-7 mt-16 lg:mt-20 min-h-[calc(100vh-4rem)] lg:min-h-[calc(100vh-5rem)]">
            {children}
          </main>
        </div>
        {/* ChatBot for School Admin */}
        {isSchoolAdminRoute && <ChatBot />}
      </div>
    </ClassesProvider>
  );
}

