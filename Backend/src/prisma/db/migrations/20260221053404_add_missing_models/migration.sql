-- CreateEnum
CREATE TYPE "attendance_status" AS ENUM ('PRESENT', 'ABSENT', 'LATE', 'HALF_DAY');

-- CreateEnum
CREATE TYPE "submission_status" AS ENUM ('PENDING', 'SUBMITTED', 'GRADED', 'OVERDUE');

-- CreateEnum
CREATE TYPE "leave_status" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "conversation_type" AS ENUM ('DIRECT', 'GROUP', 'CLASS', 'SCHOOL');

-- CreateEnum
CREATE TYPE "notification_type" AS ENUM ('ATTENDANCE', 'HOMEWORK', 'EXAM', 'FEE', 'LEAVE', 'ANNOUNCEMENT', 'GENERAL', 'LIBRARY', 'CIRCULAR');

-- CreateEnum
CREATE TYPE "library_issue_status" AS ENUM ('ISSUED', 'RETURNED', 'OVERDUE');

-- CreateEnum
CREATE TYPE "gallery_privacy" AS ENUM ('PUBLIC', 'PRIVATE', 'SCHOOL_ONLY');

-- CreateEnum
CREATE TYPE "circular_status" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "chatbot_intent" AS ENUM ('GENERAL_QUERY', 'ATTENDANCE_QUERY', 'HOMEWORK_QUERY', 'EXAM_QUERY', 'FEE_QUERY', 'TIMETABLE_QUERY');

-- CreateEnum
CREATE TYPE "tc_status" AS ENUM ('ISSUED', 'COLLECTED', 'CANCELLED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "permission" ADD VALUE 'MARK_ATTENDANCE';
ALTER TYPE "permission" ADD VALUE 'GET_ATTENDANCE';
ALTER TYPE "permission" ADD VALUE 'EXPORT_ATTENDANCE';
ALTER TYPE "permission" ADD VALUE 'CREATE_TIMETABLE';
ALTER TYPE "permission" ADD VALUE 'GET_TIMETABLE';
ALTER TYPE "permission" ADD VALUE 'EDIT_TIMETABLE';
ALTER TYPE "permission" ADD VALUE 'DELETE_TIMETABLE';
ALTER TYPE "permission" ADD VALUE 'CREATE_HOMEWORK';
ALTER TYPE "permission" ADD VALUE 'GET_HOMEWORK';
ALTER TYPE "permission" ADD VALUE 'EDIT_HOMEWORK';
ALTER TYPE "permission" ADD VALUE 'DELETE_HOMEWORK';
ALTER TYPE "permission" ADD VALUE 'SUBMIT_HOMEWORK';
ALTER TYPE "permission" ADD VALUE 'GRADE_HOMEWORK';
ALTER TYPE "permission" ADD VALUE 'ENTER_MARKS';
ALTER TYPE "permission" ADD VALUE 'GET_MARKS';
ALTER TYPE "permission" ADD VALUE 'EDIT_MARKS';
ALTER TYPE "permission" ADD VALUE 'PUBLISH_RESULTS';
ALTER TYPE "permission" ADD VALUE 'GET_RESULTS';
ALTER TYPE "permission" ADD VALUE 'CREATE_LEAVE_REQUEST';
ALTER TYPE "permission" ADD VALUE 'GET_LEAVE_REQUESTS';
ALTER TYPE "permission" ADD VALUE 'APPROVE_LEAVE';
ALTER TYPE "permission" ADD VALUE 'REJECT_LEAVE';
ALTER TYPE "permission" ADD VALUE 'SEND_MESSAGE';
ALTER TYPE "permission" ADD VALUE 'GET_MESSAGES';
ALTER TYPE "permission" ADD VALUE 'CREATE_ANNOUNCEMENT';
ALTER TYPE "permission" ADD VALUE 'SEND_NOTIFICATION';
ALTER TYPE "permission" ADD VALUE 'CREATE_NOTE';
ALTER TYPE "permission" ADD VALUE 'EDIT_NOTE';
ALTER TYPE "permission" ADD VALUE 'GET_NOTES';
ALTER TYPE "permission" ADD VALUE 'DELETE_NOTE';
ALTER TYPE "permission" ADD VALUE 'CREATE_SYLLABUS';
ALTER TYPE "permission" ADD VALUE 'EDIT_SYLLABUS';
ALTER TYPE "permission" ADD VALUE 'GET_SYLLABUS';
ALTER TYPE "permission" ADD VALUE 'DELETE_SYLLABUS';
ALTER TYPE "permission" ADD VALUE 'CREATE_CIRCULAR';
ALTER TYPE "permission" ADD VALUE 'EDIT_CIRCULAR';
ALTER TYPE "permission" ADD VALUE 'PUBLISH_CIRCULAR';
ALTER TYPE "permission" ADD VALUE 'GET_CIRCULARS';
ALTER TYPE "permission" ADD VALUE 'DELETE_CIRCULAR';
ALTER TYPE "permission" ADD VALUE 'CREATE_LIBRARY_BOOK';
ALTER TYPE "permission" ADD VALUE 'EDIT_LIBRARY_BOOK';
ALTER TYPE "permission" ADD VALUE 'GET_LIBRARY_BOOKS';
ALTER TYPE "permission" ADD VALUE 'ISSUE_LIBRARY_BOOK';
ALTER TYPE "permission" ADD VALUE 'RETURN_LIBRARY_BOOK';
ALTER TYPE "permission" ADD VALUE 'RESERVE_LIBRARY_BOOK';
ALTER TYPE "permission" ADD VALUE 'GET_LIBRARY_HISTORY';
ALTER TYPE "permission" ADD VALUE 'GET_ATTENDANCE_REPORTS';
ALTER TYPE "permission" ADD VALUE 'GET_FEE_ANALYTICS';
ALTER TYPE "permission" ADD VALUE 'GET_ACADEMIC_REPORTS';
ALTER TYPE "permission" ADD VALUE 'GET_SALARY_REPORTS';
ALTER TYPE "permission" ADD VALUE 'USE_CHATBOT';
ALTER TYPE "permission" ADD VALUE 'GET_CHATBOT_HISTORY';
ALTER TYPE "permission" ADD VALUE 'MANAGE_FAQ';
ALTER TYPE "permission" ADD VALUE 'MANAGE_ROUTES';
ALTER TYPE "permission" ADD VALUE 'GET_ROUTES';
ALTER TYPE "permission" ADD VALUE 'ASSIGN_STUDENTS_TO_ROUTE';
ALTER TYPE "permission" ADD VALUE 'GET_CHILDREN';
ALTER TYPE "permission" ADD VALUE 'GET_CHILD_DATA';
ALTER TYPE "permission" ADD VALUE 'GET_CONSOLIDATED_DASHBOARD';
ALTER TYPE "permission" ADD VALUE 'VIEW_AUDIT_LOGS';
ALTER TYPE "permission" ADD VALUE 'REQUEST_DELETION_OTP';

-- CreateTable
CREATE TABLE "attendance_periods" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "start_time" TEXT NOT NULL,
    "end_time" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "created_by" TEXT NOT NULL,
    "updated_by" TEXT,
    "deleted_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "attendance_periods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendances" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "class_id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "status" "attendance_status" NOT NULL,
    "period_id" TEXT,
    "late_arrival_time" TIMESTAMP(3),
    "absence_reason" TEXT,
    "marked_by" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "created_by" TEXT NOT NULL,
    "updated_by" TEXT,
    "deleted_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "attendances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "timetables" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "class_id" TEXT,
    "school_id" TEXT NOT NULL,
    "effective_from" TIMESTAMP(3) NOT NULL,
    "effective_till" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" TEXT NOT NULL,
    "updated_by" TEXT,
    "deleted_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "timetables_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "timetable_slots" (
    "id" TEXT NOT NULL,
    "timetable_id" TEXT NOT NULL,
    "day_of_week" INTEGER NOT NULL,
    "period_number" INTEGER NOT NULL,
    "subject_id" TEXT NOT NULL,
    "teacher_id" TEXT NOT NULL,
    "room" TEXT,
    "start_time" TEXT NOT NULL,
    "end_time" TEXT NOT NULL,
    "created_by" TEXT NOT NULL,
    "updated_by" TEXT,
    "deleted_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "timetable_slots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "homeworks" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "class_ids" TEXT[],
    "subject_id" TEXT NOT NULL,
    "teacher_id" TEXT NOT NULL,
    "due_date" TIMESTAMP(3) NOT NULL,
    "is_mcq" BOOLEAN NOT NULL DEFAULT false,
    "attachments" TEXT[],
    "school_id" TEXT NOT NULL,
    "created_by" TEXT NOT NULL,
    "updated_by" TEXT,
    "deleted_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "homeworks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "homework_submissions" (
    "id" TEXT NOT NULL,
    "homework_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "submitted_at" TIMESTAMP(3),
    "status" "submission_status" NOT NULL,
    "files" TEXT[],
    "feedback" TEXT,
    "grade" TEXT,
    "marks_obtained" INTEGER,
    "total_marks" INTEGER,
    "created_by" TEXT NOT NULL,
    "updated_by" TEXT,
    "deleted_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "homework_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mcq_questions" (
    "id" TEXT NOT NULL,
    "homework_id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "options" TEXT[],
    "correct_answer" INTEGER NOT NULL,
    "marks" INTEGER NOT NULL,
    "created_by" TEXT NOT NULL,
    "updated_by" TEXT,
    "deleted_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "mcq_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mcq_answers" (
    "id" TEXT NOT NULL,
    "submission_id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "selected_answer" INTEGER NOT NULL,
    "is_correct" BOOLEAN NOT NULL,
    "marks_obtained" INTEGER NOT NULL,
    "created_by" TEXT NOT NULL,
    "updated_by" TEXT,
    "deleted_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "mcq_answers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leave_types" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "max_leaves" INTEGER,
    "school_id" TEXT NOT NULL,
    "created_by" TEXT NOT NULL,
    "updated_by" TEXT,
    "deleted_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "leave_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leave_requests" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "leave_type_id" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "leave_status" NOT NULL DEFAULT 'PENDING',
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "rejection_reason" TEXT,
    "school_id" TEXT NOT NULL,
    "created_by" TEXT NOT NULL,
    "updated_by" TEXT,
    "deleted_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "leave_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leave_balances" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "leave_type_id" TEXT NOT NULL,
    "total_leaves" INTEGER NOT NULL,
    "used_leaves" INTEGER NOT NULL DEFAULT 0,
    "remaining_leaves" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "school_id" TEXT NOT NULL,
    "created_by" TEXT NOT NULL,
    "updated_by" TEXT,
    "deleted_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "leave_balances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marks" (
    "id" TEXT NOT NULL,
    "exam_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "subject_id" TEXT NOT NULL,
    "class_id" TEXT NOT NULL,
    "marks_obtained" DECIMAL(10,2) NOT NULL,
    "max_marks" DECIMAL(10,2) NOT NULL,
    "percentage" DECIMAL(5,2) NOT NULL,
    "grade" TEXT,
    "school_id" TEXT NOT NULL,
    "created_by" TEXT NOT NULL,
    "updated_by" TEXT,
    "deleted_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "marks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "results" (
    "id" TEXT NOT NULL,
    "exam_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "class_id" TEXT NOT NULL,
    "total_marks" DECIMAL(10,2) NOT NULL,
    "max_total_marks" DECIMAL(10,2) NOT NULL,
    "percentage" DECIMAL(5,2) NOT NULL,
    "cgpa" DECIMAL(4,2),
    "grade" TEXT NOT NULL,
    "rank" INTEGER,
    "is_pass" BOOLEAN NOT NULL,
    "published_at" TIMESTAMP(3),
    "published_by" TEXT,
    "school_id" TEXT NOT NULL,
    "created_by" TEXT NOT NULL,
    "updated_by" TEXT,
    "deleted_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversations" (
    "id" TEXT NOT NULL,
    "participants" TEXT[],
    "type" "conversation_type" NOT NULL,
    "title" TEXT,
    "school_id" TEXT,
    "created_by" TEXT NOT NULL,
    "updated_by" TEXT,
    "deleted_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "sender_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "attachments" TEXT[],
    "readBy" TEXT[],
    "sent_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT NOT NULL,
    "updated_by" TEXT,
    "deleted_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" "notification_type" NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "action_url" TEXT,
    "school_id" TEXT,
    "created_by" TEXT NOT NULL,
    "updated_by" TEXT,
    "deleted_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parent_child_links" (
    "id" TEXT NOT NULL,
    "parent_id" TEXT NOT NULL,
    "child_id" TEXT NOT NULL,
    "relationship" TEXT NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "created_by" TEXT NOT NULL,
    "updated_by" TEXT,
    "deleted_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "parent_child_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "ip_address" TEXT NOT NULL,
    "user_agent" TEXT,
    "changes" JSONB,
    "result" TEXT NOT NULL,
    "error_message" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "otps" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "otp" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "is_used" BOOLEAN NOT NULL DEFAULT false,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "used_at" TIMESTAMP(3),

    CONSTRAINT "otps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_reset_tokens" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "is_used" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "used_at" TIMESTAMP(3),

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transfer_certificates" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "tc_number" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "transfer_date" TIMESTAMP(3) NOT NULL,
    "destination_school" TEXT,
    "remarks" TEXT,
    "status" "tc_status" NOT NULL DEFAULT 'ISSUED',
    "created_by" TEXT NOT NULL,
    "updated_by" TEXT,
    "deleted_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "transfer_certificates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "emergency_contacts" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "relationship" TEXT NOT NULL,
    "contact" TEXT NOT NULL,
    "alternate_contact" TEXT,
    "address" TEXT,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "created_by" TEXT NOT NULL,
    "updated_by" TEXT,
    "deleted_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "emergency_contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "library_books" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "isbn" TEXT,
    "publisher" TEXT,
    "category" TEXT,
    "description" TEXT,
    "total_copies" INTEGER NOT NULL DEFAULT 1,
    "available_copies" INTEGER NOT NULL DEFAULT 1,
    "location" TEXT,
    "price" DECIMAL(10,2),
    "language" TEXT NOT NULL DEFAULT 'English',
    "published_year" INTEGER,
    "school_id" TEXT NOT NULL,
    "created_by" TEXT NOT NULL,
    "updated_by" TEXT,
    "deleted_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "library_books_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "library_issues" (
    "id" TEXT NOT NULL,
    "book_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "issued_date" TIMESTAMP(3) NOT NULL,
    "due_date" TIMESTAMP(3) NOT NULL,
    "return_date" TIMESTAMP(3),
    "status" "library_issue_status" NOT NULL,
    "fine_amount" DECIMAL(10,2),
    "remarks" TEXT,
    "school_id" TEXT NOT NULL,
    "created_by" TEXT NOT NULL,
    "updated_by" TEXT,
    "deleted_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "library_issues_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "library_reservations" (
    "id" TEXT NOT NULL,
    "book_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "school_id" TEXT NOT NULL,
    "created_by" TEXT NOT NULL,
    "updated_by" TEXT,
    "deleted_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "library_reservations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notes" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "subject_id" TEXT NOT NULL,
    "class_id" TEXT,
    "chapter" TEXT,
    "topic" TEXT,
    "file_id" TEXT,
    "school_id" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" TEXT NOT NULL,
    "updated_by" TEXT,
    "deleted_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "syllabi" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "subject_id" TEXT NOT NULL,
    "class_id" TEXT NOT NULL,
    "academic_year" TEXT NOT NULL,
    "chapters" JSONB,
    "file_id" TEXT,
    "school_id" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" TEXT NOT NULL,
    "updated_by" TEXT,
    "deleted_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "syllabi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "galleries" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "event_id" TEXT,
    "privacy" "gallery_privacy" NOT NULL DEFAULT 'PUBLIC',
    "class_id" TEXT,
    "school_id" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" TEXT NOT NULL,
    "updated_by" TEXT,
    "deleted_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "galleries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gallery_images" (
    "id" TEXT NOT NULL,
    "gallery_id" TEXT NOT NULL,
    "file_id" TEXT NOT NULL,
    "caption" TEXT,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "school_id" TEXT NOT NULL,
    "created_by" TEXT NOT NULL,
    "updated_by" TEXT,
    "deleted_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "gallery_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "circulars" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "status" "circular_status" NOT NULL DEFAULT 'DRAFT',
    "target_roles" JSONB NOT NULL DEFAULT '[]',
    "target_user_ids" JSONB NOT NULL DEFAULT '[]',
    "class_ids" JSONB NOT NULL DEFAULT '[]',
    "attachments" JSONB NOT NULL DEFAULT '[]',
    "expires_at" TIMESTAMP(3),
    "published_at" TIMESTAMP(3),
    "school_id" TEXT NOT NULL,
    "created_by" TEXT NOT NULL,
    "updated_by" TEXT,
    "deleted_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "circulars_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "faqs" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "category" TEXT,
    "keywords" JSONB DEFAULT '[]',
    "school_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "created_by" TEXT NOT NULL,
    "updated_by" TEXT,
    "deleted_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "faqs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chatbot_conversations" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "intent" "chatbot_intent",
    "context" JSONB,
    "school_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chatbot_conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chatbot_messages" (
    "id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chatbot_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "routes" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "transport_id" TEXT NOT NULL,
    "start_point" TEXT NOT NULL,
    "end_point" TEXT NOT NULL,
    "distance" DECIMAL(10,2),
    "estimated_time" INTEGER,
    "school_id" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" TEXT NOT NULL,
    "updated_by" TEXT,
    "deleted_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "routes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "route_stops" (
    "id" TEXT NOT NULL,
    "route_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "latitude" DECIMAL(10,7),
    "longitude" DECIMAL(10,7),
    "sequence" INTEGER NOT NULL,
    "arrival_time" TEXT,
    "school_id" TEXT NOT NULL,
    "created_by" TEXT NOT NULL,
    "updated_by" TEXT,
    "deleted_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "route_stops_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_maintenance" (
    "id" TEXT NOT NULL,
    "transport_id" TEXT NOT NULL,
    "maintenance_type" TEXT NOT NULL,
    "description" TEXT,
    "cost" DECIMAL(10,2),
    "maintenance_date" TIMESTAMP(3) NOT NULL,
    "next_maintenance_date" TIMESTAMP(3),
    "serviceProvider" TEXT,
    "odometer_reading" INTEGER,
    "school_id" TEXT NOT NULL,
    "created_by" TEXT NOT NULL,
    "updated_by" TEXT,
    "deleted_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "vehicle_maintenance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "attendance_periods_school_id_deleted_at_idx" ON "attendance_periods"("school_id", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "attendance_periods_name_school_id_key" ON "attendance_periods"("name", "school_id");

-- CreateIndex
CREATE INDEX "attendance_student_id_date_deleted_at_idx" ON "attendances"("student_id", "date", "deleted_at");

-- CreateIndex
CREATE INDEX "attendance_class_id_date_deleted_at_idx" ON "attendances"("class_id", "date", "deleted_at");

-- CreateIndex
CREATE INDEX "attendance_school_id_date_deleted_at_idx" ON "attendances"("school_id", "date", "deleted_at");

-- CreateIndex
CREATE INDEX "attendance_marked_by_date_deleted_at_idx" ON "attendances"("marked_by", "date", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "attendances_student_id_class_id_date_period_id_key" ON "attendances"("student_id", "class_id", "date", "period_id");

-- CreateIndex
CREATE INDEX "timetables_school_class_deleted_at_idx" ON "timetables"("school_id", "class_id", "deleted_at");

-- CreateIndex
CREATE INDEX "timetables_school_active_deleted_at_idx" ON "timetables"("school_id", "is_active", "deleted_at");

-- CreateIndex
CREATE INDEX "timetable_slots_timetable_day_deleted_at_idx" ON "timetable_slots"("timetable_id", "day_of_week", "deleted_at");

-- CreateIndex
CREATE INDEX "timetable_slots_teacher_day_deleted_at_idx" ON "timetable_slots"("teacher_id", "day_of_week", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "timetable_slots_timetable_id_day_of_week_period_number_key" ON "timetable_slots"("timetable_id", "day_of_week", "period_number");

-- CreateIndex
CREATE INDEX "homeworks_school_subject_deleted_at_idx" ON "homeworks"("school_id", "subject_id", "deleted_at");

-- CreateIndex
CREATE INDEX "homeworks_teacher_due_date_deleted_at_idx" ON "homeworks"("teacher_id", "due_date", "deleted_at");

-- CreateIndex
CREATE INDEX "homeworks_school_due_date_deleted_at_idx" ON "homeworks"("school_id", "due_date", "deleted_at");

-- CreateIndex
CREATE INDEX "homework_submissions_homework_status_deleted_at_idx" ON "homework_submissions"("homework_id", "status", "deleted_at");

-- CreateIndex
CREATE INDEX "homework_submissions_student_deleted_at_idx" ON "homework_submissions"("student_id", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "homework_submissions_homework_id_student_id_key" ON "homework_submissions"("homework_id", "student_id");

-- CreateIndex
CREATE INDEX "mcq_questions_homework_deleted_at_idx" ON "mcq_questions"("homework_id", "deleted_at");

-- CreateIndex
CREATE INDEX "mcq_answers_submission_deleted_at_idx" ON "mcq_answers"("submission_id", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "mcq_answers_submission_id_question_id_key" ON "mcq_answers"("submission_id", "question_id");

-- CreateIndex
CREATE INDEX "leave_types_school_deleted_at_idx" ON "leave_types"("school_id", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "leave_types_name_school_id_key" ON "leave_types"("name", "school_id");

-- CreateIndex
CREATE INDEX "leave_requests_user_status_deleted_at_idx" ON "leave_requests"("user_id", "status", "deleted_at");

-- CreateIndex
CREATE INDEX "leave_requests_school_status_deleted_at_idx" ON "leave_requests"("school_id", "status", "deleted_at");

-- CreateIndex
CREATE INDEX "leave_requests_approved_by_deleted_at_idx" ON "leave_requests"("approved_by", "deleted_at");

-- CreateIndex
CREATE INDEX "leave_balances_user_year_deleted_at_idx" ON "leave_balances"("user_id", "year", "deleted_at");

-- CreateIndex
CREATE INDEX "leave_balances_school_deleted_at_idx" ON "leave_balances"("school_id", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "leave_balances_user_id_leave_type_id_year_key" ON "leave_balances"("user_id", "leave_type_id", "year");

-- CreateIndex
CREATE INDEX "marks_exam_student_deleted_at_idx" ON "marks"("exam_id", "student_id", "deleted_at");

-- CreateIndex
CREATE INDEX "marks_student_deleted_at_idx" ON "marks"("student_id", "deleted_at");

-- CreateIndex
CREATE INDEX "marks_school_exam_deleted_at_idx" ON "marks"("school_id", "exam_id", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "marks_exam_id_student_id_subject_id_key" ON "marks"("exam_id", "student_id", "subject_id");

-- CreateIndex
CREATE INDEX "results_exam_pass_deleted_at_idx" ON "results"("exam_id", "is_pass", "deleted_at");

-- CreateIndex
CREATE INDEX "results_student_deleted_at_idx" ON "results"("student_id", "deleted_at");

-- CreateIndex
CREATE INDEX "results_school_exam_deleted_at_idx" ON "results"("school_id", "exam_id", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "results_exam_id_student_id_key" ON "results"("exam_id", "student_id");

-- CreateIndex
CREATE INDEX "conversations_school_deleted_at_idx" ON "conversations"("school_id", "deleted_at");

-- CreateIndex
CREATE INDEX "messages_conversation_sent_deleted_at_idx" ON "messages"("conversation_id", "sent_at", "deleted_at");

-- CreateIndex
CREATE INDEX "messages_sender_deleted_at_idx" ON "messages"("sender_id", "deleted_at");

-- CreateIndex
CREATE INDEX "notifications_user_read_deleted_at_idx" ON "notifications"("user_id", "is_read", "deleted_at");

-- CreateIndex
CREATE INDEX "notifications_school_deleted_at_idx" ON "notifications"("school_id", "deleted_at");

-- CreateIndex
CREATE INDEX "notifications_user_created_deleted_at_idx" ON "notifications"("user_id", "created_at", "deleted_at");

-- CreateIndex
CREATE INDEX "parent_child_links_parent_deleted_at_idx" ON "parent_child_links"("parent_id", "deleted_at");

-- CreateIndex
CREATE INDEX "parent_child_links_child_deleted_at_idx" ON "parent_child_links"("child_id", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "parent_child_links_parent_id_child_id_key" ON "parent_child_links"("parent_id", "child_id");

-- CreateIndex
CREATE INDEX "audit_logs_user_timestamp_idx" ON "audit_logs"("user_id", "timestamp");

-- CreateIndex
CREATE INDEX "audit_logs_entity_timestamp_idx" ON "audit_logs"("entity_type", "entity_id", "timestamp");

-- CreateIndex
CREATE INDEX "audit_logs_action_timestamp_idx" ON "audit_logs"("action", "timestamp");

-- CreateIndex
CREATE INDEX "otps_email_purpose_status_expires_idx" ON "otps"("email", "purpose", "is_used", "expires_at");

-- CreateIndex
CREATE INDEX "otps_email_expires_idx" ON "otps"("email", "expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_tokens_user_id_key" ON "password_reset_tokens"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_tokens_token_key" ON "password_reset_tokens"("token");

-- CreateIndex
CREATE INDEX "password_reset_tokens_token_expires_used_idx" ON "password_reset_tokens"("token", "expires_at", "is_used");

-- CreateIndex
CREATE UNIQUE INDEX "transfer_certificates_tc_number_key" ON "transfer_certificates"("tc_number");

-- CreateIndex
CREATE INDEX "tcs_school_id_deleted_at_idx" ON "transfer_certificates"("school_id", "deleted_at");

-- CreateIndex
CREATE INDEX "tcs_student_id_deleted_at_idx" ON "transfer_certificates"("student_id", "deleted_at");

-- CreateIndex
CREATE INDEX "tcs_status_deleted_at_idx" ON "transfer_certificates"("status", "deleted_at");

-- CreateIndex
CREATE INDEX "emergency_contacts_student_id_deleted_at_idx" ON "emergency_contacts"("student_id", "deleted_at");

-- CreateIndex
CREATE INDEX "emergency_contacts_school_id_deleted_at_idx" ON "emergency_contacts"("school_id", "deleted_at");

-- CreateIndex
CREATE INDEX "emergency_contacts_primary_deleted_at_idx" ON "emergency_contacts"("is_primary", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "library_books_isbn_key" ON "library_books"("isbn");

-- CreateIndex
CREATE INDEX "library_books_school_id_deleted_at_idx" ON "library_books"("school_id", "deleted_at");

-- CreateIndex
CREATE INDEX "library_issues_book_id_deleted_at_idx" ON "library_issues"("book_id", "deleted_at");

-- CreateIndex
CREATE INDEX "library_issues_user_id_deleted_at_idx" ON "library_issues"("user_id", "deleted_at");

-- CreateIndex
CREATE INDEX "library_issues_school_id_deleted_at_idx" ON "library_issues"("school_id", "deleted_at");

-- CreateIndex
CREATE INDEX "library_reservations_book_active_deleted_at_idx" ON "library_reservations"("book_id", "is_active", "deleted_at");

-- CreateIndex
CREATE INDEX "library_reservations_user_id_deleted_at_idx" ON "library_reservations"("user_id", "deleted_at");

-- CreateIndex
CREATE INDEX "notes_school_id_deleted_at_idx" ON "notes"("school_id", "deleted_at");

-- CreateIndex
CREATE INDEX "notes_subject_id_deleted_at_idx" ON "notes"("subject_id", "deleted_at");

-- CreateIndex
CREATE INDEX "syllabus_school_id_deleted_at_idx" ON "syllabi"("school_id", "deleted_at");

-- CreateIndex
CREATE INDEX "galleries_school_id_deleted_at_idx" ON "galleries"("school_id", "deleted_at");

-- CreateIndex
CREATE INDEX "gallery_images_gallery_id_deleted_at_idx" ON "gallery_images"("gallery_id", "deleted_at");

-- CreateIndex
CREATE INDEX "circulars_school_status_deleted_at_idx" ON "circulars"("school_id", "status", "deleted_at");

-- CreateIndex
CREATE INDEX "faqs_school_active_deleted_at_idx" ON "faqs"("school_id", "is_active", "deleted_at");

-- CreateIndex
CREATE INDEX "chatbot_conversations_user_id_idx" ON "chatbot_conversations"("user_id");

-- CreateIndex
CREATE INDEX "chatbot_messages_conversation_id_idx" ON "chatbot_messages"("conversation_id");

-- CreateIndex
CREATE INDEX "routes_school_id_deleted_at_idx" ON "routes"("school_id", "deleted_at");

-- CreateIndex
CREATE INDEX "routes_transport_id_deleted_at_idx" ON "routes"("transport_id", "deleted_at");

-- CreateIndex
CREATE INDEX "route_stops_route_id_deleted_at_idx" ON "route_stops"("route_id", "deleted_at");

-- CreateIndex
CREATE INDEX "vehicle_maintenance_transport_id_deleted_at_idx" ON "vehicle_maintenance"("transport_id", "deleted_at");

-- CreateIndex
CREATE INDEX "exams_school_year_type_idx" ON "exams"("school_id", "year", "type");

-- AddForeignKey
ALTER TABLE "salary_structure_components" ADD CONSTRAINT "salary_structure_components_salary_structure_id_fkey" FOREIGN KEY ("salary_structure_id") REFERENCES "salary_structures"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_period_id_fkey" FOREIGN KEY ("period_id") REFERENCES "attendance_periods"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_marked_by_fkey" FOREIGN KEY ("marked_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timetables" ADD CONSTRAINT "timetables_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timetable_slots" ADD CONSTRAINT "timetable_slots_timetable_id_fkey" FOREIGN KEY ("timetable_id") REFERENCES "timetables"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timetable_slots" ADD CONSTRAINT "timetable_slots_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timetable_slots" ADD CONSTRAINT "timetable_slots_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "homeworks" ADD CONSTRAINT "homeworks_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "homeworks" ADD CONSTRAINT "homeworks_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "homework_submissions" ADD CONSTRAINT "homework_submissions_homework_id_fkey" FOREIGN KEY ("homework_id") REFERENCES "homeworks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "homework_submissions" ADD CONSTRAINT "homework_submissions_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mcq_questions" ADD CONSTRAINT "mcq_questions_homework_id_fkey" FOREIGN KEY ("homework_id") REFERENCES "homeworks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mcq_answers" ADD CONSTRAINT "mcq_answers_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "homework_submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mcq_answers" ADD CONSTRAINT "mcq_answers_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "mcq_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_leave_type_id_fkey" FOREIGN KEY ("leave_type_id") REFERENCES "leave_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_balances" ADD CONSTRAINT "leave_balances_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_balances" ADD CONSTRAINT "leave_balances_leave_type_id_fkey" FOREIGN KEY ("leave_type_id") REFERENCES "leave_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marks" ADD CONSTRAINT "marks_exam_id_fkey" FOREIGN KEY ("exam_id") REFERENCES "exams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marks" ADD CONSTRAINT "marks_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marks" ADD CONSTRAINT "marks_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marks" ADD CONSTRAINT "marks_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "results" ADD CONSTRAINT "results_exam_id_fkey" FOREIGN KEY ("exam_id") REFERENCES "exams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "results" ADD CONSTRAINT "results_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "results" ADD CONSTRAINT "results_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "results" ADD CONSTRAINT "results_published_by_fkey" FOREIGN KEY ("published_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parent_child_links" ADD CONSTRAINT "parent_child_links_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parent_child_links" ADD CONSTRAINT "parent_child_links_child_id_fkey" FOREIGN KEY ("child_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfer_certificates" ADD CONSTRAINT "transfer_certificates_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfer_certificates" ADD CONSTRAINT "transfer_certificates_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emergency_contacts" ADD CONSTRAINT "emergency_contacts_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emergency_contacts" ADD CONSTRAINT "emergency_contacts_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "library_books" ADD CONSTRAINT "library_books_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "library_issues" ADD CONSTRAINT "library_issues_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "library_books"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "library_issues" ADD CONSTRAINT "library_issues_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "library_reservations" ADD CONSTRAINT "library_reservations_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "library_books"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "library_reservations" ADD CONSTRAINT "library_reservations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "files"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "syllabi" ADD CONSTRAINT "syllabi_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "syllabi" ADD CONSTRAINT "syllabi_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "syllabi" ADD CONSTRAINT "syllabi_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "files"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "syllabi" ADD CONSTRAINT "syllabi_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "galleries" ADD CONSTRAINT "galleries_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "galleries" ADD CONSTRAINT "galleries_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "galleries" ADD CONSTRAINT "galleries_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gallery_images" ADD CONSTRAINT "gallery_images_gallery_id_fkey" FOREIGN KEY ("gallery_id") REFERENCES "galleries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gallery_images" ADD CONSTRAINT "gallery_images_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "files"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "circulars" ADD CONSTRAINT "circulars_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "faqs" ADD CONSTRAINT "faqs_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chatbot_conversations" ADD CONSTRAINT "chatbot_conversations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chatbot_messages" ADD CONSTRAINT "chatbot_messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "chatbot_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "routes" ADD CONSTRAINT "routes_transport_id_fkey" FOREIGN KEY ("transport_id") REFERENCES "transports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "routes" ADD CONSTRAINT "routes_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "route_stops" ADD CONSTRAINT "route_stops_route_id_fkey" FOREIGN KEY ("route_id") REFERENCES "routes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_maintenance" ADD CONSTRAINT "vehicle_maintenance_transport_id_fkey" FOREIGN KEY ("transport_id") REFERENCES "transports"("id") ON DELETE CASCADE ON UPDATE CASCADE;
