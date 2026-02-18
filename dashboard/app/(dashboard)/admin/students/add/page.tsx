"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AddStudentRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to unified students page with "add" tab
    router.replace("/admin/students?tab=add");
  }, [router]);

  return null;
}
