"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Clock, Minus, User } from "lucide-react";
import { cn } from "@/lib/utils";

export type StaffAttendanceStatus = "PRESENT" | "ABSENT" | "LATE" | "HALF_DAY";

export interface StaffAttendanceRow {
  id: string;
  firstName: string;
  lastName?: string;
  email?: string;
  /** School-facing staff / teacher ID */
  publicUserId?: string;
  kind: "TEACHER" | "STAFF";
}

interface StaffAttendanceTableProps {
  members: StaffAttendanceRow[];
  getStatus: (id: string) => StaffAttendanceStatus | null;
  onSetStatus: (id: string, status: StaffAttendanceStatus) => void;
  /** When set, "Mark selected …" saves immediately via API (same as student attendance bulk). */
  onBulkMarkSelected?: (
    status: StaffAttendanceStatus,
    memberIds: string[]
  ) => void | Promise<void>;
  disabled?: boolean;
}

export function StaffAttendanceTable({
  members,
  getStatus,
  onSetStatus,
  onBulkMarkSelected,
  disabled = false,
}: StaffAttendanceTableProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const sorted = useMemo(() => {
    return [...members].sort((a, b) => {
      const na = `${a.firstName} ${a.lastName || ""}`.trim().toLowerCase();
      const nb = `${b.firstName} ${b.lastName || ""}`.trim().toLowerCase();
      return na.localeCompare(nb);
    });
  }, [members]);

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === sorted.length && sorted.length > 0) {
      setSelected(new Set());
    } else {
      setSelected(new Set(sorted.map((m) => m.id)));
    }
  };

  const clearSelection = () => setSelected(new Set());

  return (
    <div className="space-y-4">
      {selected.size > 0 && (
        <div className="bg-white rounded-lg p-4 border flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Badge variant="secondary">{selected.size} selected</Badge>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={disabled}
              onClick={async () => {
                const ids = Array.from(selected);
                if (onBulkMarkSelected) {
                  await onBulkMarkSelected("PRESENT", ids);
                } else {
                  ids.forEach((id) => onSetStatus(id, "PRESENT"));
                }
                clearSelection();
              }}
            >
              Mark selected present
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={disabled}
              onClick={async () => {
                const ids = Array.from(selected);
                if (onBulkMarkSelected) {
                  await onBulkMarkSelected("ABSENT", ids);
                } else {
                  ids.forEach((id) => onSetStatus(id, "ABSENT"));
                }
                clearSelection();
              }}
            >
              Mark selected absent
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={disabled}
              onClick={async () => {
                const ids = Array.from(selected);
                if (onBulkMarkSelected) {
                  await onBulkMarkSelected("LATE", ids);
                } else {
                  ids.forEach((id) => onSetStatus(id, "LATE"));
                }
                clearSelection();
              }}
            >
              Mark selected late
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={disabled}
              onClick={async () => {
                const ids = Array.from(selected);
                if (onBulkMarkSelected) {
                  await onBulkMarkSelected("HALF_DAY", ids);
                } else {
                  ids.forEach((id) => onSetStatus(id, "HALF_DAY"));
                }
                clearSelection();
              }}
            >
              Mark selected half day
            </Button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-schooliat-tint">
                <TableHead className="w-12">
                  <Checkbox
                    checked={
                      sorted.length > 0 && selected.size === sorted.length
                    }
                    onCheckedChange={() => toggleAll()}
                  />
                </TableHead>
                <TableHead className="w-14">#</TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="w-32">Staff ID</TableHead>
                <TableHead className="w-28">Role</TableHead>
                <TableHead className="text-center min-w-[280px]">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                    No people match your filters
                  </TableCell>
                </TableRow>
              ) : (
                sorted.map((member, idx) => {
                  const currentStatus = getStatus(member.id);
                  return (
                    <TableRow key={member.id}>
                      <TableCell>
                        <Checkbox
                          checked={selected.has(member.id)}
                          onCheckedChange={() => toggleOne(member.id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium text-muted-foreground">
                        {String(idx + 1).padStart(2, "0")}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground shrink-0" />
                          <div>
                            <div className="font-medium text-foreground">
                              {member.firstName} {member.lastName || ""}
                            </div>
                            {member.email ? (
                              <div className="text-xs text-muted-foreground">
                                {member.email}
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm text-muted-foreground">
                        {member.publicUserId ?? "—"}
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            "text-xs font-medium px-2 py-1 rounded-full",
                            member.kind === "TEACHER"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-purple-100 text-purple-800"
                          )}
                        >
                          {member.kind === "TEACHER" ? "Teacher" : "Staff"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-2 flex-wrap">
                          <button
                            type="button"
                            disabled={disabled}
                            onClick={() => onSetStatus(member.id, "PRESENT")}
                            className={cn(
                              "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                              currentStatus === "PRESENT"
                                ? "bg-green-600 text-white shadow-sm"
                                : "bg-gray-100 text-gray-500 hover:bg-green-100 hover:text-green-800"
                            )}
                          >
                            <CheckCircle2 className="inline h-3.5 w-3.5 mr-1 align-text-bottom" />
                            Present
                          </button>
                          <button
                            type="button"
                            disabled={disabled}
                            onClick={() => onSetStatus(member.id, "ABSENT")}
                            className={cn(
                              "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                              currentStatus === "ABSENT"
                                ? "bg-red-600 text-white shadow-sm"
                                : "bg-gray-100 text-gray-500 hover:bg-red-100 hover:text-red-800"
                            )}
                          >
                            <XCircle className="inline h-3.5 w-3.5 mr-1 align-text-bottom" />
                            Absent
                          </button>
                          <button
                            type="button"
                            disabled={disabled}
                            onClick={() => onSetStatus(member.id, "LATE")}
                            className={cn(
                              "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                              currentStatus === "LATE"
                                ? "bg-yellow-500 text-white shadow-sm"
                                : "bg-gray-100 text-gray-500 hover:bg-yellow-100 hover:text-yellow-800"
                            )}
                          >
                            <Clock className="inline h-3.5 w-3.5 mr-1 align-text-bottom" />
                            Late
                          </button>
                          <button
                            type="button"
                            disabled={disabled}
                            onClick={() => onSetStatus(member.id, "HALF_DAY")}
                            className={cn(
                              "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                              currentStatus === "HALF_DAY"
                                ? "bg-orange-500 text-white shadow-sm"
                                : "bg-gray-100 text-gray-500 hover:bg-orange-100 hover:text-orange-800"
                            )}
                          >
                            <Minus className="inline h-3.5 w-3.5 mr-1 align-text-bottom" />
                            Half day
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
