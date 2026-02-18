"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function TransferCertificatesRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tcId = searchParams.get("id");

  useEffect(() => {
    // If there's a specific TC ID, redirect to that detail page
    // Otherwise redirect to unified students page with "transfer" tab
    if (tcId) {
      router.replace(`/admin/transfer-certificates/${tcId}`);
    } else {
      router.replace("/admin/students?tab=transfer");
    }
  }, [router, tcId]);

  return null;
}
