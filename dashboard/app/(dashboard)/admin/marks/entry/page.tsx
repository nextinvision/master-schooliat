"use client";

import { useState, useCallback } from "react";
import { useExams, useEnterMarks, useEnterBulkMarks } from "@/lib/hooks/use-marks";
import { useClassesContext } from "@/lib/context/classes-context";
import { useStudentsPage } from "@/lib/hooks/use-students";
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
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Save, Download } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function MarksEntryPage() {
  const { classes, isLoading: classesLoading } = useClassesContext();
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [selectedExamId, setSelectedExamId] = useState<string>("");
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");
  const [maxMarks, setMaxMarks] = useState<number>(100);

  const { data: examsData, isLoading: examsLoading } = useExams({
    classId: selectedClassId || undefined,
  });
  const { data: studentsData, isLoading: studentsLoading } = useStudentsPage(1, 1000);

  const enterMarks = useEnterMarks();
  const enterBulkMarks = useEnterBulkMarks();

  const exams = examsData?.data || [];
  const students = studentsData?.data || [];
  const filteredStudents = selectedClassId
    ? students.filter((s: any) => s.studentProfile?.classId === selectedClassId)
    : [];

  const [marksData, setMarksData] = useState<Record<string, number>>({});

  const handleMarksChange = (studentId: string, value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0) {
      setMarksData((prev) => ({
        ...prev,
        [studentId]: numValue,
      }));
    } else if (value === "") {
      setMarksData((prev) => {
        const newData = { ...prev };
        delete newData[studentId];
        return newData;
      });
    }
  };

  const handleSaveAll = useCallback(async () => {
    if (!selectedExamId || !selectedClassId || !selectedSubjectId) {
      toast.error("Please select exam, class, and subject");
      return;
    }

    const marksToSave = Object.entries(marksData)
      .filter(([_, marks]) => marks !== undefined && marks !== null)
      .map(([studentId, marksObtained]) => ({
        examId: selectedExamId,
        studentId,
        subjectId: selectedSubjectId,
        classId: selectedClassId,
        marksObtained,
        maxMarks,
      }));

    if (marksToSave.length === 0) {
      toast.error("Please enter at least one mark");
      return;
    }

    try {
      if (marksToSave.length === 1) {
        await enterMarks.mutateAsync(marksToSave[0]);
      } else {
        await enterBulkMarks.mutateAsync({ marks: marksToSave });
      }
      toast.success("Marks saved successfully");
      setMarksData({});
    } catch (error: any) {
      toast.error(error?.message || "Failed to save marks");
    }
  }, [selectedExamId, selectedClassId, selectedSubjectId, marksData, maxMarks, enterMarks, enterBulkMarks]);

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Marks Entry</h1>
        <Button onClick={handleSaveAll} disabled={enterMarks.isPending || enterBulkMarks.isPending}>
          <Save className="h-4 w-4 mr-2" />
          Save All Marks
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Select Exam & Class</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Class</Label>
              {classesLoading ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes?.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.division ? `${cls.grade}-${cls.division}` : cls.grade}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="space-y-2">
              <Label>Exam</Label>
              {examsLoading ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <Select value={selectedExamId} onValueChange={setSelectedExamId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Exam" />
                  </SelectTrigger>
                  <SelectContent>
                    {exams.map((exam: any) => (
                      <SelectItem key={exam.id} value={exam.id}>
                        {exam.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="space-y-2">
              <Label>Subject</Label>
              <Select value={selectedSubjectId} onValueChange={setSelectedSubjectId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Subject" />
                </SelectTrigger>
                <SelectContent>
                  {/* TODO: Fetch subjects from API */}
                  <SelectItem value="sub1">Mathematics</SelectItem>
                  <SelectItem value="sub2">Science</SelectItem>
                  <SelectItem value="sub3">English</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Max Marks</Label>
              <Input
                type="number"
                value={maxMarks}
                onChange={(e) => setMaxMarks(parseFloat(e.target.value) || 100)}
                min={1}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Marks Entry Table */}
      {selectedClassId && selectedExamId && selectedSubjectId ? (
        <Card>
          <CardHeader>
            <CardTitle>Enter Marks</CardTitle>
          </CardHeader>
          <CardContent>
            {studentsLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-[#e5ffc7]">
                      <TableHead className="w-16">No</TableHead>
                      <TableHead>Student Name</TableHead>
                      <TableHead>Roll Number</TableHead>
                      <TableHead className="w-48">Marks Obtained</TableHead>
                      <TableHead className="w-32">Percentage</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8">
                          No students found for this class
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredStudents.map((student: any, index: number) => {
                        const marks = marksData[student.id] || 0;
                        const percentage = maxMarks > 0 ? ((marks / maxMarks) * 100).toFixed(2) : "0.00";
                        return (
                          <TableRow key={student.id}>
                            <TableCell className="font-medium">
                              {String(index + 1).padStart(2, "0")}
                            </TableCell>
                            <TableCell className="font-medium">
                              {student.firstName} {student.lastName}
                            </TableCell>
                            <TableCell>{student.studentProfile?.rollNumber || "N/A"}</TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                value={marksData[student.id] || ""}
                                onChange={(e) => handleMarksChange(student.id, e.target.value)}
                                placeholder="Enter marks"
                                min={0}
                                max={maxMarks}
                                className="w-full"
                              />
                            </TableCell>
                            <TableCell>
                              <span className={marks > 0 ? "font-semibold" : "text-gray-400"}>
                                {percentage}%
                              </span>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12 text-gray-500">
              <p>Please select class, exam, and subject to enter marks</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

