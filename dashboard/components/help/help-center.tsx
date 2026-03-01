"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FormCard } from "@/components/forms/form-card";
import { HelpCircle, MessageSquare, BookOpen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { post } from "@/lib/api/client";

const helpQuerySchema = z.object({
  subject: z.string().min(1, "Subject is required"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

type HelpQueryFormData = z.infer<typeof helpQuerySchema>;

export function HelpCenter() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<HelpQueryFormData>({
    resolver: zodResolver(helpQuerySchema),
    defaultValues: {
      subject: "",
      message: "",
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setIsSubmitting(true);
    try {
      await post("/admin/query", { request: values });
      form.reset();
      toast({
        title: "Success",
        description: "Your query has been submitted successfully!",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Failed to submit query. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  });

  const faqs = [
    {
      question: "How do I add a new student?",
      answer:
        "Navigate to Students > Add New Student, fill in the required information, and click Save.",
    },
    {
      question: "How do I generate fee receipts?",
      answer:
        "Go to Finance > Fees, select a student, and click on Generate Receipt.",
    },
    {
      question: "How do I manage classes?",
      answer:
        "Navigate to Classes, click Add New Class, and configure the class details including divisions.",
    },
    {
      question: "How do I update school settings?",
      answer:
        "Go to Settings, update the school logo, fee configuration, or change your password.",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Help Center</h1>
        <p className="text-gray-600 mt-2">
          Find answers to common questions or submit a query
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="space-y-4">
          <div className="p-4 border rounded-lg">
            <BookOpen className="w-6 h-6 text-primary mb-2" />
            <h3 className="font-semibold">Documentation</h3>
            <p className="text-sm text-gray-600">
              Browse our comprehensive documentation
            </p>
          </div>
          <div className="p-4 border rounded-lg">
            <MessageSquare className="w-6 h-6 text-primary mb-2" />
            <h3 className="font-semibold">Support</h3>
            <p className="text-sm text-gray-600">
              Contact our support team for assistance
            </p>
          </div>
        </div>

        {/* FAQ & Query Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* FAQs */}
          <FormCard title="Frequently Asked Questions">
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <div key={index} className="border-b pb-4 last:border-0">
                  <div className="flex items-start gap-2 mb-2">
                    <HelpCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <h4 className="font-semibold">{faq.question}</h4>
                  </div>
                  <p className="text-sm text-gray-600 ml-7">{faq.answer}</p>
                </div>
              ))}
            </div>
          </FormCard>

          {/* Submit Query */}
          <FormCard title="Submit a Query">
            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  placeholder="What do you need help with?"
                  {...form.register("subject")}
                  error={form.formState.errors.subject?.message}
                />
              </div>

              <div>
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  placeholder="Describe your issue or question..."
                  rows={6}
                  {...form.register("message")}
                  error={form.formState.errors.message?.message}
                />
              </div>

              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? "Submitting..." : "Submit Query"}
              </Button>
            </form>
          </FormCard>
        </div>
      </div>
    </div>
  );
}

