"use client";

import { useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useHomeworkById, useSubmitHomework } from "@/lib/hooks/use-homework";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Upload, Send, FileText, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { useFileUpload } from "@/lib/hooks/use-file-upload";

export default function SubmitHomeworkPage() {
  const router = useRouter();
  const params = useParams();
  const homeworkId = params.id as string;

  const { data, isLoading } = useHomeworkById(homeworkId);
  const submitHomework = useSubmitHomework();
  const uploadFile = useFileUpload();

  const [submissionText, setSubmissionText] = useState("");
  const [attachments, setAttachments] = useState<string[]>([]);
  const [mcqAnswers, setMcqAnswers] = useState<number[]>([]);
  const [uploading, setUploading] = useState(false);

  const homework = data?.data;

  const handleFileUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      setUploading(true);
      try {
        const result = await uploadFile.mutateAsync(file);
        setAttachments((prev) => [...prev, result.data.id]);
        toast.success("File uploaded successfully");
      } catch (error: any) {
        toast.error(error?.message || "Failed to upload file");
      } finally {
        setUploading(false);
      }
    },
    [uploadFile]
  );

  const handleMCQAnswer = (questionIndex: number, answerIndex: number) => {
    setMcqAnswers((prev) => {
      const newAnswers = [...prev];
      newAnswers[questionIndex] = answerIndex;
      return newAnswers;
    });
  };

  const handleSubmit = useCallback(async () => {
    if (homework?.isMCQ) {
      if (mcqAnswers.length !== homework.mcqQuestions?.length) {
        toast.error("Please answer all MCQ questions");
        return;
      }
    } else {
      if (!submissionText.trim() && attachments.length === 0) {
        toast.error("Please provide submission text or upload files");
        return;
      }
    }

    try {
      await submitHomework.mutateAsync({
        homeworkId,
        ...(homework?.isMCQ
          ? { answers: mcqAnswers }
          : { submissionText, attachments }),
      });
      toast.success("Homework submitted successfully");
      router.push("/student/homework");
    } catch (error: any) {
      toast.error(error?.message || "Failed to submit homework");
    }
  }, [homework, homeworkId, mcqAnswers, submissionText, attachments, submitHomework, router]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!homework) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Homework not found</p>
      </div>
    );
  }

  const isOverdue = new Date(homework.dueDate) < new Date();

  return (
    <div className="space-y-6 pb-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{homework.title}</h1>
          <p className="text-sm text-gray-500 mt-1">
            Due: {format(new Date(homework.dueDate), "MMM dd, yyyy 'at' h:mm a")}
            {isOverdue && (
              <Badge variant="destructive" className="ml-2">
                Overdue
              </Badge>
            )}
          </p>
        </div>
      </div>

      {/* Homework Details */}
      <Card>
        <CardHeader>
          <CardTitle>Assignment Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-gray-600">Description</Label>
              <p className="mt-1 text-gray-900 whitespace-pre-wrap">{homework.description}</p>
            </div>
            {homework.subject && (
              <div>
                <Label className="text-sm font-medium text-gray-600">Subject</Label>
                <p className="mt-1">{homework.subject.name}</p>
              </div>
            )}
            {homework.isMCQ && (
              <div>
                <Badge className="bg-blue-500 hover:bg-blue-600">MCQ Assignment</Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Submission Form */}
      <Card>
        <CardHeader>
          <CardTitle>Your Submission</CardTitle>
        </CardHeader>
        <CardContent>
          {homework.isMCQ ? (
            <div className="space-y-6">
              {homework.mcqQuestions?.map((question: any, qIndex: number) => (
                <div key={qIndex} className="space-y-3 p-4 border rounded-lg">
                  <div className="flex items-start gap-2">
                    <span className="font-semibold text-gray-700">{qIndex + 1}.</span>
                    <p className="flex-1">{question.question}</p>
                    <span className="text-sm text-gray-500">({question.marks} marks)</span>
                  </div>
                  <div className="space-y-2 ml-6">
                    {question.options.map((option: string, oIndex: number) => (
                      <label
                        key={oIndex}
                        className="flex items-center gap-2 p-2 rounded hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="radio"
                          name={`question-${qIndex}`}
                          checked={mcqAnswers[qIndex] === oIndex}
                          onChange={() => handleMCQAnswer(qIndex, oIndex)}
                          className="w-4 h-4"
                        />
                        <span>{option}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Submission Text</Label>
                <Textarea
                  value={submissionText}
                  onChange={(e) => setSubmissionText(e.target.value)}
                  placeholder="Enter your submission here..."
                  rows={10}
                />
              </div>
              <div className="space-y-2">
                <Label>Attachments</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    onChange={handleFileUpload}
                    disabled={uploading}
                    className="flex-1"
                  />
                  {uploading && <span className="text-sm text-gray-500">Uploading...</span>}
                </div>
                {attachments.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {attachments.map((fileId, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm text-gray-600">
                        <FileText className="h-4 w-4" />
                        <span>File {index + 1} uploaded</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="flex items-center justify-end gap-2">
        <Button variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={submitHomework.isPending}>
          <Send className="h-4 w-4 mr-2" />
          {submitHomework.isPending ? "Submitting..." : "Submit Homework"}
        </Button>
      </div>
    </div>
  );
}

