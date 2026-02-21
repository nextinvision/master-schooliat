"use client";

import { useState, useMemo, useEffect } from "react";
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
import { FileText, Download } from "lucide-react";
import { useClassFilters } from "@/lib/hooks/use-class-filters";

const EXAM_OPTIONS = ["1st Term", "2nd Term", "Mid Term", "Final"];

// Mock data - replace with API call
const MOCK_DATA = Array.from({ length: 20 }, (_, i) => ({
  id: i + 1,
  no: String(i + 1).padStart(2, "0"),
  class: String((i % 12) + 1),
  division: ["A", "B", "C"][i % 3],
  exam: "1st Term",
  status: i % 2 === 0 ? "Generated" : "Not generated",
  generatedOn: i % 2 === 0 ? "29 Nov 2025" : "NA",
}));

interface ResultManagementProps {
  onGenerateAll?: () => void;
  onGenerateRow?: (item: any) => void;
  onViewTemplate?: () => void;
}

export function ResultManagement({
  onGenerateAll,
  onGenerateRow,
  onViewTemplate,
}: ResultManagementProps) {
  const [page, setPage] = useState(0);
  const itemsPerPage = 15;
  const { classFilter, divisionFilter } = useClassFilters();
  const [classFilterValue, setClassFilterValue] = useState(classFilter.defaultValue);
  const [divisionFilterValue, setDivisionFilterValue] = useState(divisionFilter.defaultValue);
  const [examFilter, setExamFilter] = useState("1st Term");

  const filteredData = useMemo(() => {
    return MOCK_DATA.filter((item) => {
      const matchesClass =
        classFilterValue === classFilter.defaultValue ||
        item.class === classFilterValue.split("-")[0];
      const matchesDivision =
        divisionFilterValue === divisionFilter.defaultValue ||
        item.division === divisionFilterValue;
      const matchesExam = item.exam === examFilter;
      return matchesClass && matchesDivision && matchesExam;
    });
  }, [MOCK_DATA, classFilterValue, divisionFilterValue, examFilter, classFilter, divisionFilter]);

  const from = page * itemsPerPage;
  const to = Math.min((page + 1) * itemsPerPage, filteredData.length);
  const numberOfPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice(from, to);

  useEffect(() => {
    setPage(0);
  }, [classFilterValue, divisionFilterValue, examFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-semibold">Results Management</h1>
        <div className="flex gap-2">
          <Button onClick={onViewTemplate} variant="outline" className="gap-2">
            <FileText className="w-4 h-4" />
            View Template
          </Button>
          <Button onClick={onGenerateAll} className="gap-2">
            <Download className="w-4 h-4" />
            Generate All
          </Button>
        </div>
      </div>

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
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {EXAM_OPTIONS.map((opt) => (
              <SelectItem key={opt} value={opt}>
                {opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-schooliat-tint">
                <TableHead className="w-16">No</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Division</TableHead>
                <TableHead>Exam</TableHead>
                <TableHead className="w-40">Status</TableHead>
                <TableHead>Generated On</TableHead>
                <TableHead className="w-32">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    No results found
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
                    <TableCell>{item.generatedOn}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onGenerateRow?.(item)}
                        disabled={item.status === "Generated"}
                        className="gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Generate
                      </Button>
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
    </div>
  );
}

