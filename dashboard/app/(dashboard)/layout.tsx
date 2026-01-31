"use client";

import { useAuth } from "@/lib/hooks/use-auth";
import { Sidebar } from "@/components/layout/sidebar";
import { TopHeader } from "@/components/layout/top-header";
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
        <Skeleton className="w-[220px] lg:w-[300px]" />
        <div className="flex-1 flex flex-col">
          <Skeleton className="h-[54px] lg:h-[72px]" />
          <Skeleton className="flex-1" />
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
        <div className="flex-1 flex flex-col min-w-0">
          <TopHeader />
          <main className="flex-1 overflow-y-auto p-4 lg:p-7 min-h-[calc(100vh-70px)]">
            {children}
          </main>
        </div>
        {/* ChatBot for School Admin */}
        {isSchoolAdminRoute && <ChatBot />}
      </div>
    </ClassesProvider>
  );
}

