"use client";

import { useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useLicenses, License } from "@/lib/hooks/use-super-admin";

const getStatusColor = (status: string) => {
  switch (status) {
    case "ACTIVE":
      return "bg-green-100 text-green-800 border-green-300";
    case "EXPIRING_SOON":
      return "bg-yellow-100 text-yellow-800 border-yellow-300";
    case "EXPIRED":
      return "bg-red-100 text-red-800 border-red-300";
    default:
      return "bg-gray-100 text-gray-800 border-gray-300";
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case "ACTIVE":
      return "Active";
    case "EXPIRING_SOON":
      return "Expiring Soon";
    case "EXPIRED":
      return "Expired";
    default:
      return status;
  }
};

interface LicenseDisplay {
  id: string;
  name: string;
  issuer: string;
  issueDate: string;
  expiryDate: string;
  status: "ACTIVE" | "EXPIRING_SOON" | "EXPIRED";
  certificateNumber: string;
  documentUrl?: string;
}

export function LicensesManagement() {
  const { data, isLoading, error } = useLicenses();

  const licenses = useMemo<LicenseDisplay[]>(() => {
    if (!data?.data) return [];
    return data.data.map((license: License) => ({
      id: license.id,
      name: license.name,
      issuer: license.issuer,
      issueDate: new Date(license.issueDate).toISOString().split("T")[0],
      expiryDate: new Date(license.expiryDate).toISOString().split("T")[0],
      status: license.status,
      certificateNumber: license.certificateNumber,
      documentUrl: license.documentUrl,
    }));
  }, [data]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading licenses...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <p className="text-red-600">Failed to load licenses</p>
          <p className="text-sm text-gray-600 mt-2">
            {(error as Error).message}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Licenses Management</h1>
        <p className="text-gray-600 mt-1">
          View and manage all licenses and certifications
        </p>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#e5ffc7]">
                <TableHead>License Name</TableHead>
                <TableHead>Issuer</TableHead>
                <TableHead>Issue Date</TableHead>
                <TableHead>Expiry Date</TableHead>
                <TableHead>Certificate Number</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {licenses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    No licenses found
                  </TableCell>
                </TableRow>
              ) : (
                licenses.map((license) => (
                  <TableRow key={license.id} className="hover:bg-gray-50">
                    <TableCell className="font-semibold">{license.name}</TableCell>
                    <TableCell>{license.issuer}</TableCell>
                    <TableCell>{license.issueDate}</TableCell>
                    <TableCell>{license.expiryDate}</TableCell>
                    <TableCell className="font-mono text-sm">
                      {license.certificateNumber}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={getStatusColor(license.status)}
                      >
                        {getStatusLabel(license.status)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

