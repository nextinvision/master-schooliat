"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, ChevronLeft, ChevronRight } from "lucide-react";
import { useAuditLogs, type AuditLog } from "@/lib/hooks/use-super-admin";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

export default function AuditLogsPage() {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    action: "all",
    entityType: "all",
    result: "all",
    startDate: "",
    endDate: "",
  });

  const { data, isLoading, error } = useAuditLogs({
    action: filters.action && filters.action !== "all" ? filters.action : undefined,
    entityType: filters.entityType && filters.entityType !== "all" ? filters.entityType : undefined,
    result: filters.result && filters.result !== "all" ? filters.result : undefined,
    startDate: filters.startDate || undefined,
    endDate: filters.endDate || undefined,
    page,
    limit: 20,
  });

  const logs = (data?.data || []) as AuditLog[];
  const pagination = data?.pagination;

  // Handle error state
  if (error) {
    console.error("Error fetching audit logs:", error);
  }

  const handleFilterChange = (key: string, value: string) => {
    setFilters({ ...filters, [key]: value });
    setPage(1);
  };

  const getResultBadge = (result: string) => {
    if (result === "SUCCESS") {
      return <Badge className="bg-green-500">Success</Badge>;
    }
    return <Badge variant="destructive">Failure</Badge>;
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">Audit Logs</h1>
        <p className="text-sm text-gray-600 mt-1">
          View system activity logs and track all user actions
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filter Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label>Action</Label>
              <Input
                placeholder="e.g., CREATE, UPDATE"
                value={filters.action}
                onChange={(e) => handleFilterChange("action", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Entity Type</Label>
              <Input
                placeholder="e.g., School, User"
                value={filters.entityType}
                onChange={(e) => handleFilterChange("entityType", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Result</Label>
              <Select
                value={filters.result}
                onValueChange={(value) => handleFilterChange("result", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All results" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Results</SelectItem>
                  <SelectItem value="SUCCESS">Success</SelectItem>
                  <SelectItem value="FAILURE">Failure</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange("startDate", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>End Date</Label>
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange("endDate", e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setFilters({
                  action: "all",
                  entityType: "all",
                  result: "all",
                  startDate: "",
                  endDate: "",
                });
                setPage(1);
              }}
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Audit Logs</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-500">
              <p className="font-medium">Error loading audit logs</p>
              <p className="text-sm text-gray-500 mt-1">
                {error instanceof Error ? error.message : "Please try again later"}
              </p>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No audit logs found
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Entity</TableHead>
                    <TableHead>Result</TableHead>
                    <TableHead>IP Address</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log: AuditLog) => {
                    try {
                      return (
                        <TableRow key={log.id}>
                          <TableCell className="text-xs">
                            {log.timestamp
                              ? format(new Date(log.timestamp), "MMM dd, yyyy HH:mm:ss")
                              : "N/A"}
                          </TableCell>
                          <TableCell>
                            {log.user
                              ? `${log.user.firstName || ""} ${log.user.lastName || ""}`.trim() ||
                                log.user.email
                              : "System"}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{log.action || "N/A"}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-xs">
                              <div className="font-medium">{log.entityType || "N/A"}</div>
                              {log.entityId && (
                                <div className="text-gray-500">{log.entityId.substring(0, 8)}...</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{getResultBadge(log.result || "SUCCESS")}</TableCell>
                          <TableCell className="text-xs">{log.ipAddress || "-"}</TableCell>
                        </TableRow>
                      );
                    } catch (error) {
                      console.error("Error rendering audit log:", error, log);
                      return null;
                    }
                  })}
                </TableBody>
              </Table>
              {pagination && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-gray-600">
                    Showing {logs.length > 0 ? ((page - 1) * (pagination.limit || 20) + 1) : 0} to{" "}
                    {Math.min(page * (pagination.limit || 20), pagination.total || 0)} of{" "}
                    {pagination.total || 0} logs
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page + 1)}
                      disabled={!pagination || page >= (pagination.totalPages || 1)}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

