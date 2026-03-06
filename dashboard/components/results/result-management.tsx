"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Download, Loader2, Info, FileDown, Eye } from "lucide-react";
import { useClassFilters } from "@/lib/hooks/use-class-filters";
import {
  useExams,
  useMarks,
  useCalculateResults,
  usePublishResults,
} from "@/lib/hooks/use-marks";
import { get } from "@/lib/api/client";
import { toast } from "sonner";
import { ResultViewModal } from "./result-view-modal";

export function ResultManagement() {
  const [page, setPage] = useState(0);
  const itemsPerPage = 15;
  const { classFilter, divisionFilter, classes } = useClassFilters();
  const [classFilterValue, setClassFilterValue] = useState(classFilter.defaultValue);
  const [divisionFilterValue, setDivisionFilterValue] = useState(divisionFilter.defaultValue);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [isExportingAll, setIsExportingAll] = useState(false);
  const [examFilter, setExamFilter] = useState<string>("");
  const [viewClassId, setViewClassId] = useState<string | null>(null);
  const [viewClassName, setViewClassName] = useState("");
  const [viewDivision, setViewDivision] = useState("");
  const [viewModalOpen, setViewModalOpen] = useState(false);

  // Fetch exams from API
  const { data: examsData, isLoading: examsLoading } = useExams({ pageSize: 100 });
  const exams = examsData?.data || [];
  const examOptions = exams.map((e: any) => ({ id: e.id, name: e.name }));

  // Set default exam once loaded
  useEffect(() => {
    if (exams.length > 0 && !examFilter) {
      setExamFilter(exams[0].id);
    }
  }, [exams, examFilter]);

  // Derive selected classId
  const selectedClassId = useMemo(() => {
    if (!classFilterValue || classFilterValue === classFilter.defaultValue) return undefined;
    const parts = classFilterValue.split("-");
    const grade = parts[0];
    let div = parts[1] || "";
    if (divisionFilterValue !== divisionFilter.defaultValue) {
      div = divisionFilterValue;
    }
    const matched = classes.find((c: any) => c.grade === grade && (!div || c.division === div));
    return matched?.id;
  }, [classFilterValue, divisionFilterValue, classes, classFilter.defaultValue, divisionFilter.defaultValue]);

  // Fetch marks for selected exam + class
  const { data: marksData, isLoading: marksLoading } = useMarks({
    examId: examFilter || undefined,
    classId: selectedClassId,
  });

  const calculateResults = useCalculateResults();
  const publishResults = usePublishResults();

  // Build class-level row data
  const classRows = useMemo(() => {
    return classes
      .filter((cls: any) => {
        if (classFilterValue !== classFilter.defaultValue) {
          const parts = classFilterValue.split("-");
          if (cls.grade !== parts[0]) return false;
          if (parts[1] && cls.division !== parts[1]) return false;
        }
        if (divisionFilterValue !== divisionFilter.defaultValue) {
          if (cls.division !== divisionFilterValue) return false;
        }
        return true;
      })
      .sort((a: any, b: any) => {
        const gradeA = parseInt(a.grade) || 0;
        const gradeB = parseInt(b.grade) || 0;
        if (gradeA !== gradeB) return gradeA - gradeB;
        return (a.division || "").localeCompare(b.division || "");
      })
      .map((cls: any, idx: number) => {
        const marks = marksData?.data || [];
        const classMarks = Array.isArray(marks)
          ? marks.filter((m: any) => m.classId === cls.id)
          : [];
        const hasMarks = classMarks.length > 0;
        const examName = exams.find((e: any) => e.id === examFilter)?.name || "";

        return {
          id: cls.id,
          no: String(idx + 1).padStart(2, "0"),
          class: cls.grade,
          division: cls.division || "-",
          exam: examName,
          status: hasMarks ? "Generated" : "Not generated",
          marksCount: classMarks.length,
        };
      });
  }, [classes, classFilterValue, divisionFilterValue, marksData, examFilter, exams, classFilter, divisionFilter]);

  const from = page * itemsPerPage;
  const to = Math.min((page + 1) * itemsPerPage, classRows.length);
  const numberOfPages = Math.ceil(classRows.length / itemsPerPage);
  const paginatedData = classRows.slice(from, to);

  useEffect(() => {
    setPage(0);
  }, [classFilterValue, divisionFilterValue, examFilter]);

  const handleGenerate = async (classId: string) => {
    if (!examFilter) {
      toast.error("Please select an exam first");
      return;
    }
    try {
      await calculateResults.mutateAsync({ examId: examFilter, classId });
      toast.success("Results calculated successfully!");
    } catch (error: any) {
      toast.error(error?.message || "Failed to calculate results");
    }
  };

  const handleGenerateAll = async () => {
    if (!examFilter) {
      toast.error("Please select an exam first");
      return;
    }
    try {
      await calculateResults.mutateAsync({ examId: examFilter });
      toast.success("All results calculated successfully!");
    } catch (error: any) {
      toast.error(error?.message || "Failed to calculate results");
    }
  };

  const handlePublishAll = async () => {
    if (!examFilter) {
      toast.error("Please select an exam first");
      return;
    }
    try {
      await publishResults.mutateAsync({ examId: examFilter });
      toast.success("Results published successfully!");
    } catch (error: any) {
      toast.error(error?.message || "Failed to publish results");
    }
  };

  // Download marks for a specific class as CSV
  const handleDownloadCSV = useCallback(async (classId: string, className: string, divisionName: string) => {
    if (!examFilter) {
      toast.error("Please select an exam first");
      return;
    }

    setDownloading(classId);
    try {
      const response = await get("/marks", { examId: examFilter, classId });
      const marks = response?.data || [];

      if (marks.length === 0) {
        toast.error("No marks found for this class. Enter marks first.");
        setDownloading(null);
        return;
      }

      // Group marks by student
      const studentMap: Record<string, { name: string; rollNumber: string; subjects: Record<string, { obtained: number; max: number }> }> = {};
      const subjectsSet = new Set<string>();

      marks.forEach((m: any) => {
        const studentId = m.studentId;
        const subjectName = m.subject?.name || m.subjectId || "Unknown";
        subjectsSet.add(subjectName);

        if (!studentMap[studentId]) {
          studentMap[studentId] = {
            name: `${m.student?.firstName || ""} ${m.student?.lastName || ""}`.trim() || studentId,
            rollNumber: m.student?.studentProfile?.rollNumber || "-",
            subjects: {},
          };
        }
        studentMap[studentId].subjects[subjectName] = {
          obtained: m.marksObtained,
          max: m.maxMarks,
        };
      });

      const subjects = Array.from(subjectsSet).sort();
      const examName = exams.find((e: any) => e.id === examFilter)?.name || "Exam";

      // Build CSV
      const headers = ["Roll No", "Student Name", ...subjects, "Total", "Max Total", "Percentage"];
      const rows = Object.values(studentMap)
        .sort((a, b) => a.rollNumber.localeCompare(b.rollNumber))
        .map((student) => {
          const subjectMarks = subjects.map((s) => student.subjects[s]?.obtained ?? "");
          const totalObtained = subjects.reduce((sum, s) => sum + (student.subjects[s]?.obtained || 0), 0);
          const totalMax = subjects.reduce((sum, s) => sum + (student.subjects[s]?.max || 0), 0);
          const percentage = totalMax > 0 ? ((totalObtained / totalMax) * 100).toFixed(1) : "0.0";

          return [student.rollNumber, student.name, ...subjectMarks, totalObtained, totalMax, `${percentage}%`];
        });

      const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${examName}-Class-${className}${divisionName !== "-" ? `-${divisionName}` : ""}-Results.csv`;
      link.click();
      URL.revokeObjectURL(url);

      toast.success("Results downloaded successfully!");
    } catch (error: any) {
      toast.error(error?.message || "Failed to download results");
    } finally {
      setDownloading(null);
    }
  }, [examFilter, exams]);

  const handleExportAll = async () => {
    if (!examFilter) {
      toast.error("Please select an exam first");
      return;
    }
    setIsExportingAll(true);
    try {
      const token = window.sessionStorage.getItem("accessToken");
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://api.schooliat.com";
      const resp = await fetch(`${baseUrl}/marks/results/export?examId=${examFilter}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "x-platform": "web",
        },
      });
      if (!resp.ok) throw new Error("Export failed");
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const examName = exams.find((e: any) => e.id === examFilter)?.name || "results";
      a.download = `exam_results_${examName}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("All exam results exported successfully!");
    } catch (e: any) {
      toast.error(e?.message || "Failed to export results");
    } finally {
      setIsExportingAll(false);
    }
  };

  const isProcessing = calculateResults.isPending || publishResults.isPending;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-semibold">Results Management</h1>
        <div className="flex gap-2">
          <Button
            onClick={handleExportAll}
            variant="outline"
            className="gap-2"
            disabled={isProcessing || isExportingAll}
          >
            {isExportingAll ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
            Download All Results
          </Button>
          <Button
            onClick={handlePublishAll}
            variant="outline"
            className="gap-2"
            disabled={isProcessing}
          >
            Publish All
          </Button>
          <Button
            onClick={handleGenerateAll}
            className="gap-2"
            disabled={isProcessing}
          >
            {isProcessing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            Generate All
          </Button>
        </div>
      </div>

      {/* Size specification info */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Results are downloadable as <strong>CSV spreadsheet</strong> files containing student names, roll numbers, subject-wise marks, totals, and percentages. Use the download button per class after marks have been entered.
        </AlertDescription>
      </Alert>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Select value={classFilterValue} onValueChange={setClassFilterValue}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Select Class" />
          </SelectTrigger>
          <SelectContent>
            {classFilter.options.map((opt) => (
              <SelectItem key={opt} value={opt}>
                {opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={divisionFilterValue} onValueChange={setDivisionFilterValue}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Select Division" />
          </SelectTrigger>
          <SelectContent>
            {divisionFilter.options.map((opt) => (
              <SelectItem key={opt} value={opt}>
                {opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={examFilter} onValueChange={setExamFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={examsLoading ? "Loading exams..." : "Select Exam"} />
          </SelectTrigger>
          <SelectContent>
            {examOptions.map((opt: any) => (
              <SelectItem key={opt.id} value={opt.id}>
                {opt.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden relative">
        {(marksLoading || examsLoading) && (
          <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10 backdrop-blur-sm">
            <Loader2 className="h-8 w-8 animate-spin text-schooliat-primary" />
          </div>
        )}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-schooliat-tint">
                <TableHead className="w-16">No</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Division</TableHead>
                <TableHead>Exam</TableHead>
                <TableHead className="w-40">Status</TableHead>
                <TableHead>Marks Entered</TableHead>
                <TableHead className="w-48">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    {!examFilter
                      ? "Please select an exam to view results."
                      : "No classes found matching the filters."}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map((item) => (
                  <TableRow key={item.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium">{item.no}</TableCell>
                    <TableCell>{item.class}</TableCell>
                    <TableCell>{item.division}</TableCell>
                    <TableCell>{item.exam}</TableCell>
                    <TableCell>
                      <Badge
                        variant={item.status === "Generated" ? "default" : "secondary"}
                        className={
                          item.status === "Generated"
                            ? "bg-schooliat-tint text-primary"
                            : "bg-gray-100 text-gray-800"
                        }
                      >
                        {item.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{item.marksCount}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleGenerate(item.id)}
                          disabled={isProcessing}
                          className="gap-1"
                          title="Calculate results"
                        >
                          <Download className="w-4 h-4" />
                          Generate
                        </Button>
                        {item.marksCount > 0 && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setViewClassId(item.id);
                                setViewClassName(item.class);
                                setViewDivision(item.division);
                                setViewModalOpen(true);
                              }}
                              className="gap-1"
                              title="View results"
                            >
                              <Eye className="w-4 h-4" />
                              View
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDownloadCSV(item.id, item.class, item.division)}
                              disabled={downloading === item.id}
                              className="gap-1 text-primary"
                              title="Download results as CSV"
                            >
                              {downloading === item.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <FileDown className="w-4 h-4" />
                              )}
                              CSV
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination */}
      {numberOfPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Page {page + 1} of {numberOfPages}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(Math.min(numberOfPages - 1, page + 1))}
              disabled={page >= numberOfPages - 1}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      <ResultViewModal
        open={viewModalOpen}
        onOpenChange={setViewModalOpen}
        classId={viewClassId}
        className={viewClassName}
        divisionName={viewDivision}
        examId={examFilter}
        examName={exams.find((e: any) => e.id === examFilter)?.name || ""}
      />
    </div>
  );
}
