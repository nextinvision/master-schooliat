"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useEmployee } from "@/lib/hooks/use-super-admin";
import { ArrowLeft, User } from "lucide-react";

export function EmployeeManagementView({ employeeId }: { employeeId: string }) {
  const router = useRouter();
  const { data, isLoading, error } = useEmployee(employeeId);
  const employee = data?.data;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading employee...</p>
        </div>
      </div>
    );
  }

  if (error || !employee) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <p className="text-red-600">Employee Not Found</p>
          <Button onClick={() => router.back()} className="mt-4">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">
            {employee.firstName} {employee.lastName}
          </h1>
          <p className="text-gray-600 mt-1">Employee Management</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border rounded-lg p-6">
          <h2 className="font-semibold mb-4">Employee Details</h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-600">Email</p>
              <p className="font-medium">{employee.email}</p>
            </div>
            {employee.assignedRegion && (
              <div>
                <p className="text-sm text-gray-600">Assigned Region</p>
                <p className="font-medium">{employee.assignedRegion.name}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <p className="font-medium">{employee.status}</p>
            </div>
          </div>
        </div>

        <div className="border rounded-lg p-6">
          <h2 className="font-semibold mb-4">Statistics</h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-600">Total Locations</p>
              <p className="font-medium text-2xl">{employee.totalLocations || 0}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Vendors</p>
              <p className="font-medium text-2xl">{employee.totalVendors || 0}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        <Button
          variant="outline"
          onClick={() => router.push(`/super-admin/employees/${employeeId}/vendors`)}
        >
          View Vendors
        </Button>
      </div>
    </div>
  );
}

