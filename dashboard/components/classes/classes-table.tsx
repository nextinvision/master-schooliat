"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Plus, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getAuthToken } from "@/lib/auth/storage";
import { BASE_URL } from "@/lib/api/config";

interface ClassesTableProps {
  classes: any[];
  onAddNew: () => void;
  page: number;
  onPageChange: (page: number) => void;
  serverTotalPages: number;
  loading: boolean;
  onRefresh: () => void;
}

export function ClassesTable({
  classes,
  onAddNew,
  page,
  onPageChange,
  serverTotalPages,
  loading,
}: ClassesTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkExporting, setBulkExporting] = useState(false);

  const filteredClasses = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return classes;

    return classes.filter((cls) => {
      const gradeMatch = cls.grade?.toLowerCase().includes(q);
      const divisionMatch = cls.division?.toLowerCase().includes(q);
      const teacherMatch =
        cls.classTeacher &&
        `${cls.classTeacher.firstName} ${cls.classTeacher.lastName}`
          .toLowerCase()
          .includes(q);
      return gradeMatch || divisionMatch || teacherMatch;
    });
  }, [classes, searchQuery]);

  const allFilteredSelected =
    filteredClasses.length > 0 &&
    filteredClasses.every((c) => selectedIds.has(c.id));

  const toggleOne = (id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const toggleAllFiltered = (checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        filteredClasses.forEach((c) => next.add(c.id));
      } else {
        filteredClasses.forEach((c) => next.delete(c.id));
      }
      return next;
    });
  };

  const downloadOne = async (classId: string, className: string) => {
    const token = await getAuthToken();
    const baseUrl = BASE_URL;
    const response = await fetch(`${baseUrl}/schools/classes/${classId}/students/export`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) throw new Error("Failed to download file");

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `class_${className.replace(/\s+/g, "_")}_students.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const handleDownload = async (classId: string, className: string) => {
    try {
      await downloadOne(classId, className);
      toast.success("Download started");
    } catch (error: any) {
      toast.error(error?.message || "Failed to download class data");
    }
  };

  const handleBulkExport = async () => {
    const ids = filteredClasses.filter((c) => selectedIds.has(c.id)).map((c) => c.id);
    if (ids.length === 0) {
      toast.error("Select at least one class");
      return;
    }
    setBulkExporting(true);
    try {
      for (const id of ids) {
        const cls = filteredClasses.find((c) => c.id === id);
        if (!cls) continue;
        const name = `${cls.grade}${cls.division ? "_" + cls.division : ""}`;
        await downloadOne(id, name);
      }
      toast.success(`Exported ${ids.length} class list(s)`);
    } catch (error: any) {
      toast.error(error?.message || "Bulk export failed");
    } finally {
      setBulkExporting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-semibold">Classes</h1>
        <Button onClick={onAddNew} className="gap-2">
          <Plus className="w-4 h-4" />
          Add/Update
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search by Grade, Division, or Teacher"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <Checkbox
              id="select-all-classes"
              checked={allFilteredSelected}
              onCheckedChange={(v) => toggleAllFiltered(v === true)}
              disabled={filteredClasses.length === 0 || loading}
            />
            <label htmlFor="select-all-classes" className="text-sm text-muted-foreground cursor-pointer">
              Select visible
            </label>
          </div>
          <Button
            variant="secondary"
            className="gap-2"
            onClick={handleBulkExport}
            disabled={bulkExporting || selectedIds.size === 0}
          >
            {bulkExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Export selected
          </Button>
        </div>
      </div>

      {loading && filteredClasses.length === 0 ? (
        <div className="border rounded-lg p-12 text-center text-muted-foreground">Loading…</div>
      ) : filteredClasses.length === 0 ? (
        <div className="border rounded-lg p-12 text-center text-muted-foreground">No classes found</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredClasses.map((cls, index) => {
            const teacher = cls.classTeacher
              ? `${cls.classTeacher.firstName} ${cls.classTeacher.lastName}`
              : "—";
            const label = `${cls.grade}${cls.division ? ` ${cls.division}` : ""}`;
            const annual = cls.defaultAnnualFee != null ? `₹${Number(cls.defaultAnnualFee).toLocaleString("en-IN")}` : "—";
            const monthly = cls.defaultMonthlyFee != null ? `₹${Number(cls.defaultMonthlyFee).toLocaleString("en-IN")}` : "—";
            return (
              <Card key={cls.id} className="overflow-hidden border-schooliat-tint/40">
                <CardHeader className="pb-2 flex flex-row items-start gap-3 space-y-0">
                  <Checkbox
                    checked={selectedIds.has(cls.id)}
                    onCheckedChange={(v) => toggleOne(cls.id, v === true)}
                    className="mt-1"
                    aria-label={`Select class ${label}`}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-lg leading-tight">{label}</div>
                    <p className="text-sm text-muted-foreground mt-1">Teacher: {teacher}</p>
                  </div>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    #{String(index + 1).padStart(2, "0")}
                  </span>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-muted-foreground">Default annual</span>
                      <div className="font-medium">{annual}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Default monthly</span>
                      <div className="font-medium">{monthly}</div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-2"
                    onClick={() => handleDownload(cls.id, `${cls.grade}${cls.division ? "_" + cls.division : ""}`)}
                  >
                    <Download className="h-4 w-4" />
                    Student list (CSV)
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {serverTotalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Page {page + 1} of {serverTotalPages}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(Math.max(0, page - 1))}
              disabled={page === 0 || loading}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(Math.min(serverTotalPages - 1, page + 1))}
              disabled={page >= serverTotalPages - 1 || loading}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
