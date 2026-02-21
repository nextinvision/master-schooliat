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
import { FileText, Download, Settings } from "lucide-react";
import { useClassFilters } from "@/lib/hooks/use-class-filters";
import {
  useIdCardsStatus,
  useGenerateClassIdCards,
  IdCardStatus,
} from "@/lib/hooks/use-id-cards";
import { toast } from "sonner";
import { format } from "date-fns";

export function IDCardsManagement() {
  const [page, setPage] = useState(0);
  const itemsPerPage = 15;
  const { classFilter, divisionFilter } = useClassFilters();
  const [classFilterValue, setClassFilterValue] = useState(classFilter.defaultValue);
  const [divisionFilterValue, setDivisionFilterValue] = useState(divisionFilter.defaultValue);

  const { data, isLoading, isError, error, refetch } = useIdCardsStatus();
  const generateIdCards = useGenerateClassIdCards();

  const idCardsData: IdCardStatus[] = data?.data ?? [];

  const filteredData = useMemo(() => {
    return idCardsData
      .map((item, index) => ({
        ...item,
        no: String(index + 1).padStart(2, "0"),
        class: item.grade,
        generatedOn: item.generatedOn
          ? format(new Date(item.generatedOn), "dd MMM yyyy")
          : "NA",
      }))
      .filter((item) => {
        const matchesClass =
          classFilterValue === classFilter.defaultValue ||
          item.grade === classFilterValue.split("-")[0];
        const matchesDivision =
          divisionFilterValue === divisionFilter.defaultValue ||
          item.division === divisionFilterValue;
        return matchesClass && matchesDivision;
      });
  }, [idCardsData, classFilterValue, divisionFilterValue, classFilter, divisionFilter]);

  const from = page * itemsPerPage;
  const to = Math.min((page + 1) * itemsPerPage, filteredData.length);
  const numberOfPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice(from, to);

  useEffect(() => {
    setPage(0);
  }, [classFilterValue, divisionFilterValue]);

  const handleGenerateAll = async () => {
    const notGenerated = filteredData.filter(
      (item) => item.status === "Not generated"
    );
    if (notGenerated.length === 0) {
      toast.info("All ID cards have already been generated");
      return;
    }

    if (
      !confirm(
        `Are you sure you want to generate ID cards for ${notGenerated.length} class(es)?`
      )
    ) {
      return;
    }

    try {
      await Promise.all(
        notGenerated.map((item) => generateIdCards.mutateAsync(item.id))
      );
      toast.success(
        `ID cards generated successfully for ${notGenerated.length} class(es)!`
      );
      refetch();
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to generate ID cards";
      toast.error(errorMessage);
    }
  };

  const handleGenerateRow = async (item: IdCardStatus) => {
    if (item.status === "Generated") {
      toast.info("ID cards for this class have already been generated");
      return;
    }

    if (!confirm(`Generate ID cards for Class ${item.grade}${item.division ? `-${item.division}` : ""}?`)) {
      return;
    }

    try {
      await generateIdCards.mutateAsync(item.id);
      toast.success("ID cards generated successfully!");
      refetch();
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to generate ID cards";
      toast.error(errorMessage);
    }
  };

  const handleViewTemplate = () => {
    toast.info("Template configuration coming soon");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading ID cards status...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-600 mb-4">
            Error: {error instanceof Error ? error.message : "Failed to load ID cards status"}
          </p>
          <Button onClick={() => refetch()} variant="outline">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-semibold">ID Cards Management</h1>
        <div className="flex gap-2">
          <Button onClick={handleViewTemplate} variant="outline" className="gap-2">
            <FileText className="w-4 h-4" />
            View Template
          </Button>
          <Button onClick={() => {}} variant="outline" className="gap-2">
            <Settings className="w-4 h-4" />
            Configure
          </Button>
          <Button
            onClick={handleGenerateAll}
            disabled={generateIdCards.isPending}
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            {generateIdCards.isPending ? "Generating..." : "Generate All"}
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
                <TableHead className="w-40">Status</TableHead>
                <TableHead>Generated On</TableHead>
                <TableHead className="w-32">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    No ID cards found
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map((item) => (
                  <TableRow key={item.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium">{item.no}</TableCell>
                    <TableCell>{item.class}</TableCell>
                    <TableCell>{item.division}</TableCell>
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
                        onClick={() => handleGenerateRow(item)}
                        disabled={item.status === "Generated" || generateIdCards.isPending}
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

