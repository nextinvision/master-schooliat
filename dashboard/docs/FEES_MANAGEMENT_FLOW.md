# School Admin – Fees Management (Root-Level Flow)

This document describes the **fees management** flow on the School Admin panel: recording payments (online/offline), generating receipts, and exporting reports. It reflects the current architecture and root-level fixes.

## Overview

- **Page**: Admin → Finance → Fees (`/admin/finance/fees`)
- **Use cases**: View installments, record payments (online/offline), generate receipts, export CSV report.
- **Backend**: `/api/v1/fees/*` (and legacy `/fees/*`).

## Flow

### 1. View fee installments

- **UI**: `FeesManagement` shows a table of installments (by installment number range and optional academic year).
- **API**: `GET /api/v1/fees/installments/:installmentNumber?end=&academicYear=`  
  Returns installments for the school with student info and `receiptFileUrl` when a receipt exists.
- **Filters**: Status (All/Paid/Partially Paid/Pending), Year, Period, Installment range. Academic year is sent as `academicYear` when applicable.

### 2. Record payment (online / offline)

- **UI**: “Record Payment” opens `PaymentModal` with:
  - **Payment method**: CASH (Offline), CHEQUE (Offline), UPI (Online), BANK_TRANSFER (Online).
  - **Amount**, **Transaction/Ref ID** (for online/bank), **Remarks**, **Waiver** toggle.
  - **OTP**: “Get OTP” calls `POST /api/v1/fees/request-otp`; user enters 6-digit OTP for verification.
- **API**: `PATCH /api/v1/fees/installments/:id/payment`  
  Body: `{ request: { amount, paymentMethod, isWaiver, transactionId, remarks, otp } }`.
- **Backend**:
  - Verifies OTP for the current user.
  - Validates amount (integer; must be ≤ remaining amount; waived installments can omit amount).
  - Generates fee receipt HTML, uploads it, stores `receiptFileId` on the installment.
  - Updates installment (`paidAmount`, `remainingAmount`, `paymentStatus`, **paymentMethod**) and fee totals.
  - Returns updated installment with `receiptFileUrl`.
- **Amount**: All amounts are **integers** (DB and API). Dashboard rounds the entered value before sending.

### 3. Receipt generation and download

- **When**: A receipt is generated **automatically** on each successful “Record Payment” and linked to the installment (`receiptFileId` → file storage).
- **URL**: Installment responses include `receiptFileUrl` (e.g. `/files/:fileId` or full URL depending on config). Next.js rewrites `/files/*` to the backend in dev.
- **Where to download**:
  - **Main table**: Each row has a receipt icon that opens `receiptFileUrl` in a new tab (when present).
  - **Fee details modal**: Per-installment “Receipt” button opens that installment’s receipt when `receiptFileUrl` is present.

### 4. Export report

- **UI**: “Download Report” in Fees Management.
- **API**: `GET /api/v1/fees/export?academicYear=`  
  Returns CSV (student, installment, amount, paid at, status, **payment method**).
- **Implementation**: Dashboard uses the shared **API client** `downloadFromApi("/fees/export?academicYear=...")` so the request uses the same base URL and `/api/v1` prefix (works in dev with Next.js rewrites and in production).

## Root-level fixes applied

1. **Export URL**  
   Export no longer uses a raw `fetch` to `/fees/export`. It uses `downloadFromApi()` so the URL is built with `/api/v1` and the same auth, fixing 404 in dev when rewrites only apply to `/api/*`.

2. **Payment amount as integer**  
   - Dashboard rounds the payment amount with `Math.round(Number(data.amount) || 0)` before sending.  
   - Backend schema uses `z.coerce.number().int()` for `amount` so decimals are coerced to integers and validation stays consistent with the DB.

3. **Payment method persistence**  
   - `paymentMethod` was added to the **FeeInstallements** model (optional) and persisted in `fee.service.js` when recording a payment.  
   - Export and any future “view payment” can show the actual method (CASH, UPI, etc.).  
   - Migration: `20260310000000_add_fee_installment_payment_method` adds `payment_method` to `fee_installments`.

4. **Receipt in Fee Details Modal**  
   - Fee details modal shows each installment with a “Receipt” button when `receiptFileUrl` is present, and displays status (Paid / Partially Paid / Waived / Pending) correctly.

## Configuration

- **Fees config** (Settings → Fees): Default student fee amount and number of installments. Used when creating new fee structures.
- **Payment info card** (same page): Shows school bank details and UPI for manual/online payments; links to Settings if not configured.

## API summary

| Action           | Method | Endpoint                                      |
|-----------------|--------|-----------------------------------------------|
| List installments | GET  | `/api/v1/fees/installments/:n?end=&academicYear=` |
| Student fees    | GET    | `/api/v1/fees/student/:studentId`            |
| Request OTP     | POST   | `/api/v1/fees/request-otp`                    |
| Record payment  | PATCH  | `/api/v1/fees/installments/:id/payment`      |
| Export CSV      | GET    | `/api/v1/fees/export?academicYear=`          |
| Receipt file    | GET    | `/files/:fileId` (via backend)               |

All dashboard requests use the same API client (auth token, `x-platform: web`, and base URL with `/api/v1` where applicable).
