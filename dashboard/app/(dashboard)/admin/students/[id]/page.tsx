"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useStudent } from "@/lib/hooks/use-students";
import { useStudentFees } from "@/lib/hooks/use-fees";
import { useMarks, useResults } from "@/lib/hooks/use-marks";
import { useHomework } from "@/lib/hooks/use-homework";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Pencil, IndianRupee, BookOpen, Award, FileText } from "lucide-react";

export default function StudentProfilePage() {
  const params = useParams();
  const router = useRouter();
  const studentId = params.id as string;

  const { data: studentRes, isLoading: loadingStudent } = useStudent(studentId);
  const student = studentRes?.data;

  const { data: feesRes, isLoading: loadingFees } = useStudentFees(studentId, {
    enabled: !!studentId,
  });
  const feePayload = feesRes?.data;
  const installments = feePayload?.installments ?? [];

  const { data: marksRes, isLoading: loadingMarks } = useMarks({ studentId });
  const marks = marksRes?.data ?? [];

  const { data: resultsRes } = useResults({ studentId });
  const results = resultsRes?.data ?? [];

  const { data: hwRes, isLoading: loadingHw } = useHomework({
    studentId,
    limit: 20,
    page: 1,
  });
  const homeworkList = hwRes?.data ?? [];

  if (loadingStudent) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground">Student not found.</p>
        <Button variant="outline" onClick={() => router.push("/admin/students")}>
          Back to students
        </Button>
      </div>
    );
  }

  const sp = student.studentProfile || {};
  const classLabel = sp.class
    ? `${sp.class.grade}${sp.class.division ? `-${sp.class.division}` : ""}`
    : "—";

  const totalDue = installments.reduce(
    (s: number, i: any) => s + Number(i.amount || 0),
    0,
  );
  const totalPaid = installments.reduce(
    (s: number, i: any) => s + Number(i.paidAmount || 0),
    0,
  );

  return (
    <div className="space-y-6 pb-8 max-w-6xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/admin/students")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold">
              {student.firstName} {student.lastName}
            </h1>
            <p className="text-sm text-muted-foreground">
              Class {classLabel}
              {student.publicUserId ? ` · ID ${student.publicUserId}` : ""}
            </p>
          </div>
        </div>
        <Button asChild variant="outline" className="gap-2">
          <Link href={`/admin/students/${studentId}/edit`}>
            <Pencil className="h-4 w-4" />
            Edit student
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Email</span>
              <span className="text-right break-all">{student.email || "—"}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Contact</span>
              <span>{student.contact || "—"}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Roll number</span>
              <span>{sp.rollNumber || "—"}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Father</span>
              <span className="text-right">{sp.fatherName || "—"}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <IndianRupee className="h-4 w-4" />
              Fees summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {loadingFees ? (
              <Skeleton className="h-20 w-full" />
            ) : (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Installments</span>
                  <span>{installments.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total (installments)</span>
                  <span>₹{totalDue.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span className="text-muted-foreground">Recorded paid</span>
                  <span>₹{totalPaid.toLocaleString("en-IN")}</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <IndianRupee className="h-4 w-4" />
            Fee ledger (installments)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingFees ? (
            <Skeleton className="h-32 w-full" />
          ) : installments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No fee records for this student.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Paid</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Paid at</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {installments.map((row: any, idx: number) => (
                    <TableRow key={row.id || idx}>
                      <TableCell>{idx + 1}</TableCell>
                      <TableCell>₹{Number(row.amount || 0).toLocaleString("en-IN")}</TableCell>
                      <TableCell>₹{Number(row.paidAmount || 0).toLocaleString("en-IN")}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{row.paymentStatus || "—"}</Badge>
                      </TableCell>
                      <TableCell>
                        {row.paidAt
                          ? new Date(row.paidAt).toLocaleDateString("en-IN")
                          : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Award className="h-4 w-4" />
              Marks (recent)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingMarks ? (
              <Skeleton className="h-24 w-full" />
            ) : !marks.length ? (
              <p className="text-sm text-muted-foreground">No marks entries found.</p>
            ) : (
              <div className="overflow-x-auto max-h-64 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Subject</TableHead>
                      <TableHead>Marks</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {marks.slice(0, 25).map((m: any, i: number) => (
                      <TableRow key={m.id || i}>
                        <TableCell>{m.subject?.name || "—"}</TableCell>
                        <TableCell>
                          {m.marksObtained ?? "—"} / {m.maxMarks ?? "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!results.length ? (
              <p className="text-sm text-muted-foreground">No published results for this student.</p>
            ) : (
              <ul className="text-sm space-y-1">
                {results.slice(0, 10).map((r: any, i: number) => (
                  <li key={r.id || i}>
                    {r.exam?.name || "Exam"} — {r.grade || r.status || "—"}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Homework
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingHw ? (
            <Skeleton className="h-24 w-full" />
          ) : !homeworkList.length ? (
            <p className="text-sm text-muted-foreground">No homework items returned for this student.</p>
          ) : (
            <ul className="text-sm space-y-2">
              {homeworkList.slice(0, 15).map((h: any) => (
                <li key={h.id} className="flex justify-between gap-4 border-b border-border/50 pb-2">
                  <span>{h.title || "Homework"}</span>
                  <span className="text-muted-foreground shrink-0">
                    {h.dueDate ? new Date(h.dueDate).toLocaleDateString("en-IN") : ""}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
