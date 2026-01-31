"use client";

import { EmployeeVendorsView } from "@/components/super-admin/employees/employee-vendors-view";

export default function EmployeeVendorsPage({ params }: { params: { id: string } }) {
  return (
    <div className="container mx-auto py-6 px-4">
      <EmployeeVendorsView employeeId={params.id} />
    </div>
  );
}

