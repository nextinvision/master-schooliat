"use client";

import { useAuth } from "@/lib/hooks/use-auth";
import { usePathname } from "next/navigation";
import { ClassesProvider } from "@/lib/context/classes-context";
import { SidebarProvider } from "@/lib/context/sidebar-context";
import { LayoutContent } from "./layout-content";
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
      <SidebarProvider>
        <LayoutContent>{children}</LayoutContent>
      </SidebarProvider>
    </ClassesProvider>
  );
}

