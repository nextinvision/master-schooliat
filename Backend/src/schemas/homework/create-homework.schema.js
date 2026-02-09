import { z } from "zod";

const mcqQuestionSchema = z.object({
  question: z.string().min(1, "Question is required"),
  options: z.array(z.string().min(1, "Option cannot be empty")).min(2, "At least 2 options required").max(10, "Maximum 10 options allowed"),
  correctAnswer: z.number().int().min(0, "Invalid answer index"),
  marks: z.number().int().min(1, "Marks must be at least 1").optional().default(1),
});

const createHomeworkSchema = z
  .object({
    request: z
      .object({
        title: z.string().min(1, "Title is required").max(200, "Title too long"),
        description: z.string().min(1, "Description is required"),
        classIds: z.array(z.string().uuid("Invalid class ID")).min(1, "At least one class is required"),
        subjectId: z.string().uuid("Invalid subject ID"),
        dueDate: z.string().datetime().or(z.date()),
        isMCQ: z.boolean().optional().default(false),
        attachments: z.array(z.string().uuid("Invalid file ID")).optional().default([]),
        mcqQuestions: z.array(mcqQuestionSchema).optional().default([]),
      })
      .refine((data) => {
        if (data.isMCQ && (!data.mcqQuestions || data.mcqQuestions.length === 0)) {
          return false;
        }
        return true;
      }, {
        message: "MCQ homework must have at least one question",
        path: ["mcqQuestions"],
      })
      .refine((data) => {
        if (data.mcqQuestions) {
          return data.mcqQuestions.every((q, index) => {
            if (q.correctAnswer < 0 || q.correctAnswer >= q.options.length) {
              return false;
            }
            return true;
          });
        }
        return true;
      }, {
        message: "Correct answer index must be within options range",
        path: ["mcqQuestions"],
      })
      .strip(),
    query: z.object({}).strip(),
    params: z.object({}).strip(),
  })
  .strip();

export default createHomeworkSchema;

