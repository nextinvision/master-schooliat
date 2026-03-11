#!/usr/bin/env node
/**
 * Generate Postman Collection v2.1 from MOBILE_APP_API_COMPLETE.json
 * Output: repo/MOBILE_APP_API_Postman_Collection.json
 */

import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, "..");

const inputPath = join(REPO_ROOT, "MOBILE_APP_API_COMPLETE.json");
const outputPath = join(REPO_ROOT, "MOBILE_APP_API_Postman_Collection.json");

const data = JSON.parse(readFileSync(inputPath, "utf8"));
const baseUrl = data.info.baseUrl || "https://api.schooliat.com";

function requestName(ep) {
  const pathShort = ep.path.replace("/api/v1/", "").replace("/auth/", "auth/");
  return `${ep.method} ${pathShort}`;
}

function getBody(ep) {
  if (ep.method === "GET") return undefined;
  let raw = { request: {} };
  if (ep.path.includes("authenticate")) raw = { request: { email: "user@example.com", password: "YourPassword" } };
  else if (ep.path.includes("request-otp") || ep.path.includes("forgot-password")) raw = { request: { email: "user@example.com" } };
  else if (ep.path.includes("verify-otp")) raw = { request: { email: "user@example.com", otp: "123456", purpose: "verification" } };
  else if (ep.path.includes("reset-password")) raw = { request: { email: "user@example.com", otp: "123456", newPassword: "NewPass123!" } };
  else if (ep.path.includes("change-password")) raw = { request: { currentPassword: "OldPass", newPassword: "NewPass123!" } };
  return {
    mode: "raw",
    raw: JSON.stringify(raw, null, 2),
    options: { raw: { language: "json" } },
  };
}

function buildRequest(ep) {
  const urlRaw = "{{base_url}}" + ep.path;
  const req = {
    method: ep.method,
    header: [
      { key: "Content-Type", value: "application/json", type: "text" },
      { key: "x-platform", value: "android", type: "text", description: "android | ios" },
    ],
    url: urlRaw,
    description: ep.description || "",
    response: [],
  };
  if (ep.authRequired) req.auth = { type: "bearer", bearer: [{ key: "token", value: "{{auth_token}}", type: "string" }] };
  const body = getBody(ep);
  if (body) req.body = body;
  return req;
}

const groups = {};
for (const ep of data.endpoints) {
  const g = ep.group || "other";
  if (!groups[g]) groups[g] = [];
  groups[g].push({
    name: requestName(ep),
    request: buildRequest(ep),
  });
}

const item = [];
const order = data.summary?.groups || [
  "authentication", "students", "employees", "users", "statistics", "attendance", "homework", "marks",
  "timetables", "notes", "syllabus", "leave", "fees", "communication", "notifications", "calendar", "files",
  "schools", "settings", "exams", "subjects", "vendors", "licenses", "receipts", "gallery", "parent", "library",
  "circulars", "reports", "regions", "transports", "invoices", "locations", "letterhead", "id-cards", "templates",
  "grievances", "salary", "ai", "audit", "deletion-otp", "transfer-certificates", "emergency-contacts", "inventory",
];
for (const groupKey of order) {
  if (!groups[groupKey]) continue;
  const folderName = groupKey.charAt(0).toUpperCase() + groupKey.slice(1).replace(/-/g, " ");
  item.push({
    name: folderName,
    item: groups[groupKey],
  });
}
for (const groupKey of Object.keys(groups)) {
  if (order.includes(groupKey)) continue;
  item.push({
    name: groupKey.charAt(0).toUpperCase() + groupKey.slice(1),
    item: groups[groupKey],
  });
}

const collection = {
  info: {
    _postman_id: "schooliat-mobile-api-complete",
    name: "SchooliAt Mobile API (Complete)",
    description: data.info.description + "\n\nGenerated from MOBILE_APP_API_COMPLETE.json. Base URL: " + baseUrl + "\nAuth: /auth/* | API: /api/v1/*",
    schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
  },
  auth: {
    type: "bearer",
    bearer: [{ key: "token", value: "{{auth_token}}", type: "string" }],
  },
  item,
  variable: [
    { key: "base_url", value: baseUrl, type: "string" },
    { key: "auth_token", value: "", type: "string" },
  ],
};

writeFileSync(outputPath, JSON.stringify(collection, null, 2), "utf8");
console.log("Written:", outputPath);
console.log("Folders:", item.length, "| Requests:", data.endpoints.length);
