"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AddStudentRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to unified students page (Add Student button will open dialog)
    router.replace("/admin/students");
  }, [router]);

  return null;
}
