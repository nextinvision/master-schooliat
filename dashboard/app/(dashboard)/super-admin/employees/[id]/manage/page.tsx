"use client";

import { EmployeeManagementView } from "@/components/super-admin/employees/employee-management-view";

export default function EmployeeManagePage({ params }: { params: { id: string } }) {
  return (
    <div className="container mx-auto py-6 px-4">
      <EmployeeManagementView employeeId={params.id} />
    </div>
  );
}

