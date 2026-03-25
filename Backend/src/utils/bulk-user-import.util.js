/**
 * Shared normalization for POST /users/teachers/bulk and /users/students/bulk.
 * Required per row: person name + 10-digit contact. Other fields are optional with defaults.
 */

import crypto from "node:crypto";

/** Used when DateOfBirth is missing or unparsable (User.dateOfBirth is required). */
export const BULK_IMPORT_DEFAULT_DOB = new Date("2000-01-01T00:00:00.000Z");

/**
 * Unique placeholder email for bulk-created users when CSV has no email.
 * Must stay globally unique (User.email is @unique).
 */
export function bulkPlaceholderEmail(schoolId, roleTag) {
  const sid = String(schoolId || "x").replace(/[^a-zA-Z0-9]/g, "").slice(0, 12);
  const id = crypto.randomUUID().replace(/-/g, "");
  return `bulk.${roleTag}.${sid}.${id}@schooliat.local`;
}

/**
 * Normalize a 10-digit Indian mobile from CSV (Contact / Phone / Mobile / etc.).
 */
export function normalizeBulkContact(row) {
  const raw = String(
    row.contact ?? row.phone ?? row.mobile ?? row.mobilenumber ?? row.phonenumber ?? "",
  ).trim();
  const digits = raw.replace(/\D/g, "");
  if (digits.length >= 10) return digits.slice(-10);
  return "";
}

/**
 * First name + last name from FirstName/LastName or a single "Name" column.
 */
export function normalizeBulkPersonName(row) {
  let first = String(row.firstname ?? "").trim();
  let last = String(row.lastname ?? "").trim();
  if (!first) {
    const full = String(row.name ?? "").trim();
    if (full) {
      const parts = full.split(/\s+/).filter(Boolean);
      first = parts[0] ?? "";
      last = parts.slice(1).join(" ") || "";
    }
  }
  return { firstName: first, lastName: last };
}

export function parseBulkDateOfBirth(raw) {
  const s = String(raw ?? "").trim();
  if (!s) return BULK_IMPORT_DEFAULT_DOB;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return BULK_IMPORT_DEFAULT_DOB;
  return d;
}

/**
 * Resolve class for bulk student row. If ClassName is empty, use first class (grade, then division).
 */
export function resolveStudentClassForBulk(row, classes) {
  const raw = String(row.classname ?? "").trim();
  const matchOne = (inputName) => {
    const lower = inputName.toLowerCase();
    return classes.find((c) => {
      const className = `${c.grade} ${c.division}`.toLowerCase();
      const altName = `${c.grade}-${c.division}`.toLowerCase();
      return className === lower || altName === lower;
    });
  };

  if (raw) {
    const found = matchOne(raw);
    if (!found) {
      return { ok: false, error: `Class "${raw}" not found. Use e.g. "10 A" or "10-A", or leave ClassName empty to use the school's first class.` };
    }
    return { ok: true, classEntity: found };
  }

  if (!classes.length) {
    return {
      ok: false,
      error:
        "No classes exist for this school. Create a class first, or add a ClassName column once classes exist.",
    };
  }

  const sorted = [...classes].sort((a, b) => {
    const ga = Number(a.grade);
    const gb = Number(b.grade);
    if (ga !== gb) return ga - gb;
    return String(a.division).localeCompare(String(b.division));
  });

  return { ok: true, classEntity: sorted[0], defaultedClass: true };
}
