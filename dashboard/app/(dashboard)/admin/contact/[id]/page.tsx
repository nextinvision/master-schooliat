"use client";

import { GrievanceDetailView } from "@/components/contact/grievance-detail-view";

export default function GrievanceDetailPage({ params }: { params: { id: string } }) {
  return (
    <div className="container mx-auto py-6 px-4">
      <GrievanceDetailView grievanceId={params.id} />
    </div>
  );
}


