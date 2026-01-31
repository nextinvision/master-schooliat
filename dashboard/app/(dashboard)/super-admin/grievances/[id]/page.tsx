"use client";

import { SuperAdminGrievanceDetailView } from "@/components/super-admin/grievances/grievance-detail-view";

export default function SuperAdminGrievanceDetailPage({ params }: { params: { id: string } }) {
  return (
    <div className="container mx-auto py-6 px-4">
      <SuperAdminGrievanceDetailView grievanceId={params.id} />
    </div>
  );
}

