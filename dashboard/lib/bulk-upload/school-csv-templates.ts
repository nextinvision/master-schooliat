/**
 * Bulk CSV formats for POST /users/teachers/bulk and POST /users/students/bulk.
 * Backend csv.util parseCSV normalizes headers: lowercased, spaces removed
 * (e.g. "First Name" → "firstname", "PanCardNumber" → "pancardnumber").
 * Column order here must match keys the backend reads on each row object.
 */

function escapeCsvCell(value: string): string {
  const s = String(value ?? "");
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

/** Build CSV text from header row + optional data rows (same length as headers). */
export function buildCsvDocument(headers: string[], dataRows: string[][]): string {
  const lines = [
    headers.map(escapeCsvCell).join(","),
    ...dataRows.map((row) =>
      headers.map((_, i) => escapeCsvCell(row[i] ?? "")).join(","),
    ),
  ];
  return lines.join("\n");
}

export function triggerCsvDownload(filename: string, csvContent: string): void {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/** Matches user.router.js POST /users/teachers/bulk (row.firstname, row.email, …). */
export const TEACHER_BULK_CSV = {
  filename: "teachers_upload_sample.csv",
  /** Column headers (parseCSV keys: firstname, lastname, email, …) */
  headers: [
    "FirstName",
    "LastName",
    "Email",
    "Contact",
    "Gender",
    "DateOfBirth",
    "Designation",
    "HighestQualification",
    "University",
    "YearOfPassing",
    "Grade",
    "AadhaarId",
    "PanCardNumber",
    "Subjects",
  ],
  /** One example row; users replace with real data. Date format YYYY-MM-DD. */
  sampleRow: [
    "Jane",
    "Smith",
    "jane.smith@example.com",
    "9876543210",
    "FEMALE",
    "1990-05-15",
    "Senior Teacher",
    "M.Sc",
    "Example University",
    "2012",
    "85",
    "",
    "",
    "Mathematics, Science",
  ],
} as const;

/** Matches user.router.js POST /users/students/bulk (row.classname, …). */
export const STUDENT_BULK_CSV = {
  filename: "students_upload_sample.csv",
  headers: [
    "FirstName",
    "LastName",
    "Email",
    "Contact",
    "Gender",
    "DateOfBirth",
    "FatherName",
    "MotherName",
    "FatherContact",
    "MotherContact",
    "ClassName",
    "ApaarId",
    "RollNumber",
  ],
  /** ClassName must match an existing class: "Grade Division" or "Grade-Division" (e.g. 10 A or 10-A). */
  sampleRow: [
    "Ravi",
    "Kumar",
    "ravi.kumar@example.com",
    "9123456789",
    "MALE",
    "2015-01-20",
    "Father Name",
    "Mother Name",
    "9988776655",
    "8877665544",
    "9 A",
    "",
    "1",
  ],
} as const;

export function getTeacherBulkUploadCsv(): string {
  return buildCsvDocument([...TEACHER_BULK_CSV.headers], [[...TEACHER_BULK_CSV.sampleRow]]);
}

export function getStudentBulkUploadCsv(): string {
  return buildCsvDocument([...STUDENT_BULK_CSV.headers], [[...STUDENT_BULK_CSV.sampleRow]]);
}
